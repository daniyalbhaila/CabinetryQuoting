/**
 * Breakdown Modal Component
 * Displays detailed calculation breakdown for line items
 */

import { getElementById } from '../utils/dom.js';
import { formatCurrency, formatDimension } from '../utils/formatting.js';
import { calculateLineItem } from '../services/calculator.js';
import { CONVERSION } from '../utils/constants.js';

/**
 * Initialize breakdown modal
 */
export function initBreakdown() {
    const closeBtn = getElementById('closeBreakdownBtn');
    const modal = getElementById('breakdownModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', hideBreakdown);
    }

    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideBreakdown();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = getElementById('breakdownModal');
            if (modal && modal.classList.contains('show')) {
                hideBreakdown();
            }
        }
    });
}

/**
 * Show breakdown modal for a line item
 * @param {Object} item - Line item data
 */
export function showBreakdown(item) {
    const calc = calculateLineItem(item);
    const breakdown = calc.breakdown;
    const modal = getElementById('breakdownModal');
    const body = getElementById('breakdownBody');

    if (!modal || !body || !breakdown) return;

    body.innerHTML = renderBreakdown(calc, item);
    modal.classList.add('show');
}

/**
 * Hide breakdown modal
 */
export function hideBreakdown() {
    const modal = getElementById('breakdownModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Render complete breakdown
 * @param {Object} calc - Calculation results
 * @param {Object} item - Line item data
 * @returns {string} Breakdown HTML
 */
function renderBreakdown(calc, item) {
    const { breakdown } = calc;
    const { itemData, ratesUsed, exchangeRate } = breakdown;

    const physicalSections = [];
    const financialSections = [];
    const summarySections = [];

    // --- Physical Calculations (Left Column) ---

    // Section 1: Linear Conversions
    if (calc.totalLF > 0) {
        physicalSections.push(`
            <div class="breakdown-section">
                <div class="breakdown-section-title">
                    <span class="breakdown-section-number">1</span>
                    Linear Feet to Meters
                </div>
                ${itemData.upperLF > 0 ? `
                    <div class="breakdown-step">
                        <div class="breakdown-label">Upper Cabinets</div>
                        <div class="breakdown-formula">${itemData.upperLF} LF × ${CONVERSION.FEET_TO_METERS} = ${breakdown.upperM.toFixed(4)} m</div>
                    </div>
                ` : ''}
                ${itemData.baseLF > 0 ? `
                    <div class="breakdown-step">
                        <div class="breakdown-label">Base Cabinets</div>
                        <div class="breakdown-formula">${itemData.baseLF} LF × ${CONVERSION.FEET_TO_METERS} = ${breakdown.baseM.toFixed(4)} m</div>
                    </div>
                ` : ''}
                ${itemData.pantryLF > 0 ? `
                    <div class="breakdown-step">
                        <div class="breakdown-label">Pantry Cabinets</div>
                        <div class="breakdown-formula">${itemData.pantryLF} LF × ${CONVERSION.FEET_TO_METERS} = ${breakdown.pantryM.toFixed(4)} m</div>
                    </div>
                ` : ''}
            </div>
        `);
    }

    // Section 2: Door Area Calculations
    let doorAreaSteps = '';
    if (itemData.upperLF > 0) {
        const upperArea = breakdown.upperM * (calc.dims.upperHt / 1000);
        doorAreaSteps += `
            <div class="breakdown-step">
                <div class="breakdown-label">Upper Doors</div>
                <div class="breakdown-formula">${breakdown.upperM.toFixed(4)} m × ${(calc.dims.upperHt / 1000).toFixed(3)} m (${calc.dims.upperHt}mm)</div>
                <div class="breakdown-result">${upperArea.toFixed(4)} m²</div>
            </div>
        `;
    }
    if (itemData.baseLF > 0) {
        const baseArea = breakdown.baseM * (calc.dims.baseHt / 1000);
        doorAreaSteps += `
            <div class="breakdown-step">
                <div class="breakdown-label">Base Doors</div>
                <div class="breakdown-formula">${breakdown.baseM.toFixed(4)} m × ${(calc.dims.baseHt / 1000).toFixed(3)} m (${calc.dims.baseHt}mm)</div>
                <div class="breakdown-result">${baseArea.toFixed(4)} m²</div>
            </div>
        `;
    }
    if (itemData.pantryLF > 0) {
        const pantryArea = breakdown.pantryM * (calc.dims.ceilingMm / 1000);
        doorAreaSteps += `
            <div class="breakdown-step">
                <div class="breakdown-label">Pantry Doors</div>
                <div class="breakdown-formula">${breakdown.pantryM.toFixed(4)} m × ${(calc.dims.ceilingMm / 1000).toFixed(3)} m (${calc.dims.ceilingMm}mm)</div>
                <div class="breakdown-result">${pantryArea.toFixed(4)} m²</div>
            </div>
        `;
    }

    physicalSections.push(`
        <div class="breakdown-section">
            <div class="breakdown-section-title">
                <span class="breakdown-section-number">2</span>
                Door Surface Area
            </div>
            ${doorAreaSteps}
            <div class="breakdown-step">
                <div class="breakdown-label">Total Door Area</div>
                <div class="breakdown-result">${breakdown.doorArea.toFixed(4)} m²</div>
            </div>
        </div>
    `);

    // Section 3: Carcass Area Calculations
    let carcassAreaSteps = '';
    if (itemData.upperLF > 0) {
        const upperSides = 2 * (calc.dims.upperHt / 1000) * (calc.dims.upperDp / 1000);
        const upperBackBottom = 2 * breakdown.upperM * (calc.dims.upperDp / 1000);
        const upperFront = breakdown.upperM * (calc.dims.upperHt / 1000);
        const upperTotal = upperSides + upperBackBottom + upperFront;
        carcassAreaSteps += `
            <div class="breakdown-step">
                <div class="breakdown-label">Upper Carcass (Total: ${upperTotal.toFixed(4)} m²)</div>
                <div class="breakdown-sub-formula">Sides: 2 × ${(calc.dims.upperHt / 1000).toFixed(3)}m(h) × ${(calc.dims.upperDp / 1000).toFixed(3)}m(d) = ${upperSides.toFixed(4)}</div>
                <div class="breakdown-sub-formula">Back/Bot: 2 × ${breakdown.upperM.toFixed(4)}m(w) × ${(calc.dims.upperDp / 1000).toFixed(3)}m(d) = ${upperBackBottom.toFixed(4)}</div>
                <div class="breakdown-sub-formula">Front: ${breakdown.upperM.toFixed(4)}m(w) × ${(calc.dims.upperHt / 1000).toFixed(3)}m(h) = ${upperFront.toFixed(4)}</div>
            </div>
        `;
    }
    if (itemData.baseLF > 0) {
        const baseSides = 2 * (calc.dims.baseHt / 1000) * (calc.dims.baseDp / 1000);
        const baseBackBottom = 2 * breakdown.baseM * (calc.dims.baseDp / 1000);
        const baseFront = breakdown.baseM * (calc.dims.baseHt / 1000);
        const baseTotal = baseSides + baseBackBottom + baseFront;
        carcassAreaSteps += `
            <div class="breakdown-step">
                <div class="breakdown-label">Base Carcass (Total: ${baseTotal.toFixed(4)} m²)</div>
                <div class="breakdown-sub-formula">Sides: 2 × ${(calc.dims.baseHt / 1000).toFixed(3)}m(h) × ${(calc.dims.baseDp / 1000).toFixed(3)}m(d) = ${baseSides.toFixed(4)}</div>
                <div class="breakdown-sub-formula">Back/Bot: 2 × ${breakdown.baseM.toFixed(4)}m(w) × ${(calc.dims.baseDp / 1000).toFixed(3)}m(d) = ${baseBackBottom.toFixed(4)}</div>
                <div class="breakdown-sub-formula">Front: ${breakdown.baseM.toFixed(4)}m(w) × ${(calc.dims.baseHt / 1000).toFixed(3)}m(h) = ${baseFront.toFixed(4)}</div>
            </div>
        `;
    }
    if (itemData.pantryLF > 0) {
        const pantrySides = 2 * (calc.dims.ceilingMm / 1000) * (calc.dims.pantryDp / 1000);
        const pantryBackBottom = 2 * breakdown.pantryM * (calc.dims.pantryDp / 1000);
        const pantryFront = breakdown.pantryM * (calc.dims.ceilingMm / 1000);
        const pantryTotal = pantrySides + pantryBackBottom + pantryFront;
        carcassAreaSteps += `
            <div class="breakdown-step">
                <div class="breakdown-label">Pantry Carcass (Total: ${pantryTotal.toFixed(4)} m²)</div>
                <div class="breakdown-sub-formula">Sides: 2 × ${(calc.dims.ceilingMm / 1000).toFixed(3)}m(h) × ${(calc.dims.pantryDp / 1000).toFixed(3)}m(d) = ${pantrySides.toFixed(4)}</div>
                <div class="breakdown-sub-formula">Back/Bot: 2 × ${breakdown.pantryM.toFixed(4)}m(w) × ${(calc.dims.pantryDp / 1000).toFixed(3)}m(d) = ${pantryBackBottom.toFixed(4)}</div>
                <div class="breakdown-sub-formula">Front: ${breakdown.pantryM.toFixed(4)}m(w) × ${(calc.dims.ceilingMm / 1000).toFixed(3)}m(h) = ${pantryFront.toFixed(4)}</div>
            </div>
        `;
    }

    physicalSections.push(`
        <div class="breakdown-section">
            <div class="breakdown-section-title">
                <span class="breakdown-section-number">3</span>
                Carcass Surface Area
            </div>
            ${carcassAreaSteps}
            <div class="breakdown-step">
                <div class="breakdown-label">Total Carcass Area</div>
                <div class="breakdown-result">${breakdown.carcassArea.toFixed(4)} m²</div>
            </div>
        </div>
    `);

    // --- Financial Calculations (Right Column) ---

    // Section 4: Component Costs (USD)
    financialSections.push(`
        <div class="breakdown-section">
            <div class="breakdown-section-title">
                <span class="breakdown-section-number">4</span>
                Component Costs (USD)
            </div>
            ${itemData.openShelf ? `
                <div class="breakdown-step">
                    <div class="breakdown-label">Door Cost</div>
                    <div class="breakdown-result">$0.00</div>
                </div>
            ` : `
                <div class="breakdown-step">
                    <div class="breakdown-label">Door Cost</div>
                    <div class="breakdown-formula">${breakdown.doorArea.toFixed(4)} m² × $${breakdown.doorRate}/m²</div>
                    <div class="breakdown-result">${formatCurrency(breakdown.doorCost).replace(' CAD', ' USD')}</div>
                </div>
            `}
            <div class="breakdown-step">
                <div class="breakdown-label">Carcass Cost</div>
                <div class="breakdown-formula">${breakdown.carcassArea.toFixed(4)} m² × rate</div>
                <div class="breakdown-result">${formatCurrency(breakdown.carcassCost).replace(' CAD', ' USD')}</div>
            </div>
            ${itemData.drawers > 0 ? `
                <div class="breakdown-step">
                    <div class="breakdown-label">Drawers (${itemData.drawers})</div>
                    <div class="breakdown-result">${formatCurrency(breakdown.drawerCost).replace(' CAD', ' USD')}</div>
                </div>
            ` : ''}
            ${itemData.accessories > 0 ? `
                <div class="breakdown-step">
                    <div class="breakdown-label">Accessories (${itemData.accessories})</div>
                    <div class="breakdown-result">${formatCurrency(breakdown.accessoryCost).replace(' CAD', ' USD')}</div>
                </div>
            ` : ''}
            <div class="breakdown-step">
                <div class="breakdown-label">Gross Cabinetry Total</div>
                <div class="breakdown-result">${formatCurrency(breakdown.cabinetryGross).replace(' CAD', ' USD')}</div>
            </div>
        </div>
    `);

    // Section 5: Discount Application
    if (ratesUsed.discountRate > 0) {
        financialSections.push(`
            <div class="breakdown-section">
                <div class="breakdown-section-title">
                    <span class="breakdown-section-number">5</span>
                    Discount
                </div>
                <div class="breakdown-step">
                    <div class="breakdown-label">Discount Applied</div>
                    <div class="breakdown-formula">${(ratesUsed.discountRate * 100).toFixed(1)}% Off</div>
                    <div class="breakdown-result">${formatCurrency(breakdown.cabinetryUSD).replace(' CAD', ' USD')}</div>
                </div>
            </div>
        `);
    }

    // Section 6: Currency Conversion + Additional Items
    const cabinetryCAD = breakdown.cabinetryUSD * exchangeRate;

    financialSections.push(`
        <div class="breakdown-section">
            <div class="breakdown-section-title">
                <span class="breakdown-section-number">6</span>
                Currency & Additional
            </div>
            <div class="breakdown-step">
                <div class="breakdown-label">Cabinetry (CAD)</div>
                <div class="breakdown-formula">Exch. Rate: ${exchangeRate}</div>
                <div class="breakdown-result">${formatCurrency(cabinetryCAD)}</div>
            </div>
            ${breakdown.additionalTotal > 0 ? `
                ${itemData.additionalItems.map(item => `
                    <div class="breakdown-step">
                        <div class="breakdown-label">${item.description || 'Custom Item'}</div>
                        <div class="breakdown-result">${formatCurrency(item.price)}</div>
                    </div>
                `).join('')}
                <div class="breakdown-step">
                    <div class="breakdown-label">Total Cabinetry</div>
                    <div class="breakdown-result">${formatCurrency(calc.cabinetry)}</div>
                </div>
            ` : ''}
        </div>
    `);

    // --- Summary Sections (Full Width) ---

    // Section 7: Shipping & Install
    if (calc.totalLF > 0) {
        summarySections.push(`
            <div class="breakdown-section">
                <div class="breakdown-section-title">
                    <span class="breakdown-section-number">7</span>
                    Shipping & Installation
                </div>
                <div class="breakdown-grid-row">
                    <div class="breakdown-step">
                        <div class="breakdown-label">Shipping</div>
                        <div class="breakdown-formula">$${ratesUsed.shippingRate}/LF</div>
                        <div class="breakdown-result">${formatCurrency(calc.shipping)}</div>
                    </div>
                    <div class="breakdown-step">
                        <div class="breakdown-label">Installation</div>
                        <div class="breakdown-formula">$${ratesUsed.installRate}/LF</div>
                        <div class="breakdown-result">${formatCurrency(calc.install)}</div>
                    </div>
                </div>
            </div>
        `);
    }

    // Section 8 & 9: Subtotal & Markup
    summarySections.push(`
        <div class="breakdown-section">
            <div class="breakdown-section-title">
                <span class="breakdown-section-number">8</span>
                Final Calculation
            </div>
            <div class="breakdown-grid-row">
                <div class="breakdown-step">
                    <div class="breakdown-label">Subtotal</div>
                    <div class="breakdown-result">${formatCurrency(calc.subtotal)}</div>
                </div>
                <div class="breakdown-step">
                    <div class="breakdown-label">Markup (${(ratesUsed.markupRate * 100).toFixed(1)}%)</div>
                    <div class="breakdown-result">${formatCurrency(calc.finalPrice)}</div>
                </div>
            </div>
        </div>
    `);

    // Final Total
    summarySections.push(`
        <div class="breakdown-total">
            <div class="breakdown-total-label">Final Price</div>
            <div class="breakdown-total-value">${formatCurrency(calc.finalPrice)}</div>
        </div>
    `);

    return `
        <div class="breakdown-columns">
            <div class="breakdown-column">
                ${physicalSections.join('')}
            </div>
            <div class="breakdown-column">
                ${financialSections.join('')}
            </div>
        </div>
        <div class="breakdown-summary-full">
            ${summarySections.join('')}
        </div>
    `;
}
