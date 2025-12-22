/**
 * Quote Calculation Service
 * Contains all pricing calculation logic
 */

import {
    CEILING_TO_MM,
    CEILING_TO_UPPER_HT,
    CONVERSION
} from '../utils/constants.js';
import { getElementById } from '../utils/dom.js';
import { loadGlobalConfig, ensureGlobalConfig } from './storage.js';

/**
 * Get current quote from app state
 * @returns {Object|null} Current quote object
 */
function getCurrentQuote() {
    // Access current quote from app state
    // This is temporary until we refactor to pass quote explicitly
    if (window.quoteApp) {
        return {
            overrides: window.quoteApp.quoteOverrides || {}
        };
    }
    return { overrides: {} };
}

/**
 * Get finish rates from global config
 * @returns {Object} Finish rates object
 */
function getFinishRates() {
    const globalConfig = ensureGlobalConfig();
    return globalConfig.materials.finishRates;
}

/**
 * Get carcass rates from global config
 * @returns {Object} Carcass rates object
 */
function getCarcassRates() {
    const globalConfig = ensureGlobalConfig();
    return globalConfig.materials.carcassRates;
}

/**
 * Check if a finish has a different shaped rate
 * @param {string} finish - Finish name
 * @returns {boolean} True if shaped rate is different from unshaped
 */
export function hasShapedRate(finish) {
    const finishRates = getFinishRates();
    if (!finishRates[finish]) return false;

    return finishRates[finish].shaped !== finishRates[finish].unshaped;
}

/**
 * Get current project settings from form (with 3-tier resolution)
 * @returns {Object} Project settings
 */
export function getProjectSettings() {
    // Get global config (ensure it exists)
    const globalConfig = ensureGlobalConfig();
    const quote = getCurrentQuote();

    // Project-specific settings (not overridable via config)
    const projectType = getElementById('projectType')?.value || 'full';
    const isFullHouse = projectType === 'full';
    const defaultCeiling = getElementById('defaultCeiling')?.value || '8';
    const carcassSupplier = getElementById('carcassSupplier')?.value || 'holike';

    // Resolve rates through 3-tier hierarchy (Global → Quote)
    const shippingRate = quote?.overrides?.shippingRate ?? globalConfig.rates.shippingRate;
    const installRate = quote?.overrides?.installRate ?? globalConfig.rates.installRate;
    const drawerRate = quote?.overrides?.drawerRate ?? globalConfig.rates.drawerRate;
    const accessoryRate = quote?.overrides?.accessoryRate ?? globalConfig.rates.accessoryRate;
    const exchangeRate = quote?.overrides?.exchangeRate ?? globalConfig.rates.exchangeRate;

    // Select markup rate based on project type (full house vs single project)
    const globalMarkupRate = isFullHouse
        ? (globalConfig.rates.markupRateFull ?? globalConfig.rates.markupRate ?? 80)
        : (globalConfig.rates.markupRateSingle ?? globalConfig.rates.markupRate ?? 90);
    const markupRate = (quote?.overrides?.markupRate ?? globalMarkupRate) / 100;

    const discountRate = (quote?.overrides?.discountRate ?? globalConfig.rates.discountRate) / 100;

    // Resolve dimensions through 3-tier hierarchy (Global → Quote)
    const defaultUpperHt = quote?.overrides?.defaultUpperHt ?? globalConfig.dimensions.defaultUpperHt;
    const defaultBaseHt = quote?.overrides?.defaultBaseHt ?? globalConfig.dimensions.defaultBaseHt;
    const defaultUpperDp = quote?.overrides?.defaultUpperDp ?? globalConfig.dimensions.defaultUpperDp;
    const defaultBaseDp = quote?.overrides?.defaultBaseDp ?? globalConfig.dimensions.defaultBaseDp;
    const defaultPantryDp = quote?.overrides?.defaultPantryDp ?? globalConfig.dimensions.defaultPantryDp;

    // Get material rates from global config
    const carcassRates = globalConfig.materials.carcassRates;
    const carcassRate = carcassSupplier === 'holike' ? carcassRates.holike : carcassRates.allure;

    return {
        projectType,
        isFullHouse,
        carcassSupplier,
        carcassRate,
        defaultCeiling,
        defaultCeilingMm: CEILING_TO_MM[defaultCeiling] || 2450,
        shippingRate,
        installRate,
        drawerRate,
        accessoryRate,
        exchangeRate,
        markupRate,
        discountRate,
        defaultUpperHt,
        defaultBaseHt,
        defaultUpperDp,
        defaultBaseDp,
        defaultPantryDp,
        carcassRates
    };
}

/**
 * Get effective dimensions for a line item (with 3-tier resolution)
 * @param {Object} item - Line item
 * @returns {Object} Effective dimensions
 */
