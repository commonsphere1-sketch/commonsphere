import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createNote, deleteNote, fetchNotes, type AccountNote } from "./supabaseData";
import { sanitizeText, sanitizeUrl, LIMITS } from "./security";

/**
 * Notes, from wherever they live.
 *
 * Signed in, a note is a row in the account's `notes` table, with its links
 * in `note_links` and any recording in the private "voice-notes" bucket.
 * Signed out, notes are kept in this browser's localStorage, without
 * recordings: audio does not fit there, and a recording that vanished on the
 * next reload would be worse than being told it needs an account.
 *
 * Notes written as a guest can be moved into the account once signed in, and
 * are only removed from the browser after the account has them.
 */

export type Note = AccountNote & { source: "account" | "device" };

export type NoteInput = {
  title: string;
  content: string;
  links: string[];
  entityName?: string;
  entityType?: string;
  voice?: Blob | null;
};

const DEVICE_KEY = "cs-notes";
/** Fired after any save or delete, so every open view re-reads. */
export const NOTES_CHANGED = "cs-notes-changed";
const DEVICE_MAX = 500;

function readDevice(): Note[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    // Storage is user-writable, so every field is re-checked on the way out.
    return parsed
      .filter((n): n is Record<string, unknown> => !!n && typeof n === "object" && typeof n.id === "string")
      .map((n) => ({
        id: String(n.id),
        title: sanitizeText(String(n.title ?? "")).slice(0, LIMITS.NOTE_TITLE),
        content: sanitizeText(String(n.content ?? "")).slice(0, LIMITS.NOTE_CONTENT),
        entityName: typeof n.entityName === "string" ? n.entityName.slice(0, 120) : null,
        entityType: typeof n.entityType === "string" ? n.entityType.slice(0, 40) : null,
        voicePath: null,
        links: (Array.isArray(n.links) ? n.links : [])
          .map((u) => sanitizeUrl(String(u)))
          .filter((u): u is string => u !== null)
          .slice(0, LIMITS.NOTE_MAX_LINKS),
        createdAt: typeof n.createdAt === "string" ? n.createdAt : new Date(0).toISOString(),
        source: "device" as const,
      }));
  } catch {
    return [];
  }
}

function writeDevice(notes: Note[]): boolean {
  try {
    localStorage.setItem(
      DEVICE_KEY,
      JSON.stringify(
        notes.map(({ id, title, content, entityName, entityType, links, createdAt }) => ({
          id,
          title,
          content,
          entityName,
          entityType,
          links,
          createdAt,
        })),
      ),
    );
    return true;
  } catch {
    return false;
  }
}

const changed = () => window.dispatchEvent(new Event(NOTES_CHANGED));

async function saveNote(uid: string | null, input: NoteInput): Promise<{ ok: boolean; message?: string }> {
  if (uid) {
    const r = await createNote(uid, input);
    if (r.ok || r.id) changed();
    return r.ok ? { ok: true } : { ok: false, message: r.message };
  }
  if (input.voice) return { ok: false, message: "Sign in to keep voice recordings." };
  const device = readDevice();
  if (device.length >= DEVICE_MAX)
    return { ok: false, message: `This browser holds up to ${DEVICE_MAX} notes. Sign in to keep more.` };
  const note: Note = {
    id: crypto.randomUUID(),
    title: sanitizeText(input.title).slice(0, LIMITS.NOTE_TITLE),
    content: sanitizeText(input.content).slice(0, LIMITS.NOTE_CONTENT),
    entityName: input.entityName || null,
    entityType: input.entityType || null,
    voicePath: null,
    links: input.links
      .map((u) => sanitizeUrl(u))
      .filter((u): u is string => u !== null)
      .slice(0, LIMITS.NOTE_MAX_LINKS),
    createdAt: new Date().toISOString(),
    source: "device",
  };
  if (!writeDevice([note, ...device]))
    return { ok: false, message: "Could not save — this browser's storage is full." };
  changed();
  return { ok: true };
}

/**
 * Saving without loading: for the popup, which is on every page and has no
 * reason to download the whole notebook to add one entry.
 */
export function useNoteActions() {
  const { user, isConfigured } = useAuth();
  const uid = isConfigured && user ? user.id : null;
  const create = useCallback((input: NoteInput) => saveNote(uid, input), [uid]);
  return { create, mode: uid ? ("account" as const) : ("device" as const) };
}

export function useNotesStore() {
  const { user, isConfigured, isPending: authPending } = useAuth();
  const uid = isConfigured && user ? user.id : null;
  const { create } = useNoteActions();
  const [notes, setNotes] = useState<Note[]>([]);
  const [deviceCount, setDeviceCount] = useState(0);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const device = readDevice();
    setDeviceCount(device.length);
    if (!uid) {
      setNotes(device.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setError(null);
      setIsPending(false);
      return;
    }
    try {
      const rows = await fetchNotes(uid);
      setNotes(rows.map((n) => ({ ...n, source: "account" as const })));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your notes could not be loaded.");
    } finally {
      setIsPending(false);
    }
  }, [uid]);

  useEffect(() => {
    if (authPending) return;
    setIsPending(true);
    void load();
    const onChange = () => void load();
    window.addEventListener(NOTES_CHANGED, onChange);
    return () => window.removeEventListener(NOTES_CHANGED, onChange);
  }, [load, authPending]);

  const remove = useCallback(async (note: Note): Promise<{ ok: boolean; message?: string }> => {
    if (note.source === "account") {
      const r = await deleteNote(note);
      if (r.ok) changed();
      return r.ok ? { ok: true } : { ok: false, message: r.message };
    }
    writeDevice(readDevice().filter((n) => n.id !== note.id));
    changed();
    return { ok: true };
  }, []);

  /** Copies this browser's notes into the account, then clears them here. */
  const importDeviceNotes = useCallback(async (): Promise<{ moved: number; failed: number }> => {
    if (!uid) return { moved: 0, failed: 0 };
    let moved = 0;
    let failed = 0;
    // Oldest first, so the account keeps their order.
    for (const n of readDevice().reverse()) {
      const r = await createNote(uid, {
        title: n.title,
        content: n.content,
        links: n.links,
        entityName: n.entityName ?? undefined,
        entityType: n.entityType ?? undefined,
      });
      // An id without ok means the note arrived but a link did not; it is
      // in the account either way, and importing it again would duplicate it.
      if (r.ok || r.id) {
        moved++;
        writeDevice(readDevice().filter((d) => d.id !== n.id));
      } else {
        failed++;
      }
    }
    changed();
    return { moved, failed };
  }, [uid]);

  return {
    notes,
    isPending: isPending || authPending,
    error,
    mode: uid ? ("account" as const) : ("device" as const),
    deviceCount,
    create,
    remove,
    importDeviceNotes,
    reload: load,
  };
}
