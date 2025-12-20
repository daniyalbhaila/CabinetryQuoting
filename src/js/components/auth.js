/**
 * Authentication Component
 * Handles password protection and login/logout
 */

import { isAuthenticated, setAuthenticated, clearAuth } from '../services/storage.js';
import { show, hide, getElementById } from '../utils/dom.js';

// TODO: Move this to environment variable or server-side
const PASSWORD = 'bosco2024';

/**
 * Initialize authentication
 * @param {Function} onAuthSuccess - Callback when authentication succeeds
 */
export function initAuth(onAuthSuccess) {
    checkAuth(onAuthSuccess);
    setupAuthListeners(onAuthSuccess);
}

/**
 * Check authentication status
 * @param {Function} onAuthSuccess - Callback when authenticated
 */
function checkAuth(onAuthSuccess) {
    const passwordModal = getElementById('passwordModal');

    if (isAuthenticated()) {
        hide(passwordModal);
        if (onAuthSuccess) onAuthSuccess();
    } else {
        show(passwordModal);
        // Focus password input
        const passwordInput = getElementById('passwordInput');
        if (passwordInput) passwordInput.focus();
    }
}

/**
 * Setup authentication event listeners
 * @param {Function} onAuthSuccess - Callback when authentication succeeds
 */
function setupAuthListeners(onAuthSuccess) {
    // Password form submission
    const passwordForm = document.querySelector('#passwordModal form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePasswordSubmit(onAuthSuccess);
        });
    }

    // Logout button
    const logoutBtn = document.querySelector('[onclick*="logout"]');
    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }
}

/**
 * Handle password form submission
 * @param {Function} onAuthSuccess - Callback when authentication succeeds
 */
function handlePasswordSubmit(onAuthSuccess) {
    const input = getElementById('passwordInput');
    const error = getElementById('passwordError');
    const passwordModal = getElementById('passwordModal');

    if (!input) return;

    if (input.value === PASSWORD) {
        setAuthenticated(true);
        hide(passwordModal);
        if (error) error.classList.remove('show');

        if (onAuthSuccess) onAuthSuccess();
    } else {
        if (error) error.classList.add('show');
        input.value = '';
        input.focus();
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        clearAuth();
        location.reload();
    }
}

/**
 * Check if current user is authenticated
 * @returns {boolean} Authentication status
 */
export function checkAuthStatus() {
    return isAuthenticated();
}
