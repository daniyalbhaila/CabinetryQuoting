#!/usr/bin/env node
/**
 * B3 Interiors Quote CLI
 * Wraps the exact same constants as the web app.
 * No DOM — settings are passed as CLI args.
 */

import { createClient } from '@supabase/supabase-js';
import { program } from 'commander';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load constants directly from the web app source — single source of truth
const {
    FINISH_RATES, CARCASS_RATES, DEFAULT_RATES, CEILING_TO_MM, CEILING_TO_UPPER_HT, CONVERSION
} = await import('../src/js/utils/constants.js');

// ---------------------------------------------------------------------------
// Pure calculation logic (no DOM, no global config — settings passed explicitly)
// Mirrors calculator.js calculateLineItem() exactly.
// ---------------------------------------------------------------------------

function buildSettings({ projectType = 'single', ceilingFt = '9', carcass = 'holike' } = {}) {
    const isFullHouse = projectType === 'full';
    return {
        projectType,
        isFullHouse,
        carcassSupplier: carcass,
        carcassRate: carcass === 'allure' ? CARCASS_RATES.allure : CARCASS_RATES.holike,
        ceilingMm: CEILING_TO_MM[ceilingFt] || 2750,
        upperHt: CEILING_TO_UPPER_HT[ceilingFt] || 920,
        baseHt: 720,
        upperDp: 300,
        baseDp: 600,
        pantryDp: 600,
        shippingRate: DEFAULT_RATES.SHIPPING_PER_LF,
        installRate: isFullHouse ? DEFAULT_RATES.INSTALL_PER_LF_FULL : DEFAULT_RATES.INSTALL_PER_LF_SINGLE,
        drawerRate: DEFAULT_RATES.DRAWER,
        accessoryRate: DEFAULT_RATES.ACCESSORY,
        exchangeRate: DEFAULT_RATES.EXCHANGE_RATE,
        markupRate: isFullHouse ? DEFAULT_RATES.MARKUP_FULL : DEFAULT_RATES.MARKUP_SINGLE,
        discountRate: DEFAULT_RATES.DISCOUNT,
    };
}

function calcCarcassArea(s, upperM, baseM, pantryM) {
    const upperArea = upperM > 0 ? (upperM * (s.upperHt / 1000) * 2 + upperM * (s.upperDp / 1000)) : 0;
    const baseArea  = baseM  > 0 ? (baseM  * (s.baseHt  / 1000) * 2 + baseM  * (s.baseDp  / 1000)) : 0;
    const pantryArea = pantryM > 0 ? (pantryM * (s.ceilingMm / 1000) * 2 + pantryM * (s.pantryDp / 1000)) : 0;
    return upperArea + baseArea + pantryArea;
}

