/**
 * Main Application
 * Initializes and coordinates all components
 */

import { initAuth } from './components/auth.js';
import { initModals, updateCeilingDisplay } from './components/modals.js';
import {
    initQuoteForm,
    loadQuoteData,
    getFormData,
    renderQuoteHistory,
    handleProjectTypeChange,
    loadQuoteOverrides,
    getQuoteOverrides
} from './components/quoteForm.js';
import {
    initLineItems,
    renderLineItems,
    updateLineItemDOM
} from './components/lineItems.js';
import { updateQuoteSummary } from './components/quoteSummary.js';
import { initBreakdown } from './components/breakdown.js';
import { saveCurrentQuote, loadCurrentQuote, syncGlobalConfig } from './services/storage.js';
import { fetchQuote } from './services/supabase.js';
import { calculateLineItem } from './services/calculator.js';
import { validateLinearFeet, validateCount } from './utils/validation.js';
import { getElementById, setValue } from './utils/dom.js';
import { getCurrentDate } from './utils/formatting.js';

/**
 * Quote Application State
 */
class QuoteApp {
    constructor() {
        this.lineItems = [];
        this.nextId = 1;
        this.quoteOverrides = {}; // Quote-level overrides (3-tier system)
        this.supabase_id = null; // Track cloud ID
        this.debounceTimeout = null;
        this.recalculateTimeout = null;
    }

    /**
     * Initialize the application
     */
    init() {
        // Initialize auth first
        initAuth(() => this.onAuthSuccess());
        // Start background sync of global config
        syncGlobalConfig();
    }

