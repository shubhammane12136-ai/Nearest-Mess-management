import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'


const SUPABASE_URL = "https://pduetnrzbajcqxnwvqgg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdWV0bnJ6YmFqY3F4bnd2cWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjg5MjEsImV4cCI6MjA4ODIwNDkyMX0.xeefb_EdbCOpfG6nMyBE0hEDczprkF30IVtGs8YKhlU";

// Defensive check for localStorage access (resolves Tracking Prevention errors)
let storage;
try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    storage = window.localStorage;
} catch (e) {
    console.warn("⚠️ LocalStorage is blocked by the browser. Auth sessions will not persist across refreshes.");
    storage = undefined; // Supabase will fallback to in-memory storage automatically
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: storage,
        persistSession: !!storage
    }
});

console.log("Supabase client initialized");

