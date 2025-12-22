/**
 * Line Items Component
 * Handles rendering and managing quote line items
 */

import { getElementById, setText } from '../utils/dom.js';
import { escapeHtml, formatCurrency, formatDimension } from '../utils/formatting.js';
import { calculateLineItem, getProjectSettings, getEffectiveRates, hasShapedRate } from '../services/calculator.js';
import { FINISH_RATES } from '../utils/constants.js';
import { showBreakdown } from './breakdown.js';

// Store references to avoid multiple event listener attachments
let listenersAttached = false;

/**
 * Initialize line items
 * @param {Function} onLineItemChange - Callback when line item changes
 */
export function initLineItems(onLineItemChange) {
    // Add line item button
    const addBtn = getElementById('addLineItemBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (window.quoteApp && window.quoteApp.addLineItem) {
                window.quoteApp.addLineItem();
            }
        });
    }

    // Setup event delegation on container (only once)
    if (!listenersAttached) {
        setupLineItemEventDelegation();
        listenersAttached = true;
    }
}

/**
 * Setup event delegation for line items (called once)
 */
function setupLineItemEventDelegation() {
    const container = getElementById('lineItemsContainer');
    if (!container) return;

    // Handle all clicks via delegation
    container.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const id = parseInt(e.target.closest('[data-id]')?.dataset.id);

        if (!action || isNaN(id)) {
            // Check for "Add First Item" button
            if (e.target.id === 'addFirstItem' || e.target.closest('#addFirstItem')) {
                if (window.quoteApp && window.quoteApp.addLineItem) {
                    window.quoteApp.addLineItem();
                }
            }
            return;
        }

        // Handle show-breakdown first (before toggle) to prevent header toggle from capturing it
        if (action === 'show-breakdown') {
            e.stopPropagation();
            e.preventDefault();
            handleShowBreakdown(id);
        } else if (action === 'toggle') {
            handleToggleCollapse(id);
        } else if (action === 'delete') {
            e.stopPropagation();
            if (window.quoteApp && window.quoteApp.removeLineItem) {
                window.quoteApp.removeLineItem(id);
            }
        } else if (action === 'toggle-advanced') {
            e.stopPropagation();
            handleToggleAdvanced(id);
        } else if (action === 'toggle-override') {
            e.stopPropagation();
            handleToggleOverride(id);
        } else if (action === 'toggle-config-override') {
            e.stopPropagation();
            handleToggleConfigOverride(id);
        } else if (action === 'add-additional') {
            e.stopPropagation();
            handleAddAdditional(id);
        } else if (action === 'remove-additional') {
            e.stopPropagation();
            const index = parseInt(e.target.closest('[data-index]')?.dataset.index);
            if (!isNaN(index)) {
                handleRemoveAdditional(id, index);
            }
        }
    });

    // Handle input changes via delegation
    container.addEventListener('change', (e) => {
        const action = e.target.dataset.action;
        const id = parseInt(e.target.dataset.id);
        const field = e.target.dataset.field;

        if (action === 'update' && !isNaN(id) && field) {
            if (window.quoteApp && window.quoteApp.updateLineItem) {
                window.quoteApp.updateLineItem(id, field, e.target.value);
            }
        } else if (action === 'update-name' && !isNaN(id)) {
            if (window.quoteApp && window.quoteApp.updateLineItem) {
                window.quoteApp.updateLineItem(id, 'name', e.target.value);
            }
        } else if (action === 'update-additional' && !isNaN(id) && field) {
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index)) {
                handleUpdateAdditional(id, index, field, e.target.value);
            }
        } else if (action === 'update' && !isNaN(id) && field === 'finish') {
            // When finish changes, check if shaped should be disabled
            if (window.quoteApp && window.quoteApp.updateLineItem) {
                window.quoteApp.updateLineItem(id, field, e.target.value);
                // Force shaped to 'no' if new finish doesn't have shaped rate
                if (!hasShapedRate(e.target.value)) {
                    const item = window.quoteApp.lineItems.find((i) => i.id === id);
                    if (item && item.shaped === 'yes') {
                        window.quoteApp.updateLineItem(id, 'shaped', 'no');
                    }
                }
            }
        }
    });
}

