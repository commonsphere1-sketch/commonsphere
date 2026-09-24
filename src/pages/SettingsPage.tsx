import React, { useState, useRef, useEffect } from "react";
import {
  User,
  Bell,
  Lock,
  Palette,
  Moon,
  Sun,
  Globe,
  MapPin,
  MagnifyingGlass,
  X,
  Check,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { countriesData } from "@/data/countriesData";
import { usStatesData } from "@/data/statesData";
import { sanitizeText, validateEmail, LIMITS } from "@/lib/security";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useProfilePhoto,
  avatarTextColor,
  GLASS_AVATAR,
  AVATAR_COLORS,
} from "@/contexts/ProfilePhotoContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { passwordProblem } from "@/components/AuthModal";
import { exportAccountData } from "@/lib/supabaseData";
import { useWatchlist, type WatchItem } from "@/contexts/WatchlistContext";
import { TOPICS } from "@/lib/watchlist";

/** A search result: "country-ke" / "state-ca" plus what to show. */
interface WatchedEntity {
  id: string;
  name: string;
  type: "Country" | "State";
}

// ─── Searchable add-row ───────────────────────────────────────────────────────
function EntitySearch({
  onAdd,
  existingIds,
}: {
  onAdd: (e: WatchedEntity) => void;
  existingIds: Set<string>;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const lower = q.trim().toLowerCase();
    if (lower.length < 2) return [];
    const countries = countriesData
      .filter(
        (c) =>
          !existingIds.has(`country-${c.id}`) &&
          c.name.toLowerCase().includes(lower),
      )
      .slice(0, 5)
      .map((c) => ({
        id: `country-${c.id}`,
        name: c.name,
        type: "Country" as const,
      }));
    const states = usStatesData
      .filter(
        (s) =>
          !existingIds.has(`state-${s.id}`) &&
          s.name.toLowerCase().includes(lower),
      )
      .slice(0, 5)
      .map((s) => ({
        id: `state-${s.id}`,
        name: s.name,
        type: "State" as const,
      }));
    return [...countries, ...states];
  }, [q, existingIds]);

  useEffect(() => {
    setOpen(results.length > 0);
  }, [results]);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MagnifyingGlass
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search countries or states…"
          className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-muted border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={12} weight="bold" />
          </button>
        )}
      </div>
      {open && (
        <div className="search-dropdown-glass absolute top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onAdd(r);
                setQ("");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors"
            >
              {r.type === "Country" ? (
                <Globe
                  size={13}
                  weight="fill"
                  className="text-secondary shrink-0"
                />
              ) : (
                <MapPin
                  size={13}
                  weight="fill"
                  className="text-secondary shrink-0"
                />
              )}
              <span className="text-[12px] font-medium text-foreground flex-1 truncate">
                {r.name}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border shrink-0">
                {r.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single watched entity row ────────────────────────────────────────────────
function WatchedRow({ item }: { item: WatchItem }) {
  const { toggleTopic, remove, markSeen } = useWatchlist();
  const topics = TOPICS.filter((t) => t.for.includes(item.type));
  return (
    <div className="bg-muted/50 border border-border/60 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.type === "country" ? (
            <Globe size={14} weight="fill" className="text-secondary shrink-0" />
          ) : (
            <MapPin size={14} weight="fill" className="text-secondary shrink-0" />
          )}
          <span className="text-[13px] font-semibold text-foreground truncate">{item.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-card border border-border shrink-0">
            {item.type === "country" ? "Country" : "State"}
          </span>
          {item.changes.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground shrink-0">
              {item.changes.length} new
            </span>
          )}
        </div>
        <button
          onClick={() => void remove(item)}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded shrink-0"
          aria-label={`Stop watching ${item.name}`}
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => {
          const active = item.topics.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => void toggleTopic(item, t.id)}
              aria-pressed={active}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                active
                  ? "chip-selected"
                  : "bg-transparent text-muted-foreground border-border hover:border-secondary/40 hover:text-secondary"
              }`}
            >
              {active && <Check size={9} weight="bold" />}
              {t.label}
            </button>
          );
        })}
      </div>
      {item.changes.length > 0 && (
        <div className="rounded-lg border border-secondary/30 bg-card px-3 py-2 space-y-1">
          {item.changes.map((c) => (
            <p key={c.key} className="text-[11px] font-sans text-foreground leading-snug">
              <span className="text-muted-foreground">{c.label}:</span> {c.from}{" "}
              <span className="text-muted-foreground">→</span> <span className="font-semibold">{c.to}</span>
            </p>
          ))}
          <button
            onClick={() => void markSeen(item)}
            className="text-[11px] font-semibold text-secondary hover:underline pt-0.5"
          >
            Mark as seen
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const {
    photo,
    setPhotoFromFile,
    removePhoto,
    isSaving: isSavingPhoto,
    avatarColor,
    setAvatarColor,
    stored: photoStored,
  } = useProfilePhoto();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState("");
  // Read the real theme rather than a local copy. This button used to drive
  // its own useState seeded to true, so it flipped its own icon while the page
  // stayed put — and it claimed "Dark" even when the app was in light mode.
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const {
    displayName: savedName,
    email: savedEmail,
    username: savedUsername,
    source: profileSource,
    save: saveProfile,
  } = useProfile();
  const { user, isConfigured } = useAuth();
  const [displayName, setDisplayName] = useState("Jane Doe");
  const [email, setEmail] = useState("jane.doe@commonsphere.io");
  const [username, setUsername] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");

  // The context reads localStorage in an effect, so the saved values arrive on
  // the render after mount. Adopt them once they land, rather than seeding
  // useState, which would keep showing the placeholder.
  useEffect(() => {
    if (savedName) setDisplayName(savedName);
  }, [savedName]);
  useEffect(() => {
    if (savedEmail) setEmail(savedEmail);
  }, [savedEmail]);
  useEffect(() => {
    setUsername(savedUsername);
  }, [savedUsername]);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const watch = useWatchlist();
  /* Arriving from the header bell (#alert-subscriptions) or the reset page
     (#security-settings): go to that section. After a tick, because the
     layout scrolls every newly opened page to the top first. */
  const { hash } = useLocation();
  useEffect(() => {
    if (!/^#[a-z-]+$/.test(hash)) return;
    const t = setTimeout(
      () => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }),
      60,
    );
    return () => clearTimeout(t);
  }, [hash]);
  const { isConfigured: accountsOn, openAuth } = useAuth();
  const existingIds = React.useMemo(
    () => new Set(watch.items.map((w) => `${w.type}-${w.id}`)),
    [watch.items],
  );

  async function handleProfileSave() {
    const cleanName = sanitizeText(displayName);
    const cleanEmail = sanitizeText(email).toLowerCase();
    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanName.trim()) {
      setProfileError("Display name cannot be empty.");
      return;
    }
    if (cleanName.length > LIMITS.NAME) {
      setProfileError(`Name must be under ${LIMITS.NAME} characters.`);
      return;
    }
    const ev = validateEmail(cleanEmail);
    if (!ev.ok) {
      setProfileError(ev.message);
      return;
    }
    if (cleanUsername && !/^[a-zA-Z0-9_.]{3,30}$/.test(cleanUsername)) {
      setProfileError("Usernames are 3–30 letters, numbers, underscores or dots.");
      return;
    }
    setProfileSaving(true);
    const result = await saveProfile(cleanName, cleanEmail, cleanUsername);
    setProfileSaving(false);
    if (!result.ok) {
      setProfileError(result.message ?? "Could not save your changes.");
      return;
    }
    // Show what was actually stored. Sanitizing can strip characters, and
    // leaving the raw text in the field would misreport what was saved.
    setDisplayName(cleanName);
    setUsername(cleanUsername);
    // An email change on an account waits for confirmation, so the field
    // goes back to the address still in effect.
    setEmail(profileSource === "account" ? savedEmail : cleanEmail);
    setProfileError("");
    setProfileNotice(result.message ?? "");
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  function addEntity(e: WatchedEntity) {
    const [type, ...rest] = e.id.split("-");
    void watch.add(type === "state" ? "state" : "country", rest.join("-"));
  }

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Profile */}
        <section
          aria-labelledby="profile-settings"
          className="bg-card border border-border rounded-lg p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <User size={20} weight="fill" className="text-secondary" />
            <h2
              id="profile-settings"
              className="text-base font-semibold font-sans text-foreground"
            >
              Profile
            </h2>
          </div>
          <div className="space-y-4">
            {/* Profile photo */}
            <div>
              <span className="block text-xs text-muted-foreground font-sans mb-2">
                Profile Photo
              </span>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  {photo && (
                    <AvatarImage src={photo} alt="Your profile photo" />
                  )}
                  <AvatarFallback
                    className={`text-sm font-bold avatar-surface${
                      avatarColor === GLASS_AVATAR ? " avatar-glass" : ""
                    }`}
                    style={
                      avatarColor === GLASS_AVATAR
                        ? undefined
                        : {
                            background: avatarColor,
                            color: avatarTextColor(avatarColor),
                          }
                    }
                  >
                    {displayName
                      ? displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        // reset so re-picking the same file still fires onChange
                        e.target.value = "";
                        if (!file) return;
                        setPhotoError("");
                        const err = await setPhotoFromFile(file);
                        if (err) setPhotoError(err);
                      }}
                    />
                    <Button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isSavingPhoto}
                      className="bg-muted text-foreground hover:bg-secondary/20 text-xs font-sans h-8"
                    >
                      {isSavingPhoto
                        ? "Saving…"
                        : photo
                          ? "Change photo"
                          : "Upload photo"}
                    </Button>
                    {photo && (
                      <Button
                        onClick={() => {
                          removePhoto();
                          setPhotoError("");
                        }}
                        className="bg-transparent border border-border text-muted-foreground hover:text-foreground text-xs font-sans h-8"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {!photo && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-muted-foreground font-sans">
                        Colour
                      </span>
                      {/* Glass sits with the swatches because it answers the
                          same question: what fills the avatar when there is
                          no photo. */}
                      <button
                        onClick={() => setAvatarColor(GLASS_AVATAR)}
                        aria-label="Use a glass avatar"
                        aria-pressed={avatarColor === GLASS_AVATAR}
                        title="Glass"
                        className={`avatar-surface avatar-glass w-5 h-5 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                          avatarColor === GLASS_AVATAR
                            ? "ring-2 ring-offset-2 ring-offset-card ring-foreground"
                            : ""
                        }`}
                      />
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setAvatarColor(c)}
                          aria-label={`Use ${c} as the avatar colour`}
                          aria-pressed={
                            avatarColor.toLowerCase() === c.toLowerCase()
                          }
                          className={`avatar-surface w-5 h-5 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                            avatarColor.toLowerCase() === c.toLowerCase()
                              ? "ring-2 ring-offset-2 ring-offset-card ring-foreground"
                              : ""
                          }`}
                          style={{ background: c }}
                        />
                      ))}
                      {/* Free choice beyond the swatches. The initials colour
                          follows whatever is picked, so any value stays
                          readable. */}
                      <label
                        className="text-[11px] text-muted-foreground font-sans underline cursor-pointer"
                        title="Pick any colour"
                      >
                        custom
                        <input
                          type="color"
                          value={avatarColor}
                          onChange={(e) => setAvatarColor(e.target.value)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground font-sans leading-snug">
                    {photoStored === "account"
                      ? "Resized to 256px and saved to your account, so it follows you to any device. The photo is public to anyone with its link, like a profile picture on most sites."
                      : "Stored on this device only — the photo is resized to 256px and never uploaded, so neither it nor the colour will follow you to another browser."}
                  </p>
                  {photoError && (
                    <p className="text-xs text-destructive">{photoError}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="display-name"
                className="block text-xs text-muted-foreground font-sans mb-1"
              >
                Display Name
              </label>
              <Input
                id="display-name"
                value={displayName}
                maxLength={LIMITS.NAME}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setProfileError("");
                }}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-xs text-muted-foreground font-sans mb-1"
              >
                Username
              </label>
              <Input
                id="username"
                value={username}
                maxLength={31}
                placeholder="letters, numbers, _ or ."
                autoComplete="username"
                onChange={(e) => {
                  setUsername(e.target.value);
                  setProfileError("");
                }}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-xs text-muted-foreground font-sans mb-1"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                maxLength={LIMITS.EMAIL}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setProfileError("");
                }}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              />
            </div>
            {profileError && (
              <p className="text-xs text-destructive">{profileError}</p>
            )}
            {user?.pendingEmail && (
              <p className="text-xs text-muted-foreground">
                Waiting for you to confirm {user.pendingEmail} from the links we emailed.
              </p>
            )}
            {profileSaved && (
              <p className="text-xs text-success">{profileNotice || "Changes saved."}</p>
            )}
            <p className="text-[11px] text-muted-foreground font-sans leading-snug">
              {profileSource === "account"
                ? "Saved to your account. Changing your email sends a confirmation link to both the old and the new address."
                : isConfigured
                  ? "Saved in this browser only. Sign in to keep your profile on every device."
                  : "Saved in this browser only."}
            </p>
            <Button
              onClick={handleProfileSave}
              disabled={profileSaving}
              className="bg-secondary text-secondary-foreground hover:bg-tertiary text-sm font-normal h-9 px-4"
            >
              {profileSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </section>

        {/* Alert Subscriptions */}
        <section
          aria-labelledby="alert-subscriptions"
          className="bg-card border border-border rounded-lg p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Bell size={20} weight="fill" className="text-secondary" />
            <h2
              id="alert-subscriptions"
              className="text-base font-semibold font-sans text-foreground"
            >
              Watch list &amp; alerts
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-sans mb-4 leading-relaxed">
            Watch countries and states. When a data update changes a figure you
            follow — a new head of state, a revised inflation rate, a new
            minimum wage — it is listed here and counted on the bell at the top
            of every page, until you mark it seen.
          </p>

          {/* Email digest: an honest opt-in. Nothing sends email yet. */}
          <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-border/60">
            <div>
              <p className="text-sm font-sans text-foreground">Email digest</p>
              <p className="text-xs text-muted-foreground font-sans leading-snug">
                {watch.mode === "account"
                  ? "Not sent yet. Turn this on to be emailed these changes once digests start; nothing is sent until then."
                  : accountsOn
                    ? "Needs an account, so there is an address to send to."
                    : "Needs an account, which this site does not offer yet."}
              </p>
            </div>
            {watch.mode === "account" ? (
              <button
                role="switch"
                aria-checked={watch.emailDigest}
                onClick={() => void watch.setEmailDigest(!watch.emailDigest)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${watch.emailDigest ? "bg-secondary" : "bg-muted"}`}
                aria-label="Email me a digest once digests start"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform duration-200 ${watch.emailDigest ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            ) : accountsOn ? (
              <button
                onClick={() => openAuth("signin")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 shrink-0"
              >
                Sign in
              </button>
            ) : null}
          </div>

          {watch.deviceCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 rounded-lg border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">
                {watch.deviceCount} place{watch.deviceCount === 1 ? " was" : "s were"} watched in this browser before you signed in.
              </p>
              <button
                onClick={() => void watch.importDevice()}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Add to my account
              </button>
            </div>
          )}

          {watch.changeCount > 0 && (
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-foreground">
                {watch.changeCount} change{watch.changeCount === 1 ? "" : "s"} since you last looked
              </p>
              <button
                onClick={() => void watch.markAllSeen()}
                className="text-xs font-semibold text-secondary hover:underline"
              >
                Mark all as seen
              </button>
            </div>
          )}

          {watch.error && <p className="text-xs text-destructive mb-3">{watch.error}</p>}

          {/* Watched places */}
          <div className="space-y-2 mb-3">
            {!watch.isPending && watch.items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nothing watched yet. Search below to add a country or state.
              </p>
            )}
            {watch.items.map((w) => (
              <WatchedRow key={w.key} item={w} />
            ))}
          </div>

          {/* Search to add */}
          <EntitySearch onAdd={addEntity} existingIds={existingIds} />
          <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
            {watch.mode === "account"
              ? "Saved to your account. "
              : "Saved in this browser. "}
            Choose topics per place: figures change only when the site's data is
            updated, and each figure's source and year are on the place's card.
          </p>
        </section>

        {/* Appearance */}
        <section
          aria-labelledby="appearance-settings"
          className="bg-card border border-border rounded-lg p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Palette size={20} weight="fill" className="text-secondary" />
            <h2
              id="appearance-settings"
              className="text-base font-semibold font-sans text-foreground"
            >
              Appearance
            </h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-sans text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground font-sans">
                Toggle between light and dark themes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-border hover:text-foreground transition-colors duration-150 cursor-pointer text-sm font-normal font-sans"
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? (
                <>
                  <Moon size={18} weight="fill" className="text-secondary" />
                  <span className="text-foreground">Dark</span>
                </>
              ) : (
                <>
                  <Sun size={18} weight="fill" className="text-warning" />
                  <span className="text-foreground">Light</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Security */}
        <section
          aria-labelledby="security-settings"
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock size={20} weight="fill" className="text-secondary" />
            <h2
              id="security-settings"
              className="text-base font-semibold font-sans text-foreground"
            >
              Security
            </h2>
          </div>
          <SecurityPanel />
        </section>
      </div>
    </div>
  );
}

