/**
 * Storage Service
 * Handles all localStorage operations with error handling
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { getCurrentDate } from '../utils/formatting.js';
import { isLocalStorageAvailable } from '../utils/validation.js';

/**
 * Save data to localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} data - Data to save
 * @returns {boolean} Success status
 */
function saveToStorage(key, data) {
    if (!isLocalStorageAvailable()) {
        console.error('localStorage is not available');
        alert(
            'Cannot save data. Please ensure you are not in private browsing mode.'
        );
        return false;
    }

    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Failed to save to localStorage:', e);

        if (e.name === 'QuotaExceededError') {
            alert('Storage quota exceeded. Please delete old quotes.');
        } else if (e.name === 'SecurityError') {
            alert('Cannot save in private browsing mode.');
        } else {
            alert('Failed to save data. Please check browser settings.');
        }
        return false;
    }
}

/**
 * Load data from localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Loaded data or default value
 */
function loadFromStorage(key, defaultValue = null) {
    if (!isLocalStorageAvailable()) {
        return defaultValue;
    }

    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        return defaultValue;
    }
}

/**
 * Save current quote to localStorage
 * @param {Object} quoteData - Quote data to save
 * @returns {boolean} Success status
 */
export function saveCurrentQuote(quoteData) {
    return saveToStorage(STORAGE_KEYS.CURRENT_QUOTE, quoteData);
}

/**
 * Load current quote from localStorage
 * @returns {Object|null} Loaded quote data or null
 */
export function loadCurrentQuote() {
    return loadFromStorage(STORAGE_KEYS.CURRENT_QUOTE);
}

/**
 * Get all saved quotes
 * @returns {Array} Array of saved quotes
 */
export function getSavedQuotes() {
    return loadFromStorage(STORAGE_KEYS.SAVED_QUOTES, []);
}

/**
 * Save a quote to history with a name
 * @param {string} name - Quote name
 * @param {Object} quoteData - Quote data
 * @returns {boolean} Success status
 */
export function saveQuoteToHistory(name, quoteData) {
    const quotes = getSavedQuotes();

    const newQuote = {
        id: Date.now(),
        name: name,
        savedAt: new Date().toISOString(),
        ...quoteData
    };

    quotes.unshift(newQuote);
    return saveToStorage(STORAGE_KEYS.SAVED_QUOTES, quotes);
}

/**
 * Delete a quote from history
 * @param {number} id - Quote ID
 * @returns {boolean} Success status
 */
export function deleteQuoteFromHistory(id) {
    const quotes = getSavedQuotes();
    const filtered = quotes.filter((q) => q.id !== id);
    return saveToStorage(STORAGE_KEYS.SAVED_QUOTES, filtered);
}

/**
 * Get a specific quote by ID
 * @param {number} id - Quote ID
 * @returns {Object|null} Quote data or null
 */
export function getQuoteById(id) {
    const quotes = getSavedQuotes();
    return quotes.find((q) => q.id === id) || null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
}

/**
 * Set authentication status
 * @param {boolean} status - Authentication status
 */
export function setAuthenticated(status) {
    if (status) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    } else {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    }
}

/**
 * Clear all authentication data
 */
export function clearAuth() {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
}

/**
 * Export quote data as JSON
 * @param {Object} quoteData - Quote to export
 * @returns {string} JSON string
 */
export function exportQuoteAsJSON(quoteData) {
    return JSON.stringify(quoteData, null, 2);
}

/**
 * Get storage usage statistics
 * @returns {Object} Storage stats
 */
export function getStorageStats() {
    if (!isLocalStorageAvailable()) {
        return {
            available: false,
            quotesCount: 0,
            estimatedSize: 0
        };
    }

    const quotes = getSavedQuotes();
    const currentQuote = loadCurrentQuote();

    const estimatedSize =
        (JSON.stringify(quotes).length + JSON.stringify(currentQuote).length) /
        1024; // KB

    return {
        available: true,
        quotesCount: quotes.length,
        estimatedSize: estimatedSize.toFixed(2) + ' KB'
    };
}
