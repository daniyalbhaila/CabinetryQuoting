/**
 * Quote Calculation Service
 * Contains all pricing calculation logic
 */

import {
    FINISH_RATES,
    CEILING_TO_MM,
    CEILING_TO_UPPER_HT,
    CONVERSION,
    CARCASS_RATES
} from '../utils/constants.js';
import { getElementById } from '../utils/dom.js';

/**
 * Get current project settings from form
 * @returns {Object} Project settings
 */
export function getProjectSettings() {
    const projectType = getElementById('projectType').value;
    const isFullHouse = projectType === 'full';
    const defaultCeiling = getElementById('defaultCeiling').value;

    return {
        projectType,
        isFullHouse,
        carcassSupplier: getElementById('carcassSupplier').value,
        carcassRate:
            getElementById('carcassSupplier').value === 'holike'
                ? CARCASS_RATES.holike
                : CARCASS_RATES.allure,
        defaultCeiling,
        defaultCeilingMm: CEILING_TO_MM[defaultCeiling] || 2450,
        shippingRate: parseFloat(getElementById('shippingRate').value) || 60,
        installRate:
            parseFloat(getElementById('installRate').value) ||
            (isFullHouse ? 100 : 120),
        drawerRate: parseFloat(getElementById('drawerRate').value) || 200,
        accessoryRate:
            parseFloat(getElementById('accessoryRate').value) || 300,
        exchangeRate: parseFloat(getElementById('exchangeRate').value) || 1.42,
        markupRate:
            (parseFloat(getElementById('markupRate').value) || 80) / 100,
        discountRate:
            (parseFloat(getElementById('discountRate').value) || 50) / 100,
        defaultUpperHt:
            parseFloat(getElementById('defaultUpperHt').value) ||
            CEILING_TO_UPPER_HT[defaultCeiling] ||
            760,
        defaultBaseHt: parseFloat(getElementById('defaultBaseHt').value) || 920,
        defaultUpperDp:
            parseFloat(getElementById('defaultUpperDp').value) || 300,
        defaultBaseDp: parseFloat(getElementById('defaultBaseDp').value) || 600,
        defaultPantryDp:
            parseFloat(getElementById('defaultPantryDp').value) || 600
    };
}

/**
 * Get effective dimensions for a line item (considering overrides)
 * @param {Object} item - Line item
 * @returns {Object} Effective dimensions
 */
export function getEffectiveDimensions(item) {
    const settings = getProjectSettings();
    const ceilingFt = item.ceilingFt || settings.defaultCeiling;
    const ceilingMm = CEILING_TO_MM[ceilingFt] || settings.defaultCeilingMm;
    const baseUpperHt = CEILING_TO_UPPER_HT[ceilingFt] || settings.defaultUpperHt;

    const upperHt =
        item.showOverride && item.upperHt ? item.upperHt : baseUpperHt;
    const baseHt =
        item.showOverride && item.baseHt ? item.baseHt : settings.defaultBaseHt;
    const upperDp =
        item.showOverride && item.upperDp ? item.upperDp : settings.defaultUpperDp;
    const baseDp =
        item.showOverride && item.baseDp ? item.baseDp : settings.defaultBaseDp;
    const pantryDp =
        item.showOverride && item.pantryDp
            ? item.pantryDp
            : settings.defaultPantryDp;

    const carcassSupplier = item.carcassSupplier || settings.carcassSupplier;
    const carcassRate =
        carcassSupplier === 'holike' ? CARCASS_RATES.holike : CARCASS_RATES.allure;

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
 * Calculate total carcass surface area
 * Formula: (2 × sides) + (2 × back/bottom) + (1 × front face)
 * @param {Object} dims - Dimensions object
 * @param {number} upperM - Upper cabinet length in meters
 * @param {number} baseM - Base cabinet length in meters
 * @param {number} pantryM - Pantry cabinet length in meters
 * @returns {number} Total carcass area in square meters
 */
function calculateCarcassArea(dims, upperM, baseM, pantryM) {
    // Upper cabinets
    const upperArea =
        2 * (dims.upperHt / 1000) * (dims.upperDp / 1000) + // Two sides
        2 * upperM * (dims.upperDp / 1000) + // Back and bottom
        upperM * (dims.upperHt / 1000); // Front face

    // Base cabinets
    const baseArea =
        2 * (dims.baseHt / 1000) * (dims.baseDp / 1000) +
        2 * baseM * (dims.baseDp / 1000) +
        baseM * (dims.baseHt / 1000);

    // Pantry cabinets
    const pantryArea =
        2 * (dims.ceilingMm / 1000) * (dims.pantryDp / 1000) +
        2 * pantryM * (dims.pantryDp / 1000) +
        pantryM * (dims.ceilingMm / 1000);

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

    const doorRate = openShelf
        ? 0
        : FINISH_RATES[finish]
        ? shaped
            ? FINISH_RATES[finish].shaped
            : FINISH_RATES[finish].unshaped
        : 100;

    // Calculate component costs (in USD)
    const doorCost = doorArea * doorRate;
    const carcassCost = carcassArea * dims.carcassRate;
    const drawerCost = (item.drawers || 0) * settings.drawerRate;
    const accessoryCost = (item.accessories || 0) * settings.accessoryRate;

    // Calculate gross cabinetry cost (USD)
    const cabinetryGross = doorCost + carcassCost + drawerCost + accessoryCost;

    // Apply discount (USD)
    const cabinetryUSD = cabinetryGross * (1 - settings.discountRate);

    // Convert cabinetry from USD to CAD
    // (shipping and install are already in CAD)
    const cabinetry = cabinetryUSD * settings.exchangeRate;

    // Calculate shipping and installation (CAD)
    const shipping = totalLF * settings.shippingRate;
    const install = totalLF * settings.installRate;

    // Calculate subtotal (CAD)
    const subtotal = cabinetry + shipping + install;

    // Apply markup for final price (CAD)
    const finalPrice = subtotal * (1 + settings.markupRate);

    return {
        totalLF,
        cabinetry,
        shipping,
        install,
        subtotal,
        finalPrice,
        dims
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
