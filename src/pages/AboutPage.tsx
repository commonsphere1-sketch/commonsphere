import { decodeEntities } from "../lib/security";
import {
  Globe,
  ArrowRight,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { SITE_DESCRIPTION, SITE_PAGES, SITE_PRINCIPLES, SITE_SOURCES, SITE_STATS } from "../lib/siteAbout";
import { figureText } from "../components/FigureText";

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-0 max-w-screen-2xl mx-auto">
        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-b-2xl border-x border-b border-border bg-card mb-12">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-purple-500/5 blur-3xl" />
          </div>
          <div className="relative px-8 pt-14 pb-12 flex flex-col gap-6 max-w-3xl">
            <div className="flex items-center gap-2">
              <Globe size={28} weight="fill" className="text-secondary" />
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-secondary">
                About CommonSphere
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-sans leading-tight text-foreground">
              We make the world&#39;s
              <br />
              <span className="text-secondary">political data legible</span>
            </h1>
            <p className="text-base text-muted-foreground font-sans leading-relaxed max-w-xl">
              {SITE_DESCRIPTION}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 w-fit px-5 py-2.5 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold font-sans hover:opacity-90 transition-opacity"
            >
              Explore the platform <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </section>

        <div className="space-y-16 pb-16">
          {/* ── STATS ─────────────────────────────────────────────── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SITE_STATS.map((s) => (
              <div
                key={s.lbl}
                className="bg-card border border-border rounded-2xl p-6 text-center"
              >
                <p className="text-4xl font-bold font-mono text-secondary mb-2">
                  {figureText(s.val)}
                </p>
                <p className="text-sm text-muted-foreground font-sans">
                  {s.lbl}
                </p>
              </div>
            ))}
          </section>

          {/* ── MISSION ───────────────────────────────────────────── */}
          <section className="bg-card border border-border rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="shrink-0 md:w-48">
              <p className="text-xs font-bold tracking-widest uppercase text-secondary font-sans mb-2">
                Our Mission
              </p>
              <div className="w-8 h-0.5 bg-secondary/40 rounded-full" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-sans text-foreground leading-snug">
                Democratising access to political intelligence
              </h2>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Geopolitical data has long been locked behind expensive
                subscriptions, inconsistent formats, and institutional
                gatekeeping. CommonSphere removes those barriers — giving any
                researcher, journalist, or policy professional access to the
                same depth of political intelligence that governments rely on to
                make decisions.
              </p>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed">
                Our goal is a single, authoritative, always-current window into
                how every country, state, city, and economy on Earth is governed
                — economically, politically, and socially — alongside the
                news and each country's history of it, crime statistics and
                the climate.
              </p>
            </div>
          </section>

          {/* ── VALUES ────────────────────────────────────────────── */}
          <section>
            <div className="mb-8">
              <p className="text-xs font-bold tracking-widest uppercase text-secondary font-sans mb-2">
                What we stand for
              </p>
              <h2 className="text-2xl font-bold font-sans text-foreground">
                Our core values
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {SITE_PRINCIPLES.map((v) => (
                <div
                  key={v.title}
                  className="bg-card border border-border rounded-2xl p-6 flex gap-5"
                >
                  <div
                    className={`p-3 rounded-xl ${v.bg} ${v.color} w-fit h-fit shrink-0 mt-0.5`}
                  >
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold font-sans text-foreground mb-2">
                      {v.title}
                    </h3>
                    <p
                      className="text-sm text-muted-foreground font-sans leading-relaxed">{decodeEntities(v.desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── DATA SOURCES ──────────────────────────────────────── */}
          <section>
            <div className="mb-8">
              <p className="text-xs font-bold tracking-widest uppercase text-secondary font-sans mb-2">
                Where the data comes from
              </p>
              <h2 className="text-2xl font-bold font-sans text-foreground">
                Data sources
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-2 max-w-2xl">
                The publishers the site's figures are drawn from. Each figure names
                its own beside it, with its year and a link; the Terms &amp; Policies
                page says under what licence each is used.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SITE_SOURCES.map((src) => (
                <div
                  key={src.name}
                  className="bg-card border border-border rounded-xl p-5 flex gap-4 hover:border-secondary/30 transition-colors group"
                >
                  <div
                    className={`p-2.5 rounded-xl ${src.bg} ${src.color} w-fit h-fit shrink-0 mt-0.5`}
                  >
                    {src.icon}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-sm font-bold font-sans text-foreground leading-snug">
                        {src.name}
                      </p>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${src.badge} whitespace-nowrap shrink-0`}
                      >
                        {src.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      {src.desc}
                    </p>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold font-sans text-secondary hover:opacity-80 transition-opacity w-fit mt-0.5"
                    >
                      Visit source <ArrowSquareOut size={11} weight="bold" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── WHAT'S ON THE PLATFORM ───────────────────────────── */}
          <section>
            <div className="mb-8">
              <p className="text-xs font-bold tracking-widest uppercase text-secondary font-sans mb-2">
                Platform Coverage
              </p>
              <h2 className="text-2xl font-bold font-sans text-foreground">
                Everything in one place
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-2 max-w-2xl">
                The pages of the site, as the sidebar names them. Each opens on
                its own figures, and every place on it has a window of its own.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {SITE_PAGES.map((item) => (
                <div
                  key={item.label}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-secondary/30 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg w-fit ${item.bg} ${item.color}`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-sans text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ───────────────────────────────────────────────── */}
          <section className="relative overflow-hidden bg-card border border-secondary/30 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-secondary/8 blur-3xl" />
            </div>
            <div className="relative space-y-2 max-w-lg">
              <p className="text-xs font-mono font-semibold uppercase tracking-widest text-secondary">
                Get started
              </p>
              <h3 className="text-xl font-bold font-sans text-foreground">
                Ready to explore the platform?
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                Start with any region or entity type — no account required for
                basic access.
              </p>
            </div>
            <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-full font-semibold text-sm font-sans hover:opacity-90 transition-opacity"
              >
                <Globe size={16} weight="fill" />
                Go to Dashboard
              </button>
              <button
                onClick={() => navigate("/dashboard/membership")}
                className="flex items-center gap-2 px-6 py-3 border border-border rounded-full font-semibold text-sm font-sans text-foreground hover:bg-muted transition-colors"
              >
                View Memberships
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
