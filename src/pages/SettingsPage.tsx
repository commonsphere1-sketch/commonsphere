import React, { useState, useRef, useEffect } from "react";
import {
  GearSix,
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
import { useProfilePhoto } from "@/contexts/ProfilePhotoContext";
import { useProfile } from "@/contexts/ProfileContext";

// ─── Topic config ────────────────────────────────────────────────────────────
const ALERT_TOPICS = [
  { id: "policy", label: "Policy Changes" },
  { id: "leadership", label: "Leadership / Elections" },
  { id: "economy", label: "Economic Updates" },
  { id: "conflicts", label: "Conflicts & Security" },
  { id: "legislation", label: "New Legislation" },
];

interface WatchedEntity {
  id: string;
  name: string;
  type: "Country" | "State";
  topics: string[];
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
        topics: ["policy", "leadership"],
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
        topics: ["policy", "leadership"],
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
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
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
function WatchedRow({
  entity,
  onToggleTopic,
  onRemove,
}: {
  entity: WatchedEntity;
  onToggleTopic: (entityId: string, topicId: string) => void;
  onRemove: (entityId: string) => void;
}) {
  return (
    <div className="bg-muted/50 border border-border/60 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {entity.type === "Country" ? (
            <Globe
              size={14}
              weight="fill"
              className="text-secondary shrink-0"
            />
          ) : (
            <MapPin
              size={14}
              weight="fill"
              className="text-secondary shrink-0"
            />
          )}
          <span className="text-[13px] font-semibold text-foreground truncate">
            {entity.name}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-card border border-border shrink-0">
            {entity.type}
          </span>
        </div>
        <button
          onClick={() => onRemove(entity.id)}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded shrink-0"
          aria-label={`Remove ${entity.name}`}
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALERT_TOPICS.map((t) => {
          const active = entity.topics.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => onToggleTopic(entity.id, t.id)}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                active
                  ? "bg-secondary/20 text-secondary border-secondary/40"
                  : "bg-transparent text-muted-foreground border-border hover:border-secondary/40 hover:text-secondary"
              }`}
            >
              {active && <Check size={9} weight="bold" />}
              {t.label}
            </button>
          );
        })}
      </div>
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
  } = useProfilePhoto();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const {
    displayName: savedName,
    email: savedEmail,
    save: saveProfile,
  } = useProfile();
  const [displayName, setDisplayName] = useState("Jane Doe");
  const [email, setEmail] = useState("jane.doe@commonsphere.io");

  // The context reads localStorage in an effect, so the saved values arrive on
  // the render after mount. Adopt them once they land, rather than seeding
  // useState, which would keep showing the placeholder.
  useEffect(() => {
    if (savedName) setDisplayName(savedName);
  }, [savedName]);
  useEffect(() => {
    if (savedEmail) setEmail(savedEmail);
  }, [savedEmail]);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [watched, setWatched] = useState<WatchedEntity[]>([
    {
      id: "country-us",
      name: "United States",
      type: "Country",
      topics: ["policy", "leadership", "economy"],
    },
    {
      id: "state-ca",
      name: "California",
      type: "State",
      topics: ["policy", "legislation"],
    },
  ]);

  const existingIds = React.useMemo(
    () => new Set(watched.map((w) => w.id)),
    [watched],
  );

  function handleProfileSave() {
    const cleanName = sanitizeText(displayName);
    const cleanEmail = sanitizeText(email).toLowerCase();
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
    if (!saveProfile(cleanName, cleanEmail)) {
      setProfileError("Could not save — this browser's storage is full.");
      return;
    }
    // Show what was actually stored. Sanitizing can strip characters, and
    // leaving the raw text in the field would misreport what was saved.
    setDisplayName(cleanName);
    setEmail(cleanEmail);
    setProfileError("");
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  function handlePasswordUpdate() {
    if (!currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("New password must differ from current password.");
      return;
    }
    setPasswordError("");
    setPasswordSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setTimeout(() => setPasswordSaved(false), 2000);
  }

  function addEntity(e: WatchedEntity) {
    setWatched((prev) => [...prev, e]);
  }

  function removeEntity(id: string) {
    setWatched((prev) => prev.filter((w) => w.id !== id));
  }

  function toggleTopic(entityId: string, topicId: string) {
    setWatched((prev) =>
      prev.map((w) => {
        if (w.id !== entityId) return w;
        const topics = w.topics.includes(topicId)
          ? w.topics.filter((t) => t !== topicId)
          : [...w.topics, topicId];
        return { ...w, topics };
      }),
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <GearSix size={28} weight="fill" className="text-secondary" />
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
                  {photo && <AvatarImage src={photo} alt="Your profile photo" />}
                  <AvatarFallback className="text-sm font-bold bg-muted text-muted-foreground">
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
                  <p className="text-[11px] text-muted-foreground font-sans leading-snug">
                    Stored on this device only — it is resized to 256px and
                    never uploaded, so it will not follow you to another
                    browser.
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
            {profileSaved && (
              <p className="text-xs text-success">Changes saved.</p>
            )}
            <Button
              onClick={handleProfileSave}
              className="bg-secondary text-secondary-foreground hover:bg-tertiary text-sm font-normal h-9 px-4"
            >
              Save Changes
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
              Alert Subscriptions
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-sans mb-4">
            Get email &amp; in-app notifications when updates occur for tracked
            countries and states.
          </p>

          {/* Master email toggle */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/60">
            <div>
              <p className="text-sm font-sans text-foreground">Email Digest</p>
              <p className="text-xs text-muted-foreground font-sans">
                Receive a daily summary for your watched locations
              </p>
            </div>
            <button
              role="switch"
              aria-checked={emailAlerts}
              onClick={() => setEmailAlerts((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${emailAlerts ? "bg-secondary" : "bg-muted"}`}
              aria-label="Toggle email alerts"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform duration-200 ${emailAlerts ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {/* Watched entities */}
          <div className="space-y-2 mb-3">
            {watched.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No locations tracked yet. Search below to add one.
              </p>
            )}
            {watched.map((w) => (
              <WatchedRow
                key={w.id}
                entity={w}
                onToggleTopic={toggleTopic}
                onRemove={removeEntity}
              />
            ))}
          </div>

          {/* Search to add */}
          <EntitySearch onAdd={addEntity} existingIds={existingIds} />
          <p className="text-[11px] text-muted-foreground mt-2">
            Toggle individual topics on each location to control what alerts you
            receive.
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
              onClick={() => setDarkMode((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-border hover:text-foreground transition-colors duration-150 cursor-pointer text-sm font-normal font-sans"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? (
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
          <div className="space-y-4">
            <div>
              <label
                htmlFor="current-password"
                className="block text-xs text-muted-foreground font-sans mb-1"
              >
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordError("");
                }}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs text-muted-foreground font-sans mb-1"
              >
                New Password{" "}
                <span className="text-muted-foreground font-normal">
                  (min. 8 characters)
                </span>
              </label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError("");
                }}
                minLength={8}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              />
            </div>
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
            {passwordSaved && (
              <p className="text-xs text-success">Password updated.</p>
            )}
            <Button
              onClick={handlePasswordUpdate}
              className="bg-primary text-primary-foreground hover:bg-muted text-sm font-normal h-9 px-4 border border-border"
            >
              Update Password
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