/**
 * Password, sessions and account deletion, for a signed-in account.
 *
 * Every action here does what it says against Supabase Auth and reports what
 * came back. Supabase checks that a password change comes from a recent
 * sign-in; when it does not, it emails a code, and the change goes through
 * once that code is entered.
 */
function SecurityPanel() {
  const {
    user,
    isConfigured,
    openAuth,
    updatePassword,
    requestReauthentication,
    signOutEverywhere,
    deleteAccount,
  } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [nonce, setNonce] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sessMsg, setSessMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delMsg, setDelMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  if (!isConfigured) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-sans text-foreground">No account on this device</p>
        <p className="text-xs text-muted-foreground font-sans leading-snug">
          This site is not set up for accounts yet, so there is no password to
          manage. Everything you save stays in this browser.
        </p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-sans leading-snug">
          Sign in to change your password, sign out other devices, or delete your account.
        </p>
        <Button
          onClick={() => openAuth("signin")}
          className="bg-secondary text-secondary-foreground hover:bg-tertiary text-sm font-normal h-9 px-4"
        >
          Sign in
        </Button>
      </div>
    );
  }

  const field = "bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 text-sm";

  async function changePassword() {
    const problem = passwordProblem(pw);
    if (problem) return setPwMsg({ ok: false, text: problem });
    if (pw !== pw2) return setPwMsg({ ok: false, text: "The two passwords do not match." });
    if (needsCode && !/^\d{6}$/.test(nonce.trim()))
      return setPwMsg({ ok: false, text: "Enter the 6-digit code from the email." });
    setPwBusy(true);
    setPwMsg(null);
    const r = await updatePassword(pw, needsCode ? nonce.trim() : undefined);
    if (!r.ok && r.code === "reauthentication_needed") {
      const sent = await requestReauthentication();
      setNeedsCode(sent.ok);
      setPwMsg({
        ok: sent.ok,
        text: sent.ok
          ? `To confirm it is you, enter the code we just sent to ${user!.email}.`
          : sent.message,
      });
    } else if (r.ok) {
      setPw("");
      setPw2("");
      setNonce("");
      setNeedsCode(false);
      setPwMsg({ ok: true, text: r.message ?? "Your password has been changed." });
    } else {
      setPwMsg({ ok: false, text: r.message });
    }
    setPwBusy(false);
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground font-sans">
        Signed in as <span className="font-semibold text-foreground">{user.email}</span>
      </p>

      {/* Password */}
      <div className="space-y-2">
        <p className="text-sm font-sans text-foreground">Change password</p>
        <Input
          type="password"
          value={pw}
          maxLength={72}
          placeholder="New password"
          autoComplete="new-password"
          aria-label="New password"
          onChange={(e) => setPw(e.target.value)}
          className={field}
        />
        <Input
          type="password"
          value={pw2}
          maxLength={72}
          placeholder="Type it again"
          autoComplete="new-password"
          aria-label="Type the new password again"
          onChange={(e) => setPw2(e.target.value)}
          className={field}
        />
        {needsCode && (
          <Input
            value={nonce}
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code from the email"
            autoComplete="one-time-code"
            aria-label="Confirmation code"
            onChange={(e) => setNonce(e.target.value)}
            className={field}
          />
        )}
        <p className="text-[11px] text-muted-foreground font-sans">
          At least 10 characters, with letters and numbers.
        </p>
        {pwMsg && (
          <p className={`text-xs ${pwMsg.ok ? "text-success" : "text-destructive"}`}>{pwMsg.text}</p>
        )}
        <Button
          onClick={changePassword}
          disabled={pwBusy || !pw}
          className="bg-secondary text-secondary-foreground hover:bg-tertiary text-sm font-normal h-9 px-4"
        >
          {pwBusy ? "Saving…" : needsCode ? "Confirm and change" : "Change password"}
        </Button>
      </div>

      {/* Sessions */}
      <div className="space-y-2 pt-4 border-t border-border/60">
        <p className="text-sm font-sans text-foreground">Sign out everywhere</p>
        <p className="text-xs text-muted-foreground font-sans leading-snug">
          Ends every session on every device, including this one — use it if you
          signed in on a computer that is not yours.
        </p>
        {sessMsg && (
          <p className={`text-xs ${sessMsg.ok ? "text-success" : "text-destructive"}`}>{sessMsg.text}</p>
        )}
        <Button
          onClick={async () => {
            const r = await signOutEverywhere();
            if (r.ok) navigate("/dashboard");
            else setSessMsg({ ok: false, text: r.message });
          }}
          className="bg-transparent border border-border text-foreground hover:bg-muted text-sm font-normal h-9 px-4"
        >
          Sign out of all devices
        </Button>
      </div>

      {/* Export */}
      <div className="space-y-2 pt-4 border-t border-border/60">
        <p className="text-sm font-sans text-foreground">Download your data</p>
        <p className="text-xs text-muted-foreground font-sans leading-snug">
          A file with your profile, notes, links, pins and watch list, as JSON.
        </p>
        {exportMsg && <p className="text-xs text-destructive">{exportMsg}</p>}
        <Button
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            setExportMsg("");
            try {
              const json = await exportAccountData(user.id, user.email);
              const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = `commonsphere-data-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch (e) {
              setExportMsg(e instanceof Error ? e.message : "Your data could not be exported.");
            } finally {
              setExporting(false);
            }
          }}
          className="bg-transparent border border-border text-foreground hover:bg-muted text-sm font-normal h-9 px-4"
        >
          {exporting ? "Preparing…" : "Download my data"}
        </Button>
      </div>

      {/* Delete */}
      <div className="space-y-2 pt-4 border-t border-border/60">
        <p className="text-sm font-sans text-destructive font-semibold">Delete account</p>
        <p className="text-xs text-muted-foreground font-sans leading-snug">
          Permanently deletes your account, profile, photo, notes, links, voice
          recordings, pins and watch list. This cannot be undone. Type DELETE to confirm.
        </p>
        <Input
          value={confirmDelete}
          onChange={(e) => setConfirmDelete(e.target.value)}
          placeholder="DELETE"
          aria-label="Type DELETE to confirm"
          className={field}
        />
        {delMsg && <p className="text-xs text-destructive">{delMsg}</p>}
        <Button
          disabled={confirmDelete !== "DELETE" || delBusy}
          onClick={async () => {
            setDelBusy(true);
            setDelMsg("");
            const r = await deleteAccount();
            setDelBusy(false);
            if (r.ok) navigate("/dashboard");
            else setDelMsg(r.message);
          }}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/85 text-sm font-normal h-9 px-4 disabled:opacity-50"
        >
          {delBusy ? "Deleting…" : "Delete my account"}
        </Button>
      </div>
    </div>
  );
}