    /**
     * Called when user successfully authenticates
     */
    onAuthSuccess() {
        // Initialize all components
        initModals(() => this.debouncedRecalculate());
        initQuoteForm(
            () => {
                // Update overrides and recalculate when form changes (including project-level overrides)
                this.quoteOverrides = getQuoteOverrides();
                this.debouncedRecalculate();
                this.debouncedSave();
            },
            (quote) => this.loadQuote(quote)
        );
        initLineItems(() => this.debouncedSave());
        initBreakdown();

        // Setup additional listeners
        this.setupEventListeners();

        // Load saved quote or initialize new
        this.loadSavedQuote();

        // Render quote history
        renderQuoteHistory();

        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Setup additional event listeners
     */
    setupEventListeners() {
        // Project type change
        const projectType = getElementById('projectType');
        if (projectType) {
            projectType.addEventListener('change', () => {
                handleProjectTypeChange(() => this.recalculateAll());
            });
        }

        // Ceiling height change
        const ceilingSelect = getElementById('defaultCeiling');
        if (ceilingSelect) {
            ceilingSelect.addEventListener('change', () => {
                updateCeilingDisplay(ceilingSelect.value, () =>
                    this.recalculateAll()
                );
            });
        }
    }


    /**
     * Load saved quote from localStorage
     */
    loadSavedQuote() {
        const saved = loadCurrentQuote();

        if (saved) {
            this.lineItems = saved.lineItems || [];
            this.nextId = saved.nextId || 1;
            this.quoteOverrides = saved.overrides || {};
            this.supabase_id = saved.supabase_id || null;
            loadQuoteData(saved);
            loadQuoteOverrides(saved); // Load quote-level overrides

            // Update ceiling display
            updateCeilingDisplay(saved.defaultCeiling || '8');

            renderLineItems(
                this.lineItems,
                (id, field, value) => this.updateLineItem(id, field, value),
                (id) => this.removeLineItem(id)
            );
            updateQuoteSummary(this.lineItems);
        } else {
            // Set default date
            setValue('quoteDate', getCurrentDate());
            updateCeilingDisplay('8');
            loadQuoteOverrides(null); // Initialize with empty overrides
            this.supabase_id = null;
        }
    }

    /**
     * Load a specific quote
     * @param {Object|null} quote - Quote to load (null for new quote)
     */
    /**
     * Load a specific quote
     * @param {Object|null} quote - Quote to load (null for new quote)
     */
    loadQuote(quote) {
        // ... (existing implementation)
        if (!quote) {
            // New quote
            this.lineItems = [];
            this.nextId = 1;
            this.quoteOverrides = {};
            this.supabase_id = null;
            setValue('clientName', '');
            setValue('projectName', '');
            setValue('quoteDate', getCurrentDate());
            loadQuoteOverrides(null); // Clear quote overrides inputs
            this.quoteOverrides = {}; // Reset app state immediately
            renderLineItems(
                this.lineItems,
                (id, field, value) => this.updateLineItem(id, field, value),
                (id) => this.removeLineItem(id)
            );
            updateQuoteSummary(this.lineItems);
            this.saveState();
            window.scrollTo(0, 0);
            return;
        }

        // Load existing quote
        this.lineItems = quote.lineItems || [];
        this.nextId = quote.nextId || 1;
        this.quoteOverrides = quote.overrides || {};
        this.supabase_id = quote.supabase_id || null;
        loadQuoteData(quote);
        loadQuoteOverrides(quote); // Load quote-level overrides

        updateCeilingDisplay(quote.defaultCeiling || '8');

        renderLineItems(
            this.lineItems,
            (id, field, value) => this.updateLineItem(id, field, value),
            (id) => this.removeLineItem(id)
        );
        updateQuoteSummary(this.lineItems);
        this.saveState();
        window.scrollTo(0, 0);
    }

    /**
     * Load quote from cloud
     * @param {string} id - Quote UUID
     */
    async loadQuoteFromCloud(id) {
        try {
            // fetchQuote returns the quote object directly (or throws)
            const quoteData = await fetchQuote(id);

            if (!quoteData) {
                alert('Failed to load quote from cloud (Empty response).');
                return;
            }

            // Inject the top-level ID just in case
            const quote = { ...quoteData, supabase_id: id };

            // If the fetched quote has an 'updated_at' from the row, we might want to preserve it
            // but our internal structure usually keeps it in metadata. 

            console.log('Loading quote from cloud:', quote);
            this.loadQuote(quote);
            console.log('Quote loaded successfully');

            // Mark as synced since we just loaded it
            // We need to bypass the auto-save 'draft' trigger that loadQuote -> saveState causes
            // Or just update the status immediately after
            // For now, let's trust the storage service to persist the sync status if we tell it
            // But we don't have direct access to persistSyncStatus here without importing it.
            // Let's defer that for now, loading is the priority.
        } catch (e) {
            console.error('Error loading cloud quote:', e);
            alert(`Error loading quote from cloud: ${e.message || 'Unknown error'}`);
        }
    }

    /**
     * Add a new line item
     */
    addLineItem() {
        const id = this.nextId++;

        this.lineItems.push({
            id,
            name: '',
            upperLF: 0,
            baseLF: 0,
            pantryLF: 0,
            finish: 'PVC',
            shaped: 'no',
            openShelf: 'no',
            drawers: 0,
            accessories: 0,
            ceilingFt: '',
            carcassSupplier: '',
            upperHt: 0,
            baseHt: 0,
            upperDp: 0,
            baseDp: 0,
            pantryDp: 0,
            showOverride: false,
            showAdvanced: false, // New: controls Advanced section visibility
            collapsed: false,
            // Config override fields
            showConfigOverride: false,
            overrideShippingRate: null,
            overrideInstallRate: null,
            overrideDrawerRate: null,
            overrideAccessoryRate: null,
            overrideMarkupRate: null,
            overrideDiscountRate: null,
            additionalItems: []
        });

        renderLineItems(
            this.lineItems,
            (id, field, value) => this.updateLineItem(id, field, value),
            (id) => this.removeLineItem(id)
        );
        updateQuoteSummary(this.lineItems);
        this.saveState();
    }

    /**
     * Remove a line item
     * @param {number} id - Line item ID
     */
    removeLineItem(id) {
        this.lineItems = this.lineItems.filter((item) => item.id !== id);

        renderLineItems(
            this.lineItems,
            (id, field, value) => this.updateLineItem(id, field, value),
            (id) => this.removeLineItem(id)
        );
        updateQuoteSummary(this.lineItems);
        this.saveState();
    }

    /**
     * Update a line item field
     * @param {number} id - Line item ID
     * @param {string} field - Field name
     * @param {*} value - New value
     */
    updateLineItem(id, field, value) {
        const item = this.lineItems.find((i) => i.id === id);
        if (!item) return;

        // Validate numeric fields
        const numericFields = [
            'upperLF',
            'baseLF',
            'pantryLF',
            'upperHt',
            'baseHt',
            'upperDp',
            'baseDp',
            'pantryDp'
        ];
        const countFields = ['drawers', 'accessories'];
        const overrideFields = [
            'overrideShippingRate',
            'overrideInstallRate',
            'overrideDrawerRate',
            'overrideAccessoryRate',
            'overrideMarkupRate',
            'overrideDiscountRate'
        ];

        if (numericFields.includes(field)) {
            item[field] =
                value === '' ? 0 : validateLinearFeet(value);
        } else if (countFields.includes(field)) {
            item[field] = validateCount(value);
        } else if (overrideFields.includes(field)) {
            // Override fields: empty = null (use default), otherwise validate
            item[field] = value === '' ? null : validateLinearFeet(value);
        } else {
            item[field] = value;
        }

        // Update DOM without full re-render for performance
        const calc = calculateLineItem(item);
        updateLineItemDOM(id, calc);
        updateQuoteSummary(this.lineItems);
        this.debouncedSave();
    }

    /**
     * Recalculate all items and update display
     */
    recalculateAll() {
        renderLineItems(
            this.lineItems,
            (id, field, value) => this.updateLineItem(id, field, value),
            (id) => this.removeLineItem(id)
        );
        updateQuoteSummary(this.lineItems);
        this.saveState();
    }

    /**
     * Save current state to localStorage
     */
    saveState() {
        const formData = getFormData();

        // Get current quote-level overrides from form
        this.quoteOverrides = getQuoteOverrides();

        const quoteData = {
            version: 2, // Mark as v2 format (3-tier system)
            ...formData,
            overrides: this.quoteOverrides, // Quote-level overrides
            lineItems: this.lineItems,
            nextId: this.nextId,
            supabase_id: this.supabase_id // Persist cloud ID
        };

        saveCurrentQuote(quoteData);
    }

    /**
     * Debounced save to prevent excessive localStorage writes
     */
    debouncedSave() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.saveState();
        }, 500);
    }

    /**
     * Debounced recalculate to avoid excessive re-renders
     */
    debouncedRecalculate() {
        clearTimeout(this.recalculateTimeout);
        this.recalculateTimeout = setTimeout(() => {
            this.recalculateAll();
        }, 150); // Shorter delay for more responsive UI
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new QuoteApp();
        app.init();
        // Expose to window for component callbacks
        window.quoteApp = app;
    });
} else {
    const app = new QuoteApp();
    app.init();
    window.quoteApp = app;
}

export default QuoteApp;
