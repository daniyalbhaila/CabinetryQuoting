/**
 * DOM manipulation utilities
 */

/**
 * Get element by ID (with error checking)
 * @param {string} id - Element ID
 * @returns {HTMLElement} DOM element
 */
export function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with id "${id}" not found`);
    }
    return element;
}

/**
 * Show element (remove 'hidden' class)
 * @param {HTMLElement|string} element - Element or element ID
 */
export function show(element) {
    const el = typeof element === 'string' ? getElementById(element) : element;
    if (el) el.classList.remove('hidden');
}

/**
 * Hide element (add 'hidden' class)
 * @param {HTMLElement|string} element - Element or element ID
 */
export function hide(element) {
    const el = typeof element === 'string' ? getElementById(element) : element;
    if (el) el.classList.add('hidden');
}

/**
 * Toggle element visibility
 * @param {HTMLElement|string} element - Element or element ID
 */
export function toggle(element) {
    const el = typeof element === 'string' ? getElementById(element) : element;
    if (el) el.classList.toggle('hidden');
}

/**
 * Show modal (add 'show' class)
 * @param {HTMLElement|string} modal - Modal element or ID
 */
export function showModal(modal) {
    const el = typeof modal === 'string' ? getElementById(modal) : modal;
    if (el) el.classList.add('show');
}

/**
 * Hide modal (remove 'show' class)
 * @param {HTMLElement|string} modal - Modal element or ID
 */
export function hideModal(modal) {
    const el = typeof modal === 'string' ? getElementById(modal) : modal;
    if (el) el.classList.remove('show');
}

/**
 * Add event listener with error handling
 * @param {HTMLElement|string} element - Element or element ID
 * @param {string} event - Event name
 * @param {Function} handler - Event handler function
 */
export function on(element, event, handler) {
    const el = typeof element === 'string' ? getElementById(element) : element;
    if (el) {
        el.addEventListener(event, handler);
    }
}

/**
 * Set text content safely
 * @param {HTMLElement|string} element - Element or element ID
 * @param {string} text - Text content
 */
export function setText(element, text) {
    const el = typeof element === 'string' ? getElementById(element) : element;
    if (el) {
        el.textContent = text;
    }
}

/**
 * Get input value
 * @param {string} id - Input element ID
 * @returns {string} Input value
 */
export function getValue(id) {
    const el = getElementById(id);
    return el ? el.value : '';
}

/**
 * Set input value
 * @param {string} id - Input element ID
 * @param {*} value - Value to set
 */
export function setValue(id, value) {
    const el = getElementById(id);
    if (el) {
        el.value = value;
    }
}
