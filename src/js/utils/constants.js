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
    MARKUP: 0.80,             // 80% markup
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

// localStorage keys
export const STORAGE_KEYS = {
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
