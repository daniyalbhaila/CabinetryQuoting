/**
 * Storage Service
 * Handles all localStorage operations with error handling
 */

import { STORAGE_KEYS, FACTORY_DEFAULTS } from '../utils/constants.js';
import { getCurrentDate } from '../utils/formatting.js';
import { isLocalStorageAvailable } from '../utils/validation.js';
import {
    publishQuote,
    fetchQuote,
    fetchRecentQuotes,
    saveGlobalSettings,
    loadGlobalSettings as loadCloudSettings
} from './supabase.js';

// Status Management
// Load initial status from storage or default to 'draft' (safer)
let syncState = loadFromStorage('quote_sync_status', { status: 'draft', lastSynced: null });

function persistSyncStatus(status) {
    syncState = {
        status,
        lastSynced: status === 'synced' ? new Date().toISOString() : syncState.lastSynced
    };
    saveToStorage('quote_sync_status', syncState);
    broadcastStatus(status);
}

/**
 * Dispatch status change event for UI updates
 * @param {string} status - 'synced' | 'draft' | 'saving'
 */
function broadcastStatus(status) {
    const event = new CustomEvent('quote-status-changed', {
        detail: { status, lastSynced: syncState.lastSynced }
    });
    window.dispatchEvent(event);
}

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
        // ... error handling ...
        return false;
    }
}

/**
 * Load data from localStorage with error handling
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
 * Save current quote to localStorage (Draft Mode)
 * @param {Object} quoteData - Quote data to save
 * @returns {boolean} Success status
 */
export function saveCurrentQuote(quoteData) {
    const success = saveToStorage(STORAGE_KEYS.CURRENT_QUOTE, quoteData);
    if (success) {
        persistSyncStatus('draft'); // Notify UI: Unsaved Changes
    }
    return success;
}

/**
 * Publish current quote to Cloud (Supabase)
 * @returns {Promise<boolean>} Success status
 */
export async function publishCurrentQuote(name = null) {
    const quote = loadCurrentQuote();
    if (!quote) return false;

    broadcastStatus('saving');

    try {
        const savedQuote = await publishQuote(quote, name);

        // Update local with any server-side fields (like updated_at or supabase_id)
        // Merge seamlessly
        const updatedLocal = { ...quote, ...savedQuote };
        saveToStorage(STORAGE_KEYS.CURRENT_QUOTE, updatedLocal);

        persistSyncStatus('synced');
        return true;
    } catch (e) {
        console.error('Publish failed:', e);
        broadcastStatus('draft'); // Revert to draft status on failure
        alert('Failed to save to cloud. Please try again.');
        return false;
    }
}

/**
 * Revert to last published version
 * @returns {Promise<Object|null>} The restored quote or null
 */
export async function revertToPublished() {
    const quote = loadCurrentQuote();
    // We need a supabase_id or at least use the id to try and find it
    // If it's a new quote (no supabase_id), we can't revert
    if (!quote || !quote.supabase_id) {
        alert('No published version found to revert to.');
        return null;
    }

    try {
        broadcastStatus('saving'); // Show spinner/activity
        const cloudData = await fetchQuote(quote.supabase_id);

        if (cloudData && cloudData.data) {
            // Overwrite local
            const restoredQuote = cloudData.data; // The JSONB column
            // Restore proper format
            saveToStorage(STORAGE_KEYS.CURRENT_QUOTE, restoredQuote);

            persistSyncStatus('synced');
            return restoredQuote;
        }
    } catch (e) {
        console.error('Revert failed:', e);
        persistSyncStatus('draft');
    }
    return null;
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
        id: crypto.randomUUID(), // Use UUID for consistency with Cloud
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

// In-memory fallback for when sessionStorage is unavailable
let inMemoryAuth = false;

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
    try {
        return sessionStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    } catch (e) {
        console.warn('sessionStorage access failed, using in-memory fallback', e);
        return inMemoryAuth;
    }
}

