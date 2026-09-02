import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * supabase.ts
 *
 * Optional Supabase backend.
 *
 * Everything in this app currently persists to localStorage because there was
 * nowhere else to put it — the profile, the display name, the avatar. That is
 * per-device by definition: it does not follow the user to another browser, and
 * it is why the Security panel says password changes happen with the sign-in
 * provider rather than here.
 *
 * Supabase is the way out of that, but it is deliberately optional. The app
 * must still build and run with no credentials configured, so this module
 * exports a client that may be null and every caller falls back to local
 * storage. Nothing here fabricates a URL or key: both come from the
 * environment, and until they are set isSupabaseConfigured() is false and the
 * app behaves exactly as it does today.
 *
 * To enable, put these in a .env.local (already gitignored):
 *
 *   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<the publishable anon key>
 *
 * The anon key is the publishable one and is meant to ship in a browser
 * bundle; it is not a secret. It still relies on row-level security being
 * switched on for any table it touches — see supabase/schema.sql, which
 * enables RLS and scopes every policy to auth.uid().
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when both variables are present and the URL looks like a project URL. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && /^https:\/\/.+\.supabase\.co\/?$/.test(url));
}

/**
 * The shared client, or null when unconfigured.
 *
 * Created once at module load. createClient() itself does no network work, so
 * this costs nothing until a query is actually issued.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/** Shape of the row the profile is stored in. */
export interface ProfileRow {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string | null;
  updated_at?: string;
}

/**
 * Reads the signed-in user's profile.
 *
 * Returns null when Supabase is not configured, nobody is signed in, or the
 * row does not exist yet — all three are ordinary states here, not errors, so
 * callers just fall back to their local copy.
 */
export async function fetchProfile(): Promise<ProfileRow | null> {
  if (!supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, username, email, updated_at")
      .eq("id", user.id)
      .maybeSingle();
    if (error) return null;
    return (data as ProfileRow) ?? null;
  } catch {
    return null;
  }
}

/**
 * Writes the signed-in user's profile.
 *
 * Returns false when it could not be saved, so the caller can keep the local
 * copy as the source of truth and say so rather than reporting a success it
 * cannot vouch for.
 */
export async function saveProfile(fields: {
  displayName: string;
  username: string;
  email: string;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: fields.displayName,
        username: fields.username,
        email: fields.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    return !error;
  } catch {
    return false;
  }
}
