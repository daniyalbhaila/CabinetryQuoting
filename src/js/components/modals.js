/**
 * Modals Component
 * Handles help modal and global settings modal
 */

import { showModal, hideModal, getElementById } from '../utils/dom.js';
import { formatDimension } from '../utils/formatting.js';
import { CEILING_TO_UPPER_HT } from '../utils/constants.js';
import {
    loadGlobalConfig,
    saveGlobalConfig,
    resetGlobalConfig,
    ensureGlobalConfig
} from '../services/storage.js';

/**
 * Initialize all modals
 * @param {Function} onConfigChange - Callback when config changes
 */
export function initModals(onConfigChange) {
    setupHelpModal();
    setupConfigModal(onConfigChange);
    setupHistoryModal();
    setupProjectDetailsModal();
    setupProjectOverridesModal();
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
 * Setup history modal listeners
 */
function setupHistoryModal() {
    // History button in header
    const showHistoryBtn = getElementById('showHistoryBtn');
    if (showHistoryBtn) {
        showHistoryBtn.addEventListener('click', showHistory);
    }

    // Close button
    const closeHistoryBtn = getElementById('closeHistoryBtn');
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', hideHistory);
    }
}

/**
 * Show history modal
 */
export function showHistory() {
    showModal('historyModal');
}

/**
 * Hide history modal
 */
export function hideHistory() {
    hideModal('historyModal');
}

/**
 * Setup project details modal listeners
 */
function setupProjectDetailsModal() {
    // Edit button in sidebar
    const editBtn = getElementById('editProjectDetailsBtn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            showProjectDetails();
        });
    }

    // Card click
    const card = getElementById('projectSummaryCard');
    if (card) {
        card.addEventListener('click', showProjectDetails);
    }

    // Close button
    const closeBtn = getElementById('closeProjectDetailsBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideProjectDetails);
    }

    // Done button
    const doneBtn = getElementById('saveProjectDetailsBtn');
    if (doneBtn) {
        doneBtn.addEventListener('click', hideProjectDetails);
    }
}

/**
 * Show project details modal
 */
export function showProjectDetails() {
    showModal('projectDetailsModal');
}

/**
 * Hide project details modal
 */
export function hideProjectDetails() {
    hideModal('projectDetailsModal');
}

/**
 * Setup project overrides modal listeners
 */
function setupProjectOverridesModal() {
    // Show button in sidebar
    const showBtn = getElementById('showProjectOverridesBtn');
    if (showBtn) {
        showBtn.addEventListener('click', showProjectOverrides);
    }

    // Close button
    const closeBtn = getElementById('closeProjectOverridesBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideProjectOverrides);
    }

    // Done button
    const doneBtn = getElementById('saveProjectOverridesBtn');
    if (doneBtn) {
        doneBtn.addEventListener('click', hideProjectOverrides);
    }
}

/**
 * Show project overrides modal
 */
export function showProjectOverrides() {
    showModal('projectOverridesModal');
}

/**
 * Hide project overrides modal
 */
