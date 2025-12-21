/**
 * Modals Component
 * Handles help modal and config modal
 */

import { showModal, hideModal, getElementById } from '../utils/dom.js';
import { formatDimension } from '../utils/formatting.js';
import { CEILING_TO_UPPER_HT } from '../utils/constants.js';

/**
 * Initialize all modals
 * @param {Function} onConfigChange - Callback when config changes
 */
export function initModals(onConfigChange) {
    setupHelpModal();
    setupConfigModal(onConfigChange);
}

/**
 * Setup help modal listeners
 */
function setupHelpModal() {
    // Help button in header
    const showHelpBtn = getElementById('showHelpBtn');
    if (showHelpBtn) {
        showHelpBtn.addEventListener('click', showHelp);
    }

    // Close buttons
    const closeHelpBtn = getElementById('closeHelpBtn');
    if (closeHelpBtn) {
        closeHelpBtn.addEventListener('click', hideHelp);
    }

    const closeHelpBtn2 = getElementById('closeHelpBtn2');
    if (closeHelpBtn2) {
        closeHelpBtn2.addEventListener('click', hideHelp);
    }
}

/**
 * Show help modal
 */
export function showHelp() {
    showModal('helpModal');
}

/**
 * Hide help modal
 */
export function hideHelp() {
    hideModal('helpModal');
}

/**
 * Setup config modal listeners
 * @param {Function} onConfigChange - Callback when config changes
 */
function setupConfigModal(onConfigChange) {
    // Config button in header
    const showConfigBtn = getElementById('showConfigBtn');
    if (showConfigBtn) {
        showConfigBtn.addEventListener('click', showConfig);
    }

    // Close button
    const closeConfigBtn = getElementById('closeConfigBtn');
    if (closeConfigBtn) {
        closeConfigBtn.addEventListener('click', hideConfig);
    }

    // Tab switching
    setupConfigTabs();

    // Config change listeners
    if (onConfigChange) {
        setupConfigChangeListeners(onConfigChange);
    }
}

/**
 * Show config modal
 */
export function showConfig() {
    showModal('configModal');
}

/**
 * Hide config modal
 */
export function hideConfig() {
    hideModal('configModal');
}

/**
 * Setup config tab switching
 */
function setupConfigTabs() {
    const tabs = document.querySelectorAll('.config-tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
            // Get tab name from data-tab attribute
            const tabName = tab.getAttribute('data-tab');
            if (tabName) {
                switchConfigTab(e, tabName);
            }
        });
    });
}

/**
 * Switch config tab
 * @param {Event} event - Click event
 * @param {string} tabName - Tab name ('rates' or 'dimensions')
 */
function switchConfigTab(event, tabName) {
    // Hide all tabs
    document
        .querySelectorAll('.config-tab-content')
        .forEach((tab) => tab.classList.remove('active'));
    document
        .querySelectorAll('.config-tab')
        .forEach((btn) => btn.classList.remove('active'));

    // Show selected tab
    const tabContent = getElementById(tabName + 'Tab');
    if (tabContent) tabContent.classList.add('active');

    if (event && event.target) {
        event.target.classList.add('active');
    }
}

/**
 * Setup config change listeners
 * @param {Function} onConfigChange - Callback when config changes
 */
function setupConfigChangeListeners(onConfigChange) {
    // All config inputs
    const configInputs = [
        'shippingRate',
        'installRate',
        'drawerRate',
        'accessoryRate',
        'markupRate',
        'discountRate',
        'exchangeRate',
        'defaultUpperHt',
        'defaultBaseHt',
        'defaultUpperDp',
        'defaultBaseDp',
        'defaultPantryDp'
    ];

    configInputs.forEach((inputId) => {
        const input = getElementById(inputId);
        if (input) {
            input.addEventListener('change', onConfigChange);
        }
    });
}

/**
 * Update ceiling height display when changed
 * @param {string} ceiling - Ceiling height
 * @param {Function} onUpdate - Callback after update
 */
export function updateCeilingDisplay(ceiling, onUpdate) {
    const upperHt = CEILING_TO_UPPER_HT[ceiling] || 760;
    const upperHtInput = getElementById('defaultUpperHt');
    const upperHtDisplay = getElementById('upperHtDisplay');

    if (upperHtInput) upperHtInput.value = upperHt;
    if (upperHtDisplay) upperHtDisplay.textContent = formatDimension(upperHt);

    if (onUpdate) onUpdate();
}
