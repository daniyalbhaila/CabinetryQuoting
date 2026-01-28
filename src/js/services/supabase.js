/**
 * Supabase Service
 * Handles cloud storage operations
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

let supabase = null;

/**
 * Initialize Supabase client
 */
export function initSupabase() {
    if (!supabase) {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            console.error('Supabase credentials missing! Check .env file.');
            console.error('URL:', SUPABASE_URL);
            console.error('KEY:', SUPABASE_KEY ? 'Set' : 'Missing');
            return;
        }
        try {
            supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('Supabase initialized via module');
        } catch (e) {
            console.error('Failed to initialize Supabase client:', e);
        }
    }
}

/**
 * Publish a quote to the cloud
 * @param {Object} quoteData - The full quote object
 * @returns {Promise<Object>} The saved data or error
 */
/**
 * Generate a UUID v4
 * Falls back to Math.random if crypto is not available
 */
function uuidv4() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Publish a quote to the cloud
 * @param {Object} quoteData - The full quote object
 * @returns {Promise<Object>} The saved data or error
 */
export async function publishQuote(quoteData, overrideName = null) {
    if (!supabase) initSupabase();

    // Debug incoming data
    console.log('Publishing quote, incoming data:', {
        hasId: !!quoteData.id,
        idType: typeof quoteData.id,
        hasSupabaseId: !!quoteData.supabase_id
    });

    // 1. Resolve ID
    // Priority: Existing supabase_id -> Existing valid UUID id -> Generate New
    let cloudId = quoteData.supabase_id;

    if (!cloudId && quoteData.id && typeof quoteData.id === 'string' && quoteData.id.length === 36) {
        cloudId = quoteData.id;
    }

    if (!cloudId) {
        cloudId = uuidv4();
        console.log('Generated new Cloud ID:', cloudId);
    }

    // 2. Ensure consistency
    quoteData.supabase_id = cloudId;
    if (!quoteData.id || typeof quoteData.id === 'number') {
        quoteData.id = cloudId;
    }

    const { data, error } = await supabase
        .from('quotes')
        .upsert({
            id: cloudId, // Explicitly use the resolved ID
            name: overrideName || quoteData.projectName || 'Untitled Quote',
            data: quoteData,
            last_modified_by: 'Bosco Team', // Placeholder
            updated_at: new Date().toISOString()
        })
        .select();

    if (error) {
        console.error('Supabase Save Error:', error);
        throw error;
    }

    return { ...quoteData, last_synced: new Date().toISOString() };
}

/**
 * Fetch a specific quote from the cloud
 * @param {string} supabaseId - The UUID of the quote
 * @returns {Promise<Object>} The quote data
 */
export async function fetchQuote(supabaseId) {
    if (!supabase) initSupabase();

    const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', supabaseId)
        .single();

    if (error) {
        console.error('Supabase Load Error:', error);
        throw error;
    }

    return data.data;
}

/**
 * Fetch recent quotes list (Metadata only)
 * @returns {Promise<Array>} List of quotes
 */
export async function fetchRecentQuotes() {
    if (!supabase) initSupabase();

    const { data, error } = await supabase
        .from('quotes')
        .select('id, name, updated_at, last_modified_by')
        .order('updated_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Supabase List Error:', error);
        throw error;
    }

    return data;
}

/**
 * Delete a quote from the cloud
 * @param {string} supabaseId - The UUID of the quote
 * @returns {Promise<boolean>} Success status
 */
export async function deleteQuote(supabaseId) {
    if (!supabase) initSupabase();

    const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', supabaseId);

    if (error) {
        console.error('Supabase Delete Error:', error);
        throw error;
    }

    return true;
}

/**
 * Save Global Settings
 * @param {Object} settings - The global config object
 */
export async function saveGlobalSettings(settings) {
    if (!supabase) initSupabase();

    const { error } = await supabase
        .from('settings')
        .upsert({
            id: 'global',
            data: settings,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Settings Save Error:', error);
        throw error; // Propagate error for UI handling
    }
}

/**
 * Load Global Settings
 * @returns {Promise<Object|null>} The settings object or null
 */
export async function loadGlobalSettings() {
    if (!supabase) initSupabase();

    const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'global')
        .maybeSingle();

    if (error) {
        // If not found (first run), return null to use defaults
        if (error.code === 'PGRST116') return null;
        console.error('Settings Load Error:', error);
        return null;
    }

    return data ? data.data : null;
}
