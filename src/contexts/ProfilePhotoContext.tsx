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
}

const ProfilePhotoContext = createContext<ProfilePhotoContextValue>({
  photo: null,
  setPhotoFromFile: async () => null,
  removePhoto: () => {},
  isSaving: false,
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

  useEffect(() => {
    try {
      setPhoto(localStorage.getItem(STORAGE_KEY));
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
      value={{ photo, setPhotoFromFile, removePhoto, isSaving }}
    >
      {children}
    </ProfilePhotoContext.Provider>
  );
}

export function useProfilePhoto() {
  return useContext(ProfilePhotoContext);
}
