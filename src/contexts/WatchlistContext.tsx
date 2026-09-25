import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useProfile } from "./ProfileContext";
import { useLiveStatus } from "@/lib/liveFigures";
import {
  addWatch,
  fetchWatchlist,
  removeWatch,
  updateProfile,
  updateWatch,
} from "@/lib/supabaseData";
import {
  changesSince,
  defaultTopics,
  isTopic,
  lookup,
  readSnapshot,
  snapshotOf,
  type Change,
  type EntityType,
  type Snapshot,
  type Topic,
} from "@/lib/watchlist";

/**
 * The watch list behind Settings' alerts and the bell in the header.
 *
 * Signed in, it is the account's `watchlist` table; signed out, it is kept
 * in this browser. Alerts are computed here, on every load, by comparing each
 * place's current figures with the snapshot taken when it was last marked
 * seen - so they appear after a data update, on any device, with nothing
 * running in the background.
 */

export type WatchItem = {
  /** Row id when signed in; "<type>:<id>" in the browser. */
  key: string;
  type: EntityType;
  id: string;
  name: string;
  topics: Topic[];
  snapshot: Snapshot;
  changes: Change[];
};

type Stored = { key: string; type: EntityType; id: string; topics: Topic[]; snapshot: Snapshot };

type Ctx = {
  items: WatchItem[];
  mode: "account" | "device";
  isPending: boolean;
  error: string | null;
  /** How many watched figures have changed, across every place. */
  changeCount: number;
  add: (type: EntityType, id: string) => Promise<void>;
  remove: (item: WatchItem) => Promise<void>;
  toggleTopic: (item: WatchItem, topic: Topic) => Promise<void>;
  markSeen: (item: WatchItem) => Promise<void>;
  markAllSeen: () => Promise<void>;
  /** Places saved in this browser before signing in. */
  deviceCount: number;
  importDevice: () => Promise<number>;
  emailDigest: boolean;
  setEmailDigest: (on: boolean) => Promise<void>;
  /** Whether a place is followed, and a one-call follow / unfollow. */
  isWatched: (type: EntityType, id: string) => boolean;
  toggle: (type: EntityType, id: string) => Promise<void>;
};

const WatchlistContext = createContext<Ctx | null>(null);
const DEVICE_KEY = "cs-watchlist";

function readDevice(): Stored[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .filter((r) => (r.type === "country" || r.type === "state") && typeof r.id === "string" && r.id.length <= 40)
      .map((r) => ({
        key: `${r.type}:${r.id}`,
        type: r.type as EntityType,
        id: r.id as string,
        topics: (Array.isArray(r.topics) ? r.topics : []).filter(isTopic),
        snapshot: readSnapshot(r.snapshot),
      }))
      .slice(0, 200);
  } catch {
    return [];
  }
}

