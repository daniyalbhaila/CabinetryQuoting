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
    ensureGlobalConfig,
    publishCurrentQuote,
    revertToPublished,
    saveCurrentQuote,
    loadCurrentQuote,
    getSyncStatus
} from '../services/storage.js';
import { fetchRecentQuotes, deleteQuote } from '../services/supabase.js';
import { hideHistory } from './modals.js';

/**
 * Initialize quote form
 * @param {Function} onFormChange - Callback when form changes
 * @param {Function} onQuoteLoad - Callback when quote is loaded
 */
export function initQuoteForm(onFormChange, onQuoteLoad) {
    setupFormListeners(onFormChange);
    setupQuoteHistoryListeners(onQuoteLoad);
    renderQuoteHistory(); // Initial load of cloud history
    setupCardToggles();
    setupQuoteSettingsCard(onFormChange);

    // Initial summary update
    updateProjectSummary();

    // Initial Save Button State
    const currentStatus = getSyncStatus();
    updateSaveButtonUI(currentStatus.status);
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
            input.addEventListener('change', () => {
                if (onFormChange) onFormChange();
                updateProjectSummary();
            });
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

    // Revert quote button
    const revertBtn = getElementById('revertQuoteBtn');
    if (revertBtn) {
        revertBtn.addEventListener('click', handleRevert);
    }
}

/**
 * Load quote data into form (only project-level fields)
 * Note: Rates and dimensions are now loaded via loadQuoteOverrides() in v2 3-tier system
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

    updateProjectSummary();
}

/**
 * Get current form data (only project-level fields, not rates/dimensions)
 * Note: Rates and dimensions are now handled via quote overrides in v2 3-tier system
 * @returns {Object} Form data
 */
export function getFormData() {
    return {
        clientName: getElementById('clientName')?.value || '',
        projectName: getElementById('projectName')?.value || '',
        quoteDate: getElementById('quoteDate')?.value || '',
        projectType: getElementById('projectType')?.value || 'full',
        carcassSupplier: getElementById('carcassSupplier')?.value || 'holike',
        defaultCeiling: getElementById('defaultCeiling')?.value || '8'
    };
}

/**
 * Handle new quote creation
 * @param {Function} onQuoteLoad - Callback when quote is created
 */
function handleNewQuote(onQuoteLoad) {
    if (confirm('Start a new quote? This will clear the current form.')) {
        if (onQuoteLoad) onQuoteLoad(null);
    }
}

/**
 * Handle save quote (Publish to Cloud)
 * @param {Function} onComplete - Callback when save completes
 */
