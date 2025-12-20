/**
 * Input validation utilities
 */

import { VALIDATION } from './constants.js';

/**
 * Validate and sanitize numeric input
 * @param {*} value - Input value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} decimals - Number of decimal places
 * @returns {number} Validated and sanitized number
 */
export function validateNumericInput(
    value,
    min = VALIDATION.MIN_RATE,
    max = VALIDATION.MAX_RATE,
    decimals = VALIDATION.DECIMAL_PLACES
) {
    // Convert to number
    let num = parseFloat(value);

    // If not a number, return minimum
    if (isNaN(num)) return min;

    // Clamp to min/max
    if (num < min) num = min;
    if (num > max) num = max;

    // Round to specified decimal places
    return parseFloat(num.toFixed(decimals));
}

/**
 * Validate linear footage input
 * @param {*} value - Linear footage value
 * @returns {number} Validated linear footage
 */
export function validateLinearFeet(value) {
    return validateNumericInput(
        value,
        VALIDATION.MIN_LINEAR_FEET,
        VALIDATION.MAX_LINEAR_FEET,
        VALIDATION.DECIMAL_PLACES
    );
}

/**
 * Validate percentage input (0-100)
 * @param {*} value - Percentage value
 * @returns {number} Validated percentage
 */
export function validatePercentage(value) {
    return validateNumericInput(
        value,
        VALIDATION.MIN_PERCENTAGE,
        VALIDATION.MAX_PERCENTAGE,
        VALIDATION.DECIMAL_PLACES
    );
}

/**
 * Validate rate input (money)
 * @param {*} value - Rate value
 * @returns {number} Validated rate
 */
export function validateRate(value) {
    return validateNumericInput(
        value,
        VALIDATION.MIN_RATE,
        VALIDATION.MAX_RATE,
        VALIDATION.DECIMAL_PLACES
    );
}

/**
 * Validate count input (whole numbers only)
 * @param {*} value - Count value
 * @returns {number} Validated count
 */
export function validateCount(value) {
    const num = parseInt(value);
    if (isNaN(num)) return 0;
    if (num < 0) return 0;
    if (num > 10000) return 10000;
    return num;
}

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
export function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}
