import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * ProfilePhotoContext
 *
 * There is no backend to upload an avatar to — the app is a static front end
 * talking to public data APIs — so the photo is kept as a downscaled data URL
 * in localStorage. That means it persists across reloads on this device and is
 * never uploaded anywhere, which is also the reason it does not follow the user
 * to another browser. If a real profile service is added later, only
 * setPhotoFromFile and the initial read need to change.
 *
 * Images are resized to 256px and re-encoded as JPEG before storage. A raw
 * phone photo is several megabytes, and localStorage caps out around 5MB per
 * origin, so storing the original would fail — often silently — and could evict
 * the theme and pinned-entity keys alongside it.
 */

const STORAGE_KEY = "cs-profile-photo";
const COLOR_KEY = "cs-avatar-color";

/**
 * Swatches offered for the avatar when no photo is set.
 *
 * Any colour is allowed via the picker; these are just a quick palette. They
 * are stored as hex so the value survives a theme change — a token would
 * shift underneath the user.
 */
export const AVATAR_COLORS = [
  "#64748b",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

export const DEFAULT_AVATAR_COLOR = "#999999";

/**
 * Readable text colour for a given background.
 *
 * The initials sit directly on the chosen colour, so the foreground has to
 * follow it rather than being fixed — near-black on a light pick, white on a
 * dark one. Uses relative luminance rather than a naive average so that, for
 * example, yellow counts as light and blue as dark.
 */
export function avatarTextColor(hex: string): string {
  const lum = (h: string): number | null => {
    const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const bg = lum(hex);
  if (bg === null) return "#000000";
  const ratio = (a: number, b: number) =>
    (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  // Compare against the two colours actually rendered. An earlier version
  // scored against pure black but painted #1a1a1a, so the real contrast came
  // out below the figure it had optimised for — indigo landed at 3.9:1.
  return ratio(bg, 0) >= ratio(bg, 1) ? "#000000" : "#ffffff";
}
/** Longest edge, in px, of the stored image. */
const MAX_EDGE = 256;
/** Reject anything larger than this before we even try to decode it. */
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

interface ProfilePhotoContextValue {
  /** Data URL of the stored photo, or null when none is set. */
  photo: string | null;
  /** Resizes, stores and returns an error message on failure, null on success. */
  setPhotoFromFile: (file: File) => Promise<string | null>;
  removePhoto: () => void;
  isSaving: boolean;
  /** Background for the initials fallback when no photo is set. */
  avatarColor: string;
  setAvatarColor: (hex: string) => void;
}

const ProfilePhotoContext = createContext<ProfilePhotoContextValue>({
  photo: null,
  setPhotoFromFile: async () => null,
  removePhoto: () => {},
  isSaving: false,
  avatarColor: DEFAULT_AVATAR_COLOR,
  setAvatarColor: () => {},
});

/** Draws the image onto a canvas at most MAX_EDGE on its longest side. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is unavailable in this browser."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

export function ProfilePhotoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarColor, setAvatarColorState] = useState(DEFAULT_AVATAR_COLOR);

  useEffect(() => {
    try {
      setPhoto(localStorage.getItem(STORAGE_KEY));
      const c = localStorage.getItem(COLOR_KEY);
      if (c) setAvatarColorState(c);
    } catch {
      // private mode or blocked storage — run without a saved photo
    }
  }, []);

  const setPhotoFromFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      return "Choose an image file.";
    }
    if (file.size > MAX_INPUT_BYTES) {
      return "That image is over 8MB. Choose a smaller one.";
    }
    setIsSaving(true);
    try {
      const dataUrl = await downscale(file);
      try {
        localStorage.setItem(STORAGE_KEY, dataUrl);
      } catch {
        return "Could not save the photo — this browser's storage is full.";
      }
      setPhoto(dataUrl);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "That image could not be read.";
    } finally {
      setIsSaving(false);
    }
  };

  const setAvatarColor = (hex: string) => {
    setAvatarColorState(hex);
    try {
      localStorage.setItem(COLOR_KEY, hex);
    } catch {
      // storage blocked; the choice still applies for this session
    }
  };

  const removePhoto = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore; clearing state below is what the UI reacts to
    }
    setPhoto(null);
  };

  return (
    <ProfilePhotoContext.Provider
      value={{
        photo,
        setPhotoFromFile,
        removePhoto,
        isSaving,
        avatarColor,
        setAvatarColor,
      }}
    >
      {children}
    </ProfilePhotoContext.Provider>
  );
}

export function useProfilePhoto() {
  return useContext(ProfilePhotoContext);
}
