import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeSlash, Spinner, ArrowsIn, ArrowsOut, X } from "@phosphor-icons/react";
import { useAuth, type AuthResult } from "../contexts/AuthContext";
import { oauthProviders, type OAuthProvider } from "../lib/supabase";
import {
  checkRateLimit,
  getRateLimitCooldown,
  resetRateLimit,
  sanitizeText,
  validateEmail,
  LIMITS,
} from "../lib/security";

export type AuthMode = "signin" | "signup" | "reset" | "link";
export type AuthPrefill = { email?: string; displayName?: string; username?: string };

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
  azure: "Microsoft",
  apple: "Apple",
};

/** Matches the project's Auth settings: 10+ characters, letters and digits. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 72) return "Use 72 characters or fewer.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Use both letters and numbers.";
  return null;
}

const USERNAME = /^[a-zA-Z0-9_.]{3,30}$/;

const inputClass =
  "w-full modal-tile border border-border/60 rounded-lg px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50";

/**
 * Sign in, create an account, reset a password or get a sign-in link.
 *
 * Rendered by AuthProvider, so it sits outside the router: links here are
 * plain anchors. Every message that depends on whether an address has an
 * account is worded so it does not reveal that.
 */
export function AuthModal({
  initialMode,
  prefill,
  onClose,
}: {
  initialMode: AuthMode;
  prefill?: AuthPrefill;
  onClose: () => void;
}) {
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState(prefill?.displayName ?? "");
  const [username, setUsername] = useState(prefill?.username ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [sent, setSent] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, [mode]);

  // Escape closes, as on the other dialogs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const switchTo = (next: AuthMode) => {
    setMode(next);
    setError("");
    setNotice("");
    setUnconfirmed(false);
    setSent(false);
    setPassword("");
  };

  const cleanEmail = () => sanitizeText(email).toLowerCase().slice(0, LIMITS.EMAIL);

  async function run(key: string, action: () => Promise<AuthResult>) {
    // A local brake on top of Supabase's own limits, so a stuck key or a
    // script in the page cannot hammer the auth server from here.
    if (!checkRateLimit(`auth:${key}`, 6, 15 * 60 * 1000)) {
      const mins = Math.ceil(getRateLimitCooldown(`auth:${key}`, 15 * 60 * 1000) / 60);
      setError(`Too many attempts. Wait ${mins} minute${mins === 1 ? "" : "s"} and try again.`);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      if (result.ok) {
        resetRateLimit(`auth:${key}`);
        if (result.message) setNotice(result.message);
      } else {
        setError(result.message);
        setUnconfirmed(result.code === "email_not_confirmed");
      }
      return result;
    } catch {
      setError("Could not reach the sign-in service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = cleanEmail();
    const ev = validateEmail(mail);
    if (!ev.ok) {
      setError(ev.message);
      return;
    }

    if (mode === "signin") {
      if (!password) {
        setError("Enter your password.");
        return;
      }
      await run("signin", () => auth.signIn(mail, password));
    } else if (mode === "signup") {
      const problem = passwordProblem(password);
      if (problem) {
        setError(problem);
        return;
      }
      const handle = username.trim().replace(/^@/, "");
      if (handle && !USERNAME.test(handle)) {
        setError("Usernames are 3–30 letters, numbers, underscores or dots.");
        return;
      }
      const r = await run("signup", () =>
        auth.signUp(mail, password, {
          displayName: sanitizeText(displayName).slice(0, LIMITS.NAME),
          username: handle,
        }),
      );
      if (r?.ok) setSent(true);
    } else if (mode === "reset") {
      const r = await run("reset", () => auth.sendPasswordReset(mail));
      if (r?.ok) setSent(true);
    } else {
      const r = await run("link", () => auth.sendMagicLink(mail));
      if (r?.ok) setSent(true);
    }
  };

  const titles: Record<AuthMode, [string, string]> = {
    signin: ["Sign in to CommonSphere", "Your notes, pins and profile, on every device."],
    signup: ["Create your account", "Free. Your notes, pins and profile follow you to any device."],
    reset: ["Reset your password", "We will email you a link to choose a new one."],
    link: ["Email me a sign-in link", "No password needed: the link we email signs you in."],
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className={`rounded-2xl p-8 w-full relative animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 flex flex-col ${isExpanded ? "max-w-full h-full justify-center" : "max-w-sm max-h-[90vh]"}`}
      >
        {/* Expand and Close as icon buttons, as on every other modal. */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label={isExpanded ? "Collapse modal" : "Expand modal to full screen"}
            title={isExpanded ? "Collapse" : "Expand to full screen"}
          >
            {isExpanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* The form keeps its width when the panel is expanded. */}
        <div className="w-full max-w-sm mx-auto pt-6">
          <h2 id="auth-title" className="text-2xl font-bold text-foreground mb-1.5">
            {titles[mode][0]}
          </h2>
          <p className="text-muted-foreground mb-5 text-sm">{titles[mode][1]}</p>

          {!auth.isConfigured ? (
            <p className="text-sm font-sans text-foreground rounded-xl border border-border px-4 py-3 modal-tile leading-relaxed">
              Accounts are not switched on for this site yet. Everything you
              save — notes, pins, your profile — is kept in this browser in the
              meantime.
            </p>
          ) : sent ? (
            <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3">
              <p className="text-sm font-semibold text-success mb-1">Check your inbox</p>
              <p className="text-xs font-sans text-foreground leading-relaxed">{notice}</p>
              <p className="text-[11px] font-sans text-muted-foreground mt-2 leading-snug">
                Nothing there after a few minutes? Look in spam, or try again.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {mode === "signup" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run("resend", () => auth.resendConfirmation(cleanEmail()))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted/60 disabled:opacity-50"
                  >
                    Send the link again
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => switchTo("signin")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  Back to sign in
                </button>
              </div>
              {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3" noValidate>
              {mode === "signup" && (
                <>
                  <label className="block">
                    <span className="block text-xs text-muted-foreground font-sans mb-1">
                      Display name <span className="opacity-70">(optional)</span>
                    </span>
                    <input
                      ref={firstField}
                      value={displayName}
                      maxLength={LIMITS.NAME}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoComplete="name"
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-muted-foreground font-sans mb-1">
                      Username <span className="opacity-70">(optional)</span>
                    </span>
                    <input
                      value={username}
                      maxLength={31}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      placeholder="letters, numbers, _ or ."
                      className={inputClass}
                    />
                  </label>
                </>
              )}
              <label className="block">
                <span className="block text-xs text-muted-foreground font-sans mb-1">Email</span>
                <input
                  ref={mode === "signup" ? undefined : firstField}
                  type="email"
                  value={email}
                  maxLength={LIMITS.EMAIL}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </label>
              {(mode === "signin" || mode === "signup") && (
                <label className="block">
                  <span className="flex items-center justify-between text-xs text-muted-foreground font-sans mb-1">
                    Password
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchTo("reset")}
                        className="text-secondary hover:underline"
                      >
                        Forgot it?
                      </button>
                    )}
                  </span>
                  <span className="relative block">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      maxLength={72}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                  {mode === "signup" && (
                    <span className="block text-[11px] text-muted-foreground font-sans mt-1">
                      At least 10 characters, with letters and numbers.
                    </span>
                  )}
                </label>
              )}

              {error && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                  {unconfirmed && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run("resend", () => auth.resendConfirmation(cleanEmail()))}
                      className="block mt-1 font-semibold underline disabled:opacity-50"
                    >
                      Send the confirmation link again
                    </button>
                  )}
                </div>
              )}
              {notice && !error && <p className="text-xs text-success">{notice}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm hover:bg-secondary/85 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {busy && <Spinner size={14} className="animate-spin" />}
                {mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : mode === "reset"
                      ? "Send reset link"
                      : "Send sign-in link"}
              </button>

              {mode === "signup" && (
                <p className="text-[11px] text-muted-foreground font-sans leading-snug">
                  By creating an account you agree to the{" "}
                  <a href="/dashboard/legal#terms" className="underline hover:text-foreground">
                    Terms
                  </a>{" "}
                  and the{" "}
                  <a href="/dashboard/legal#privacy" className="underline hover:text-foreground">
                    Privacy notice
                  </a>
                  .
                </p>
              )}
            </form>
          )}

          {auth.isConfigured && !sent && (mode === "signin" || mode === "signup") && oauthProviders.length > 0 && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-2 bg-background/80 rounded text-muted-foreground">or continue with</span>
                </div>
              </div>
              <div className="flex gap-2">
                {oauthProviders.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={busy}
                    onClick={() => run("oauth", () => auth.signInWithProvider(p))}
                    className="flex-1 border border-border rounded-lg py-2 text-xs font-semibold text-foreground hover:bg-muted/60 disabled:opacity-50"
                  >
                    {PROVIDER_LABEL[p]}
                  </button>
                ))}
              </div>
            </>
          )}

          {auth.isConfigured && !sent && (
            <div className="mt-5 space-y-1.5 text-center text-xs font-sans text-muted-foreground">
              {mode === "signin" && (
                <>
                  <p>
                    New here?{" "}
                    <button type="button" onClick={() => switchTo("signup")} className="text-secondary font-semibold hover:underline">
                      Create an account
                    </button>
                  </p>
                  <p>
                    <button type="button" onClick={() => switchTo("link")} className="hover:text-foreground hover:underline">
                      Email me a sign-in link instead
                    </button>
                  </p>
                </>
              )}
              {mode !== "signin" && (
                <p>
                  {mode === "signup" ? "Already have an account? " : ""}
                  <button type="button" onClick={() => switchTo("signin")} className="text-secondary font-semibold hover:underline">
                    {mode === "signup" ? "Sign in" : "Back to sign in"}
                  </button>
                </p>
              )}
              <p>
                Student or educator?{" "}
                <a href="/edu" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  Sign in with your .edu email
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
