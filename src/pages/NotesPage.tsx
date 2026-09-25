import { useState, useRef, useLayoutEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotesStore, type Note } from "@/lib/notesStore";
import { voiceNoteUrl } from "@/lib/supabaseData";
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
import { FollowedPlaces } from "@/components/FollowedPlaces";
import type { EntityType } from "@/lib/watchlist";

export function NotesPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const { isConfigured, openAuth } = useAuth();
  const { notes, isPending, error, mode, deviceCount, remove, importDeviceNotes } = useNotesStore();
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");

  const entityTypes = ["All", "Country", "State", "City", "Economy"];
  const followTypes: EntityType[] =
    filterType === "All" ? ["country", "state"] : filterType === "Country" ? ["country"] : filterType === "State" ? ["state"] : [];

  const filtered = notes.filter((n: Note) => {
    const matchSearch =
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.entityName?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || n.entityType === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = async (note: Note) => {
    setIsMutating(true);
    setActionError("");
    const r = await remove(note);
    if (!r.ok) setActionError(r.message ?? "The note could not be deleted.");
    setIsMutating(false);
  };

  const handleImport = async () => {
    setImporting(true);
    const { moved, failed } = await importDeviceNotes();
    setImporting(false);
    setImportResult(
      failed
        ? `Moved ${moved}; ${failed} could not be moved and are still in this browser.`
        : `Moved ${moved} note${moved === 1 ? "" : "s"} into your account.`,
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

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

        {/* Where these notes live, and how to move them. */}
        {mode === "device" ? (
          <div className="mb-6 rounded-xl border border-border bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-sans text-muted-foreground leading-relaxed max-w-2xl">
              {isConfigured
                ? "These notes are saved in this browser only. Sign in to keep them in your account, on every device, and to add voice recordings."
                : "These notes are saved in this browser only, and clearing its data removes them."}
            </p>
            {isConfigured && (
              <button
                onClick={() => openAuth("signin")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Sign in
              </button>
            )}
          </div>
        ) : deviceCount > 0 || importResult ? (
          <div className="mb-6 rounded-xl border border-border bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-sans text-muted-foreground">
              {importResult ||
                `${deviceCount} note${deviceCount === 1 ? " was" : "s were"} written in this browser before you signed in.`}
            </p>
            {deviceCount > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
              >
                {importing ? "Moving…" : "Move them into my account"}
              </button>
            )}
          </div>
        ) : null}

        {actionError && (
          <p className="mb-4 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {actionError}
          </p>
        )}

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

        {/* The countries and states you follow, kept here beside your notes.
            The type buttons and the search narrow these too; a city or an
            economy cannot be followed, so those filters hide this. */}
        {followTypes.length > 0 && (
          <FollowedPlaces
            types={followTypes}
            title={
              followTypes.length === 2
                ? "Places you follow"
                : followTypes[0] === "country"
                  ? "Countries you follow"
                  : "States you follow"
            }
            match={search ? (name) => name.toLowerCase().includes(search.toLowerCase()) : undefined}
            emptyText={
              <>
                Follow a country or a US state with the ☆ on its card or in its pop-up and its card is kept
                here, with its key figures and anything that changes in a data update since you last looked.
              </>
            }
          />
        )}

        {isPending && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Spinner size={22} className="animate-spin" />
            <span className="text-sm font-sans">Loading notes…</span>
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-destructive text-sm font-sans">
            Your notes could not be loaded: {error}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                {filtered.map((note: Note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    formatDate={formatDate}
                    onDelete={handleDelete}
                    isMutating={isMutating}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, formatDate, onDelete, isMutating }: {
  note: Note;
  formatDate: (d: string) => string;
  onDelete: (note: Note) => void;
  isMutating: boolean;
}) {
  const noteLinks = note.links;
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* A note grows with what is written in it, line breaks kept. A very long
     one stops at twelve lines with "Show more" rather than stretching the
     page; whether it needs that is measured, not guessed from its length. */
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [note.content, expanded]);

  // Recordings are private, so the playable URL is signed on demand and
  // lasts an hour, rather than being fetched for every card on the page.
  const togglePlay = async () => {
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); return; }
    let src = audioSrc;
    if (!src && note.voicePath) {
      src = await voiceNoteUrl(note.voicePath);
      if (!src) { setAudioError(true); return; }
      setAudioSrc(src);
    }
    const el = audioRef.current;
    if (!el || !src) return;
    if (el.src !== src) el.src = src;
    try { await el.play(); setIsPlaying(true); } catch { setAudioError(true); }
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
          <h3
            className={`text-sm font-semibold font-sans text-foreground leading-snug break-words ${expanded ? "" : "line-clamp-2"}`}
          >
            {note.title || "Untitled Note"}
          </h3>
        </div>
        <button
          onClick={() => onDelete(note)}
          disabled={isMutating}
          className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors duration-150 disabled:opacity-40"
          aria-label={`Delete note: ${note.title || "Untitled"}`}
        >
          <Trash size={15} weight="bold" />
        </button>
      </div>

      {/* Content */}
      <div>
        <p
          ref={bodyRef}
          className={`text-xs text-muted-foreground font-sans leading-relaxed whitespace-pre-wrap break-words ${expanded ? "" : "line-clamp-[12]"}`}
        >
          {note.content}
        </p>
        {(overflows || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 text-xs font-semibold font-sans text-secondary hover:underline"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

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
      {note.voicePath && (
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 border-t border-border mt-auto">
          <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
          <Microphone size={12} weight="fill" className="text-secondary shrink-0" />
          <span className="text-xs font-mono text-muted-foreground flex-1">
            {audioError ? "Recording unavailable" : "Voice note"}
          </span>
          <button
            onClick={togglePlay}
            className="text-secondary hover:text-secondary/80 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
          </button>
        </div>
      )}

      {/* Footer date */}
      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground pt-2 border-t border-border mt-auto">
        <CalendarBlank size={12} weight="fill" className="text-secondary" />
        {formatDate(note.createdAt)}
      </div>
    </article>
  );
}
