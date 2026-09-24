import { addPins, fetchPins, removePins, type PinnedType } from "./supabaseData";

/**
 * Pinned countries and states.
 *
 * The browser's copy in localStorage is what the pages read, signed in or
 * not, so a guest keeps their pins and nothing waits on the network to draw.
 * While someone is signed in, every change is also written to their account,
 * and signing in brings the account's pins down to this browser.
 *
 * How the two copies meet on sign-in:
 *   · the first time this browser meets the account, they are merged, so pins
 *     chosen as a guest are not lost to the account's
 *   · after that, the account's list wins, so a pin removed on another device
 *     does not come back from this one
 * Signing out takes the account's pins off this browser, so the next person
 * to use it does not inherit them; pins added as a guest after that are
 * merged in at the next sign-in.
 */

export const PIN_KEYS: Record<PinnedType, string> = {
  country: "cs_pinned_countries",
  state: "cs_pinned_states",
};
const SYNCED_KEY = "cs_pins_synced_for";
export const PINS_CHANGED = "cs-pins-changed";

let syncUid: string | null = null;

/** The stored list, or null when nothing has ever been saved. */
export function readPins(type: PinnedType): string[] | null {
  try {
    const raw = localStorage.getItem(PIN_KEYS[type]);
    if (raw === null) return null;
    /* Anything but a list of strings - a hand-edited value, another app on
       the same origin - is treated as no saved pins. */
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return null;
  }
}

function storeLocal(type: PinnedType, ids: string[]) {
  try {
    localStorage.setItem(PIN_KEYS[type], JSON.stringify(ids));
  } catch {
    /* Storage full or blocked: the pin applies for this visit only. */
  }
  window.dispatchEvent(new CustomEvent(PINS_CHANGED, { detail: { type } }));
}

/** Saves the list here and, when signed in, the difference to the account. */
export function writePins(type: PinnedType, ids: string[]) {
  const before = readPins(type) ?? [];
  const next = [...new Set(ids)];
  storeLocal(type, next);
  if (!syncUid) return;
  const uid = syncUid;
  void addPins(uid, type, next.filter((id) => !before.includes(id)));
  void removePins(uid, type, before.filter((id) => !next.includes(id)));
}

/** Called by the auth layer whenever the signed-in account changes. */
export async function syncPinsFor(uid: string | null) {
  if (!uid) {
    syncUid = null;
    // Signed out (or the session ran out): the pins here were the account's,
    // so they go with it. Left behind, the next person to sign in on this
    // browser would have them merged into their own account.
    let hadAccount = false;
    try {
      hadAccount = localStorage.getItem(SYNCED_KEY) !== null;
      localStorage.removeItem(SYNCED_KEY);
      if (hadAccount) {
        localStorage.removeItem(PIN_KEYS.country);
        localStorage.removeItem(PIN_KEYS.state);
      }
    } catch {
      /* nothing to forget */
    }
    if (hadAccount) window.dispatchEvent(new CustomEvent(PINS_CHANGED, { detail: { type: null } }));
    return;
  }
  const server = await fetchPins(uid);
  // A failed read leaves writes off rather than risk overwriting the account
  // from a stale copy.
  if (!server) return;
  let metBefore = false;
  try {
    metBefore = localStorage.getItem(SYNCED_KEY) === uid;
  } catch {
    /* treat as a first meeting */
  }
  for (const type of ["country", "state"] as const) {
    const local = readPins(type);
    if (metBefore || local === null) {
      if (server[type].length || local !== null) storeLocal(type, server[type]);
    } else {
      const extra = local.filter((id) => !server[type].includes(id));
      await addPins(uid, type, extra);
      storeLocal(type, [...server[type], ...extra]);
    }
  }
  try {
    localStorage.setItem(SYNCED_KEY, uid);
  } catch {
    /* merged again next time, which is harmless */
  }
  syncUid = uid;
}
