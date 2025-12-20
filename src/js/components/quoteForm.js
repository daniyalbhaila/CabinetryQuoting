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
    deleteQuoteFromHistory
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
    const newQuoteButtons = document.querySelectorAll('[onclick*="newQuote"]');
    newQuoteButtons.forEach((btn) => {
        btn.onclick = () => handleNewQuote(onQuoteLoad);
    });

    // Save quote button
    const saveQuoteButtons = document.querySelectorAll(
        '[onclick*="saveQuoteWithName"]'
    );
    saveQuoteButtons.forEach((btn) => {
        btn.onclick = () => handleSaveQuote(onQuoteLoad);
    });
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
            ...formData,
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
