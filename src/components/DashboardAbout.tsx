/**
 * The Dashboard's details of the site, as asked, at the foot of the page: what it keeps to, where its figures come from and
 * its pages. Every word is the site's own, from lib/siteAbout - the same the About page gives. (The description of the site
 * that stood at the head of the page, with its counts and a place for an ad banner, was taken off, as asked; AdSlot.tsx
 * is kept for a banner elsewhere.)
 */
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowSquareOut, ListBullets } from "@phosphor-icons/react";
import { useTokens } from "../lib/cardTokens";
import { SITE_PAGES, SITE_PRINCIPLES, SITE_SOURCES } from "../lib/siteAbout";
import { Card, Head } from "./DashboardCitiesSectors";
import { ROW_GLOW } from "./DataExplorer";

/** The site's details, at the foot of the page: what it keeps to, where its figures come from, and its pages. */
export function SiteDetails() {
  const t = useTokens();
  const navigate = useNavigate();
  const kicker = "text-[10px] font-mono uppercase tracking-widest mb-2";
  return (
    <Card t={t}>
      <Head t={t} icon={<ListBullets size={13} weight="fill" />} label="Details" badge="how the site works" color={t.headText} cta="About" to="/dashboard/about" />

      {/* What it keeps to: the About page's four principles, parted by lines. */}
      <p className={kicker} style={{ color: t.mutedText }}>
        What the site keeps to
      </p>
      <div className="grid grid-cols-2 cs-figlines">
        {SITE_PRINCIPLES.map((p) => (
          <div key={p.title} className="py-3">
            <p className="text-[13px] font-semibold font-sans" style={{ color: t.headText }}>
              {p.title}
            </p>
            <p className="text-[11px] font-sans leading-snug mt-1" style={{ color: t.bodyText }}>
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Where the figures come from: every publisher the About page lists, each a link to its own site. */}
      <p className={`${kicker} mt-5`} style={{ color: t.mutedText }}>
        Where the figures come from · {SITE_SOURCES.length} publishers, each named beside its figures
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SITE_SOURCES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={s.desc}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-sans border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {s.name} <ArrowSquareOut size={10} aria-hidden />
          </a>
        ))}
      </div>

      {/* The site's pages, as the side menu has them: each a row that opens it, lit when pointed at as the Data Explorer's rows are. */}
      <p className={`${kicker} mt-5`} style={{ color: t.mutedText }}>
        The site's pages
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        {SITE_PAGES.map((p) => (
          <button
            key={p.to}
            type="button"
            onClick={() => navigate(p.to)}
            className={`flex items-center gap-3 px-2 py-2 text-left cursor-pointer rounded-md ${ROW_GLOW}`}
            style={{ "--row": t.headText, borderBottom: `1px solid ${t.gridLine}` } as React.CSSProperties}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold font-sans" style={{ color: t.headText }}>
                {p.label}
              </span>
              <span className="block text-[11px] font-sans truncate" style={{ color: t.mutedText }}>
                {p.desc}
              </span>
            </span>
            <ArrowRight size={11} weight="bold" aria-hidden style={{ color: t.mutedText, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </Card>
  );
}
