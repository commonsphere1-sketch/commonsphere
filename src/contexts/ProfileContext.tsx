import React, { createContext, useContext, useEffect, useState } from "react";
import {
  isSupabaseConfigured,
  fetchProfile,
  saveProfile,
} from "@/lib/supabase";

/**
 * ProfileContext
 *
 * Display name and email for the account panel.
 *
 * Same constraint as the profile photo: there is no backend to write to, so
 * these persist to localStorage on this device. Before this existed, Save
 * Changes validated the input, flashed "Changes saved." and then kept the
 * values in component state only — so a reload silently restored the "Jane
 * Doe" placeholder. Reporting success while discarding the edit is worse than
 * having no save button, which is why this stores the values for real.
 *
 * Seeding order is deliberate: a value the user saved outranks whatever the
 * SDK session reports, since the saved one is the more recent statement of
 * intent. If a real profile service is added later, only load/save need to
 * change.
 */

const NAME_KEY = "cs-display-name";
const EMAIL_KEY = "cs-email";
const USERNAME_KEY = "cs-username";

interface ProfileContextValue {
  /** Saved display name, or "" when the user has never saved one. */
  displayName: string;
  /** Saved email, or "" when the user has never saved one. */
  email: string;
  /** Saved username, or "" when the user has never chosen one. */
  username: string;
  save: (name: string, email: string, username?: string) => boolean;
  /** True when the profile is backed by Supabase rather than this device. */
  isRemote: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  displayName: "",
  email: "",
  username: "",
  save: () => true,
  isRemote: false,
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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  // Local storage is read first so the fields are populated immediately, then
  // Supabase overwrites them if it has a row. Doing it the other way round
  // would leave the form blank while the network call is in flight.
  useEffect(() => {
    setDisplayName(read(NAME_KEY));
    setEmail(read(EMAIL_KEY));
    setUsername(read(USERNAME_KEY));

    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    fetchProfile().then((row) => {
      if (cancelled || !row) return;
      if (row.display_name) setDisplayName(row.display_name);
      if (row.email) setEmail(row.email);
      if (row.username) setUsername(row.username);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Returns false when storage rejected the write, so the UI can say so. */
  const save = (name: string, nextEmail: string, nextUsername?: string) => {
    setDisplayName(name);
    setEmail(nextEmail);
    if (nextUsername !== undefined) setUsername(nextUsername);
    try {
      localStorage.setItem(NAME_KEY, name);
      localStorage.setItem(EMAIL_KEY, nextEmail);
      if (nextUsername !== undefined)
        localStorage.setItem(USERNAME_KEY, nextUsername);
      // Mirror to Supabase when configured. The local write above already
      // succeeded, so this is best-effort: a failed sync must not report the
      // save as failed when the value is safely on the device.
      if (isSupabaseConfigured()) {
        void saveProfile({
          displayName: name,
          email: nextEmail,
          username: nextUsername ?? username,
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        displayName,
        email,
        username,
        save,
        isRemote: isSupabaseConfigured(),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
