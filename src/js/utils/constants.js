/**
 * Application Constants
 */

// Finish rates (USD per square meter)
export const FINISH_RATES = {
    PVC: { unshaped: 100, shaped: 200 },
    Melamine: { unshaped: 70, shaped: 70 },
    Skin: { unshaped: 150, shaped: 150 },
    'Paint/Lacquer': { unshaped: 170, shaped: 200 },
    Powder: { unshaped: 100, shaped: 200 },
    Veneer: { unshaped: 440, shaped: 440 },
    PET: { unshaped: 110, shaped: 110 }
};

// Ceiling height to total ceiling height in mm
export const CEILING_TO_MM = {
    '8': 2450,
    '9': 2750,
    '10': 3050,
    '11': 3350,
    '12': 3660,
    '13': 3960
};

// Ceiling height to upper cabinet height in mm
export const CEILING_TO_UPPER_HT = {
    '8': 760,
    '9': 920,
    '10': 1070,
    '11': 1220,
    '12': 1320,
    '13': 1473
};

// Conversion constants
export const CONVERSION = {
    FEET_TO_METERS: 0.3048,
    MM_TO_INCHES: 25.4
};

// Carcass supplier rates (USD per square meter)
export const CARCASS_RATES = {
    holike: 65,
    allure: 200
};

// Default rates
export const DEFAULT_RATES = {
    SHIPPING_PER_LF: 60,      // CAD per linear foot
    INSTALL_PER_LF_FULL: 100, // CAD per linear foot (full house)
    INSTALL_PER_LF_SINGLE: 120, // CAD per linear foot (single project)
    DRAWER: 200,              // CAD per drawer
    ACCESSORY: 300,           // CAD per accessory
    EXCHANGE_RATE: 1.42,      // USD to CAD
    MARKUP_FULL: 0.80,        // 80% markup for full house
    MARKUP_SINGLE: 0.90,      // 90% markup for single project
    DISCOUNT: 0.50            // 50% discount
};

// Default dimensions (mm)
export const DEFAULT_DIMENSIONS = {
    UPPER_HEIGHT: 760,
    BASE_HEIGHT: 920,
    UPPER_DEPTH: 300,
    BASE_DEPTH: 600,
    PANTRY_DEPTH: 600
};

// Factory defaults for global configuration
export const FACTORY_DEFAULTS = {
    version: 1,
    lastUpdated: null, // Will be set when saved
    rates: {
        shippingRate: DEFAULT_RATES.SHIPPING_PER_LF,
        installRate: DEFAULT_RATES.INSTALL_PER_LF_FULL,
        drawerRate: DEFAULT_RATES.DRAWER,
        accessoryRate: DEFAULT_RATES.ACCESSORY,
        markupRateFull: DEFAULT_RATES.MARKUP_FULL * 100, // Store as percentage
        markupRateSingle: DEFAULT_RATES.MARKUP_SINGLE * 100, // Store as percentage
        discountRate: DEFAULT_RATES.DISCOUNT * 100, // Store as percentage
        exchangeRate: DEFAULT_RATES.EXCHANGE_RATE
    },
    dimensions: {
        defaultUpperHt: DEFAULT_DIMENSIONS.UPPER_HEIGHT,
        defaultBaseHt: DEFAULT_DIMENSIONS.BASE_HEIGHT,
        defaultUpperDp: DEFAULT_DIMENSIONS.UPPER_DEPTH,
        defaultBaseDp: DEFAULT_DIMENSIONS.BASE_DEPTH,
        defaultPantryDp: DEFAULT_DIMENSIONS.PANTRY_DEPTH
    },
    materials: {
        carcassRates: {
            holike: CARCASS_RATES.holike,
            allure: CARCASS_RATES.allure
        },
        finishRates: {
            PVC: { unshaped: FINISH_RATES.PVC.unshaped, shaped: FINISH_RATES.PVC.shaped },
            Melamine: { unshaped: FINISH_RATES.Melamine.unshaped, shaped: FINISH_RATES.Melamine.shaped },
            Skin: { unshaped: FINISH_RATES.Skin.unshaped, shaped: FINISH_RATES.Skin.shaped },
            'Paint/Lacquer': { unshaped: FINISH_RATES['Paint/Lacquer'].unshaped, shaped: FINISH_RATES['Paint/Lacquer'].shaped },
            Powder: { unshaped: FINISH_RATES.Powder.unshaped, shaped: FINISH_RATES.Powder.shaped },
            Veneer: { unshaped: FINISH_RATES.Veneer.unshaped, shaped: FINISH_RATES.Veneer.shaped },
            PET: { unshaped: FINISH_RATES.PET.unshaped, shaped: FINISH_RATES.PET.shaped }
        }
    }
};

// localStorage keys
export const STORAGE_KEYS = {
    GLOBAL_CONFIG: 'bosco_global_config', // NEW: Global defaults
    CURRENT_QUOTE: 'bosco_current_quote',
    SAVED_QUOTES: 'bosco_saved_quotes',
    AUTH: 'bosco_auth'
};

// Validation limits
export const VALIDATION = {
    MIN_LINEAR_FEET: 0,
    MAX_LINEAR_FEET: 10000,
    MIN_RATE: 0,
    MAX_RATE: 100000,
    MIN_PERCENTAGE: 0,
    MAX_PERCENTAGE: 100,
    DECIMAL_PLACES: 2
};