/**
 * Set authentication status
 * @param {boolean} status - Authentication status
 */
export function setAuthenticated(status) {
    try {
        if (status) {
            sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        } else {
            sessionStorage.removeItem(STORAGE_KEYS.AUTH);
        }
    } catch (e) {
        console.warn('sessionStorage access failed, using in-memory fallback', e);
    }
    // Always update in-memory state
    inMemoryAuth = status;
}

/**
 * Clear all authentication data
 */
export function clearAuth() {
    try {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    } catch (e) {
        console.warn('sessionStorage access failed, using in-memory fallback', e);
    }
    inMemoryAuth = false;
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

// =============================================================================
// GLOBAL CONFIGURATION (3-Tier System)
// =============================================================================

/**
 * Load global configuration from localStorage
 * @returns {Object|null} Global config or null
 */
export function loadGlobalConfig() {
    return loadFromStorage(STORAGE_KEYS.GLOBAL_CONFIG);
}

/**
 * Save global configuration to localStorage AND Cloud
 * @param {Object} config - Global configuration object
 * @returns {boolean} Success status
 */
export function saveGlobalConfig(config) {
    const configWithTimestamp = {
        ...config,
        lastUpdated: new Date().toISOString()
    };

    // Save Local
    const localSuccess = saveToStorage(STORAGE_KEYS.GLOBAL_CONFIG, configWithTimestamp);

    // Save Cloud (Background)
    if (localSuccess) {
        saveGlobalSettings(configWithTimestamp).catch(err => {
            console.warn('Failed to sync global settings to cloud:', err);
        });
    }

    return localSuccess;
}


/**
 * Ensure global config exists (Synchronous)
 * @returns {Object} Global configuration
 */
export function ensureGlobalConfig() {
    let config = loadFromStorage(STORAGE_KEYS.GLOBAL_CONFIG);
    if (!config) {
        config = {
            ...FACTORY_DEFAULTS,
            lastUpdated: new Date().toISOString()
        };
        saveToStorage(STORAGE_KEYS.GLOBAL_CONFIG, config);
    }
    return config;
}

/**
 * Sync global config from cloud (Async)
 * @returns {Promise<void>}
 */
export async function syncGlobalConfig() {
    try {
        const cloudConfig = await loadCloudSettings();
        if (cloudConfig) {
            saveToStorage(STORAGE_KEYS.GLOBAL_CONFIG, cloudConfig);
            // We should notify app to re-render settings? 
            // For now, next render will pick it up.
        }
    } catch (e) {
        console.warn('Global config sync failed:', e);
    }
}

/**
 * Get current sync status
 */
export function getSyncStatus() {
    return syncState;
}

/**
 * Reset global config to factory defaults
 * @returns {boolean} Success status
 */
export function resetGlobalConfig() {
    return saveGlobalConfig(FACTORY_DEFAULTS);
}

// =============================================================================
// MIGRATION LOGIC (v1 → v2)
// =============================================================================

/**
 * Migrate a v1 quote to v2 structure (with 3-tier overrides)
 * @param {Object} oldQuote - Quote in v1 format
 * @returns {Object} Quote in v2 format
 */
export function migrateQuoteToV2(oldQuote) {
    if (oldQuote.version === 2) {
        return oldQuote; // Already migrated
    }

    // Extract quote-level overrides from old structure
    // (In v1, these were stored directly on the quote)
    const quoteOverrides = {
        shippingRate: oldQuote.shippingRate ?? null,
        installRate: oldQuote.installRate ?? null,
        drawerRate: oldQuote.drawerRate ?? null,
        accessoryRate: oldQuote.accessoryRate ?? null,
        markupRate: oldQuote.markupRate ?? null,
        discountRate: oldQuote.discountRate ?? null,
        exchangeRate: oldQuote.exchangeRate ?? null,
        defaultUpperHt: oldQuote.defaultUpperHt ?? null,
        defaultBaseHt: oldQuote.defaultBaseHt ?? null,
        defaultUpperDp: oldQuote.defaultUpperDp ?? null,
        defaultBaseDp: oldQuote.defaultBaseDp ?? null,
        defaultPantryDp: oldQuote.defaultPantryDp ?? null
    };

    // Clean nulls (only keep actual overrides)
    Object.keys(quoteOverrides).forEach(key => {
        if (quoteOverrides[key] === null || quoteOverrides[key] === undefined) {
            delete quoteOverrides[key];
        }
    });

    // Migrate line items to nested structure
    const newLineItems = (oldQuote.lineItems || []).map(item => {
        // Extract dimension overrides
        const dimensionOverrides = {
            ceilingFt: item.ceilingFt || null,
            upperHt: item.upperHt || null,
            baseHt: item.baseHt || null,
            upperDp: item.upperDp || null,
            baseDp: item.baseDp || null,
            pantryDp: item.pantryDp || null
        };

        // Extract rate overrides
        const rateOverrides = {
            shippingRate: item.overrideShippingRate ?? null,
            installRate: item.overrideInstallRate ?? null,
            drawerRate: item.overrideDrawerRate ?? null,
            accessoryRate: item.overrideAccessoryRate ?? null,
            markupRate: item.overrideMarkupRate ?? null,
            discountRate: item.overrideDiscountRate ?? null
        };

        // Create new structure
        const newItem = {
            ...item,
            overrides: {
                dimensions: dimensionOverrides,
                rates: rateOverrides
            },
            showAdvanced: false // Default to collapsed
        };

        // Remove old flat fields
        delete newItem.ceilingFt;
        delete newItem.upperHt;
        delete newItem.baseHt;
        delete newItem.upperDp;
        delete newItem.baseDp;
        delete newItem.pantryDp;
        delete newItem.overrideShippingRate;
        delete newItem.overrideInstallRate;
        delete newItem.overrideDrawerRate;
        delete newItem.overrideAccessoryRate;
        delete newItem.overrideMarkupRate;
        delete newItem.overrideDiscountRate;
        delete newItem.showOverride;
        delete newItem.showConfigOverride;

        return newItem;
    });

    return {
        ...oldQuote,
        version: 2,
        overrides: Object.keys(quoteOverrides).length > 0 ? quoteOverrides : {},
        lineItems: newLineItems
    };
}

/**
 * Migrate all saved quotes to v2
 * @returns {boolean} Success status
 */
export function migrateAllQuotesToV2() {
    const quotes = getSavedQuotes();
    const migratedQuotes = quotes.map(q => migrateQuoteToV2(q));
    return saveToStorage(STORAGE_KEYS.SAVED_QUOTES, migratedQuotes);
}

/**
 * Resolve a setting value through the 3-tier hierarchy
 * @param {string} settingKey - The setting to resolve (e.g., 'shippingRate')
 * @param {Object} lineItem - Line item with potential override
 * @param {Object} quote - Quote with potential override
 * @param {Object} globalConfig - Global configuration
 * @param {string} tier - 'rates' or 'dimensions'
 * @returns {*} Resolved value
 */
export function resolveSetting(settingKey, lineItem, quote, globalConfig, tier = 'rates') {
    // Tier 3: Line item override
    if (lineItem?.overrides?.[tier]?.[settingKey] !== null &&
        lineItem?.overrides?.[tier]?.[settingKey] !== undefined) {
        return lineItem.overrides[tier][settingKey];
    }

    // Tier 2: Quote-level override
    if (quote?.overrides?.[settingKey] !== null &&
        quote?.overrides?.[settingKey] !== undefined) {
        return quote.overrides[settingKey];
    }

    // Tier 1: Global default
    if (tier === 'rates') {
        return globalConfig.rates[settingKey];
    } else if (tier === 'dimensions') {
        return globalConfig.dimensions[settingKey];
    }

    return null;
}
