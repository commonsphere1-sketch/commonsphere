import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { fetchProfile, updateProfile, type Profile } from "@/lib/supabaseData";

/**
 * ProfileContext
 *
 * Display name, email and username for the account panel.
 *
 * Signed in, these come from the account: the profile row in Supabase, and
 * the email from Supabase Auth itself, since that is the address sign-in and
 * password resets go to. Saving writes them back, and an email change goes
 * through Supabase's confirmation step before it takes effect.
 *
 * Signed out (or on a build without Supabase keys), they persist to
 * localStorage on this device, as they always have. The two are kept apart
 * on purpose: an account's details are never written into the guest slots,
 * so signing out on a shared computer leaves nothing of the account behind.
 */

const NAME_KEY = "cs-display-name";
const EMAIL_KEY = "cs-email";
const USERNAME_KEY = "cs-username";

export type SaveResult = { ok: boolean; message?: string };

interface ProfileContextValue {
  /** Saved display name, or "" when none has been saved. */
  displayName: string;
  /** The account's email when signed in; the saved one otherwise. */
  email: string;
  /** Saved username, or "" when none has been chosen. */
  username: string;
  /** "account" when these are the signed-in account's, "device" otherwise. */
  source: "account" | "device";
  /** The account's profile row, or null when signed out. */
  profile: Profile | null;
  save: (name: string, email: string, username?: string) => Promise<SaveResult>;
  /** Re-reads the profile row, after another part of the app changed it. */
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  displayName: "",
  email: "",
  username: "",
  source: "device",
  profile: null,
  save: async () => ({ ok: true }),
  refresh: async () => {},
});

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    // private mode or blocked storage — fall back to the session defaults
    return "";
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured, updateEmail } = useAuth();
  const [local, setLocal] = useState({ displayName: "", email: "", username: "" });
  const [profile, setProfile] = useState<Profile | null>(null);
  const uid = isConfigured && user ? user.id : null;

  useEffect(() => {
    setLocal({ displayName: read(NAME_KEY), email: read(EMAIL_KEY), username: read(USERNAME_KEY) });
  }, []);

  const refresh = useCallback(async () => {
    if (!uid) {
      setProfile(null);
      return;
    }
    setProfile(await fetchProfile(uid));
  }, [uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveLocal = (name: string, nextEmail: string, nextUsername?: string): SaveResult => {
    setLocal((p) => ({
      displayName: name,
      email: nextEmail,
      username: nextUsername ?? p.username,
    }));
    try {
      localStorage.setItem(NAME_KEY, name);
      localStorage.setItem(EMAIL_KEY, nextEmail);
      if (nextUsername !== undefined) localStorage.setItem(USERNAME_KEY, nextUsername);
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not save — this browser's storage is full." };
    }
  };

  const save = async (name: string, nextEmail: string, nextUsername?: string): Promise<SaveResult> => {
    if (!uid || !user) return saveLocal(name, nextEmail, nextUsername);

    const result = await updateProfile(uid, {
      displayName: name,
      ...(nextUsername !== undefined ? { username: nextUsername || null } : {}),
    });
    if (!result.ok) return result;
    await refresh();

    if (nextEmail && nextEmail !== user.email.toLowerCase() && nextEmail !== user.pendingEmail) {
      const change = await updateEmail(nextEmail);
      return change.ok
        ? { ok: true, message: `Saved. ${change.message ?? ""}`.trim() }
        : { ok: false, message: `Your name was saved, but the email was not: ${change.message}` };
    }
    return { ok: true };
  };

  const value: ProfileContextValue =
    uid && user
      ? {
          displayName: profile?.display_name ?? user.name,
          email: user.email,
          username: profile?.username ?? "",
          source: "account",
          profile,
          save,
          refresh,
        }
      : { ...local, source: "device", profile: null, save, refresh };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
