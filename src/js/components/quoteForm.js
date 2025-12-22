/**
 * Quote Form Component
 * Handles client info, project settings, and quote history
 */

import { getElementById, setValue } from '../utils/dom.js';
import { getCurrentDate, escapeHtml, formatDate, formatTime } from '../utils/formatting.js';
import {
    saveQuoteToHistory,
    getSavedQuotes,
    getQuoteById,
    deleteQuoteFromHistory,
    ensureGlobalConfig
} from '../services/storage.js';

/**
 * Initialize quote form
 * @param {Function} onFormChange - Callback when form changes
 * @param {Function} onQuoteLoad - Callback when quote is loaded
 */
export function initQuoteForm(onFormChange, onQuoteLoad) {
    setupFormListeners(onFormChange);
    setupQuoteHistoryListeners(onQuoteLoad);
    setupCardToggles();
    setupQuoteSettingsCard(onFormChange);
}

/**
 * Setup form input listeners
 * @param {Function} onFormChange - Callback when form changes
 */
function setupFormListeners(onFormChange) {
    const formInputs = [
        'clientName',
        'projectName',
        'quoteDate',
        'projectType',
        'carcassSupplier',
        'defaultCeiling'
    ];

    formInputs.forEach((inputId) => {
        const input = getElementById(inputId);
        if (input) {
            input.addEventListener('change', onFormChange);
        }
    });
}

/**
 * Setup card header toggles
 */
function setupCardToggles() {
    const cardHeaders = document.querySelectorAll('.card-header');
    cardHeaders.forEach((header) => {
        header.addEventListener('click', () => {
            const cardBody = header.nextElementSibling;
            if (cardBody) {
                cardBody.classList.toggle('collapsed');
                header.classList.toggle('collapsed');
            }
        });
    });
}

/**
 * Setup quote history listeners
 * @param {Function} onQuoteLoad - Callback when quote is loaded
 */
function setupQuoteHistoryListeners(onQuoteLoad) {
    // New quote button
    const newQuoteBtn = getElementById('newQuoteBtn');
    if (newQuoteBtn) {
        newQuoteBtn.addEventListener('click', () => handleNewQuote(onQuoteLoad));
    }

    // Save quote button
    const saveQuoteBtn = getElementById('saveQuoteBtn');
    if (saveQuoteBtn) {
        saveQuoteBtn.addEventListener('click', () => handleSaveQuote(onQuoteLoad));
    }
}

/**
 * Load quote data into form
 * @param {Object} quoteData - Quote data to load
 */
export function loadQuoteData(quoteData) {
    if (!quoteData) {
        // Set default date
        setValue('quoteDate', getCurrentDate());
        return;
    }

    setValue('clientName', quoteData.clientName || '');
    setValue('projectName', quoteData.projectName || '');
    setValue('quoteDate', quoteData.quoteDate || getCurrentDate());
    setValue('projectType', quoteData.projectType || 'full');
    setValue('carcassSupplier', quoteData.carcassSupplier || 'holike');
    setValue('defaultCeiling', quoteData.defaultCeiling || '8');
    setValue('shippingRate', quoteData.shippingRate || 60);
    setValue('installRate', quoteData.installRate || 100);
    setValue('drawerRate', quoteData.drawerRate || 200);
    setValue('accessoryRate', quoteData.accessoryRate || 300);
    setValue('exchangeRate', quoteData.exchangeRate || 1.42);
    setValue('markupRate', quoteData.markupRate || 80);
    setValue('discountRate', quoteData.discountRate || 50);
    setValue('defaultUpperHt', quoteData.defaultUpperHt || 760);
    setValue('defaultBaseHt', quoteData.defaultBaseHt || 920);
    setValue('defaultUpperDp', quoteData.defaultUpperDp || 300);
    setValue('defaultBaseDp', quoteData.defaultBaseDp || 600);
    setValue('defaultPantryDp', quoteData.defaultPantryDp || 600);
}

