import React, { useState } from "react";
import { useQuery, useMutation } from "@animaapp/playground-react-sdk";
import {
  BookmarkSimple,
  Trash,
  Spinner,
  DownloadSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";

const TYPE_COLORS: Record<string, string> = {
  Country: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  State: "text-secondary border-secondary/40 bg-secondary/10",
  City: "text-green-400 border-green-500/40 bg-green-500/10",
  Economy: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  Global: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
};

function exportBookmarksToCSV(bookmarks: any[]) {
  const headers = ["Label", "Type", "Saved On"];
  const rows = bookmarks.map((b) => [
    b.label,
    b.entityType,
    new Date(b.createdAt).toLocaleDateString("en-US"),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v: any) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookmarks.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function BookmarksPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

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

  const allTypes = ["All", "State", "Country", "City", "Economy", "Global"];
  const filtered = (bookmarks ?? []).filter(
    (b) =>
      (typeFilter === "All" || b.entityType === typeFilter) &&
      (search === "" || b.label.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <BookmarkSimple
              size={28}
              weight="fill"
              className="text-secondary"
            />
            <div>
              <h1 className="text-2xl font-bold font-sans text-foreground">
                Bookmarks
              </h1>
              <p className="text-muted-foreground text-sm font-sans">
                Your saved states, countries &amp; cities
              </p>
            </div>
          </div>
          {(bookmarks ?? []).length > 0 && (
            <button
              onClick={() => exportBookmarksToCSV(filtered)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-[11px] font-sans cursor-pointer shrink-0"
              title="Export bookmarks to CSV"
            >
              <DownloadSimple size={13} weight="bold" />
              Export CSV
            </button>
          )}
        </div>

        {(bookmarks ?? []).length > 0 && (
          <div className="flex flex-col bg-card border border-border/60 rounded-2xl px-4 py-2.5 mb-5">
            <div className="flex items-center gap-2">
              <MagnifyingGlass
                size={15}
                className="text-muted-foreground shrink-0"
              />
              <input
                type="text"
                placeholder="Search bookmarks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2 mt-1 border-t border-border/60">
              {allTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${typeFilter === t ? "bg-secondary/20 text-secondary border-secondary/40" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

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
            {filtered.length === 0 && (bookmarks ?? []).length > 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm font-sans">
                No bookmarks match your search.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((bm) => (
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

            {!isPending && (bookmarks ?? []).length === 0 && (
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
