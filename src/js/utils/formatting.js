/**
 * Formatting utilities
 */

import { CONVERSION } from './constants.js';

/**
 * Convert millimeters to inches
 * @param {number} mm - Millimeters
 * @returns {number} Inches (rounded)
 */
export function mmToInches(mm) {
    return Math.round(mm / CONVERSION.MM_TO_INCHES);
}

/**
 * Format dimension as "XXXmm / YY""
 * @param {number} mm - Dimension in millimeters
 * @returns {string} Formatted dimension string
 */
export function formatDimension(mm) {
    return `${mm}mm / ${mmToInches(mm)}"`;
}

/**
 * Format currency in CAD
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
    return (
        '$' +
        amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) +
        ' CAD'
    );
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} unsafe - Unsafe HTML string
 * @returns {string} Safe HTML string
 */
export function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Get current date in ISO format (YYYY-MM-DD)
 * @returns {string} Current date
 */
export function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString();
}

/**
 * Format time for display
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted time string
 */
export function formatTime(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleTimeString();
}