/**
 * Get current form data
 * @returns {Object} Form data
 */
export function getFormData() {
    return {
        clientName: getElementById('clientName').value,
        projectName: getElementById('projectName').value,
        quoteDate: getElementById('quoteDate').value,
        projectType: getElementById('projectType').value,
        carcassSupplier: getElementById('carcassSupplier').value,
        defaultCeiling: getElementById('defaultCeiling').value,
        shippingRate: getElementById('shippingRate').value,
        installRate: getElementById('installRate').value,
        drawerRate: getElementById('drawerRate').value,
        accessoryRate: getElementById('accessoryRate').value,
        exchangeRate: getElementById('exchangeRate').value,
        markupRate: getElementById('markupRate').value,
        discountRate: getElementById('discountRate').value,
        defaultUpperHt: getElementById('defaultUpperHt').value,
        defaultBaseHt: getElementById('defaultBaseHt').value,
        defaultUpperDp: getElementById('defaultUpperDp').value,
        defaultBaseDp: getElementById('defaultBaseDp').value,
        defaultPantryDp: getElementById('defaultPantryDp').value
    };
}

/**
 * Handle new quote creation
 * @param {Function} onQuoteLoad - Callback when quote is created
 */
function handleNewQuote(onQuoteLoad) {
    if (confirm('Start a new quote? Current work will be auto-saved.')) {
        if (onQuoteLoad) onQuoteLoad(null);
    }
}

/**
 * Handle save quote with name
 * @param {Function} onComplete - Callback when save completes
 */
function handleSaveQuote(onComplete) {
    const clientName = getElementById('clientName').value || 'Unnamed Client';
    const projectName =
        getElementById('projectName').value || 'Unnamed Project';
    const quoteName = prompt(
        'Enter a name for this quote:',
        `${clientName} - ${projectName}`
    );

    if (quoteName) {
        const formData = getFormData();

        // Get line items from window (set by main app)
        const lineItems = window.quoteApp ? window.quoteApp.lineItems : [];
        const nextId = window.quoteApp ? window.quoteApp.nextId : 1;

        const success = saveQuoteToHistory(quoteName, {
            version: 2,
            ...formData,
            overrides: getQuoteOverrides(),
            lineItems,
            nextId
        });

        if (success) {
            alert('Quote saved successfully!');
            renderQuoteHistory();
            if (onComplete) onComplete();
        }
    }
}

/**
 * Render quote history list
 */
