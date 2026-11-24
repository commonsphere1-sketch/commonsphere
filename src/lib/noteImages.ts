/**
 * The images a note carries, as asked: kept in this browser's own database (IndexedDB), by the note's id, for a note in
 * the account as for one kept in the browser. The account has no place for images - a new storage bucket on the shared
 * database would be needed - so the note says where its images are kept.
 *
 * An image is checked on the way in: a photo (JPEG, PNG, WebP or GIF) only, no more than six to a note, and a large one is
 * drawn smaller - its longer side to 1,600 pixels - so that the browser's room is not spent on one picture. Nothing is
 * sent anywhere: the images never leave the browser.
 */
import { useEffect, useState } from "react";

export type NoteImage = { id: string; name: string; type: string; blob: Blob };

export const NOTE_IMAGES_MAX = 6;
/** The most an image may weigh once drawn to size. */
export const NOTE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
/** Told when a note's images change, so every card showing them reads them again. */
export const NOTE_IMAGES_CHANGED = "cs-note-images-changed";

const DB_NAME = "cs-note-images";
const STORE = "notes";
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const LONGEST = 1600;

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | null): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, mode);
          const req = fn(tx.objectStore(STORE));
          tx.oncomplete = () => {
            db.close();
            resolve(req ? (req.result as T) : null);
          };
          tx.onerror = () => {
            db.close();
            resolve(null);
          };
          tx.onabort = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      }),
  );
}

/** Whether this browser can keep images at all (a private window may not). */
export async function imagesAvailable(): Promise<boolean> {
  const db = await openDb();
  db?.close();
  return !!db;
}

/** A note's images, oldest first; none where it has none or the browser keeps none. */
export async function readImages(noteId: string): Promise<NoteImage[]> {
  const got = await run<unknown>("readonly", (s) => s.get(noteId));
  if (!Array.isArray(got)) return [];
  // Read back as checked going in: what the browser's store holds can be changed by hand.
  return got.filter(
    (x): x is NoteImage =>
      !!x && typeof x === "object" && typeof (x as NoteImage).id === "string" && (x as NoteImage).blob instanceof Blob && TYPES.has((x as NoteImage).type),
  );
}

/** Sets a note's images: none clears them. Whether the browser kept them. */
export async function writeImages(noteId: string, images: NoteImage[]): Promise<boolean> {
  const kept = images.slice(0, NOTE_IMAGES_MAX).map(({ id, name, type, blob }) => ({ id, name: name.slice(0, 120), type, blob }));
  const r = await run<IDBValidKey>("readwrite", (s) => (kept.length ? s.put(kept, noteId) : s.delete(noteId) as unknown as IDBRequest<IDBValidKey>));
  window.dispatchEvent(new CustomEvent(NOTE_IMAGES_CHANGED, { detail: noteId }));
  return r !== null || kept.length === 0;
}

export const deleteImages = (noteId: string) => writeImages(noteId, []);

/** A note's images moved to another id: a note in the browser moved into the account takes a new one. */
export async function moveImages(from: string, to: string): Promise<void> {
  const images = await readImages(from);
  if (!images.length) return;
  if (await writeImages(to, images)) await deleteImages(from);
}

/**
 * A file chosen, made ready to keep: a photo of an accepted kind, drawn smaller where its longer side is over 1,600
 * pixels (a GIF is kept as it is, so that it still moves). An error in words where it cannot be kept.
 */
export async function prepareImage(file: File): Promise<NoteImage | { error: string }> {
  if (!TYPES.has(file.type)) return { error: `${file.name}: only JPEG, PNG, WebP and GIF images can be added.` };
  let blob: Blob = file;
  let type = file.type;
  if (file.type !== "image/gif") {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, LONGEST / Math.max(bmp.width, bmp.height));
      if (scale < 1 || file.size > NOTE_IMAGE_MAX_BYTES) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bmp.width * scale));
        canvas.height = Math.max(1, Math.round(bmp.height * scale));
        canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        const drawn = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.85));
        if (drawn && drawn.type === "image/webp") {
          blob = drawn;
          type = "image/webp";
        }
      }
      bmp.close();
    } catch {
      return { error: `${file.name}: this image could not be read.` };
    }
  }
  if (blob.size > NOTE_IMAGE_MAX_BYTES) return { error: `${file.name}: over 4 MB even when drawn smaller.` };
  return { id: crypto.randomUUID(), name: file.name, type, blob };
}

/** A note's images as addresses a page can draw, made when they are read and let go when they change. */
export function useNoteImages(noteId: string | null): { id: string; name: string; url: string }[] {
  const [shown, setShown] = useState<{ id: string; name: string; url: string }[]>([]);
  useEffect(() => {
    if (!noteId) {
      setShown([]);
      return;
    }
    let live = true;
    let urls: string[] = [];
    const load = () =>
      void readImages(noteId).then((images) => {
        if (!live) return;
        urls.forEach((u) => URL.revokeObjectURL(u));
        const next = images.map((i) => ({ id: i.id, name: i.name, url: URL.createObjectURL(i.blob) }));
        urls = next.map((n) => n.url);
        setShown(next);
      });
    load();
    const onChange = (e: Event) => (e as CustomEvent).detail === noteId && load();
    window.addEventListener(NOTE_IMAGES_CHANGED, onChange);
    return () => {
      live = false;
      window.removeEventListener(NOTE_IMAGES_CHANGED, onChange);
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [noteId]);
  return shown;
}
