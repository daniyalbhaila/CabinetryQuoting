/**
 * Quote Summary Component
 * Displays quote totals and summary
 */

import { setText } from '../utils/dom.js';
import { formatCurrency } from '../utils/formatting.js';
import { calculateTotals } from '../services/calculator.js';

/**
 * Update quote summary totals
 * @param {Array} lineItems - Array of line items
 */
export function updateQuoteSummary(lineItems) {
    const totals = calculateTotals(lineItems);

    setText('totalLF', `${totals.totalLF} LF Total`);
    setText('totalCabinetry', formatCurrency(totals.totalCabinetry));
    setText('totalShipping', formatCurrency(totals.totalShipping));
    setText('totalInstall', formatCurrency(totals.totalInstall));
    setText('totalSubtotal', formatCurrency(totals.totalSubtotal));
    setText('grandTotal', formatCurrency(totals.grandTotal));
    setText('headerTotal', formatCurrency(totals.grandTotal));
}
