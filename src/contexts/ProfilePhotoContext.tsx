import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useProfile } from "./ProfileContext";
import { isOwnAvatarUrl, removeAvatar, updateProfile, uploadAvatar } from "@/lib/supabaseData";

/**
 * ProfilePhotoContext
 *
 * Signed in, the photo is uploaded to the account's own folder in the
 * Supabase "avatars" bucket and the colour is saved on the profile, so both
 * follow the person to any device. Signed out, the photo is kept as a
 * downscaled data URL in localStorage and never leaves the browser.
 *
 * Either way images are resized to 256px and re-encoded as JPEG first. A raw
 * phone photo is several megabytes: localStorage caps out around 5MB per
 * origin, and there is no reason to upload more than the header will draw.
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
 * Avatar styled as glass rather than filled with a colour.
 *
 * Stored in the same slot as the swatches, so it is a sentinel rather than a
 * hex value — the fill has to come from CSS, since glass depends on what is
 * behind it and on the theme, neither of which a stored colour can express.
 */
export const GLASS_AVATAR = "glass";

/**
 * Readable text colour for a given background.
 *
 * The initials sit directly on the chosen colour, so the foreground has to
 * follow it rather than being fixed — near-black on a light pick, white on a
 * dark one. Uses relative luminance rather than a naive average so that, for
 * example, yellow counts as light and blue as dark.
 */
/**
 * True for a plain 6-digit hex colour. Storage is user-writable, so a value
 * read back from it is treated the same way a stored note URL is: re-checked
 * rather than trusted, falling back to the default when it fails.
 */
export function isValidAvatarColor(value: string): boolean {
  return value === GLASS_AVATAR || /^#[0-9a-fA-F]{6}$/.test(value);
}

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
  /** Where the photo and colour are kept: the account, or this browser. */
  stored: "account" | "device";
}

const ProfilePhotoContext = createContext<ProfilePhotoContextValue>({
  photo: null,
  setPhotoFromFile: async () => null,
  removePhoto: () => {},
  isSaving: false,
  avatarColor: DEFAULT_AVATAR_COLOR,
  setAvatarColor: () => {},
  stored: "device",
});

/** Draws the image onto a canvas at most MAX_EDGE on its longest side. */
function downscale(file: File): Promise<HTMLCanvasElement> {
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
      resolve(canvas);
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
  const { user, isConfigured } = useAuth();
  const { profile, refresh } = useProfile();
  const uid = isConfigured && user ? user.id : null;
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarColor, setAvatarColorState] = useState(DEFAULT_AVATAR_COLOR);
  const [accountColor, setAccountColor] = useState<string | null>(null);

  // The account's colour, once its profile has loaded. Held apart from the
  // device's so signing out shows the guest colour again.
  useEffect(() => {
    const c = profile?.avatar_color;
    setAccountColor(c && isValidAvatarColor(c) ? c : null);
  }, [profile?.avatar_color]);
  const accountPhoto = isOwnAvatarUrl(profile?.avatar_url) ? profile!.avatar_url : null;

  useEffect(() => {
    try {
      /* Only what downscale() writes - a base64 image data URL - is used as
         an <img> source; any other value in the slot is ignored. */
      const saved = localStorage.getItem(STORAGE_KEY);
      setPhoto(
        saved && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(saved)
          ? saved
          : null,
      );
      const c = localStorage.getItem(COLOR_KEY);
      if (c && isValidAvatarColor(c)) setAvatarColorState(c);
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
      const canvas = await downscale(file);
      if (uid) {
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
        if (!blob) return "That image could not be converted.";
        const up = await uploadAvatar(uid, blob);
        if ("error" in up) return `The photo could not be uploaded: ${up.error}`;
        const saved = await updateProfile(uid, { avatarUrl: up.url });
        if (!saved.ok) return saved.message;
        await refresh();
        return null;
      }
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
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
    if (!isValidAvatarColor(hex)) return;
    if (uid) {
      setAccountColor(hex);
      void updateProfile(uid, { avatarColor: hex }).then((r) => {
        if (!r.ok) console.warn("[profile] colour not saved:", r.message);
      });
      return;
    }
    setAvatarColorState(hex);
    try {
      localStorage.setItem(COLOR_KEY, hex);
    } catch {
      // storage blocked; the choice still applies for this session
    }
  };

  const removePhoto = () => {
    if (uid) {
      void removeAvatar(uid).then(() => refresh());
      return;
    }
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
        photo: uid ? accountPhoto : photo,
        setPhotoFromFile,
        removePhoto,
        isSaving,
        avatarColor: uid ? (accountColor ?? DEFAULT_AVATAR_COLOR) : avatarColor,
        setAvatarColor,
        stored: uid ? "account" : "device",
      }}
    >
      {children}
    </ProfilePhotoContext.Provider>
  );
}

export function useProfilePhoto() {
  return useContext(ProfilePhotoContext);
}