function calcLineItem(item, settings) {
    const s = settings;
    const ft = CONVERSION.FEET_TO_METERS;
    const upperM  = (item.upperLF  || 0) * ft;
    const baseM   = (item.baseLF   || 0) * ft;
    const pantryM = (item.pantryLF || 0) * ft;
    const upperLF = item.upperLF || 0;
    const baseLF  = item.baseLF  || 0;
    const pantryLF = item.pantryLF || 0;
    const totalLF = upperLF + baseLF + pantryLF;

    const doorArea    = upperM * (s.upperHt / 1000) + baseM * (s.baseHt / 1000) + pantryM * (s.ceilingMm / 1000);
    const carcassArea = calcCarcassArea(s, upperM, baseM, pantryM);

    const finish     = item.finish || 'PVC';
    const shaped     = item.shaped === 'yes';
    const finishRate = FINISH_RATES[finish] ? (shaped ? FINISH_RATES[finish].shaped : FINISH_RATES[finish].unshaped) : 100;

    const doorCost     = doorArea    * finishRate;
    const carcassCost  = carcassArea * s.carcassRate;
    const drawerCost   = (item.drawers     || 0) * s.drawerRate;
    const accessoryCost = (item.accessories || 0) * s.accessoryRate;

    const cabinetryGross = doorCost + carcassCost + drawerCost + accessoryCost;
    const cabinetryUSD   = cabinetryGross * (1 - s.discountRate);
    const cabinetryCAD   = cabinetryUSD * s.exchangeRate;

    const upperBaseLF = upperLF + baseLF;
    const shipping    = (upperBaseLF * s.shippingRate / 2) + (pantryLF * s.shippingRate);
    const install     = (upperBaseLF * s.installRate  / 2) + (pantryLF * s.installRate);

    const subtotal   = cabinetryCAD + shipping + install;
    const finalPrice = subtotal * (1 + s.markupRate);

    return {
        name: item.name || 'Room',
        totalLF,
        cabinetryCAD: Math.round(cabinetryCAD * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        install:  Math.round(install  * 100) / 100,
        subtotal: Math.round(subtotal  * 100) / 100,
        finalPrice: Math.round(finalPrice * 100) / 100,
    };
}

function calcQuote(rooms, opts) {
    const settings = buildSettings(opts);
    const lineItems = rooms.map(r => calcLineItem(r, settings));
    const grandTotal = lineItems.reduce((s, i) => s + i.finalPrice, 0);
    const totalLF    = lineItems.reduce((s, i) => s + i.totalLF, 0);
    return { lineItems, grandTotal: Math.round(grandTotal * 100) / 100, totalLF, settings };
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
        console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment.');
        process.exit(1);
    }
    return createClient(url, key);
}

// ---------------------------------------------------------------------------
// CLI commands
// ---------------------------------------------------------------------------

program
    .name('quote')
    .description('B3 Interiors cabinetry quoting CLI')
    .version('1.0.0');

program
    .command('estimate')
    .description('Calculate an estimate (no save)')
    .option('--project-type <type>', 'single or full', 'single')
    .option('--ceiling <ft>', 'Ceiling height in feet', '9')
    .option('--carcass <supplier>', 'holike or allure', 'holike')
    .option('--rooms <json>', 'JSON array of rooms', '[]')
    .option('--json', 'Output as JSON')
    .action((opts) => {
        const rooms = JSON.parse(opts.rooms);
        const result = calcQuote(rooms, { projectType: opts.projectType, ceilingFt: opts.ceiling, carcass: opts.carcass });

        if (opts.json) {
            console.log(JSON.stringify(result, null, 2));
            return;
        }

        console.log('\nB3 Interiors — Estimate');
        console.log('─'.repeat(58));
        for (const li of result.lineItems) {
            console.log(`\n${li.name} (${li.totalLF} LF)`);
            console.log(`  Cabinetry:  $${li.cabinetryCAD.toLocaleString('en-CA', {minimumFractionDigits: 2})}`);
            console.log(`  Shipping:   $${li.shipping.toLocaleString('en-CA', {minimumFractionDigits: 2})}`);
            console.log(`  Install:    $${li.install.toLocaleString('en-CA', {minimumFractionDigits: 2})}`);
            console.log(`  Total:      $${li.finalPrice.toLocaleString('en-CA', {minimumFractionDigits: 2})} CAD`);
        }
        console.log('\n' + '─'.repeat(58));
        console.log(`TOTAL  $${result.grandTotal.toLocaleString('en-CA', {minimumFractionDigits: 2})} CAD  (${result.totalLF} LF)`);
        const lo = Math.round(result.grandTotal * 0.9);
        const hi = Math.round(result.grandTotal * 1.1);
        console.log(`Range  $${lo.toLocaleString('en-CA')} – $${hi.toLocaleString('en-CA')} CAD  (±10%)`);
        console.log(`Markup: ${opts.projectType === 'full' ? '80%' : '90%'}  |  Exchange: ${DEFAULT_RATES.EXCHANGE_RATE} USD→CAD  |  Before HST\n`);
    });