export function getEffectiveDimensions(item) {
    const settings = getProjectSettings();

    // Helper to get dimension override (new nested or old flat structure)
    const getDimOverride = (newPath, oldPath) => {
        // Try new nested structure first
        if (item.overrides?.dimensions?.[newPath]) {
            return item.overrides.dimensions[newPath];
        }
        // Fall back to old flat structure
        if (item[oldPath]) {
            return item[oldPath];
        }
        return null;
    };

    // Ceiling height (affects upper cabinet height)
    const ceilingFt = getDimOverride('ceilingFt', 'ceilingFt') || settings.defaultCeiling;
    const ceilingMm = CEILING_TO_MM[ceilingFt] || settings.defaultCeilingMm;
    const baseUpperHt = CEILING_TO_UPPER_HT[ceilingFt] || settings.defaultUpperHt;

    // Individual dimension overrides
    const upperHt = getDimOverride('upperHt', 'upperHt') || baseUpperHt;
    const baseHt = getDimOverride('baseHt', 'baseHt') || settings.defaultBaseHt;
    const upperDp = getDimOverride('upperDp', 'upperDp') || settings.defaultUpperDp;
    const baseDp = getDimOverride('baseDp', 'baseDp') || settings.defaultBaseDp;
    const pantryDp = getDimOverride('pantryDp', 'pantryDp') || settings.defaultPantryDp;

    // Carcass supplier (not a dimension but related)
    const carcassSupplier = item.carcassSupplier || settings.carcassSupplier;
    const carcassRate =
        carcassSupplier === 'holike'
            ? settings.carcassRates.holike
            : settings.carcassRates.allure;

    return {
        ceilingFt,
        ceilingMm,
        upperHt,
        baseHt,
        upperDp,
        baseDp,
        pantryDp,
        carcassSupplier,
        carcassRate,
        baseUpperHt
    };
}

/**
 * Get effective rates for a line item (with 3-tier resolution)
 * @param {Object} item - Line item
 * @returns {Object} Effective rates
 */
export function getEffectiveRates(item) {
    const settings = getProjectSettings();

    // Use new nested structure: item.overrides.rates.shippingRate
    // Fall back to old flat structure for backward compatibility during migration
    const getLineItemOverride = (newPath, oldPath) => {
        // Try new nested structure first
        if (item.overrides?.rates?.[newPath] !== null && item.overrides?.rates?.[newPath] !== undefined) {
            return item.overrides.rates[newPath];
        }
        // Fall back to old flat structure
        if (item[oldPath] !== null && item[oldPath] !== undefined) {
            return item[oldPath];
        }
        return null;
    };

    const shippingOverride = getLineItemOverride('shippingRate', 'overrideShippingRate');
    const installOverride = getLineItemOverride('installRate', 'overrideInstallRate');
    const drawerOverride = getLineItemOverride('drawerRate', 'overrideDrawerRate');
    const accessoryOverride = getLineItemOverride('accessoryRate', 'overrideAccessoryRate');
    const markupOverride = getLineItemOverride('markupRate', 'overrideMarkupRate');
    const discountOverride = getLineItemOverride('discountRate', 'overrideDiscountRate');

    return {
        shippingRate: shippingOverride !== null ? parseFloat(shippingOverride) : settings.shippingRate,
        installRate: installOverride !== null ? parseFloat(installOverride) : settings.installRate,
        drawerRate: drawerOverride !== null ? parseFloat(drawerOverride) : settings.drawerRate,
        accessoryRate: accessoryOverride !== null ? parseFloat(accessoryOverride) : settings.accessoryRate,
        markupRate: markupOverride !== null ? parseFloat(markupOverride) / 100 : settings.markupRate,
        discountRate: discountOverride !== null ? parseFloat(discountOverride) / 100 : settings.discountRate
    };
}

/**
 * Calculate total carcass surface area
 * Formula: (2 × sides) + (2 × back/bottom) + (1 × front face)
 * @param {Object} dims - Dimensions object
 * @param {number} upperM - Upper cabinet length in meters
 * @param {number} baseM - Base cabinet length in meters
 * @param {number} pantryM - Pantry cabinet length in meters
 * @returns {number} Total carcass area in square meters
 */
function calculateCarcassArea(dims, upperM, baseM, pantryM) {
    // Upper cabinets - only calculate if there's actual length
    const upperArea = upperM > 0
        ? 2 * (dims.upperHt / 1000) * (dims.upperDp / 1000) + // Two sides
          2 * upperM * (dims.upperDp / 1000) + // Back and bottom
          upperM * (dims.upperHt / 1000) // Front face
        : 0;

    // Base cabinets - only calculate if there's actual length
    const baseArea = baseM > 0
        ? 2 * (dims.baseHt / 1000) * (dims.baseDp / 1000) +
          2 * baseM * (dims.baseDp / 1000) +
          baseM * (dims.baseHt / 1000)
        : 0;

    // Pantry cabinets - only calculate if there's actual length
    const pantryArea = pantryM > 0
        ? 2 * (dims.ceilingMm / 1000) * (dims.pantryDp / 1000) +
          2 * pantryM * (dims.pantryDp / 1000) +
          pantryM * (dims.ceilingMm / 1000)
        : 0;

    return upperArea + baseArea + pantryArea;
}

