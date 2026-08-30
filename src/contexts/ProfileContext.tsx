import React, { createContext, useContext, useEffect, useState } from "react";

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

interface ProfileContextValue {
  /** Saved display name, or "" when the user has never saved one. */
  displayName: string;
  /** Saved email, or "" when the user has never saved one. */
  email: string;
  save: (name: string, email: string) => boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  displayName: "",
  email: "",
  save: () => true,
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

  useEffect(() => {
    setDisplayName(read(NAME_KEY));
    setEmail(read(EMAIL_KEY));
  }, []);

  /** Returns false when storage rejected the write, so the UI can say so. */
  const save = (name: string, nextEmail: string) => {
    setDisplayName(name);
    setEmail(nextEmail);
    try {
      localStorage.setItem(NAME_KEY, name);
      localStorage.setItem(EMAIL_KEY, nextEmail);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <ProfileContext.Provider value={{ displayName, email, save }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
