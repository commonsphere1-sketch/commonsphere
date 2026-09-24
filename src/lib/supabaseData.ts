import { supabase, isSupabaseConfigured } from "./supabase";
import { sanitizeText, sanitizeUrl, LIMITS } from "./security";
import type { Database } from "./database.types";

/**
 * Typed reads and writes for the per-account tables and buckets.
 *
 * Every function takes the signed-in user's id from the session the caller
 * already holds, rather than asking the auth server again on each call. The
 * id only scopes the query: what a request may touch is decided by the RLS
 * policies in supabase/migrations, against the verified token, so passing
 * another id gets nothing back.
 *
 * Text is sanitised here as well as in the UI. The database constraints are
 * the backstop, this keeps a stored value tidy, and the UI is only the first
 * of the three.
 */

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type NoteRow = Database["public"]["Tables"]["notes"]["Row"];

export type Result = { ok: true } | { ok: false; message: string };

const NOT_CONFIGURED_MESSAGE = "Accounts are not available on this site yet.";
const NOT_CONFIGURED: Result = { ok: false, message: NOT_CONFIGURED_MESSAGE };

function client() {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  return supabase;
}

/* ── Profile ──────────────────────────────────────────────────────────────── */

export async function fetchProfile(uid: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error) {
    console.warn("[supabase] profile read failed:", error.message);
    return null;
  }
  return data;
}

/**
 * The four columns an account may change. The row itself is created by the
 * database when the account is (see private.handle_new_user), so this is an
 * update, never an insert.
 */
export async function updateProfile(
  uid: string,
  input: {
    displayName?: string;
    username?: string | null;
    avatarColor?: string;
    avatarUrl?: string | null;
  },
): Promise<Result> {
  if (!supabase) return NOT_CONFIGURED;
  const patch: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (input.displayName !== undefined)
    patch.display_name = sanitizeText(input.displayName).slice(0, LIMITS.NAME) || null;
  if (input.username !== undefined)
    patch.username = input.username ? input.username.trim().replace(/^@/, "").slice(0, 30) : null;
  if (input.avatarColor !== undefined) patch.avatar_color = input.avatarColor;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;

  const { data, error } = await supabase.from("profiles").update(patch).eq("id", uid).select("id");
  if (error) {
    // 23505 is unique_violation; on this table only the username can raise it.
    if (error.code === "23505") return { ok: false, message: "That username is already taken." };
    if (error.code === "23514") return { ok: false, message: "That value is not allowed here." };
    return { ok: false, message: error.message };
  }
  if (!data?.length) return { ok: false, message: "Your profile could not be found. Sign out and in again." };
  return { ok: true };
}

/* ── Avatar ───────────────────────────────────────────────────────────────── */

/**
 * Uploads the (already downscaled) avatar to the person's own folder and
 * returns its public URL. One file per person, replaced in place; the query
 * string changes with each upload so browsers do not keep the old picture.
 */
export async function uploadAvatar(uid: string, image: Blob): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: NOT_CONFIGURED_MESSAGE };
  const path = `${uid}/avatar.jpg`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, image, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

export async function removeAvatar(uid: string): Promise<Result> {
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.storage.from("avatars").remove([`${uid}/avatar.jpg`]);
  if (error) return { ok: false, message: error.message };
  return updateProfile(uid, { avatarUrl: null });
}

/**
 * True only for an avatar in this project's own public bucket, so a profile
 * row can never make the page load an image from anywhere else.
 */
export function isOwnAvatarUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) return false;
  return url.startsWith(`${base.replace(/\/+$/, "")}/storage/v1/object/public/avatars/`);
}

/* ── Notes ────────────────────────────────────────────────────────────────── */

export type AccountNote = {
  id: string;
  title: string;
  content: string;
  entityName: string | null;
  entityType: string | null;
  voicePath: string | null;
  links: string[];
  createdAt: string;
};

export async function fetchNotes(uid: string): Promise<AccountNote[]> {
  const db = client();
  const [notes, links] = await Promise.all([
    db.from("notes").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    db.from("note_links").select("note_id, url, created_at").eq("user_id", uid).order("created_at"),
  ]);
  if (notes.error) throw new Error(notes.error.message);
  if (links.error) throw new Error(links.error.message);
  const byNote = new Map<string, string[]>();
  for (const l of links.data ?? []) {
    // Re-checked on the way out as well as on the way in.
    const safe = sanitizeUrl(l.url);
    if (safe) byNote.set(l.note_id, [...(byNote.get(l.note_id) ?? []), safe]);
  }
  return (notes.data ?? []).map((n: NoteRow) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    entityName: n.entity_name,
    entityType: n.entity_type,
    voicePath: n.voice_path,
    links: byNote.get(n.id) ?? [],
    createdAt: n.created_at,
  }));
}

/** File extension for each recording type the voice-notes bucket accepts. */
const VOICE_TYPES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
};
export const VOICE_MAX_BYTES = 10 * 1024 * 1024;

