import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Spinner, WarningCircle, Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { initialAuthRedirect } from "@/lib/supabase";
import { passwordProblem } from "@/components/AuthModal";

/**
 * Where the links in auth emails land.
 *
 * /auth/callback — account confirmation, sign-in links, OAuth and email
 * changes. The Supabase client has already read the result out of the URL by
 * the time this renders; this page only says what happened.
 *
 * /auth/reset — the password-reset link, which signs the person in for long
 * enough to choose a new password.
 */

function Panel({
  tone,
  title,
  children,
}: {
  tone: "ok" | "wait" | "error";
  title: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "ok" ? CheckCircle : tone === "error" ? WarningCircle : Spinner;
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-12 animate-fade-in">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
        <Icon
          size={40}
          weight={tone === "wait" ? "regular" : "fill"}
          className={`mx-auto mb-4 ${
            tone === "ok" ? "text-success" : tone === "error" ? "text-destructive" : "text-muted-foreground animate-spin"
          }`}
        />
        <h1 className="text-xl font-bold font-sans text-foreground mb-2">{title}</h1>
        {children}
      </div>
    </div>
  );
}

const button =
  "px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/85 transition-colors";
const quiet =
  "px-4 py-2 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted/60 transition-colors";

export function AuthCallbackPage() {
  const { user, isPending, isConfigured, openAuth } = useAuth();
  const navigate = useNavigate();
  const { error, message } = initialAuthRedirect;

  // Signed in by the link: carry on to the dashboard after a moment to read.
  useEffect(() => {
    if (!user || error || message) return;
    const t = setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [user, error, message, navigate]);

  if (!isConfigured) {
    return (
      <Panel tone="error" title="Accounts are not available">
        <p className="text-sm text-muted-foreground">This site is not set up for sign-in yet.</p>
      </Panel>
    );
  }
  if (error) {
    return (
      <Panel tone="error" title="That link did not work">
        <p className="text-sm text-muted-foreground mb-1">{error}</p>
        <p className="text-xs text-muted-foreground mb-5">
          Links from our emails work once, and expire after an hour.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className={button} onClick={() => openAuth("signin")}>
            Sign in
          </button>
          <button className={quiet} onClick={() => openAuth("link")}>
            Email me a new link
          </button>
        </div>
      </Panel>
    );
  }
  if (message) {
    return (
      <Panel tone="ok" title="Almost done">
        <p className="text-sm text-muted-foreground mb-5">{message}</p>
        <button className={button} onClick={() => navigate("/dashboard")}>
          Go to the dashboard
        </button>
      </Panel>
    );
  }
  if (isPending) return <Panel tone="wait" title="Signing you in…" />;
  if (user) {
    return (
      <Panel tone="ok" title="You are signed in">
        <p className="text-sm text-muted-foreground mb-5">
          Welcome{user.name ? `, ${user.name}` : ""}. Taking you to the dashboard…
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className={button} onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button className={quiet} onClick={() => navigate("/dashboard/settings")}>
            Your profile
          </button>
        </div>
      </Panel>
    );
  }
  return (
    <Panel tone="error" title="This link has already been used">
      <p className="text-sm text-muted-foreground mb-5">
        If you confirmed your email a moment ago, it worked — sign in to continue.
      </p>
      <button className={button} onClick={() => openAuth("signin")}>
        Sign in
      </button>
    </Panel>
  );
}

export function ResetPasswordPage() {
  const { user, isPending, isConfigured, recovery, openAuth, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!isConfigured) {
    return (
      <Panel tone="error" title="Accounts are not available">
        <p className="text-sm text-muted-foreground">This site is not set up for sign-in yet.</p>
      </Panel>
    );
  }
  if (done) {
    return (
      <Panel tone="ok" title="Password changed">
        <p className="text-sm text-muted-foreground mb-5">Use your new password next time you sign in.</p>
        <button className={button} onClick={() => navigate("/dashboard")}>
          Go to the dashboard
        </button>
      </Panel>
    );
  }
  if (initialAuthRedirect.error) {
    return (
      <Panel tone="error" title="That reset link did not work">
        <p className="text-sm text-muted-foreground mb-1">{initialAuthRedirect.error}</p>
        <p className="text-xs text-muted-foreground mb-5">Reset links work once, and expire after an hour.</p>
        <button className={button} onClick={() => openAuth("reset")}>
          Send a new link
        </button>
      </Panel>
    );
  }
  if (isPending) return <Panel tone="wait" title="Checking your link…" />;
  if (!user) {
    return (
      <Panel tone="error" title="This reset link has expired">
        <p className="text-sm text-muted-foreground mb-5">Ask for a new one and use it within the hour.</p>
        <button className={button} onClick={() => openAuth("reset")}>
          Send a new link
        </button>
      </Panel>
    );
  }
  if (!recovery) {
    return (
      <Panel tone="ok" title="You are already signed in">
        <p className="text-sm text-muted-foreground mb-5">You can change your password in Settings.</p>
        <button className={button} onClick={() => navigate("/dashboard/settings#security-settings")}>
          Open Settings
        </button>
      </Panel>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    setError("");
    const r = await updatePassword(password);
    setBusy(false);
    if (r.ok) setDone(true);
    else setError(r.message);
  };

  const field =
    "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50";
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-12 animate-fade-in">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-card border border-border rounded-2xl p-8 space-y-3" noValidate>
        <h1 className="text-xl font-bold font-sans text-foreground">Choose a new password</h1>
        <p className="text-xs text-muted-foreground">
          For {user.email}. At least 10 characters, with letters and numbers.
        </p>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">New password</span>
          <span className="relative block">
            <input
              type={show ? "text" : "password"}
              value={password}
              maxLength={72}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              className={`${field} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>
        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">Type it again</span>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            maxLength={72}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className={field}
          />
        </label>
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${button} w-full disabled:opacity-50`}>
          {busy ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
