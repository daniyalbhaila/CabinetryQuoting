/**
 * Application Configuration
 * Contains environment-specific variables.
 * 
 * IMPORTANT: In a real production build with a bundler (Vite/Webpack),
 * these should be replaced with actual environment variables (process.env or import.meta.env).
 * For this vanilla JS setup, we use this config file.
 */


export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