export async function createNote(
  uid: string,
  input: {
    title: string;
    content: string;
    links?: string[];
    entityName?: string;
    entityType?: string;
    voice?: Blob | null;
  },
): Promise<Result & { id?: string }> {
  if (!supabase) return NOT_CONFIGURED;

  // The recording goes up first, so a note never points at a file that failed
  // to arrive. If the note insert fails after, the orphan is removed.
  let voicePath: string | null = null;
  if (input.voice) {
    const type = input.voice.type.split(";")[0].trim();
    const ext = VOICE_TYPES[type];
    if (!ext) return { ok: false, message: "This browser recorded in a format that cannot be stored." };
    if (input.voice.size > VOICE_MAX_BYTES) return { ok: false, message: "That recording is over 10 MB." };
    voicePath = `${uid}/${crypto.randomUUID()}.${ext}`;
    // Re-wrapped with the bare type: a Blob is sent as a form part carrying
    // its own type, and "audio/webm;codecs=opus" is not on the bucket's list.
    const file = new Blob([input.voice], { type });
    const { error } = await supabase.storage
      .from("voice-notes")
      .upload(voicePath, file, { contentType: type, upsert: false });
    if (error) return { ok: false, message: `The recording could not be saved: ${error.message}` };
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: uid,
      title: sanitizeText(input.title).slice(0, LIMITS.NOTE_TITLE),
      content: sanitizeText(input.content).slice(0, LIMITS.NOTE_CONTENT),
      entity_name: input.entityName ? sanitizeText(input.entityName).slice(0, 120) : null,
      entity_type: input.entityType ? sanitizeText(input.entityType).slice(0, 40) : null,
      voice_path: voicePath,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (voicePath) await supabase.storage.from("voice-notes").remove([voicePath]);
    return { ok: false, message: error?.message ?? "The note could not be saved." };
  }

  const links = (input.links ?? [])
    .map((u) => sanitizeUrl(u))
    .filter((u): u is string => u !== null)
    .slice(0, LIMITS.NOTE_MAX_LINKS);
  if (links.length) {
    const { error: linkError } = await supabase
      .from("note_links")
      .insert(links.map((url) => ({ note_id: data.id, user_id: uid, url })));
    if (linkError) {
      return { ok: false, id: data.id, message: `The note was saved, but its links were not: ${linkError.message}` };
    }
  }
  return { ok: true, id: data.id };
}

export async function deleteNote(note: { id: string; voicePath: string | null }): Promise<Result> {
  if (!supabase) return NOT_CONFIGURED;
  // note_links rows go with it through ON DELETE CASCADE; the recording does
  // not, since storage sits outside the database's foreign keys.
  const { error } = await supabase.from("notes").delete().eq("id", note.id);
  if (error) return { ok: false, message: error.message };
  if (note.voicePath) {
    const { error: fileError } = await supabase.storage.from("voice-notes").remove([note.voicePath]);
    if (fileError) console.warn("[supabase] recording not removed:", fileError.message);
  }
  return { ok: true };
}

/** A playable URL for a private recording, valid for an hour. */
export async function voiceNoteUrl(path: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from("voice-notes").createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

/* ── Pins ─────────────────────────────────────────────────────────────────── */

export type PinnedType = "country" | "state";

export async function fetchPins(uid: string): Promise<Record<PinnedType, string[]> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pinned_items")
    .select("entity_type, entity_id, created_at")
    .eq("user_id", uid)
    .order("created_at");
  if (error) {
    console.warn("[supabase] pins read failed:", error.message);
    return null;
  }
  const out: Record<PinnedType, string[]> = { country: [], state: [] };
  for (const r of data ?? []) {
    if (r.entity_type === "country" || r.entity_type === "state") out[r.entity_type].push(r.entity_id);
  }
  return out;
}

export async function addPins(uid: string, type: PinnedType, ids: string[]): Promise<boolean> {
  if (!supabase || !ids.length) return true;
  // ignoreDuplicates makes this ON CONFLICT DO NOTHING. A merge upsert would
  // need UPDATE, which pins deliberately do not grant.
  const { error } = await supabase
    .from("pinned_items")
    .upsert(
      ids.map((entity_id) => ({ user_id: uid, entity_type: type, entity_id })),
      { onConflict: "user_id,entity_type,entity_id", ignoreDuplicates: true },
    );
  if (error) console.warn("[supabase] pin write failed:", error.message);
  return !error;
}

export async function removePins(uid: string, type: PinnedType, ids: string[]): Promise<boolean> {
  if (!supabase || !ids.length) return true;
  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", uid)
    .eq("entity_type", type)
    .in("entity_id", ids);
  if (error) console.warn("[supabase] unpin failed:", error.message);
  return !error;
}

/* ── Account ──────────────────────────────────────────────────────────────── */

/**
 * Everything the account holds, as one JSON document, for the "download my
 * data" button. Recordings are listed by file name; each can be played from
 * the notes page, and they are left out of the file to keep it small.
 */
export async function exportAccountData(uid: string, email: string): Promise<string> {
  const [profile, notes, pins] = await Promise.all([fetchProfile(uid), fetchNotes(uid), fetchPins(uid)]);
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      account: { id: uid, email },
      profile: profile && {
        displayName: profile.display_name,
        username: profile.username,
        avatarColor: profile.avatar_color,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
      notes: notes.map((n) => ({
        title: n.title,
        content: n.content,
        about: n.entityName ? { name: n.entityName, type: n.entityType } : null,
        links: n.links,
        voiceRecording: n.voicePath ? n.voicePath.split("/").pop() : null,
        createdAt: n.createdAt,
      })),
      pinned: pins ?? { country: [], state: [] },
    },
    null,
    2,
  );
}

/**
 * Deletes the signed-in account through the delete-account Edge Function,
 * which holds the service role this browser must never see.
 */
export async function deleteOwnAccount(): Promise<Result> {
  if (!supabase) return NOT_CONFIGURED;
  const { data, error } = await supabase.functions.invoke<{ deleted?: boolean; error?: string }>(
    "delete-account",
    { method: "POST" },
  );
  if (error) {
    // FunctionsHttpError carries the function's own JSON body.
    let message = "The account could not be deleted. Try again, or contact us if it keeps failing.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = String(body.error);
    } catch {
      /* not JSON: the function is probably not deployed */
    }
    return { ok: false, message };
  }
  if (!data?.deleted) return { ok: false, message: data?.error ?? "The account could not be deleted." };
  return { ok: true };
}

export { isSupabaseConfigured };
