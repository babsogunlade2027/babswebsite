// Secure Supabase Client & Configuration Standards
// Ensure only public anon keys are exposed in client bundles

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL"; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY"; // Replace with your public Anon key

// Initialize client if script is loaded
let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