export function renderQuoteHistory() {
    const container = getElementById('historyList');
    if (!container) return;

    const quotes = getSavedQuotes();

    if (quotes.length === 0) {
        container.innerHTML =
            '<div class="history-empty">No saved quotes yet</div>';
        return;
    }

    container.innerHTML = quotes
        .map((quote) => {
            const date = new Date(quote.savedAt);
            return `
            <div class="history-item" data-quote-id="${quote.id}">
                <div class="history-item-info">
                    <div class="history-item-name">${escapeHtml(quote.name)}</div>
                    <div class="history-item-meta">${formatDate(quote.savedAt)} ${formatTime(quote.savedAt)}</div>
                </div>
                <div class="history-item-actions">
                    <button data-action="delete" data-quote-id="${quote.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
        })
        .join('');

    // Add event listeners to history items
    attachHistoryItemListeners();
}

/**
 * Attach event listeners to history items
 */
function attachHistoryItemListeners() {
    // Load quote on click
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            // Don't load if clicking delete button
            if (e.target.closest('[data-action="delete"]')) return;

            const quoteId = parseInt(item.dataset.quoteId);
            const quote = getQuoteById(quoteId);
            if (quote && window.quoteApp && window.quoteApp.loadQuote) {
                window.quoteApp.loadQuote(quote);
            }
        });
    });

    // Delete quote on button click
    const deleteButtons = document.querySelectorAll('[data-action="delete"]');
    deleteButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const quoteId = parseInt(btn.dataset.quoteId);
            if (confirm('Are you sure you want to delete this quote?')) {
                deleteQuoteFromHistory(quoteId);
                renderQuoteHistory();
            }
        });
    });
}

/**
 * Update project type and adjust install rate
 * @param {Function} onUpdate - Callback after update
 */
export function handleProjectTypeChange(onUpdate) {
    const projectType = getElementById('projectType').value;
    const installRate = projectType === 'full' ? 100 : 120;
    setValue('installRate', installRate);
    if (onUpdate) onUpdate();
}

// =============================================================================
// QUOTE SETTINGS CARD (3-Tier System - Quote Level)
// =============================================================================

/**
 * Setup quote settings card
 * @param {Function} onOverrideChange - Callback when override changes
 */
function setupQuoteSettingsCard(onOverrideChange) {
    // Initialize with global defaults displayed
    updateQuoteSettingsDisplay();

    // Setup toggle functionality
    const toggle = getElementById('quoteOverrideToggle');
    const content = getElementById('quoteOverrideContent');
    if (toggle && content) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            content.classList.toggle('show');
        });
    }

    // Setup input listeners for quote overrides
    const overrideInputs = [
        'quoteShippingRate',
        'quoteInstallRate',
        'quoteDrawerRate',
        'quoteAccessoryRate',
        'quoteMarkupRate',
        'quoteDiscountRate',
        'quoteDefaultUpperHt',
        'quoteDefaultBaseHt'
    ];

    overrideInputs.forEach(inputId => {
        const input = getElementById(inputId);
        if (input) {
            input.addEventListener('input', () => {
                updateQuoteSettingsDisplay();
                if (onOverrideChange) onOverrideChange();
            });
        }
    });

    // Setup reset button
    const resetBtn = getElementById('resetQuoteOverridesBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all quote settings to global defaults?')) {
                resetQuoteOverrides();
                updateQuoteSettingsDisplay();
                if (onOverrideChange) onOverrideChange();
            }
        });
    }
}

/**
 * Load quote overrides into the form
 * @param {Object} quoteData - Quote data with optional overrides
 */
export function loadQuoteOverrides(quoteData) {
    if (!quoteData || !quoteData.overrides) {
        // No overrides, clear all inputs
        resetQuoteOverrides();
        return;
    }

    const overrides = quoteData.overrides;

    // Load rate overrides (if they exist)
    if (overrides.shippingRate != null) setValue('quoteShippingRate', overrides.shippingRate);
    if (overrides.installRate != null) setValue('quoteInstallRate', overrides.installRate);
    if (overrides.drawerRate != null) setValue('quoteDrawerRate', overrides.drawerRate);
    if (overrides.accessoryRate != null) setValue('quoteAccessoryRate', overrides.accessoryRate);
    if (overrides.markupRate != null) setValue('quoteMarkupRate', overrides.markupRate);
    if (overrides.discountRate != null) setValue('quoteDiscountRate', overrides.discountRate);

    // Load dimension overrides (if they exist)
    if (overrides.defaultUpperHt != null) setValue('quoteDefaultUpperHt', overrides.defaultUpperHt);
    if (overrides.defaultBaseHt != null) setValue('quoteDefaultBaseHt', overrides.defaultBaseHt);

    updateQuoteSettingsDisplay();
}

/**
 * Get quote overrides from form (only non-empty values)
 * @returns {Object} Quote overrides object
 */
export function getQuoteOverrides() {
    const overrides = {};

    // Rate overrides
    const shippingRate = getElementById('quoteShippingRate')?.value;
    if (shippingRate !== '') overrides.shippingRate = parseFloat(shippingRate);

    const installRate = getElementById('quoteInstallRate')?.value;
    if (installRate !== '') overrides.installRate = parseFloat(installRate);

    const drawerRate = getElementById('quoteDrawerRate')?.value;
    if (drawerRate !== '') overrides.drawerRate = parseFloat(drawerRate);

    const accessoryRate = getElementById('quoteAccessoryRate')?.value;
    if (accessoryRate !== '') overrides.accessoryRate = parseFloat(accessoryRate);

    const markupRate = getElementById('quoteMarkupRate')?.value;
    if (markupRate !== '') overrides.markupRate = parseFloat(markupRate);

    const discountRate = getElementById('quoteDiscountRate')?.value;
    if (discountRate !== '') overrides.discountRate = parseFloat(discountRate);

    // Dimension overrides
    const upperHt = getElementById('quoteDefaultUpperHt')?.value;
    if (upperHt !== '') overrides.defaultUpperHt = parseFloat(upperHt);

    const baseHt = getElementById('quoteDefaultBaseHt')?.value;
    if (baseHt !== '') overrides.defaultBaseHt = parseFloat(baseHt);

    return overrides;
}

/**
 * Reset all quote overrides to empty (use global)
 */
function resetQuoteOverrides() {
    setValue('quoteShippingRate', '');
    setValue('quoteInstallRate', '');
    setValue('quoteDrawerRate', '');
    setValue('quoteAccessoryRate', '');
    setValue('quoteMarkupRate', '');
    setValue('quoteDiscountRate', '');
    setValue('quoteDefaultUpperHt', '');
    setValue('quoteDefaultBaseHt', '');
}

/**
 * Update quote settings display (badge and source indicators)
 */
function updateQuoteSettingsDisplay() {
    const globalConfig = ensureGlobalConfig();
    const overrides = getQuoteOverrides();
    const overrideCount = Object.keys(overrides).length;

    // Update badge
    const badge = getElementById('quoteSettingsBadge');
    if (badge) {
        if (overrideCount > 0) {
            badge.classList.add('has-overrides');
            badge.textContent = `${overrideCount} Custom`;
        } else {
            badge.classList.remove('has-overrides');
            badge.textContent = `Global`;
        }
    }

    // Update source indicators for rates
    updateSourceIndicator('shippingSource', 'quoteShippingRate', globalConfig.rates.shippingRate, 'Shipping');
    updateSourceIndicator('installSource', 'quoteInstallRate', globalConfig.rates.installRate, 'Install');
    updateSourceIndicator('drawerSource', 'quoteDrawerRate', globalConfig.rates.drawerRate, 'Drawer');
    updateSourceIndicator('accessorySource', 'quoteAccessoryRate', globalConfig.rates.accessoryRate, 'Accessory');
    updateSourceIndicator('markupSource', 'quoteMarkupRate', globalConfig.rates.markupRate, 'Markup');
    updateSourceIndicator('discountSource', 'quoteDiscountRate', globalConfig.rates.discountRate, 'Discount');

    // Update source indicators for dimensions
    updateSourceIndicator('upperHtSource', 'quoteDefaultUpperHt', globalConfig.dimensions.defaultUpperHt, 'Upper Ht');
    updateSourceIndicator('baseHtSource', 'quoteDefaultBaseHt', globalConfig.dimensions.defaultBaseHt, 'Base Ht');
}

/**
 * Update a single source indicator
 * @param {string} sourceId - ID of the source indicator element
 * @param {string} inputId - ID of the input element
 * @param {number} globalValue - Global default value
 * @param {string} label - Label for the setting
 */
function updateSourceIndicator(sourceId, inputId, globalValue, label) {
    const sourceEl = getElementById(sourceId);
    const inputEl = getElementById(inputId);

    if (!sourceEl || !inputEl) return;

    const hasOverride = inputEl.value !== '';

    if (hasOverride) {
        sourceEl.className = 'setting-source custom';
        sourceEl.textContent = `Custom for this quote`;
    } else {
        sourceEl.className = 'setting-source';
        sourceEl.textContent = `Global: ${globalValue}`;
    }
}
