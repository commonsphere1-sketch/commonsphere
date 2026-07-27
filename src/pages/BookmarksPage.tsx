import React from "react";
import { useQuery, useMutation } from "@animaapp/playground-react-sdk";
import { BookmarkSimple, Trash, Spinner } from "@phosphor-icons/react";

export function BookmarksPage() {
  const {
    data: bookmarks,
    isPending,
    error,
  } = useQuery("Bookmark", { orderBy: { createdAt: "desc" } });

  const { remove, isPending: isMutating } = useMutation("Bookmark");

  const handleRemove = async (id: string) => {
    try {
      await remove(id);
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  };

  const typeImages: Record<string, string> = {
    Country: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_3.png",
    State: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_5.png",
    City: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_4.png",
    Economy: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_2.png",
    Global: "https://c.animaapp.com/mnv7exnwOzX3vX/img/ai_1.png",
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BookmarkSimple size={28} weight="fill" className="text-secondary" />
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">Bookmarks</h1>
            <p className="text-muted-foreground text-sm font-sans">
              Your saved data insights and reports
            </p>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Spinner size={22} className="animate-spin" />
            <span className="text-sm font-sans">Loading bookmarks…</span>
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-destructive text-sm font-sans">
            Error loading bookmarks: {error.message}
          </div>
        )}

        {!isPending && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(bookmarks ?? []).map((bm) => (
                <article
                  key={bm.id}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <div className="h-36 overflow-hidden">
                    <img
                      src={typeImages[bm.entityType] ?? typeImages.Global}
                      alt={`${bm.entityType} bookmark`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block text-xs font-mono px-2 py-0.5 rounded-full bg-secondary/20 text-secondary mb-2">
                          {bm.entityType}
                        </span>
                        <h3 className="text-sm font-semibold font-sans text-foreground">
                          {bm.label}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {new Date(bm.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(bm.id)}
                        disabled={isMutating}
                        className="text-muted-foreground hover:text-destructive transition-colors duration-150 p-1 shrink-0 disabled:opacity-40"
                        aria-label={`Remove bookmark: ${bm.label}`}
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {(bookmarks ?? []).length === 0 && (
              <div className="text-center py-16 text-muted-foreground font-sans">
                <BookmarkSimple
                  size={48}
                  weight="thin"
                  className="mx-auto mb-3 text-muted-foreground"
                />
                <p className="text-sm">No bookmarks yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
