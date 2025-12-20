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
    handleProjectTypeChange
} from './components/quoteForm.js';
import {
    initLineItems,
    renderLineItems,
    updateLineItemDOM
} from './components/lineItems.js';
import { updateQuoteSummary } from './components/quoteSummary.js';
import { saveCurrentQuote, loadCurrentQuote } from './services/storage.js';
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
        this.debounceTimeout = null;
    }

    /**
     * Initialize the application
     */
    init() {
        // Initialize auth first
        initAuth(() => this.onAuthSuccess());
    }

    /**
     * Called when user successfully authenticates
     */
    onAuthSuccess() {
        // Initialize all components
        initModals(() => this.recalculateAll());
        initQuoteForm(
            () => this.debouncedSave(),
            (quote) => this.loadQuote(quote)
        );
        initLineItems(() => this.debouncedSave());

        // Setup additional listeners
        this.setupEventListeners();

        // Load saved quote or initialize new
        this.loadSavedQuote();

        // Render quote history
        renderQuoteHistory();
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
            loadQuoteData(saved);

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
        }
    }

    /**
     * Load a specific quote
     * @param {Object|null} quote - Quote to load (null for new quote)
     */
    loadQuote(quote) {
        if (!quote) {
            // New quote
            this.lineItems = [];
            this.nextId = 1;
            setValue('clientName', '');
            setValue('projectName', '');
            setValue('quoteDate', getCurrentDate());
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
        loadQuoteData(quote);

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
            collapsed: false
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

        if (numericFields.includes(field)) {
            item[field] =
                value === '' ? 0 : validateLinearFeet(value);
        } else if (countFields.includes(field)) {
            item[field] = validateCount(value);
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

        const quoteData = {
            ...formData,
            lineItems: this.lineItems,
            nextId: this.nextId
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
