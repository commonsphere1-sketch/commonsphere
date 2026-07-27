import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  ArrowLeft,
  GraduationCap,
  EnvelopeSimple,
  CheckCircle,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";
import {
  checkRateLimit,
  getRateLimitCooldown,
  resetRateLimit,
  sanitizeText,
  validateEmail,
  LIMITS,
} from "../lib/security";

const RATE_KEY_EDU_PAGE = "auth:edu:page";

const EDU_PERKS = [
  "Full Research plan — free for verified students & faculty",
  "Unlimited API calls during enrollment",
  "Collaborative research workspaces",
  "Export to CSV, PDF, and BibTeX",
  "Priority data refresh & historical archives",
];

export function EduSignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting: 5 attempts per 15 min
    if (!checkRateLimit(RATE_KEY_EDU_PAGE, 5, 15 * 60 * 1000)) {
      const secs = getRateLimitCooldown(RATE_KEY_EDU_PAGE, 15 * 60 * 1000);
      const mins = Math.ceil(secs / 60);
      setError(`Too many attempts. Please wait ${mins} minute${mins !== 1 ? "s" : ""} and try again.`);
      return;
    }

    // Sanitize + validate
    const sanitized = sanitizeText(email).toLowerCase();
    const emailValidation = validateEmail(sanitized);
    if (!emailValidation.ok) {
      setError(emailValidation.message);
      return;
    }
    if (!sanitized.endsWith(".edu")) {
      setError("Please enter a valid .edu email address.");
      return;
    }

    setError("");
    resetRateLimit(RATE_KEY_EDU_PAGE);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#06101f] text-white font-sans flex flex-col">
      {/* Nav */}
      <nav className="h-14 flex items-center px-6 border-b border-slate-800 bg-[#06101f]/90 backdrop-blur-md fixed top-0 inset-x-0 z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors text-sm mr-4"
        >
          <ArrowLeft size={16} weight="bold" /> Back
        </button>
        <Globe size={20} weight="fill" className="text-sky-400 mr-2" />
        <span className="font-bold text-sm">CommonSphere</span>
        <span className="ml-2 text-slate-600 text-sm">/</span>
        <span className="ml-2 text-emerald-300 text-sm font-semibold">Edu Sign-in</span>
      </nav>

      <main className="flex-1 pt-14 flex items-center justify-center px-6">
        <div className="max-w-4xl w-full py-16 grid md:grid-cols-2 gap-12 items-center">
          {/* Left: perks */}
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-xs font-semibold mb-5">
              <GraduationCap size={13} /> Education Program
            </div>
            <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "Georgia, serif" }}>
              Free for Students<br />& Educators
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Verify your .edu email and unlock everything CommonSphere has to offer — at no cost, for the duration of your enrollment.
            </p>
            <ul className="space-y-3">
              {EDU_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                  {perk}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <Sparkle size={12} className="text-yellow-400" />
              Used by researchers at 200+ universities worldwide
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1f35]/80 p-8">
            {submitted ? (
              <div className="text-center py-4">
                <CheckCircle size={40} weight="fill" className="text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
                <p className="text-slate-400 text-sm">
                  We&#39;ve sent a verification link to <span className="text-emerald-300 font-mono text-xs">{email}</span>.
                  Click it to activate your free Research plan.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                  className="mt-6 text-sky-400 hover:text-sky-300 text-sm underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <EnvelopeSimple size={18} className="text-emerald-400" />
                  <h2 className="text-base font-semibold">Sign in with .edu email</h2>
                </div>
                <p className="text-slate-400 text-xs mb-6">
                  Enter your institutional email address below. We&#39;ll send you a magic link to verify your enrollment.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Institutional email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      maxLength={LIMITS.EMAIL}
                      onChange={(e) => {
                        if (e.target.value.length <= LIMITS.EMAIL) {
                          setEmail(e.target.value);
                          setError("");
                        }
                      }}
                      placeholder="you@university.edu"
                      className="w-full bg-[#06101f] border border-slate-700 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                    />
                    {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Send Verification Link <ArrowRight size={14} />
                  </button>
                </form>
                <p className="text-slate-500 text-[11px] mt-5 text-center">
                  By continuing you agree to our Terms of Service. Verified annually.
                </p>

                <div className="border-t border-slate-700/60 mt-5 pt-5 text-center">
                  <p className="text-slate-400 text-xs mb-3">Or sign in with</p>
                  <div className="flex gap-3">
                    <button className="flex-1 border border-slate-700 hover:border-slate-500 rounded-lg py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all">
                      Google
                    </button>
                    <button className="flex-1 border border-slate-700 hover:border-slate-500 rounded-lg py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all">
                      Microsoft
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
