import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNoteActions, type Note } from "../lib/notesStore";
import { NOTE_IMAGES_MAX, prepareImage, readImages, writeImages, type NoteImage } from "../lib/noteImages";
import { VOICE_MAX_BYTES } from "../lib/supabaseData";
import {
  sanitizeText,
  sanitizeUrl,
  validateNotePayload,
  LIMITS,
} from "../lib/security";
import { countriesData } from "../data/countriesData";
import { usStatesData } from "../data/statesData";
import { followedNow } from "../lib/followedCities";
import { NOTE_KINDS, followedKind, sectionOf, type NoteKind } from "../lib/noteKinds";
import { useFloatingButton } from "../lib/floatingButtons";
import { StyledSelect } from "./StyledSelect";
import {
  NotePencil,
  X,
  CaretDown,
  CaretUp,
  FloppyDisk,
  Spinner,
  Link,
  Plus,
  Trash,
  Microphone,
  StopCircle,
  Play,
  Pause,
  ImageSquare,
} from "@phosphor-icons/react";

export function NotesPopup() {
  const [open, setOpen] = useState(false);
  const [buttonShown] = useFloatingButton("notes");
  const [minimized, setMinimized] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState("");
  /* The place locked in on the dashboard first, then anything pinned. Read
     when the popup opens rather than once at mount, so a country followed a
     moment ago is already here. Same localStorage keys the dashboard
     carousel and the pinned strip write. */
  const savedPlaces = useMemo(() => {
    if (!open) return [];
    const read = (key: string): string[] => {
      try {
        const raw = localStorage.getItem(key);
        const ids = raw ? JSON.parse(raw) : [];
        return Array.isArray(ids) ? ids : [];
      } catch {
        return [];
      }
    };
    let focus: { kind?: string; id?: string } = {};
    try {
      focus = JSON.parse(localStorage.getItem("cs_focus") ?? "{}") ?? {};
    } catch {
      focus = {};
    }
    const out: { name: string; type: string; followed: boolean }[] = [];
    const push = (name: string | undefined, type: string, followed: boolean) => {
      if (name && !out.some((p) => p.name === name)) out.push({ name, type, followed });
    };
    if (focus.id) {
      const pool = focus.kind === "state" ? usStatesData : countriesData;
      push(pool.find((x) => x.id === focus.id)?.name, focus.kind === "state" ? "State" : "Country", true);
    }
    for (const id of read("cs_pinned_countries"))
      push(countriesData.find((c) => c.id === id)?.name, "Country", false);
    for (const id of read("cs_pinned_states"))
      push(usStatesData.find((s) => s.id === id)?.name, "State", false);
    // The cities and municipalities followed with a star, by the names kept with them.
    for (const f of followedNow()) if (f.about) push(f.about.name, followedKind(f.id), false);
    return out.slice(0, 10);
  }, [open]);
  /** The page the popup was opened on: a note can be about the whole of it. */
  const here = useMemo(() => (open ? sectionOf(window.location.pathname) : null), [open]);
  /** What a note is about, named by hand, with its kind: for an economy, a leader, a policy - anything the chips do not offer. */
  const [aboutName, setAboutName] = useState("");
  const [aboutKind, setAboutKind] = useState<NoteKind>("Country");
  const setAbout = () => {
    const name = sanitizeText(aboutName).slice(0, 120);
    if (!name) return;
    setEntityName(name);
    setEntityType(aboutKind);
    setAboutName("");
  };
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  /* The note being edited, as asked: opened from its card on My Notes, its fields filled in; saved where it lives. */
  const [editing, setEditing] = useState<Pick<Note, "id" | "source" | "voicePath"> | null>(null);
  /* Its images, as asked: added here, kept in this browser (lib/noteImages), shown small with a way to take one off. */
  const [images, setImages] = useState<NoteImage[]>([]);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const previews = useMemo(() => images.map((i) => ({ id: i.id, name: i.name, url: URL.createObjectURL(i.blob) })), [images]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);
  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const room = NOTE_IMAGES_MAX - images.length;
    if (room <= 0) {
      setInputError(`A note holds up to ${NOTE_IMAGES_MAX} images.`);
      return;
    }
    const ready: NoteImage[] = [];
    const problems: string[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      const r = await prepareImage(file);
      if ("error" in r) problems.push(r.error);
      else ready.push(r);
    }
    if (files.length > room) problems.push(`Only ${room} more could be added: a note holds up to ${NOTE_IMAGES_MAX} images.`);
    setInputError(problems.join(" "));
    setImages((prev) => [...prev, ...ready].slice(0, NOTE_IMAGES_MAX));
  };
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  /* The recording itself, uploaded with the note. audioUrl is only a local
     object URL for playing it back here, and dies with the page. */
  const audioBlobRef = useRef<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isConfigured, openAuth } = useAuth();
  const { create, update, mode } = useNoteActions();
  const canRecord = mode === "account";
  const [inputError, setInputError] = useState("");

  // Listen for open-notes-popup events dispatched by entity modals
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        entityName?: string;
        entityType?: string;
        links?: string[];
        /** A note to edit, from its card on My Notes: its fields are filled in, and Save keeps it where it lives. */
        edit?: Note;
      };
      if (detail.edit) {
        const n = detail.edit;
        setEditing({ id: n.id, source: n.source, voicePath: n.voicePath });
        setTitle(n.title);
        setContent(n.content);
        setEntityName(n.entityName ?? "");
        setEntityType(n.entityType ?? "");
        setLinks(n.links.map((u) => sanitizeUrl(String(u))).filter((u): u is string => u !== null).slice(0, LIMITS.NOTE_MAX_LINKS));
        setLinkInput("");
        setInputError("");
        setImages([]);
        void readImages(n.id).then(setImages);
        setOpen(true);
        setMinimized(false);
        return;
      }
      setEditing(null);
      setEntityName(detail.entityName ?? "");
      setEntityType(detail.entityType ?? "");
      // Links it is opened with - a comparison's link back to itself - checked as a link typed in is.
      if (Array.isArray(detail.links)) {
        const given = detail.links.map((u) => sanitizeUrl(String(u))).filter((u): u is string => u !== null);
        setLinks(given.slice(0, LIMITS.NOTE_MAX_LINKS));
      }
      setOpen(true);
      setMinimized(false);
    };
    window.addEventListener("open-notes-popup", handler);
    return () => window.removeEventListener("open-notes-popup", handler);
  }, []);

  const addLink = () => {
    if (links.length >= LIMITS.NOTE_MAX_LINKS) {
      setInputError(`Maximum ${LIMITS.NOTE_MAX_LINKS} links allowed.`);
      return;
    }
    const sanitized = sanitizeUrl(linkInput.trim());
    if (!sanitized) {
      setInputError("Invalid URL. Only http/https links are allowed.");
      return;
    }
    setInputError("");
    setLinks((prev) => [...prev, sanitized]);
    setLinkInput("");
  };

  const removeLink = (idx: number) =>
    setLinks((prev) => prev.filter((_, i) => i !== idx));

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        /* The type the browser actually recorded in: WebM in Chrome, Ogg in
           Firefox, MP4 in Safari. Labelling them all WebM made Safari's
           unplayable elsewhere. */
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size > VOICE_MAX_BYTES) {
          setInputError("That recording is over 10 MB. Record a shorter one.");
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(
        () => setRecordingSeconds((s) => s + 1),
        1000,
      );
    } catch {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const clearRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioBlobRef.current = null;
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const formatSecs = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleSave = async () => {
    const cleanTitle = sanitizeText(title);
    const cleanContent = sanitizeText(content);

    const validation = validateNotePayload({
      title: cleanTitle,
      content: cleanContent,
      links,
    });

    if (!validation.ok) {
      setInputError(validation.message);
      return;
    }

    setInputError("");
    setSaving(true);
    try {
      const fields = {
        title: cleanTitle,
        content: cleanContent,
        links,
        entityName: entityName || undefined,
        entityType: entityType || undefined,
      };
      const result = editing ? await update(editing, fields) : await create({ ...fields, voice: audioBlobRef.current });
      const id = editing ? editing.id : (result as { id?: string }).id;
      if (!result.ok) {
        setInputError(result.message ?? "The note could not be saved.");
        return;
      }
      // Its images, kept in this browser by the note's id: set whole, so one taken off goes.
      if (id && (images.length || editing)) {
        const kept = await writeImages(id, images);
        if (!kept && images.length) {
          setInputError("The note was saved, but this browser would not keep its images.");
          return;
        }
      }
      setEditing(null);
      setImages([]);
      setTitle("");
      setContent("");
      setLinks([]);
      setLinkInput("");
      setEntityName("");
      setEntityType("");
      clearRecording();
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch {
      setInputError("The note could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // The button, unless the reader has taken it off in Settings, as asked - there alone, not on the button itself. Off, the
  // popup still opens where a note is asked for - a place's window, a comparison, My Notes.
  if (!open) {
    return buttonShown ? (
      <button
        onClick={() => setOpen(true)}
        className="notes-fab fixed bottom-4 right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center hover:scale-105"
        aria-label="Open notes"
      >
        <NotePencil size={16} weight="fill" />
      </button>
    ) : null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-xl shadow-2xl flex flex-col overflow-hidden modal-glass border"
      style={{
        width: "17rem",
        maxHeight: minimized ? "48px" : "560px",
        transition: "max-height 0.2s ease",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 modal-tile border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <NotePencil size={18} weight="fill" className="text-secondary" />
          <span className="text-sm font-semibold font-sans text-foreground">
            {editing ? "Edit note" : "Quick Note"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized((v) => !v)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors duration-150"
            aria-label={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? (
              <CaretUp size={16} weight="bold" />
            ) : (
              <CaretDown size={16} weight="bold" />
            )}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setMinimized(false);
              if (editing) {
                setEditing(null);
                setTitle("");
                setContent("");
                setLinks([]);
                setLinkInput("");
                setEntityName("");
                setEntityType("");
                setImages([]);
                setInputError("");
              }
            }}
            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors duration-150"
            aria-label="Close notes popup"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="flex flex-col flex-1 p-3 gap-2 overflow-y-auto">
          {/* The page it is taken on, offered with a press. */}
          {!entityName && here && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => {
                  setEntityName(here.label);
                  setEntityType("Page");
                }}
                className="px-2 py-0.5 rounded-full border border-border/60 text-[10px] font-sans text-muted-foreground hover:text-foreground hover:border-secondary/40 transition-colors"
              >
                About this page · {here.label}
              </button>
            </div>
          )}
          {/* The places the reader already follows or pinned, so a note can
              be attached to one without typing it. Opened from a country
              page the entity is already set, but the popup is also opened
              from the corner of any page, where it is not. */}
          {!entityName && savedPlaces.length > 0 && (
            <div>
              <p className="text-[10px] font-sans text-muted-foreground mb-1">
                About one of yours?
              </p>
              <div className="flex flex-wrap gap-1">
                {savedPlaces.map((p) => (
                  <button
                    key={`${p.type}-${p.name}`}
                    onClick={() => {
                      setEntityName(p.name);
                      setEntityType(p.type);
                    }}
                    className="px-2 py-0.5 rounded-full border border-border/60 text-[10px] font-sans text-muted-foreground hover:text-foreground hover:border-secondary/40 transition-colors"
                  >
                    {p.followed ? "★ " : ""}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* What the note is about, its name and its words in one box, as asked - three lines of the one note, parted by
              hairlines; each is still kept apart in the note, so My Notes can sort and show them. */}
          <div className="modal-tile border border-border/60 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-secondary/50">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/60 min-h-[1.9rem]">
              {entityName ? (
                <>
                  <span className="text-[10px] font-sans text-secondary opacity-70">{entityType || "Entity"}:</span>
                  <span className="text-[10px] font-sans font-semibold text-secondary truncate">{entityName}</span>
                  <button
                    onClick={() => {
                      setEntityName("");
                      setEntityType("");
                    }}
                    className="ml-auto text-secondary opacity-60 hover:opacity-100"
                    aria-label="Clear the place this note is about"
                  >
                    <X size={9} weight="bold" />
                  </button>
                </>
              ) : (
                <>
                  {/* The site's own drop-down (its frosted list, as the calendar's), as asked, not the browser's. */}
                  <StyledSelect
                    value={aboutKind}
                    onValueChange={(v) => setAboutKind(v as NoteKind)}
                    options={NOTE_KINDS.map((k) => ({ value: k, label: k }))}
                    ariaLabel="What kind of thing the note is about"
                    triggerClassName="!text-[10px]"
                  />
                  <span className="text-[10px] text-muted-foreground/60" aria-hidden>
                    ·
                  </span>
                  <input
                    type="text"
                    value={aboutName}
                    onChange={(e) => setAboutName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), setAbout())}
                    onBlur={setAbout}
                    placeholder="what it is about…"
                    aria-label="What the note is about"
                    maxLength={120}
                    className="flex-1 min-w-0 bg-transparent border-none p-0 text-[10px] font-sans text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name my file…"
              aria-label="Name my file"
              maxLength={LIMITS.NOTE_TITLE}
              className="block w-full bg-transparent border-0 border-b border-border/60 px-2.5 py-1.5 text-xs font-semibold font-sans text-foreground placeholder:text-muted-foreground placeholder:font-normal focus:outline-none"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here…"
              aria-label="Write your note"
              rows={4}
              maxLength={LIMITS.NOTE_CONTENT}
              className="block w-full bg-transparent border-none px-2.5 py-1.5 text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
          </div>
          {content.length > LIMITS.NOTE_CONTENT * 0.9 && (
            <p className="text-[10px] text-muted-foreground text-right font-mono">
              {content.length}/{LIMITS.NOTE_CONTENT}
            </p>
          )}

          {/* Links, images and voice, as asked: one section - the link's box with its +, an image button and a microphone
              beside it; the links, the images and the recording under it; one line saying where each is kept. */}
          <div>
            <p className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Link size={11} weight="bold" /> Links, images and voice
              {images.length > 0 && <span className="font-mono font-normal normal-case">· {images.length}/{NOTE_IMAGES_MAX} images</span>}
            </p>
            <div className="flex gap-1.5 mb-1.5">
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLink()}
                placeholder="https://…"
                aria-label="A link to add"
                maxLength={LIMITS.NOTE_LINK_URL}
                className="flex-1 min-w-0 modal-tile border border-border/60 rounded px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary/50"
              />
              <button
                onClick={addLink}
                disabled={!linkInput.trim()}
                aria-label="Add the link"
                title="Add the link"
                className="px-2 py-1 bg-secondary/20 rounded text-secondary hover:bg-secondary/30 transition-colors disabled:opacity-40"
              >
                <Plus size={12} weight="bold" />
              </button>
              <input
                ref={imageInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  void addImages(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                disabled={images.length >= NOTE_IMAGES_MAX}
                aria-label="Add images"
                title={images.length >= NOTE_IMAGES_MAX ? `A note holds up to ${NOTE_IMAGES_MAX} images` : "Add images: JPEG, PNG, WebP or GIF, kept in this browser"}
                className="px-2 py-1 bg-secondary/20 rounded text-secondary hover:bg-secondary/30 transition-colors disabled:opacity-40"
              >
                <ImageSquare size={12} weight="bold" />
              </button>
              {/* Record, or stop: an account keeps a recording; signed out, a press asks to sign in. */}
              <button
                type="button"
                onClick={() => (isRecording ? stopRecording() : canRecord ? void startRecording() : isConfigured ? openAuth("signin") : undefined)}
                disabled={!!editing || !!audioUrl || (!canRecord && !isConfigured)}
                aria-label={isRecording ? "Stop recording" : "Record a voice note"}
                title={
                  editing
                    ? "A recording is added to a new note, not to one being edited"
                    : audioUrl
                      ? "One recording to a note: take it off to record again"
                      : canRecord
                        ? isRecording
                          ? "Stop recording"
                          : "Record a voice note"
                        : isConfigured
                          ? "Sign in to keep voice recordings with your notes"
                          : "Voice recordings need an account"
                }
                className={`px-2 py-1 rounded transition-colors disabled:opacity-40 ${isRecording ? "bg-destructive/20 text-destructive hover:bg-destructive/30" : "bg-secondary/20 text-secondary hover:bg-secondary/30"}`}
              >
                {isRecording ? <StopCircle size={12} weight="fill" /> : <Microphone size={12} weight="bold" />}
              </button>
            </div>
            {links.length > 0 && (
              <ul className="flex flex-col gap-0.5 mb-1.5">
                {links.map((url, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-1.5 bg-muted rounded px-2 py-1"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-secondary truncate hover:underline flex-1 min-w-0"
                    >
                      {url}
                    </a>
                    <button
                      onClick={() => removeLink(i)}
                      aria-label="Take the link off"
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash size={11} weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {isRecording && (
              <p className="text-xs font-mono text-destructive animate-pulse mb-1.5">{formatSecs(recordingSeconds)} recording… press the square to stop</p>
            )}
            {audioUrl && (
              <div className="flex items-center gap-1.5 bg-muted rounded px-2.5 py-1.5 mb-1.5">
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                <button onClick={togglePlay} className="text-secondary hover:text-secondary/80 transition-colors" aria-label={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
                </button>
                <span className="text-xs font-mono text-muted-foreground flex-1 flex items-center gap-1">
                  <Microphone size={11} weight="fill" aria-hidden /> Voice note
                </span>
                <button onClick={clearRecording} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Take the recording off">
                  <Trash size={11} weight="bold" />
                </button>
              </div>
            )}
            {previews.length > 0 && (
              <ul className="grid grid-cols-3 gap-1.5 mb-1.5">
                {previews.map((p) => (
                  <li key={p.id} className="relative group/img">
                    <img src={p.url} alt={p.name} className="w-full h-16 object-cover rounded border border-border/60" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((i) => i.id !== p.id))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Take ${p.name} off the note`}
                    >
                      <X size={9} weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] font-sans text-muted-foreground leading-snug">
              Images: JPEG, PNG, WebP or GIF, up to {NOTE_IMAGES_MAX}; kept in this browser only. Voice:{" "}
              {editing ? (
                editing.voicePath ? "its recording is kept as it is; an edit does not change it." : "added to a new note, not to one being edited."
              ) : canRecord ? (
                "one recording, up to 10 MB, kept with your account."
              ) : isConfigured ? (
                <>
                  <button onClick={() => openAuth("signin")} className="text-secondary font-semibold hover:underline">
                    sign in
                  </button>{" "}
                  to keep recordings with your notes.
                </>
              ) : (
                "recordings need an account, which this site does not offer yet."
              )}
            </p>
          </div>

          {/* Validation error */}
          {inputError && (
            <p className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1">
              {inputError}
            </p>
          )}

          {/* Save */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {savedMsg ? (
              <span className="text-xs text-success font-sans">
                {editing ? "Changes saved!" : "Note saved!"}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-sans">
                {(editing ? editing.source === "account" : mode === "account") ? "Saves to your account" : "Saves in this browser"}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded text-xs font-sans font-normal hover:bg-secondary/80 disabled:opacity-50 transition-colors duration-150"
            >
              {saving ? (
                <Spinner size={13} className="animate-spin" />
              ) : (
                <FloppyDisk size={13} weight="fill" />
              )}
              {editing ? "Save changes" : "Save Note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
