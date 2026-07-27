import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@animaapp/playground-react-sdk";
import {
  sanitizeText,
  sanitizeUrl,
  validateNotePayload,
  LIMITS,
} from "../lib/security";
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
} from "@phosphor-icons/react";

export function NotesPopup() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { create, isPending: isMutating } = useMutation("Note");

  const [inputError, setInputError] = useState("");

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

  const removeLink = (idx: number) => setLinks((prev) => prev.filter((_, i) => i !== idx));

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
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
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const formatSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleSave = async () => {
    const cleanTitle   = sanitizeText(title);
    const cleanContent = sanitizeText(content);

    const validation = validateNotePayload({
      title:   cleanTitle,
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
      await create({
        title:   cleanTitle || undefined,
        content: cleanContent,
        links:   links.length > 0 ? JSON.stringify(links) : undefined,
        voiceRecordingUrl: audioUrl ?? undefined,
      });
      setTitle("");
      setContent("");
      setLinks([]);
      setLinkInput("");
      clearRecording();
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-9 h-9 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform duration-150"
        aria-label="Open notes"
      >
        <NotePencil size={16} weight="fill" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-xl shadow-2xl flex flex-col overflow-hidden bg-card border border-border"
      style={{ width: "17rem", maxHeight: minimized ? "48px" : "560px", transition: "max-height 0.2s ease" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/10 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <NotePencil size={18} weight="fill" className="text-secondary" />
          <span className="text-sm font-semibold font-sans text-foreground">Quick Note</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized((v) => !v)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors duration-150" aria-label={minimized ? "Expand" : "Minimize"}>
            {minimized ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
          </button>
          <button onClick={() => { setOpen(false); setMinimized(false); }} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors duration-150" aria-label="Close notes popup">
            <X size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="flex flex-col flex-1 p-3 gap-2 overflow-y-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)…"
            maxLength={LIMITS.NOTE_TITLE}
            className="bg-muted border border-border rounded px-2.5 py-1.5 text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here…"
            rows={3}
            maxLength={LIMITS.NOTE_CONTENT}
            className="bg-muted border border-border rounded px-2.5 py-1.5 text-xs font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary resize-none"
          />
          {content.length > LIMITS.NOTE_CONTENT * 0.9 && (
            <p className="text-[10px] text-muted-foreground text-right font-mono">
              {content.length}/{LIMITS.NOTE_CONTENT}
            </p>
          )}

          {/* Links section */}
          <div>
            <p className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Link size={11} weight="bold" /> Links
            </p>
            <div className="flex gap-1.5 mb-1.5">
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLink()}
                placeholder="https://…"
                maxLength={LIMITS.NOTE_LINK_URL}
                className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <button
                onClick={addLink}
                disabled={!linkInput.trim()}
                className="px-2 py-1 bg-secondary/20 rounded text-secondary hover:bg-secondary/30 transition-colors disabled:opacity-40"
              >
                <Plus size={12} weight="bold" />
              </button>
            </div>
            {links.length > 0 && (
              <ul className="flex flex-col gap-0.5">
                {links.map((url, i) => (
                  <li key={i} className="flex items-center justify-between gap-1.5 bg-muted rounded px-2 py-1">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-secondary truncate hover:underline flex-1 min-w-0">{url}</a>
                    <button onClick={() => removeLink(i)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"><Trash size={11} weight="bold" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Voice recording section */}
          <div>
            <p className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Microphone size={11} weight="bold" /> Voice Recording
            </p>
            {!audioUrl ? (
              <div className="flex items-center gap-1.5">
                {isRecording ? (
                  <>
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-1 px-2.5 py-1 bg-destructive/20 text-destructive rounded text-xs font-sans hover:bg-destructive/30 transition-colors"
                    >
                      <StopCircle size={12} weight="fill" />
                      Stop
                    </button>
                    <span className="text-xs font-mono text-destructive animate-pulse">{formatSecs(recordingSeconds)} recording…</span>
                  </>
                ) : (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-1 px-2.5 py-1 bg-secondary/20 text-secondary rounded text-xs font-sans hover:bg-secondary/30 transition-colors"
                  >
                    <Microphone size={12} weight="fill" />
                    Record
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-muted rounded px-2.5 py-1.5">
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                <button onClick={togglePlay} className="text-secondary hover:text-secondary/80 transition-colors">
                  {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
                </button>
                <span className="text-xs font-mono text-muted-foreground flex-1">voice-note.webm</span>
                <button onClick={clearRecording} className="text-muted-foreground hover:text-destructive transition-colors"><Trash size={11} weight="bold" /></button>
              </div>
            )}
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
              <span className="text-xs text-success font-sans">Note saved!</span>
            ) : (
              <span className="text-xs text-muted-foreground font-sans">Saves to My Notes</span>
            )}
            <button
              onClick={handleSave}
              disabled={!content.trim() || saving || isMutating}
              className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded text-xs font-sans font-normal hover:bg-secondary/80 disabled:opacity-50 transition-colors duration-150"
            >
              {saving || isMutating ? <Spinner size={13} className="animate-spin" /> : <FloppyDisk size={13} weight="fill" />}
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
