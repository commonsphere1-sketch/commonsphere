import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * The Supabase client, or null when the project is not configured.
 *
 * Returning null rather than throwing is deliberate. Vercel builds this site
 * from a static bundle, and a module that throws on import takes the whole app
 * down at load — so an unset variable would turn a missing config into a white
 * screen. Callers check `isSupabaseConfigured` and fall back to local storage,
 * which is what the app did before any of this existed.
 *
 * Only the publishable (anon) key belongs here. Everything in this file is
 * compiled into the bundle and served to every visitor: the service_role key
 * would hand each of them full read and write access to every table, past every
 * RLS policy. It has no place in a browser and must never be added to a VITE_
 * variable.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/** True when both variables are present, so callers can branch before querying. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * A key beginning with the service_role marker is a configuration accident
 * serious enough to refuse outright rather than quietly ship to the browser.
 */
function looksLikeServiceRoleKey(key: string): boolean {
  try {
    const [, payload] = key.split(".");
    if (!payload) return false;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded?.role === "service_role";
  } catch {
    return false;
  }
}

if (publishableKey && looksLikeServiceRoleKey(publishableKey)) {
  throw new Error(
    "VITE_SUPABASE_ANON_KEY holds a service_role key. That key bypasses every " +
      "RLS policy and would be readable by anyone loading this page. Use the " +
      "publishable (anon) key instead and rotate the exposed one.",
  );
}

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // Dev-only, so a contributor without keys understands why nothing syncs
  // instead of assuming the sync is broken.
  console.info(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are unset — " +
      "profile, notes and pins stay in this browser only.",
  );
}
