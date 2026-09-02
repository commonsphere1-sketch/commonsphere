import { useState, useRef } from "react";
import { useQuery, useMutation } from "@animaapp/playground-react-sdk";
import { sanitizeUrl } from "@/lib/security";
import {
  NotePencil,
  Trash,
  MagnifyingGlass,
  Spinner,
  Tag,
  CalendarBlank,
  Link,
  Microphone,
  Play,
  Pause,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

/** Shape of a "Note" record as this page consumes it. The SDK's useQuery
 *  returns `data: any`, so the fields are declared here for type safety. */
type Note = {
  id: string;
  title?: string;
  content: string;
  entityName?: string;
  entityType?: string;
  createdAt?: string;
  links?: string;
  voiceRecordingUrl?: string;
};
export function NotesPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  const { data: notes, isPending, error } = useQuery("Note", { orderBy: { createdAt: "desc" } });
  const { remove, isPending: isMutating } = useMutation("Note");

  const entityTypes = ["All", "Country", "State", "City", "Economy"];

  const filtered = ((notes ?? []) as Note[]).filter((n: Note) => {
    const matchSearch =
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.entityName?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || n.entityType === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = async (id: string) => {
    try { await remove(id); } catch (err) { console.error("Failed to delete note:", err); }
  };

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const parseLinks = (raw?: string | null): string[] => {
    if (!raw) return [];
    let parsed: string[];
    try { parsed = JSON.parse(raw); } catch { parsed = raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean); }
    // Re-validate every stored URL — reject anything non-http/https, and
    // keep the normalised form. Filtering on sanitizeUrl but returning the
    // raw string let a scheme-less "example.com" through as a relative href,
    // which navigated to /example.com inside the app instead of off-site.
    return parsed
      .map((u) => sanitizeUrl(u))
      .filter((u): u is string => u !== null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">My Notes</h1>
            <p className="text-muted-foreground text-sm font-sans">Notes taken while examining data</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm mx-auto">
            <MagnifyingGlass size={16} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…" className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-full" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {entityTypes.map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans transition-colors duration-150 ${filterType === t ? "bg-secondary text-secondary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {isPending && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Spinner size={22} className="animate-spin" />
            <span className="text-sm font-sans">Loading notes…</span>
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-destructive text-sm font-sans">
            Error loading notes: {error.message}
          </div>
        )}

        {!isPending && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground font-sans">
                <NotePencil size={48} weight="thin" className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm">No notes yet. Use the popup button to write your first note.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((note: Note) => {
                  const noteLinks = parseLinks(note.links);
                  return (
                    <NoteCard
                      key={note.id}
                      note={note}
                      noteLinks={noteLinks}
                      formatDate={formatDate}
                      onDelete={handleDelete}
                      isMutating={isMutating}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, noteLinks, formatDate, onDelete, isMutating }: {
  note: any;
  noteLinks: string[];
  formatDate: (d: Date) => string;
  onDelete: (id: string) => void;
  isMutating: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  return (
    <article className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3 group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {note.entityName && (
            <div className="flex items-center gap-1 mb-1.5">
              <Tag size={12} weight="fill" className="text-secondary shrink-0" />
              <span className="text-xs font-mono text-secondary truncate">
                {note.entityName}{note.entityType ? ` · ${note.entityType}` : ""}
              </span>
            </div>
          )}
          <h3 className="text-sm font-semibold font-sans text-foreground line-clamp-2 leading-snug">
            {note.title || "Untitled Note"}
          </h3>
        </div>
        <button
          onClick={() => onDelete(note.id)}
          disabled={isMutating}
          className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors duration-150 disabled:opacity-40"
          aria-label={`Delete note: ${note.title || "Untitled"}`}
        >
          <Trash size={15} weight="bold" />
        </button>
      </div>

      {/* Content preview */}
      <p className="text-xs text-muted-foreground font-sans leading-relaxed line-clamp-4 flex-1">
        {note.content}
      </p>

      {/* Links */}
      {noteLinks.length > 0 && (
        <div className="flex flex-col gap-1 pt-2 border-t border-border">
          <p className="text-[10px] font-semibold font-sans text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-0.5">
            <Link size={10} weight="bold" /> Links ({noteLinks.length})
          </p>
          {noteLinks.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs font-mono text-secondary truncate hover:underline block"
              onClick={(e) => e.stopPropagation()}>
              {url.replace(/^https?:\/\//, "").slice(0, 40)}{url.length > 40 ? "…" : ""}
            </a>
          ))}
        </div>
      )}

      {/* Voice recording */}
      {note.voiceRecordingUrl && (() => {
        // Only render audio if the stored URL uses a safe scheme (blob: or https:)
        const safeAudioSrc = (() => {
          const u = note.voiceRecordingUrl as string;
          if (u.startsWith("blob:")) return u;
          const clean = sanitizeUrl(u);
          return clean ?? null;
        })();
        if (!safeAudioSrc) return null;
        return (
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 border-t border-border mt-auto">
          <audio ref={audioRef} src={safeAudioSrc} onEnded={() => setIsPlaying(false)} />
          <Microphone size={12} weight="fill" className="text-secondary shrink-0" />
          <span className="text-xs font-mono text-muted-foreground flex-1">Voice note</span>
          <button
            onClick={togglePlay}
            className="text-secondary hover:text-secondary/80 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
          </button>
        </div>
        );
      })()}

      {/* Footer date */}
      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground pt-2 border-t border-border mt-auto">
        <CalendarBlank size={12} weight="fill" className="text-secondary" />
        {formatDate(note.createdAt)}
      </div>
    </article>
  );
}