/**
 * Calculate pricing for a single line item
 * @param {Object} item - Line item configuration
 * @returns {Object} Calculation results
 */
export function calculateLineItem(item) {
    const settings = getProjectSettings();
    const dims = getEffectiveDimensions(item);
    const rates = getEffectiveRates(item);

    // Convert linear feet to meters
    const upperM = (item.upperLF || 0) * CONVERSION.FEET_TO_METERS;
    const baseM = (item.baseLF || 0) * CONVERSION.FEET_TO_METERS;
    const pantryM = (item.pantryLF || 0) * CONVERSION.FEET_TO_METERS;
    const totalLF = (item.upperLF || 0) + (item.baseLF || 0) + (item.pantryLF || 0);

    // Calculate door area (square meters)
    const doorArea =
        upperM * (dims.upperHt / 1000) +
        baseM * (dims.baseHt / 1000) +
        pantryM * (dims.ceilingMm / 1000);

    // Calculate carcass area (square meters)
    const carcassArea = calculateCarcassArea(dims, upperM, baseM, pantryM);

    // Get door rate based on finish and shape
    const finish = item.finish || 'PVC';
    const shaped = item.shaped === 'yes';
    const openShelf = item.openShelf === 'yes';
    const finishRates = getFinishRates();

    const doorRate = openShelf
        ? 0
        : finishRates[finish]
        ? shaped
            ? finishRates[finish].shaped
            : finishRates[finish].unshaped
        : 100;

    // Calculate component costs (in USD)
    const doorCost = doorArea * doorRate;
    const carcassCost = carcassArea * dims.carcassRate;
    const drawerCost = (item.drawers || 0) * rates.drawerRate;
    const accessoryCost = (item.accessories || 0) * rates.accessoryRate;

    // Calculate gross cabinetry cost (USD)
    const cabinetryGross = doorCost + carcassCost + drawerCost + accessoryCost;

    // Apply discount (USD)
    const cabinetryUSD = cabinetryGross * (1 - rates.discountRate);

    // Calculate additional items total (CAD)
    const additionalTotal = (item.additionalItems || []).reduce(
        (sum, additional) => sum + (parseFloat(additional.price) || 0),
        0
    );

    // Convert cabinetry from USD to CAD and add additional items
    // (shipping and install are already in CAD)
    const cabinetry = (cabinetryUSD * settings.exchangeRate) + additionalTotal;

    // Calculate shipping and installation (CAD)
    const shipping = totalLF * rates.shippingRate;
    const install = totalLF * rates.installRate;

    // Calculate subtotal (CAD)
    const subtotal = cabinetry + shipping + install;

    // Apply markup for final price (CAD)
    const finalPrice = subtotal * (1 + rates.markupRate);

    // Create breakdown object for transparency
    const breakdown = {
        // Conversions
        upperM,
        baseM,
        pantryM,
        // Areas
        doorArea,
        carcassArea,
        // Component costs (USD)
        doorRate,
        doorCost,
        carcassCost,
        drawerCost,
        accessoryCost,
        // Subtotals
        cabinetryGross,
        cabinetryUSD,
        additionalTotal,
        // Rates applied
        ratesUsed: rates,
        exchangeRate: settings.exchangeRate,
        // Item metadata for display
        itemData: {
            upperLF: item.upperLF || 0,
            baseLF: item.baseLF || 0,
            pantryLF: item.pantryLF || 0,
            drawers: item.drawers || 0,
            accessories: item.accessories || 0,
            finish,
            shaped,
            openShelf,
            additionalItems: item.additionalItems || []
        }
    };

    return {
        totalLF,
        cabinetry,
        shipping,
        install,
        additionalTotal,
        subtotal,
        finalPrice,
        dims,
        breakdown
    };
}

/**
 * Calculate totals across all line items
 * @param {Array} lineItems - Array of line items
 * @returns {Object} Total calculations
 */
export function calculateTotals(lineItems) {
    let totalLF = 0;
    let totalCabinetry = 0;
    let totalShipping = 0;
    let totalInstall = 0;
    let totalSubtotal = 0;
    let grandTotal = 0;

    lineItems.forEach((item) => {
        const calc = calculateLineItem(item);
        totalLF += calc.totalLF;
        totalCabinetry += calc.cabinetry;
        totalShipping += calc.shipping;
        totalInstall += calc.install;
        totalSubtotal += calc.subtotal;
        grandTotal += calc.finalPrice;
    });

    return {
        totalLF,
        totalCabinetry,
        totalShipping,
        totalInstall,
        totalSubtotal,
        grandTotal
    };
}
