import React, { createContext, useContext, ReactNode } from "react";

type BookmarkContextType = {
  bookmarks: string[];
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
};

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarks: [],
  addBookmark: () => {},
  removeBookmark: () => {},
});

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = React.useState<string[]>([]);
  const addBookmark = (id: string) => setBookmarks((prev) => [...prev, id]);
  const removeBookmark = (id: string) => setBookmarks((prev) => prev.filter((b) => b !== id));
  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarkContext);
}
