import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lbkhadjmkwtrbzwkuhyn.supabase.co";
const SUPABASE_KEY = "sb_publishable_NQ17m1yFOZf-6Yg69U3kWQ_yOzFgKkK";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
