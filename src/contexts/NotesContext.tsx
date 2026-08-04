import React, { createContext, useContext, useState, useCallback } from "react";

interface NotesPrefill {
  entityName?: string;
  entityType?: string;
}

interface NotesContextValue {
  openNote: (prefill?: NotesPrefill) => void;
  prefill: NotesPrefill | null;
  clearPrefill: () => void;
}

const NotesContext = createContext<NotesContextValue>({
  openNote: () => {},
  prefill: null,
  clearPrefill: () => {},
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [prefill, setPrefill] = useState<NotesPrefill | null>(null);

  const openNote = useCallback((p?: NotesPrefill) => {
    setPrefill(p ?? null);
    // Dispatch a custom event so NotesPopup can open regardless of where it lives
    window.dispatchEvent(
      new CustomEvent("open-notes-popup", { detail: p ?? {} }),
    );
  }, []);

  const clearPrefill = useCallback(() => setPrefill(null), []);

  return (
    <NotesContext.Provider value={{ openNote, prefill, clearPrefill }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  return useContext(NotesContext);
}