/**
 * Handle toggle line item collapse
 * @param {number} id - Line item ID
 */
function handleToggleCollapse(id) {
    if (window.quoteApp && window.quoteApp.lineItems) {
        const item = window.quoteApp.lineItems.find((i) => i.id === id);
        if (item) {
            item.collapsed = !item.collapsed;
            window.quoteApp.recalculateAll();
        }
    }
}

/**
 * Handle toggle advanced section
 * @param {number} id - Line item ID
 */
function handleToggleAdvanced(id) {
    if (window.quoteApp && window.quoteApp.lineItems) {
        const item = window.quoteApp.lineItems.find((i) => i.id === id);
        if (item) {
            item.showAdvanced = !item.showAdvanced;
            window.quoteApp.recalculateAll();
        }
    }
}

/**
 * Handle toggle override section
 * @param {number} id - Line item ID
 */
function handleToggleOverride(id) {
    if (window.quoteApp && window.quoteApp.lineItems) {
        const item = window.quoteApp.lineItems.find((i) => i.id === id);
        if (item) {
            item.showOverride = !item.showOverride;
            window.quoteApp.recalculateAll();
        }
    }
}

/**
 * Handle toggle config override section
 * @param {number} id - Line item ID
 */
function handleToggleConfigOverride(id) {
    if (window.quoteApp && window.quoteApp.lineItems) {
        const item = window.quoteApp.lineItems.find((i) => i.id === id);
        if (item) {
            item.showConfigOverride = !item.showConfigOverride;
            window.quoteApp.recalculateAll();
        }
    }
}

/**
 * Handle add additional item
 * @param {number} id - Line item ID
 */
function handleAddAdditional(id) {
    if (window.quoteApp && window.quoteApp.lineItems) {
        const item = window.quoteApp.lineItems.find((i) => i.id === id);
        if (item) {
            if (!item.additionalItems) {
                item.additionalItems = [];
            }
            item.additionalItems.push({ description: '', price: 0 });
            window.quoteApp.recalculateAll();
        }
    }
}

/**
 * Handle remove additional item
 * @param {number} id - Line item ID
 * @param {number} index - Item index
 */
function handleRemoveAdditional(id, index) {
    if (window.quoteApp && window.quoteApp.lineItems) {
        const item = window.quoteApp.lineItems.find((i) => i.id === id);
        if (item && item.additionalItems) {
            item.additionalItems.splice(index, 1);
            window.quoteApp.recalculateAll();
        }
    }
}

/**
 * Handle update additional item
 * @param {number} id - Line item ID
 * @param {number} index - Item index
 * @param {string} field - Field to update ('description' or 'price')
 * @param {*} value - New value
 */
function handleUpdateAdditional(id, index, field, value) {
    if (window.quoteApp && window.quoteApp.lineItems) {
        const item = window.quoteApp.lineItems.find((i) => i.id === id);
        if (item && item.additionalItems && item.additionalItems[index]) {
            if (field === 'description') {
                item.additionalItems[index].description = value;
            } else if (field === 'price') {
                item.additionalItems[index].price = parseFloat(value) || 0;
            }
            window.quoteApp.debouncedSave();

            // Update calculations
            const calc = calculateLineItem(item);
            updateLineItemDOM(id, calc);

            // Update quote summary
            if (window.quoteApp.lineItems) {
                const quoteSummary = document.getElementById('quoteSummary');
                if (quoteSummary) {
                    import('../components/quoteSummary.js').then(module => {
                        module.updateQuoteSummary(window.quoteApp.lineItems);
                    });
                }
            }
        }
    }
}

/**
 * Handle show breakdown modal
 * @param {number} id - Line item ID
 */
