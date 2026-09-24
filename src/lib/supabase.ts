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
  /* Supabase's newer API keys are not JWTs: the secret one is prefixed
     sb_secret_ (the browser-safe one sb_publishable_), so the JWT check below
     would wave it through. */
  if (key.trim().startsWith("sb_secret_")) return true;
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
    "VITE_SUPABASE_ANON_KEY holds a secret (service_role / sb_secret_) key. That key bypasses every " +
      "RLS policy and would be readable by anyone loading this page. Use the " +
      "publishable (anon) key instead and rotate the exposed one.",
  );
}

/**
 * What an auth email link brought back, read before the client consumes it.
 *
 * Confirmation, magic-link and recovery links land here with the result in
 * the URL. On success the client turns it into a session and strips it from
 * the address bar; on failure (an expired or already-used link) it leaves
 * only an error_description that nothing would otherwise show. Reading it
 * first lets the callback page say what happened.
 */
export const initialAuthRedirect: { type?: string; error?: string; message?: string } = (() => {
  // Only the pages auth emails link to; a ?type= on a data page is not ours.
  if (typeof window === "undefined" || !window.location.pathname.startsWith("/auth/")) return {};
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  new URLSearchParams(window.location.search).forEach((v, k) => {
    if (!params.has(k)) params.set(k, v);
  });
  const error = params.get("error_description") ?? undefined;
  // Sent after the first of the two links in an email change.
  const message = params.get("message") ?? undefined;
  return {
    type: params.get("type") ?? undefined,
    message: message ? message.slice(0, 200) : undefined,
    // Shown as text, never as markup, and cut short: it came from the URL.
    error: error ? error.slice(0, 200) : undefined,
  };
})();

/**
 * Implicit flow on purpose. With PKCE a confirmation link only works in the
 * browser that asked for it, and people open these emails on their phones.
 * The implicit tokens arrive in the URL fragment, which is never sent to a
 * server, and the client removes them from the address bar as it reads them.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, publishableKey!, {
      auth: {
        flowType: "implicit",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** An absolute URL on this site, for auth emails to send people back to. */
export const siteUrl = (path: string): string =>
  `${window.location.origin}${path.startsWith("/") ? path : "/" + path}`;

/**
 * OAuth providers switched on for this deployment, e.g. "google,github".
 * Each must also be enabled, with its client id and secret, under
 * Authentication > Providers in the dashboard; a button for a provider that is
 * not would only lead to an error page, so none shows unless it is listed.
 */
const KNOWN_PROVIDERS = ["google", "github", "azure", "apple"] as const;
export type OAuthProvider = (typeof KNOWN_PROVIDERS)[number];
export const oauthProviders: OAuthProvider[] = String(
  import.meta.env.VITE_SUPABASE_OAUTH_PROVIDERS ?? "",
)
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter((p): p is OAuthProvider => (KNOWN_PROVIDERS as readonly string[]).includes(p));

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // Dev-only, so a contributor without keys understands why nothing syncs
  // instead of assuming the sync is broken.
  console.info(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are unset — " +
      "accounts are off; profile, notes and pins stay in this browser only.",
  );
}