program
    .command('list')
    .description('List saved quotes from Supabase')
    .option('--limit <n>', 'Max results', '20')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('quotes')
            .select('id, name, updated_at, last_modified_by')
            .order('updated_at', { ascending: false })
            .limit(parseInt(opts.limit));
        if (error) { console.error('Supabase error:', error.message); process.exit(1); }

        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }

        console.log(`\nSaved Quotes (${data.length})`);
        console.log('─'.repeat(72));
        for (const q of data) {
            const dt = new Date(q.updated_at).toLocaleDateString('en-CA');
            console.log(`${q.id.slice(0,8)}  ${q.name.padEnd(40)}  ${dt}  ${q.last_modified_by || ''}`);
        }
        console.log();
    });

program
    .command('get <id>')
    .description('Get a saved quote by UUID (or partial)')
    .option('--json', 'Output as JSON')
    .action(async (id, opts) => {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('quotes')
            .select('*')
            .ilike('id', `${id}%`)
            .limit(1)
            .single();
        if (error) { console.error('Not found:', error.message); process.exit(1); }

        if (opts.json) { console.log(JSON.stringify(data, null, 2)); return; }

        console.log(`\nQuote: ${data.name}`);
        console.log(`ID:    ${data.id}`);
        console.log(`By:    ${data.last_modified_by || 'unknown'}`);
        console.log(`At:    ${new Date(data.updated_at).toLocaleString('en-CA')}`);
        console.log('\nData:');
        console.log(JSON.stringify(data.data, null, 2));
    });

program
    .command('create')
    .description('Save a new quote draft to Supabase')
    .requiredOption('--name <name>', 'Quote name (e.g. "Smith - Kitchen - June 2026")')
    .option('--project-type <type>', 'single or full', 'single')
    .option('--ceiling <ft>', 'Ceiling height in feet', '9')
    .option('--carcass <supplier>', 'holike or allure', 'holike')
    .option('--rooms <json>', 'JSON array of rooms', '[]')
    .option('--client-name <name>', 'Client full name')
    .option('--client-email <email>', 'Client email')
    .option('--client-phone <phone>', 'Client phone (E.164)')
    .option('--ghl-contact-id <id>', 'GHL contact ID')
    .option('--modified-by <who>', 'Who created this', 'Claude Code')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
        const rooms = JSON.parse(opts.rooms);
        const result = calcQuote(rooms, { projectType: opts.projectType, ceilingFt: opts.ceiling, carcass: opts.carcass });

        const payload = {
            projectType: opts.projectType,
            ceiling: opts.ceiling,
            carcass: opts.carcass,
            rooms,
            estimate: result,
            client: {
                name: opts.clientName || null,
                email: opts.clientEmail || null,
                phone: opts.clientPhone || null,
                ghlContactId: opts.ghlContactId || null,
            },
            createdAt: new Date().toISOString(),
        };

        const sb = getSupabase();
        const { data, error } = await sb
            .from('quotes')
            .insert({ name: opts.name, data: payload, last_modified_by: opts.modifiedBy })
            .select('id')
            .single();
        if (error) { console.error('Supabase error:', error.message); process.exit(1); }

        if (opts.json) {
            console.log(JSON.stringify({ id: data.id, name: opts.name, grandTotal: result.grandTotal }, null, 2));
            return;
        }

        console.log(`\nQuote saved.`);
        console.log(`Name:  ${opts.name}`);
        console.log(`ID:    ${data.id}`);
        console.log(`Total: $${result.grandTotal.toLocaleString('en-CA', {minimumFractionDigits: 2})} CAD`);
        console.log(`Open in quoting app → History tab → search "${opts.name}"\n`);
    });

program
    .command('delete <id>')
    .description('Delete a quote from Supabase')
    .action(async (id) => {
        const sb = getSupabase();
        const { error } = await sb.from('quotes').delete().eq('id', id);
        if (error) { console.error('Error:', error.message); process.exit(1); }
        console.log(`Deleted ${id}`);
    });

program.parse();
