import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import {
  GraduationCap,
  EnvelopeSimple,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  checkRateLimit,
  getRateLimitCooldown,
  resetRateLimit,
  sanitizeText,
  validateEmail,
  LIMITS,
} from "../lib/security";

const RATE_KEY_LOGIN = "auth:login";
const RATE_KEY_EDU = "auth:edu";

type Props = { isOpen: boolean; onClose: () => void };

export function AuthModal({ isOpen, onClose }: Props) {
  const { login, isPending } = useAuth();
  const navigate = useNavigate();
  const [showEdu, setShowEdu] = useState(false);
  const [eduEmail, setEduEmail] = useState("");
  const [eduSent, setEduSent] = useState(false);
  const [eduError, setEduError] = useState("");
  const [loginBlocked, setLoginBlocked] = useState(false);
  const [loginCooldown, setLoginCooldown] = useState(0);

  if (!isOpen) return null;

  // ── .edu submit with rate limiting + validation ──
  const handleEduSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limit: 5 attempts per 15 min for edu auth
    if (!checkRateLimit(RATE_KEY_EDU, 5, 15 * 60 * 1000)) {
      const secs = getRateLimitCooldown(RATE_KEY_EDU, 15 * 60 * 1000);
      const mins = Math.ceil(secs / 60);
      setEduError(
        `Too many attempts. Please wait ${mins} minute${mins !== 1 ? "s" : ""} and try again.`,
      );
      return;
    }

    const sanitized = sanitizeText(eduEmail).toLowerCase();
    const emailValidation = validateEmail(sanitized);
    if (!emailValidation.ok) {
      setEduError(emailValidation.message);
      return;
    }
    if (!sanitized.endsWith(".edu")) {
      setEduError("Please enter a valid .edu email address.");
      return;
    }

    setEduError("");
    resetRateLimit(RATE_KEY_EDU); // successful — reset counter
    setEduSent(true);
  };

  // ── Standard login with rate limiting ──
  const handleLogin = async () => {
    if (!checkRateLimit(RATE_KEY_LOGIN, 5, 15 * 60 * 1000)) {
      const secs = getRateLimitCooldown(RATE_KEY_LOGIN, 15 * 60 * 1000);
      const mins = Math.ceil(secs / 60);
      setLoginBlocked(true);
      setLoginCooldown(mins);
      return;
    }
    try {
      await login();
      resetRateLimit(RATE_KEY_LOGIN);
      onClose();
    } catch {
      // attempt counted; next call to checkRateLimit will reflect it
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl p-8 max-w-sm w-full mx-4 relative animate-fade-in modal-glass border">
        <button
          onClick={() => {
            onClose();
            setShowEdu(false);
            setEduSent(false);
            setEduEmail("");
          }}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        {!showEdu ? (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Sign in to CommonSphere
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Access civic data, save bookmarks, and more.
            </p>
            {loginBlocked && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 mb-2 text-center">
                Too many sign-in attempts. Please wait {loginCooldown} minute
                {loginCooldown !== 1 ? "s" : ""} before trying again.
              </p>
            )}
            <button
              onClick={handleLogin}
              disabled={isPending || loginBlocked}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Signing in..." : "Sign In Free"}
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowEdu(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl font-semibold text-sm hover:bg-emerald-100 transition-colors"
            >
              <GraduationCap size={16} /> Sign in with .edu email
            </button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Student or educator?{" "}
              <button
                onClick={() => {
                  onClose();
                  navigate("/edu");
                }}
                className="text-emerald-500 hover:underline font-medium"
              >
                Get free Research plan
              </button>
            </p>
          </>
        ) : eduSent ? (
          <div className="text-center py-2">
            <EnvelopeSimple
              size={36}
              className="text-emerald-400 mx-auto mb-3"
            />
            <h2 className="text-lg font-bold text-foreground mb-1">
              Check your inbox
            </h2>
            <p className="text-muted-foreground text-sm">
              We sent a verification link to{" "}
              <span className="font-mono text-xs text-emerald-400">
                {eduEmail}
              </span>
              .
            </p>
            <button
              onClick={() => {
                setShowEdu(false);
                setEduSent(false);
                setEduEmail("");
              }}
              className="mt-5 text-sm text-secondary hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                setShowEdu(false);
                setEduError("");
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold text-foreground mb-1">
              Edu Sign-in
            </h2>
            <p className="text-muted-foreground text-sm mb-5">
              Enter your .edu email — we&#39;ll send a magic link to verify your
              enrollment.
            </p>
            <form onSubmit={handleEduSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={eduEmail}
                onChange={(e) => {
                  if (e.target.value.length <= LIMITS.EMAIL) {
                    setEduEmail(e.target.value);
                    setEduError("");
                  }
                }}
                placeholder="you@university.edu"
                maxLength={LIMITS.EMAIL}
                className="w-full border border-border modal-tile rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-emerald-400/60"
              />
              {eduError && (
                <p className="text-destructive text-xs">{eduError}</p>
              )}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Send Verification Link <ArrowRight size={13} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
