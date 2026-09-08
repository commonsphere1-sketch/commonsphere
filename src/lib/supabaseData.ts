import { supabase, isSupabaseConfigured } from "./supabase";
import { sanitizeText, sanitizeUrl, LIMITS } from "./security";
import type { Database } from "./database.types";

/**
 * Typed reads and writes for the per-user tables.
 *
 * Two things every caller should know.
 *
 * First, each function returns null (or an empty list) when Supabase is not
 * configured, rather than throwing. The app is expected to keep working from
 * localStorage in that case, which is how it worked before this existed.
 *
 * Second, every one of these depends on a Supabase auth session. The RLS
 * policies are written against auth.uid(), so with no Supabase session
 * auth.uid() is null, every policy evaluates false, and each call returns
 * nothing rather than failing loudly. The app currently signs in through
 * @animaapp/playground-react-sdk, which does not produce a Supabase session —
 * so these will read empty until sign-in moves to Supabase Auth. That is a
 * deliberate gap, not an oversight; see the note in the commit.
 *
 * Text is sanitised here as well as in the UI. The database constraints are the
 * backstop, this is the layer that keeps a stored value tidy, and the UI is
 * only the first of the three.
 */

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Note = Database["public"]["Tables"]["notes"]["Row"];

/** The signed-in user's id, or null when there is no Supabase session. */
export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/* ── Profile ──────────────────────────────────────────────────────────────── */

export async function fetchProfile(): Promise<Profile | null> {
  if (!supabase) return null;
  const uid = await currentUserId();
  if (!uid) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    console.warn("[supabase] profile read failed:", error.message);
    return null;
  }
  return data;
}

export async function saveProfile(input: {
  displayName?: string;
  email?: string;
  username?: string;
  avatarColor?: string;
  avatarUrl?: string | null;
}): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const uid = await currentUserId();
  if (!uid) return { ok: false, message: "Not signed in." };

  // Trimmed to the same limits the database enforces, so a value is never
  // rejected by the constraint after the UI has already accepted it.
  const patch: Database["public"]["Tables"]["profiles"]["Update"] = { id: uid };
  if (input.displayName !== undefined)
    patch.display_name = sanitizeText(input.displayName).slice(0, LIMITS.NAME);
  if (input.email !== undefined)
    patch.email = sanitizeText(input.email).toLowerCase().slice(0, LIMITS.EMAIL);
  if (input.username !== undefined)
    patch.username = sanitizeText(input.username).slice(0, 30) || null;
  if (input.avatarColor !== undefined) patch.avatar_color = input.avatarColor;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;

  // upsert, because the row may not exist yet on a first save.
  const { error } = await supabase
    .from("profiles")
    .upsert({ ...patch, id: uid }, { onConflict: "id" });

  if (error) {
    // 23505 is unique_violation — here that can only be the username.
    if (error.code === "23505") {
      return { ok: false, message: "That username is already taken." };
    }
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

/* ── Notes ────────────────────────────────────────────────────────────────── */

export async function fetchNotes(): Promise<Note[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[supabase] notes read failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createNote(input: {
  title: string;
  content: string;
  links?: string[];
  contextType?: string;
  contextId?: string;
}): Promise<{ ok: boolean; id?: string; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const uid = await currentUserId();
  if (!uid) return { ok: false, message: "Not signed in." };

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: uid,
      title: sanitizeText(input.title).slice(0, LIMITS.NOTE_TITLE),
      content: sanitizeText(input.content).slice(0, LIMITS.NOTE_CONTENT),
      context_type: input.contextType ?? null,
      context_id: input.contextId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, message: error?.message };

  // Links are normalised through the same sanitiser the UI uses, and anything
  // that is not http/https is dropped here as well as refused by the column
  // constraint.
  const links = (input.links ?? [])
    .map((u) => sanitizeUrl(u))
    .filter((u): u is string => u !== null)
    .slice(0, LIMITS.NOTE_MAX_LINKS);

  if (links.length) {
    const { error: linkError } = await supabase.from("note_links").insert(
      links.map((url) => ({ note_id: data.id, user_id: uid, url })),
    );
    if (linkError) {
      console.warn("[supabase] note links write failed:", linkError.message);
    }
  }

  return { ok: true, id: data.id };
}

export async function deleteNote(id: string): Promise<boolean> {
  if (!supabase) return false;
  // note_links rows go with it via ON DELETE CASCADE.
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) console.warn("[supabase] note delete failed:", error.message);
  return !error;
}

/* ── Pins ─────────────────────────────────────────────────────────────────── */

export type PinnedType = "country" | "state";

export async function fetchPinned(type: PinnedType): Promise<string[]> {
  if (!supabase) return [];
  const uid = await currentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("pinned_items")
    .select("entity_id")
    .eq("user_id", uid)
    .eq("entity_type", type);

  if (error) {
    console.warn("[supabase] pins read failed:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.entity_id);
}

export async function setPinned(
  type: PinnedType,
  entityId: string,
  pinned: boolean,
): Promise<boolean> {
  if (!supabase) return false;
  const uid = await currentUserId();
  if (!uid) return false;

  if (pinned) {
    // The unique constraint makes a repeated pin a no-op rather than a second row.
    const { error } = await supabase
      .from("pinned_items")
      .upsert(
        { user_id: uid, entity_type: type, entity_id: entityId },
        { onConflict: "user_id,entity_type,entity_id" },
      );
    return !error;
  }

  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", uid)
    .eq("entity_type", type)
    .eq("entity_id", entityId);
  return !error;
}

export { isSupabaseConfigured };