function writeDevice(list: Stored[]) {
  try {
    localStorage.setItem(
      DEVICE_KEY,
      JSON.stringify(list.map(({ type, id, topics, snapshot }) => ({ type, id, topics, snapshot }))),
    );
  } catch {
    /* storage full or blocked: the list lasts for this visit */
  }
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured, isPending: authPending } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();
  const uid = isConfigured && user ? user.id : null;
  const [stored, setStored] = useState<Stored[]>([]);
  const [deviceCount, setDeviceCount] = useState(0);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Refreshed figures change what counts as a change since last seen.
  const { version: liveVersion } = useLiveStatus();

  const load = useCallback(async () => {
    const device = readDevice();
    setDeviceCount(device.length);
    if (!uid) {
      setStored(device);
      setError(null);
      setIsPending(false);
      return;
    }
    try {
      const rows = await fetchWatchlist(uid);
      setStored(
        rows.map((r) => ({
          key: r.id,
          type: r.entityType,
          id: r.entityId,
          topics: r.topics.filter(isTopic),
          snapshot: readSnapshot(r.snapshot),
        })),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your watch list could not be loaded.");
    } finally {
      setIsPending(false);
    }
  }, [uid]);

  useEffect(() => {
    if (authPending) return;
    setIsPending(true);
    void load();
  }, [load, authPending]);

  const items = useMemo<WatchItem[]>(
    () =>
      stored
        .map((s) => {
          const hit = lookup(s.type, s.id);
          return hit
            ? { ...s, name: hit.name, changes: changesSince(s.type, s.id, s.topics, s.snapshot) }
            : null;
        })
        .filter((x): x is WatchItem => x !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stored, liveVersion],
  );

  const saveDevice = (next: Stored[]) => {
    writeDevice(next);
    setStored(next);
  };

  const fail = (message: string) => setError(message);

  const add = async (type: EntityType, id: string) => {
    if (stored.some((s) => s.type === type && s.id === id)) return;
    const row = { type, id, topics: defaultTopics(type), snapshot: snapshotOf(type, id) };
    if (!uid) return saveDevice([...stored, { key: `${type}:${id}`, ...row }]);
    const r = await addWatch(uid, { entityType: type, entityId: id, topics: row.topics, snapshot: row.snapshot });
    if (!r.ok) return fail(r.message);
    await load();
  };

  const remove = async (item: WatchItem) => {
    if (!uid) return saveDevice(stored.filter((s) => s.key !== item.key));
    const r = await removeWatch(item.key);
    if (!r.ok) return fail(r.message);
    setStored((prev) => prev.filter((s) => s.key !== item.key));
  };

  const toggleTopic = async (item: WatchItem, topic: Topic) => {
    const topics = item.topics.includes(topic) ? item.topics.filter((t) => t !== topic) : [...item.topics, topic];
    if (!uid) return saveDevice(stored.map((s) => (s.key === item.key ? { ...s, topics } : s)));
    setStored((prev) => prev.map((s) => (s.key === item.key ? { ...s, topics } : s)));
    const r = await updateWatch(item.key, { topics });
    if (!r.ok) {
      fail(r.message);
      await load();
    }
  };

  const markSeen = async (item: WatchItem) => {
    const snapshot = snapshotOf(item.type, item.id);
    if (!uid) return saveDevice(stored.map((s) => (s.key === item.key ? { ...s, snapshot } : s)));
    setStored((prev) => prev.map((s) => (s.key === item.key ? { ...s, snapshot } : s)));
    const r = await updateWatch(item.key, { snapshot, seen: true });
    if (!r.ok) {
      fail(r.message);
      await load();
    }
  };

  const markAllSeen = async () => {
    for (const item of items) if (item.changes.length) await markSeen(item);
  };

  /** Moves this browser's places into the account, then clears them here. */
  const importDevice = async () => {
    if (!uid) return 0;
    let moved = 0;
    const left: Stored[] = [];
    for (const d of readDevice()) {
      if (stored.some((s) => s.type === d.type && s.id === d.id)) {
        moved++;
        continue;
      }
      const r = await addWatch(uid, { entityType: d.type, entityId: d.id, topics: d.topics, snapshot: d.snapshot });
      if (r.ok) moved++;
      else left.push(d);
    }
    writeDevice(left);
    await load();
    return moved;
  };

  const setEmailDigest = async (on: boolean) => {
    if (!uid) return;
    const r = await updateProfile(uid, { emailDigest: on });
    if (!r.ok) return fail(r.message);
    await refreshProfile();
  };

  const isWatched = (type: EntityType, id: string) => stored.some((s) => s.type === type && s.id === id);
  const toggle = async (type: EntityType, id: string) => {
    const item = items.find((i) => i.type === type && i.id === id);
    if (item) await remove(item);
    else await add(type, id);
  };

  const value: Ctx = {
    items,
    mode: uid ? "account" : "device",
    isPending: isPending || authPending,
    error,
    changeCount: items.reduce((n, i) => n + i.changes.length, 0),
    add,
    remove,
    toggleTopic,
    markSeen,
    markAllSeen,
    deviceCount: uid ? deviceCount : 0,
    importDevice,
    emailDigest: !!profile?.email_digest,
    setEmailDigest,
    isWatched,
    toggle,
  };

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): Ctx {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used inside WatchlistProvider");
  return ctx;
}