export function hideProjectOverrides() {
    hideModal('projectOverridesModal');
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
    // Ensure global config exists
    ensureGlobalConfig();

    // Config button in header
    const showConfigBtn = getElementById('showConfigBtn');
    if (showConfigBtn) {
        showConfigBtn.addEventListener('click', () => {
            loadGlobalConfigToForm();
            showConfig();
        });
    }

    // Close button
    const closeConfigBtn = getElementById('closeConfigBtn');
    if (closeConfigBtn) {
        closeConfigBtn.addEventListener('click', hideConfig);
    }

    // Save Global Config button
    const saveGlobalBtn = getElementById('saveGlobalConfigBtn');
    if (saveGlobalBtn) {
        saveGlobalBtn.addEventListener('click', () => {
            saveGlobalConfigFromForm();
            if (onConfigChange) onConfigChange();
        });
    }

    // Reset to Factory Defaults button
    const resetGlobalBtn = getElementById('resetGlobalConfigBtn');
    if (resetGlobalBtn) {
        resetGlobalBtn.addEventListener('click', () => {
            if (confirm('Reset all global settings to factory defaults? This cannot be undone.')) {
                resetGlobalConfig();
                loadGlobalConfigToForm();
                if (onConfigChange) onConfigChange();
                alert('Global settings reset to factory defaults.');
            }
        });
    }

    // Tab switching
    setupConfigTabs();

    // Config change listeners (for auto-update)
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
        'markupRateFull',
        'markupRateSingle',
        'discountRate',
        'exchangeRate',
        'defaultUpperHt',
        'defaultBaseHt',
        'defaultUpperDp',
        'defaultBaseDp',
        'defaultPantryDp',
        // Carcass supplier rates
        'holikeRate',
        'allureRate',
        // Door finish rates
        'pvcUnshaped',
        'pvcShaped',
        'melamineUnshaped',
        'melamineShaped',
        'skinUnshaped',
        'skinShaped',
        'paintLacquerUnshaped',
        'paintLacquerShaped',
        'powderUnshaped',
        'powderShaped',
        'veneerUnshaped',
        'veneerShaped',
        'petUnshaped',
        'petShaped'
    ];

    configInputs.forEach((inputId) => {
        const input = getElementById(inputId);
        if (input) {
            // Use 'input' event for immediate updates as user types
            input.addEventListener('input', onConfigChange);
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

// =============================================================================
// GLOBAL CONFIG LOAD/SAVE
// =============================================================================

/**
 * Load global config values into the form
 */
function loadGlobalConfigToForm() {
    const config = ensureGlobalConfig();

    // Rates
    if (getElementById('shippingRate')) getElementById('shippingRate').value = config.rates.shippingRate;
    if (getElementById('installRate')) getElementById('installRate').value = config.rates.installRate;
    if (getElementById('drawerRate')) getElementById('drawerRate').value = config.rates.drawerRate;
    if (getElementById('accessoryRate')) getElementById('accessoryRate').value = config.rates.accessoryRate;
    if (getElementById('markupRateFull')) getElementById('markupRateFull').value = config.rates.markupRateFull ?? config.rates.markupRate ?? 80;
    if (getElementById('markupRateSingle')) getElementById('markupRateSingle').value = config.rates.markupRateSingle ?? config.rates.markupRate ?? 90;
    if (getElementById('discountRate')) getElementById('discountRate').value = config.rates.discountRate;
    if (getElementById('exchangeRate')) getElementById('exchangeRate').value = config.rates.exchangeRate;

    // Dimensions
    if (getElementById('defaultUpperHt')) getElementById('defaultUpperHt').value = config.dimensions.defaultUpperHt;
    if (getElementById('defaultBaseHt')) getElementById('defaultBaseHt').value = config.dimensions.defaultBaseHt;
    if (getElementById('defaultUpperDp')) getElementById('defaultUpperDp').value = config.dimensions.defaultUpperDp;
    if (getElementById('defaultBaseDp')) getElementById('defaultBaseDp').value = config.dimensions.defaultBaseDp;
    if (getElementById('defaultPantryDp')) getElementById('defaultPantryDp').value = config.dimensions.defaultPantryDp;

    // Materials - Carcass Rates
    if (getElementById('holikeRate')) getElementById('holikeRate').value = config.materials.carcassRates.holike;
    if (getElementById('allureRate')) getElementById('allureRate').value = config.materials.carcassRates.allure;

    // Materials - Finish Rates
    if (getElementById('pvcUnshaped')) getElementById('pvcUnshaped').value = config.materials.finishRates.PVC.unshaped;
    if (getElementById('pvcShaped')) getElementById('pvcShaped').value = config.materials.finishRates.PVC.shaped;
    if (getElementById('melamineUnshaped')) getElementById('melamineUnshaped').value = config.materials.finishRates.Melamine.unshaped;
    if (getElementById('melamineShaped')) getElementById('melamineShaped').value = config.materials.finishRates.Melamine.shaped;
    if (getElementById('skinUnshaped')) getElementById('skinUnshaped').value = config.materials.finishRates.Skin.unshaped;
    if (getElementById('skinShaped')) getElementById('skinShaped').value = config.materials.finishRates.Skin.shaped;
    if (getElementById('paintLacquerUnshaped')) getElementById('paintLacquerUnshaped').value = config.materials.finishRates['Paint/Lacquer'].unshaped;
    if (getElementById('paintLacquerShaped')) getElementById('paintLacquerShaped').value = config.materials.finishRates['Paint/Lacquer'].shaped;
    if (getElementById('powderUnshaped')) getElementById('powderUnshaped').value = config.materials.finishRates.Powder.unshaped;
    if (getElementById('powderShaped')) getElementById('powderShaped').value = config.materials.finishRates.Powder.shaped;
    if (getElementById('veneerUnshaped')) getElementById('veneerUnshaped').value = config.materials.finishRates.Veneer.unshaped;
    if (getElementById('veneerShaped')) getElementById('veneerShaped').value = config.materials.finishRates.Veneer.shaped;
    if (getElementById('petUnshaped')) getElementById('petUnshaped').value = config.materials.finishRates.PET.unshaped;
    if (getElementById('petShaped')) getElementById('petShaped').value = config.materials.finishRates.PET.shaped;
}

/**
 * Save global config from form values
 */
function saveGlobalConfigFromForm() {
    const config = {
        version: 1,
        rates: {
            shippingRate: parseFloat(getElementById('shippingRate')?.value) || 60,
            installRate: parseFloat(getElementById('installRate')?.value) || 100,
            drawerRate: parseFloat(getElementById('drawerRate')?.value) || 200,
            accessoryRate: parseFloat(getElementById('accessoryRate')?.value) || 300,
            markupRateFull: parseFloat(getElementById('markupRateFull')?.value) || 80,
            markupRateSingle: parseFloat(getElementById('markupRateSingle')?.value) || 90,
            discountRate: parseFloat(getElementById('discountRate')?.value) || 50,
            exchangeRate: parseFloat(getElementById('exchangeRate')?.value) || 1.42
        },
        dimensions: {
            defaultUpperHt: parseFloat(getElementById('defaultUpperHt')?.value) || 760,
            defaultBaseHt: parseFloat(getElementById('defaultBaseHt')?.value) || 920,
            defaultUpperDp: parseFloat(getElementById('defaultUpperDp')?.value) || 300,
            defaultBaseDp: parseFloat(getElementById('defaultBaseDp')?.value) || 600,
            defaultPantryDp: parseFloat(getElementById('defaultPantryDp')?.value) || 600
        },
        materials: {
            carcassRates: {
                holike: parseFloat(getElementById('holikeRate')?.value) || 65,
                allure: parseFloat(getElementById('allureRate')?.value) || 200
            },
            finishRates: {
                PVC: {
                    unshaped: parseFloat(getElementById('pvcUnshaped')?.value) || 100,
                    shaped: parseFloat(getElementById('pvcShaped')?.value) || 200
                },
                Melamine: {
                    unshaped: parseFloat(getElementById('melamineUnshaped')?.value) || 70,
                    shaped: parseFloat(getElementById('melamineShaped')?.value) || 70
                },
                Skin: {
                    unshaped: parseFloat(getElementById('skinUnshaped')?.value) || 150,
                    shaped: parseFloat(getElementById('skinShaped')?.value) || 150
                },
                'Paint/Lacquer': {
                    unshaped: parseFloat(getElementById('paintLacquerUnshaped')?.value) || 170,
                    shaped: parseFloat(getElementById('paintLacquerShaped')?.value) || 200
                },
                Powder: {
                    unshaped: parseFloat(getElementById('powderUnshaped')?.value) || 100,
                    shaped: parseFloat(getElementById('powderShaped')?.value) || 200
                },
                Veneer: {
                    unshaped: parseFloat(getElementById('veneerUnshaped')?.value) || 440,
                    shaped: parseFloat(getElementById('veneerShaped')?.value) || 440
                },
                PET: {
                    unshaped: parseFloat(getElementById('petUnshaped')?.value) || 110,
                    shaped: parseFloat(getElementById('petShaped')?.value) || 110
                }
            }
        }
    };

    const success = saveGlobalConfig(config);
    if (success) {
        alert('Global settings saved successfully!');
    } else {
        alert('Failed to save global settings. Please try again.');
    }
}