async function handleSaveQuote(onComplete) {
    // 1. Prompt for Name
    const nameInput = getElementById('clientName'); // Use client name or project name as default?
    const projectInput = getElementById('projectName');

    let defaultName = projectInput?.value || '';
    if (!defaultName && nameInput?.value) {
        defaultName = `${nameInput.value} Quote`;
    }

    const name = prompt('Enter a name for this quote:', defaultName);
    if (!name) return; // User cancelled

    // Update the UI with the new name immediately
    if (projectInput) {
        projectInput.value = name;
        updateProjectSummary();
    }

    const saveBtn = getElementById('saveQuoteBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
        if (window.lucide) window.lucide.createIcons();
    }

    try {
        // Save using the new name, but preserve existing data (line items, overrides)
        // We merged the form data with the current storage state
        // Save using the new name, but preserve existing data (line items, overrides)
        // We merged the form data with the current storage state
        const currentQuote = loadCurrentQuote() || {};
        const formData = getFormData();

        // FAILSAFE: Ensure we capture the latest in-memory state from the running app
        // This prevents "debounce lag" where storage might be slightly behind the UI
        if (window.quoteApp) {
            currentQuote.lineItems = window.quoteApp.lineItems || [];
            currentQuote.overrides = window.quoteApp.quoteOverrides || {};
            currentQuote.nextId = window.quoteApp.nextId || 1;
        }

        const mergedQuote = {
            ...currentQuote,
            ...formData
        };
        saveCurrentQuote(mergedQuote);

        const success = await publishCurrentQuote();
        if (success) {
            // Sync the new ID back to the running app state so future auto-saves include it
            const saved = loadCurrentQuote();
            if (saved && saved.supabase_id && window.quoteApp) {
                window.quoteApp.supabase_id = saved.supabase_id;
            }

            // Re-fetch and render the cloud history
            await renderQuoteHistory();
            // Do NOT call onComplete() here, as it triggers loadQuote(undefined) which resets the form
            // The UI is already up-to-date with the saved data
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }
}

/**
 * Handle Revert
 */
async function handleRevert() {
    if (confirm('Discard your recent unsaved changes? This will reload the last saved version from the cloud.')) {
        const revertBtn = getElementById('revertQuoteBtn');
        if (revertBtn) {
            revertBtn.disabled = true;
            revertBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
            window.lucide?.createIcons();
        }

        await revertToPublished();
        // Reload app state is handled by the caller or we trigger a reload?
        // revertToPublished updates local storage. App State needs to refresh.
        // We might need to reload the page or re-init the app state.
        location.reload();
    }
}

// Listen for status changes to update UI
window.addEventListener('quote-status-changed', (e) => {
    const { status } = e.detail;
    updateSaveButtonUI(status);
});

function updateSaveButtonUI(status) {
    const btn = getElementById('saveQuoteBtn');
    if (!btn) return;

    // Revert button should exist in HTML
    const revertBtn = getElementById('revertQuoteBtn');

    if (status === 'draft') {
        // Draft Mode: Solid Green
        btn.className = 'btn btn-success flex-1';
        btn.innerHTML = '<i data-lucide="cloud-upload"></i> Save';
        if (revertBtn) revertBtn.style.display = 'inline-flex';
    } else if (status === 'synced') {
        // Synced Mode: Ghost/Transparent
        btn.className = 'btn btn-ghost flex-1';
        btn.innerHTML = '<i data-lucide="check"></i> Saved';
        if (revertBtn) revertBtn.style.display = 'none';
    } else if (status === 'saving') {
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving';
    }

    if (window.lucide) window.lucide.createIcons();
}

/**
 * Render quote history list
 */
export async function renderQuoteHistory() {
    const container = getElementById('historyList');
    if (!container) return;

    container.innerHTML = '<div class="p-4 text-center opacity-50"><i data-lucide="loader-2" class="spin"></i> Loading cloud history...</div>';
    if (window.lucide) window.lucide.createIcons();

    try {
        const quotes = await fetchRecentQuotes();

        if (!quotes || quotes.length === 0) {
            container.innerHTML = '<div class="history-empty">No cloud quotes found</div>';
            return;
        }

        container.innerHTML = quotes
            .map((quote) => {
                // Supabase returns 'updated_at', we format that
                const date = new Date(quote.updated_at);
                return `
                <div class="history-item" data-quote-id="${quote.id}">
                    <div class="history-item-info">
                        <div class="history-item-name">${escapeHtml(quote.name || 'Untitled')}</div>
                        <div class="history-item-meta">
                            ${formatDate(quote.updated_at)} ${formatTime(quote.updated_at)}
                            <br><span class="text-xs opacity-75">By ${escapeHtml(quote.last_modified_by || 'Unknown')}</span>
                        </div>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-ghost btn-sm text-error" data-action="delete" data-quote-id="${quote.id}" title="Delete">
                            <i data-lucide="trash-2"></i>
                        </button>
                        <button class="btn-ghost btn-sm" title="Load">
                            <i data-lucide="arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
            })
            .join('');

        // Add event listeners to history items
        attachHistoryItemListeners();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (err) {
        console.error('Failed to load history:', err);
        container.innerHTML = '<div class="history-empty text-error">Failed to load history</div>';
    }
}

/**
 * Attach event listeners to history items
 */
function attachHistoryItemListeners() {
    const historyItems = document.querySelectorAll('.history-item');
    historyItems.forEach((item) => {
        // Main Click (Load)
        item.addEventListener('click', async (e) => {
            // Check if delete button was clicked
            if (e.target.closest('[data-action="delete"]')) {
                e.stopPropagation();
                const btn = e.target.closest('[data-action="delete"]');
                const quoteId = btn.dataset.quoteId;

                if (confirm('Are you sure you want to delete this quote from the cloud? This cannot be undone.')) {
                    try {
                        btn.disabled = true;
                        await deleteQuote(quoteId);
                        await renderQuoteHistory(); // Reload list
                    } catch (err) {
                        alert('Failed to delete quote');
                        btn.disabled = false;
                    }
                }
                return;
            }

            const quoteId = item.dataset.quoteId;
            if (!quoteId) return;

            // Show loading state?
            if (window.quoteApp && window.quoteApp.loadQuoteFromCloud) {
                await window.quoteApp.loadQuoteFromCloud(quoteId);
                hideHistory();
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

    // Initialize with global defaults displayed
    updateQuoteSettingsDisplay();



    // Setup input listeners for quote overrides
    const overrideInputs = [
        'quoteShippingRate',
        'quoteInstallRate',
        'quoteDrawerRate',
        'quoteAccessoryRate',
        'quoteMarkupRate',
        'quoteDiscountRate',
        'quoteDefaultUpperHt',
        'quoteDefaultBaseHt',
        'quoteDefaultUpperDp',
        'quoteDefaultBaseDp',
        'quoteDefaultPantryDp'
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
    // Always start clean to ensure no stale data from previous state
    resetQuoteOverrides();

    if (!quoteData || !quoteData.overrides) {
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
    if (overrides.defaultUpperDp != null) setValue('quoteDefaultUpperDp', overrides.defaultUpperDp);
    if (overrides.defaultBaseDp != null) setValue('quoteDefaultBaseDp', overrides.defaultBaseDp);
    if (overrides.defaultPantryDp != null) setValue('quoteDefaultPantryDp', overrides.defaultPantryDp);

    updateQuoteSettingsDisplay();
}

/**
 * Get quote overrides from form (only non-empty values)
 * @returns {Object} Quote overrides object
 */
export function getQuoteOverrides() {
    const overrides = {};

    // Rate overrides
    const shippingInput = getElementById('quoteShippingRate');
    if (shippingInput && shippingInput.value !== '') overrides.shippingRate = parseFloat(shippingInput.value);

    const installInput = getElementById('quoteInstallRate');
    if (installInput && installInput.value !== '') overrides.installRate = parseFloat(installInput.value);

    const drawerInput = getElementById('quoteDrawerRate');
    if (drawerInput && drawerInput.value !== '') overrides.drawerRate = parseFloat(drawerInput.value);

    const accessoryInput = getElementById('quoteAccessoryRate');
    if (accessoryInput && accessoryInput.value !== '') overrides.accessoryRate = parseFloat(accessoryInput.value);

    const markupInput = getElementById('quoteMarkupRate');
    if (markupInput && markupInput.value !== '') overrides.markupRate = parseFloat(markupInput.value);

    const discountInput = getElementById('quoteDiscountRate');
    if (discountInput && discountInput.value !== '') overrides.discountRate = parseFloat(discountInput.value);

    // Dimension overrides
    const upperHtInput = getElementById('quoteDefaultUpperHt');
    if (upperHtInput && upperHtInput.value !== '') overrides.defaultUpperHt = parseFloat(upperHtInput.value);

    const baseHtInput = getElementById('quoteDefaultBaseHt');
    if (baseHtInput && baseHtInput.value !== '') overrides.defaultBaseHt = parseFloat(baseHtInput.value);

    const upperDpInput = getElementById('quoteDefaultUpperDp');
    if (upperDpInput && upperDpInput.value !== '') overrides.defaultUpperDp = parseFloat(upperDpInput.value);

    const baseDpInput = getElementById('quoteDefaultBaseDp');
    if (baseDpInput && baseDpInput.value !== '') overrides.defaultBaseDp = parseFloat(baseDpInput.value);

    const pantryDpInput = getElementById('quoteDefaultPantryDp');
    if (pantryDpInput && pantryDpInput.value !== '') overrides.defaultPantryDp = parseFloat(pantryDpInput.value);

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
    setValue('quoteDefaultUpperDp', '');
    setValue('quoteDefaultBaseDp', '');
    setValue('quoteDefaultPantryDp', '');
}

/**
 * Update quote settings display (badge and source indicators)
 */
function updateQuoteSettingsDisplay() {
    const globalConfig = ensureGlobalConfig();
    const overrides = getQuoteOverrides();
    const overrideCount = Object.keys(overrides).length;

    // Update badge
    const badge = getElementById('sidebarOverridesBadge');
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
    updateSourceIndicator('upperDpSource', 'quoteDefaultUpperDp', globalConfig.dimensions.defaultUpperDp, 'Upper Dp');
    updateSourceIndicator('baseDpSource', 'quoteDefaultBaseDp', globalConfig.dimensions.defaultBaseDp, 'Base Dp');
    updateSourceIndicator('pantryDpSource', 'quoteDefaultPantryDp', globalConfig.dimensions.defaultPantryDp, 'Pantry Dp');
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

/**
 * Update the project summary card in the sidebar
 */
export function updateProjectSummary() {
    const clientName = getElementById('clientName')?.value || 'Client Name';
    const projectName = getElementById('projectName')?.value || 'Project Name';
    const date = getElementById('quoteDate')?.value;
    const projectType = getElementById('projectType')?.value;

    const summaryClient = getElementById('summaryClientName');
    const summaryProject = getElementById('summaryProjectName');
    const summaryDate = getElementById('summaryDate');
    const summaryType = getElementById('summaryType');

    if (summaryClient) summaryClient.textContent = clientName || 'Client Name';
    if (summaryProject) summaryProject.textContent = projectName || 'Project Name';
    if (summaryDate) summaryDate.textContent = date ? formatDate(date) : 'Date';
    if (summaryType) summaryType.textContent = projectType === 'single' ? 'Single Project' : 'Full House';

    // Update override indicator on summary card
    const overrides = getQuoteOverrides();
    const hasOverrides = Object.keys(overrides).length > 0;
    const summaryCard = getElementById('projectSummaryCard');

    if (summaryCard) {
        if (hasOverrides) {
            summaryCard.classList.add('has-overrides');
            // Add or update indicator if not exists (handled via CSS ::after usually, but we can toggle class)
        } else {
            summaryCard.classList.remove('has-overrides');
        }
    }
}
