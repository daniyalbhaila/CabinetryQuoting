/**
 * Line Items Component
 * Handles rendering and managing quote line items
 */

import { getElementById, setText } from '../utils/dom.js';
import { escapeHtml, formatCurrency, formatDimension } from '../utils/formatting.js';
import { calculateLineItem, getProjectSettings } from '../services/calculator.js';
import { FINISH_RATES } from '../utils/constants.js';

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

    // Add first item button (in empty state)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'addFirstItem' || e.target.closest('#addFirstItem')) {
            if (window.quoteApp && window.quoteApp.addLineItem) {
                window.quoteApp.addLineItem();
            }
        }
    });
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

    // Attach event listeners
    attachLineItemListeners(lineItems, onUpdate, onDelete);
}

/**
 * Render empty state
 * @returns {string} Empty state HTML
 */
function renderEmptyState() {
    return `
        <div class="card empty-state">
            <div class="empty-state-icon">📦</div>
            <h3>No line items yet</h3>
            <p>Add your first room or cabinet section to get started</p>
            <button class="btn btn-primary" id="addFirstItem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
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
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
                <svg class="line-item-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                </svg>
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
    return `
        <div class="line-item-body">
            ${renderLinearFootageSection(item)}
            ${renderFinishSection(item, settings)}
            ${renderDimensionsSection(item, dims, settings)}
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
                <div class="input-group">
                    <label>Shaped?</label>
                    <select data-action="update" data-id="${item.id}" data-field="shaped">
                        <option value="no"${item.shaped === 'no' ? ' selected' : ''}>No</option>
                        <option value="yes"${item.shaped === 'yes' ? ' selected' : ''}>Yes</option>
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
    return `
        <div class="line-item-section">
            <div class="line-item-section-title">Dimensions</div>
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
            <div class="dimension-display">Using: Upper ${formatDimension(dims.upperHt)} • Base ${formatDimension(dims.baseHt)}</div>
            ${renderOverrideSection(item, dims, settings)}
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
        ? '<path d="M5 12h14"/>'
        : '<path d="M12 5v14M5 12h14"/>';

    return `
        <div class="override-section">
            <div class="override-toggle ${toggleClass}" data-action="toggle-override" data-id="${item.id}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${toggleIcon}
                </svg>
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
 * Attach event listeners to line items
 * @param {Array} lineItems - Array of line items
 * @param {Function} onUpdate - Callback when item updates
 * @param {Function} onDelete - Callback when item deleted
 */
function attachLineItemListeners(lineItems, onUpdate, onDelete) {
    const container = getElementById('lineItemsContainer');
    if (!container) return;

    // Use event delegation
    container.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const id = parseInt(e.target.closest('[data-id]')?.dataset.id);

        if (!action || isNaN(id)) return;

        if (action === 'toggle') {
            handleToggle(id, lineItems, onUpdate);
        } else if (action === 'delete') {
            e.stopPropagation();
            if (onDelete) onDelete(id);
        } else if (action === 'toggle-override') {
            e.stopPropagation();
            handleToggleOverride(id, lineItems, onUpdate);
        }
    });

    // Handle input changes
    container.addEventListener('change', (e) => {
        const action = e.target.dataset.action;
        const id = parseInt(e.target.dataset.id);
        const field = e.target.dataset.field;

        if (action === 'update' && !isNaN(id) && field && onUpdate) {
            onUpdate(id, field, e.target.value);
        } else if (action === 'update-name' && !isNaN(id) && onUpdate) {
            onUpdate(id, 'name', e.target.value);
        }
    });

    // Handle "Add First Item" button in empty state
    const addFirstBtn = getElementById('addFirstItem');
    if (addFirstBtn) {
        addFirstBtn.onclick = () => {
            if (window.quoteApp && window.quoteApp.addLineItem) {
                window.quoteApp.addLineItem();
            }
        };
    }
}

/**
 * Handle toggle line item collapse
 * @param {number} id - Line item ID
 * @param {Array} lineItems - Array of line items
 * @param {Function} onUpdate - Callback when updated
 */
function handleToggle(id, lineItems, onUpdate) {
    const item = lineItems.find((i) => i.id === id);
    if (item) {
        item.collapsed = !item.collapsed;
        if (onUpdate) onUpdate();
    }
}

/**
 * Handle toggle override section
 * @param {number} id - Line item ID
 * @param {Array} lineItems - Array of line items
 * @param {Function} onUpdate - Callback when updated
 */
function handleToggleOverride(id, lineItems, onUpdate) {
    const item = lineItems.find((i) => i.id === id);
    if (item) {
        item.showOverride = !item.showOverride;
        if (onUpdate) onUpdate();
    }
}

/**
 * Update line item DOM without full re-render
 * @param {number} id - Line item ID
 * @param {Object} calc - New calculation results
 */
export function updateLineItemDOM(id, calc) {
    setText(`price-${id}`, formatCurrency(calc.finalPrice));
    setText(`lf-${id}`, `${calc.totalLF} LF`);
    setText(`cabinetry-${id}`, formatCurrency(calc.cabinetry));
    setText(`shipping-${id}`, formatCurrency(calc.shipping));
    setText(`install-${id}`, formatCurrency(calc.install));
}