function handleShowBreakdown(id) {
    if (window.quoteApp && window.quoteApp.lineItems) {
        const item = window.quoteApp.lineItems.find((i) => i.id === id);
        if (item) {
            showBreakdown(item);
        }
    }
}

/**
 * Render all line items
 * @param {Array} lineItems - Array of line items
 * @param {Function} onUpdate - Callback when line item updates
 * @param {Function} onDelete - Callback when line item deleted
 */
export function renderLineItems(lineItems, onUpdate, onDelete) {
    const container = getElementById('lineItemsContainer');
    const summary = getElementById('quoteSummary');

    if (!container) return;

    if (lineItems.length === 0) {
        container.innerHTML = renderEmptyState();
        if (summary) summary.style.display = 'none';
        return;
    }

    if (summary) summary.style.display = 'block';

    container.innerHTML = lineItems
        .map((item, index) => renderLineItem(item, index))
        .join('');

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Render empty state
 * @returns {string} Empty state HTML
 */
function renderEmptyState() {
    return `
        <div class="card empty-state">
            <h3>No line items yet</h3>
            <p>Add your first room or cabinet section to get started</p>
            <button class="btn btn-primary" id="addFirstItem">
                <i data-lucide="plus"></i>
                Add First Item
            </button>
        </div>
    `;
}

/**
 * Render a single line item
 * @param {Object} item - Line item data
 * @param {number} index - Item index
 * @returns {string} Line item HTML
 */
function renderLineItem(item, index) {
    const calc = calculateLineItem(item);
    const dims = calc.dims;
    const settings = getProjectSettings();
    const collapsedClass = item.collapsed ? 'collapsed' : '';

    return `
        <div class="line-item ${collapsedClass}" data-id="${item.id}">
            ${renderLineItemHeader(item, index, calc)}
            ${renderLineItemBody(item, dims, settings, calc)}
            ${renderLineItemFooter(item, calc, dims)}
        </div>
    `;
}

/**
 * Render line item header
 * @param {Object} item - Line item data
 * @param {number} index - Item index
 * @param {Object} calc - Calculation results
 * @returns {string} Header HTML
 */
function renderLineItemHeader(item, index, calc) {
    const finishDisplay =
        item.openShelf === 'yes'
            ? 'Open Shelf'
            : item.finish + (item.shaped === 'yes' ? ' (Shaped)' : '');

    return `
        <div class="line-item-header" data-action="toggle" data-id="${item.id}">
            <div class="line-item-left">
                <div class="line-item-number">${index + 1}</div>
                <input
                    type="text"
                    class="line-item-name-input"
                    placeholder="Room name..."
                    value="${escapeHtml(item.name || '')}"
                    data-action="update-name"
                    data-id="${item.id}"
                >
                <div class="line-item-summary">
                    <span id="lf-${item.id}">${calc.totalLF} LF</span>
                    <span>${escapeHtml(finishDisplay)}</span>
                </div>
            </div>
            <div class="line-item-right">
                <div class="line-item-price" id="price-${item.id}">
                    ${formatCurrency(calc.finalPrice)}
                </div>
                <button class="btn btn-icon" data-action="show-breakdown" data-id="${item.id}" title="Show Breakdown">
                    <i data-lucide="calculator"></i>
                </button>
                <button class="btn btn-icon btn-danger" data-action="delete" data-id="${item.id}" title="Delete Item">
                    <i data-lucide="trash-2"></i>
                </button>
                <i class="line-item-chevron" data-lucide="chevron-down"></i>
            </div>
        </div>
    `;
}

/**
 * Render line item body
 * @param {Object} item - Line item data
 * @param {Object} dims - Effective dimensions
 * @param {Object} settings - Project settings
 * @param {Object} calc - Calculation results
 * @returns {string} Body HTML
 */
function renderLineItemBody(item, dims, settings, calc) {
    const rates = getEffectiveRates(item);

    return `
        <div class="line-item-body">
            ${renderBasicSection(item, settings)}
            ${renderAdditionalItemsStandaloneSection(item)}
            ${renderAdvancedSection(item, dims, settings, rates)}
        </div>
    `;
}

/**
 * Render basic section (always visible)
 * @param {Object} item - Line item data
 * @param {Object} settings - Project settings
 * @returns {string} Basic section HTML
 */
function renderBasicSection(item, settings) {
    return `
        ${renderLinearFootageSection(item)}
        ${renderFinishSection(item, settings)}
        ${renderRoomSettingsSection(item, settings)}
    `;
}

/**
 * Render advanced section (collapsed by default)
 * @param {Object} item - Line item data
 * @param {Object} dims - Effective dimensions
 * @param {Object} settings - Project settings
 * @param {Object} rates - Effective rates
 * @returns {string} Advanced section HTML
 */
function renderAdvancedSection(item, dims, settings, rates) {
    const showAdvanced = item.showAdvanced || false;
    const toggleClass = showAdvanced ? 'active' : '';
    const contentClass = showAdvanced ? 'show' : '';
    const toggleIcon = showAdvanced
        ? '<i data-lucide="chevron-down"></i>'
        : '<i data-lucide="chevron-right"></i>';

    // Count active overrides
    const hasOverrides = item.ceilingFt || item.upperHt || item.baseHt || item.upperDp || item.baseDp || item.pantryDp ||
        item.overrideShippingRate !== null && item.overrideShippingRate !== undefined ||
        item.overrideInstallRate !== null && item.overrideInstallRate !== undefined ||
        item.overrideDrawerRate !== null && item.overrideDrawerRate !== undefined ||
        item.overrideAccessoryRate !== null && item.overrideAccessoryRate !== undefined ||
        item.overrideMarkupRate !== null && item.overrideMarkupRate !== undefined ||
        item.overrideDiscountRate !== null && item.overrideDiscountRate !== undefined ||
        (item.additionalItems && item.additionalItems.length > 0);

    const statusText = hasOverrides ? 'Custom settings' : 'Using quote defaults';

    return `
        <div class="line-item-section" style="grid-column: 1 / -1;">
            <div class="override-toggle ${toggleClass}" data-action="toggle-advanced" data-id="${item.id}">
                ${toggleIcon}
                <span>Advanced Settings</span>
                <span class="advanced-status">${statusText}</span>
            </div>
            <div class="override-content ${contentClass}">
                ${renderDimensionsSection(item, dims, settings)}
                ${renderConfigOverrideSection(item, settings, rates)}
            </div>
        </div>
    `;
}

/**
 * Render linear footage section
 * @param {Object} item - Line item data
 * @returns {string} Section HTML
 */
function renderLinearFootageSection(item) {
    return `
        <div class="line-item-section">
            <div class="line-item-section-title">Linear Footage</div>
            <div class="input-group">
                <label>Upper LF</label>
                <input
                    type="number"
                    value="${item.upperLF || ''}"
                    placeholder="0"
                    data-action="update"
                    data-id="${item.id}"
                    data-field="upperLF"
                >
            </div>
            <div class="input-group">
                <label>Base LF</label>
                <input
                    type="number"
                    value="${item.baseLF || ''}"
                    placeholder="0"
                    data-action="update"
                    data-id="${item.id}"
                    data-field="baseLF"
                >
            </div>
            <div class="input-group">
                <label>Pantry LF</label>
                <input
                    type="number"
                    value="${item.pantryLF || ''}"
                    placeholder="0"
                    data-action="update"
                    data-id="${item.id}"
                    data-field="pantryLF"
                >
            </div>
        </div>
    `;
}

/**
 * Render finish and options section
 * @param {Object} item - Line item data
 * @param {Object} settings - Project settings
 * @returns {string} Section HTML
 */
function renderFinishSection(item, settings) {
    const finishOptions = Object.keys(FINISH_RATES)
        .map(
            (f) =>
                `<option value="${f}"${item.finish === f ? ' selected' : ''}>${f}</option>`
        )
        .join('');

    // Check if current finish has different shaped rate
    const currentFinish = item.finish || 'PVC';
    const shapedEnabled = hasShapedRate(currentFinish);
    const shapedDisabled = !shapedEnabled ? ' disabled' : '';
    const shapedStyle = !shapedEnabled ? ' style="opacity: 0.5; cursor: not-allowed;"' : '';

    return `
        <div class="line-item-section">
            <div class="line-item-section-title">Finish & Options</div>
            <div class="input-group">
                <label>Finish</label>
                <select data-action="update" data-id="${item.id}" data-field="finish">
                    ${finishOptions}
                </select>
            </div>
            <div class="input-row">
                <div class="input-group"${shapedStyle}>
                    <label>Shaped? ${!shapedEnabled ? '(Same rate as unshaped)' : ''}</label>
                    <select data-action="update" data-id="${item.id}" data-field="shaped"${shapedDisabled}>
                        <option value="no"${item.shaped === 'no' || !shapedEnabled ? ' selected' : ''}>No</option>
                        <option value="yes"${item.shaped === 'yes' && shapedEnabled ? ' selected' : ''}>Yes</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Open Shelf?</label>
                    <select data-action="update" data-id="${item.id}" data-field="openShelf">
                        <option value="no"${(item.openShelf || 'no') === 'no' ? ' selected' : ''}>No</option>
                        <option value="yes"${item.openShelf === 'yes' ? ' selected' : ''}>Yes</option>
                    </select>
                </div>
            </div>
            <div class="input-row">
                <div class="input-group">
                    <label>Drawers</label>
                    <input
                        type="number"
                        value="${item.drawers || ''}"
                        placeholder="0"
                        data-action="update"
                        data-id="${item.id}"
                        data-field="drawers"
                    >
                </div>
                <div class="input-group">
                    <label>Accessories</label>
                    <input
                        type="number"
                        value="${item.accessories || ''}"
                        placeholder="0"
                        data-action="update"
                        data-id="${item.id}"
                        data-field="accessories"
                    >
                </div>
            </div>
        </div>
    `;
}

/**
 * Render room settings section (ceiling, carcass)
 * @param {Object} item - Line item data
 * @param {Object} settings - Project settings
 * @returns {string} Section HTML
 */
function renderRoomSettingsSection(item, settings) {
    return `
        <div class="line-item-section">
            <div class="line-item-section-title">Room Settings</div>
            <div class="input-group">
                <label>Ceiling Height</label>
                <select data-action="update" data-id="${item.id}" data-field="ceilingFt">
                    <option value=""${!item.ceilingFt ? ' selected' : ''}>Default (${settings.defaultCeiling}ft)</option>
                    <option value="8"${item.ceilingFt === '8' ? ' selected' : ''}>8 ft (96")</option>
                    <option value="9"${item.ceilingFt === '9' ? ' selected' : ''}>9 ft (108")</option>
                    <option value="10"${item.ceilingFt === '10' ? ' selected' : ''}>10 ft (120")</option>
                    <option value="11"${item.ceilingFt === '11' ? ' selected' : ''}>11 ft (132")</option>
                    <option value="12"${item.ceilingFt === '12' ? ' selected' : ''}>12 ft (144")</option>
                    <option value="13"${item.ceilingFt === '13' ? ' selected' : ''}>13 ft (156")</option>
                </select>
            </div>
            <div class="input-group">
                <label>Carcass Supplier</label>
                <select data-action="update" data-id="${item.id}" data-field="carcassSupplier">
                    <option value=""${!item.carcassSupplier ? ' selected' : ''}>Default (${settings.carcassSupplier === 'holike' ? 'Holike' : 'Allure'})</option>
                    <option value="holike"${item.carcassSupplier === 'holike' ? ' selected' : ''}>Holike ($65/sqm)</option>
                    <option value="allure"${item.carcassSupplier === 'allure' ? ' selected' : ''}>Allure ($200/sqm)</option>
                </select>
            </div>
        </div>
    `;
}

/**
 * Render dimensions section
 * @param {Object} item - Line item data
 * @param {Object} dims - Effective dimensions
 * @param {Object} settings - Project settings
 * @returns {string} Section HTML
 */
function renderDimensionsSection(item, dims, settings) {
    const toggleClass = item.showOverride ? 'active' : '';
    const contentClass = item.showOverride ? 'show' : '';

    return `
        <div class="line-item-section" style="margin-bottom: 1.5rem;">
            <div class="line-item-section-title">Dimension Overrides</div>
            <div class="dimension-display" style="margin-bottom: 0.5rem;">Using: Upper ${formatDimension(dims.upperHt)} • Base ${formatDimension(dims.baseHt)}</div>

            <div class="override-toggle ${toggleClass}" data-action="toggle-override" data-id="${item.id}">
                <i data-lucide="chevron-right"></i>
                <span>${item.showOverride ? 'Hide dimension overrides' : 'Override dimensions'}</span>
            </div>
            <div class="override-content ${contentClass}">
                <div class="input-row">
                    <div class="input-group">
                        <label>Upper Ht (mm)</label>
                        <input
                            type="number"
                            value="${item.upperHt || ''}"
                            placeholder="${dims.baseUpperHt}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="upperHt"
                        >
                    </div>
                    <div class="input-group">
                        <label>Base Ht (mm)</label>
                        <input
                            type="number"
                            value="${item.baseHt || ''}"
                            placeholder="${settings.defaultBaseHt}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="baseHt"
                        >
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Upper Dp (mm)</label>
                        <input
                            type="number"
                            value="${item.upperDp || ''}"
                            placeholder="${settings.defaultUpperDp}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="upperDp"
                        >
                    </div>
                    <div class="input-group">
                        <label>Base Dp (mm)</label>
                        <input
                            type="number"
                            value="${item.baseDp || ''}"
                            placeholder="${settings.defaultBaseDp}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="baseDp"
                        >
                    </div>
                </div>
                <div class="input-group">
                    <label>Pantry Dp (mm)</label>
                    <input
                        type="number"
                        value="${item.pantryDp || ''}"
                        placeholder="${settings.defaultPantryDp}"
                        data-action="update"
                        data-id="${item.id}"
                        data-field="pantryDp"
                    >
                </div>
            </div>
        </div>
    `;
}

/**
 * Render override section
 * @param {Object} item - Line item data
 * @param {Object} dims - Effective dimensions
 * @param {Object} settings - Project settings
 * @returns {string} Override HTML
 */
function renderOverrideSection(item, dims, settings) {
    const toggleClass = item.showOverride ? 'active' : '';
    const contentClass = item.showOverride ? 'show' : '';
    const toggleIcon = item.showOverride
        ? '<i data-lucide="minus"></i>'
        : '<i data-lucide="plus"></i>';

    return `
        <div class="override-section">
            <div class="override-toggle ${toggleClass}" data-action="toggle-override" data-id="${item.id}">
                ${toggleIcon}
                ${item.showOverride ? 'Hide overrides' : 'Override dimensions'}
            </div>
            <div class="override-content ${contentClass}">
                <div class="input-row">
                    <div class="input-group">
                        <label>Upper Ht (mm)</label>
                        <input
                            type="number"
                            value="${item.upperHt || ''}"
                            placeholder="${dims.baseUpperHt}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="upperHt"
                        >
                    </div>
                    <div class="input-group">
                        <label>Base Ht (mm)</label>
                        <input
                            type="number"
                            value="${item.baseHt || ''}"
                            placeholder="${settings.defaultBaseHt}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="baseHt"
                        >
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Upper Dp (mm)</label>
                        <input
                            type="number"
                            value="${item.upperDp || ''}"
                            placeholder="${settings.defaultUpperDp}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="upperDp"
                        >
                    </div>
                    <div class="input-group">
                        <label>Base Dp (mm)</label>
                        <input
                            type="number"
                            value="${item.baseDp || ''}"
                            placeholder="${settings.defaultBaseDp}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="baseDp"
                        >
                    </div>
                </div>
                <div class="input-group">
                    <label>Pantry Dp (mm)</label>
                    <input
                        type="number"
                        value="${item.pantryDp || ''}"
                        placeholder="${settings.defaultPantryDp}"
                        data-action="update"
                        data-id="${item.id}"
                        data-field="pantryDp"
                    >
                </div>
            </div>
        </div>
    `;
}

/**
 * Render config override section
 * @param {Object} item - Line item data
 * @param {Object} settings - Project settings
 * @param {Object} rates - Effective rates
 * @returns {string} Config override HTML
 */
function renderConfigOverrideSection(item, settings, rates) {
    const toggleClass = item.showConfigOverride ? 'active' : '';
    const contentClass = item.showConfigOverride ? 'show' : '';
    // Get defaults to show as placeholders
    const defaultShipping = settings.shippingRate;
    const defaultInstall = settings.installRate;
    const defaultDrawer = settings.drawerRate;
    const defaultAccessory = settings.accessoryRate;
    const defaultMarkup = (settings.markupRate * 100).toFixed(0);
    const defaultDiscount = (settings.discountRate * 100).toFixed(0);

    return `
        <div class="line-item-section" style="margin-bottom: 1.5rem;">
            <div class="line-item-section-title">Pricing Overrides</div>
            <div class="dimension-display" style="margin-bottom: 0.5rem;">Using quote defaults</div>

            <div class="override-toggle ${toggleClass}" data-action="toggle-config-override" data-id="${item.id}">
                <i data-lucide="chevron-right"></i>
                <span>${item.showConfigOverride ? 'Hide pricing overrides' : 'Override pricing'}</span>
            </div>
            <div class="override-content ${contentClass}">
                <div class="input-row">
                    <div class="input-group">
                        <label>Shipping ($/LF)</label>
                        <input
                            type="number"
                            value="${item.overrideShippingRate !== null && item.overrideShippingRate !== undefined ? item.overrideShippingRate : ''}"
                            placeholder="${defaultShipping}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="overrideShippingRate"
                            step="0.01"
                        >
                    </div>
                    <div class="input-group">
                        <label>Install ($/LF)</label>
                        <input
                            type="number"
                            value="${item.overrideInstallRate !== null && item.overrideInstallRate !== undefined ? item.overrideInstallRate : ''}"
                            placeholder="${defaultInstall}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="overrideInstallRate"
                            step="0.01"
                        >
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Drawer Cost ($)</label>
                        <input
                            type="number"
                            value="${item.overrideDrawerRate !== null && item.overrideDrawerRate !== undefined ? item.overrideDrawerRate : ''}"
                            placeholder="${defaultDrawer}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="overrideDrawerRate"
                            step="0.01"
                        >
                    </div>
                    <div class="input-group">
                        <label>Accessory Cost ($)</label>
                        <input
                            type="number"
                            value="${item.overrideAccessoryRate !== null && item.overrideAccessoryRate !== undefined ? item.overrideAccessoryRate : ''}"
                            placeholder="${defaultAccessory}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="overrideAccessoryRate"
                            step="0.01"
                        >
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-group">
                        <label>Markup (%)</label>
                        <input
                            type="number"
                            value="${item.overrideMarkupRate !== null && item.overrideMarkupRate !== undefined ? item.overrideMarkupRate : ''}"
                            placeholder="${defaultMarkup}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="overrideMarkupRate"
                            step="0.1"
                        >
                    </div>
                    <div class="input-group">
                        <label>Discount (%)</label>
                        <input
                            type="number"
                            value="${item.overrideDiscountRate !== null && item.overrideDiscountRate !== undefined ? item.overrideDiscountRate : ''}"
                            placeholder="${defaultDiscount}"
                            data-action="update"
                            data-id="${item.id}"
                            data-field="overrideDiscountRate"
                            step="0.1"
                        >
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render additional items as standalone section
 * @param {Object} item - Line item data
 * @returns {string} Additional items HTML
 */
function renderAdditionalItemsStandaloneSection(item) {
    const additionalItems = item.additionalItems || [];

    const itemsHtml = additionalItems.map((addItem, index) => `
        <div class="additional-item-row">
            <div class="additional-item-desc">
                <input
                    type="text"
                    class="form-input"
                    value="${escapeHtml(addItem.description || '')}"
                    placeholder="Description"
                    data-action="update-additional"
                    data-id="${item.id}"
                    data-index="${index}"
                    data-field="description"
                >
            </div>
            <div class="additional-item-price">
                <input
                    type="number"
                    class="form-input"
                    value="${addItem.price || ''}"
                    placeholder="Price"
                    data-action="update-additional"
                    data-id="${item.id}"
                    data-index="${index}"
                    data-field="price"
                    step="0.01"
                >
            </div>
            <button
                type="button"
                class="btn btn-icon btn-danger btn-remove-item"
                data-action="remove-additional"
                data-id="${item.id}"
                data-index="${index}"
                title="Remove Item"
            >
                <i data-lucide="x"></i>
            </button>
        </div>
    `).join('');

    return `
        <div class="line-item-section additional-items-section">
            <div class="line-item-section-title">
                <span>Additional Items</span>
                <button
                    type="button"
                    class="btn btn-sm btn-secondary"
                    data-action="add-additional"
                    data-id="${item.id}"
                >
                    <i data-lucide="plus"></i> Add Item
                </button>
            </div>
            
            <div class="additional-items-list">
                ${additionalItems.length > 0 ? itemsHtml : '<div class="additional-items-empty">No additional items added</div>'}
            </div>
        </div>
    `;
}

/**
 * Render line item footer
 * @param {Object} item - Line item data
 * @param {Object} calc - Calculation results
 * @param {Object} dims - Effective dimensions
 * @returns {string} Footer HTML
 */
function renderLineItemFooter(item, calc, dims) {
    return `
        <div class="line-item-footer">
            <div class="cost-breakdown">
                <div class="cost-item">
                    <span class="cost-item-label">Cabinetry:</span>
                    <span class="cost-item-value" id="cabinetry-${item.id}">${formatCurrency(calc.cabinetry)}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-item-label">Shipping:</span>
                    <span class="cost-item-value" id="shipping-${item.id}">${formatCurrency(calc.shipping)}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-item-label">Install:</span>
                    <span class="cost-item-value" id="install-${item.id}">${formatCurrency(calc.install)}</span>
                </div>
            </div>
            <div style="font-size: 0.8125rem; color: var(--text-muted);">
                ${calc.totalLF} LF • ${dims.carcassSupplier === 'holike' ? 'Holike' : 'Allure'}
            </div>
        </div>
    `;
}


/**
 * Update line item DOM without full re-render
 * @param {number} id - Line item ID
 * @param {Object} calc - New calculation results
 */
export function updateLineItemDOM(id, calc) {
    // Update price with calculator icon preserved
    // Update price (just text, icon is separate)
    const priceEl = getElementById(`price-${id}`);
    if (priceEl) {
        priceEl.textContent = formatCurrency(calc.finalPrice);
    }
    setText(`lf-${id}`, `${calc.totalLF} LF`);
    setText(`cabinetry-${id}`, formatCurrency(calc.cabinetry));
    setText(`shipping-${id}`, formatCurrency(calc.shipping));
    setText(`install-${id}`, formatCurrency(calc.install));
}
