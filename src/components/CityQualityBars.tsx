/**
 * Under a city on the Dashboard: quality-of-living figures as bars - health,
 * water, power, air, safety, schooling, the internet, income, work and the
 * journey to it.
 *
 * They are the rows of the city's own window (CountryQuality's, through
 * qualityHeadlines), so the two cannot disagree, and they are what that
 * window says they are: the figures of the country the city is in, each from
 * the body that measures it and for its latest year. No body publishes them
 * city by city on one footing. Where a figure is held for the city itself -
 * the Census Bureau's journey to work, for a city in the United States - it
 * comes first and is named as the city's.
 *
 * A row is a name, a bar and a figure, as the Policy explorer draws its own;
 * under it what the figure is counted in, its year and the world's figure.
 * The bar is on the measure's own scale, with a tick where the world stands;
 * a figure with no scale is given without one.
 *
 * Loaded when the card is shown: the country panels it reads are large.
 */
import { semanticColor } from "../lib/semanticColors";
import { inSentence, qualityHeadlines } from "./CountryQuality";
import type { Tokens } from "./DataExplorer";
import { SourceLink } from "./SourceLink";

export type QualityPlace = { /** The country's ISO code. */ code: string; country: string; /** The city's id on the Cities page. */ city: string; name: string };

export default function CityQualityBars({ t, code, country, city, name }: QualityPlace & { t: Tokens }) {
  const rows = qualityHeadlines(code, country, city);
  if (!rows.length)
    return (
      <p className="text-[10px] font-sans leading-snug pl-7 mt-2" style={{ color: t.mutedText }}>
        Quality of living: no figure is held for {inSentence(country)}.
      </p>
    );
  return (
    <div className="pl-7 mt-2">
      <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: t.mutedText }}>
        Quality of living · figures for {inSentence(country)}, not for {name} alone
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(15rem,100%),1fr))] gap-x-6 gap-y-2">
        {rows.map((r) => {
          const sub = `${r.sub}${r.world ? ` · world ${r.world}` : ""}`;
          return (
            <div key={r.label} className="min-w-0" title={`${r.label}: ${r.value} · ${sub}${r.bar ? ` · bar on a scale of ${r.bar.scale}` : ""}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-sans flex-1 min-w-0 truncate ${r.own ? "font-bold" : ""}`} style={{ color: r.own ? t.headText : t.bodyText }}>
                  {r.label}
                </span>
                {r.bar && (
                  <span className="relative w-20 h-1.5 rounded-full shrink-0" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }} aria-hidden>
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(1.5, r.bar.at)}%`, background: semanticColor(r.label) ?? r.color }} />
                    {r.bar.world != null && <span className="absolute -top-0.5 -bottom-0.5 w-0.5 -ml-px rounded-full" style={{ left: `${r.bar.world}%`, background: t.headText }} />}
                  </span>
                )}
                <span className="text-[10px] font-mono font-semibold text-right shrink-0 min-w-[4.5rem]" style={{ color: t.headText }}>
                  {r.value}
                </span>
              </div>
              <p className="text-[9px] font-mono leading-snug truncate" style={{ color: t.mutedText }}>
                {sub}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Where the figures under the cities shown are from: each body once. */
export function CityQualitySources({ places, className }: { places: QualityPlace[]; className?: string }) {
  const sources = new Map<string, { label: string; url: string }>();
  for (const p of places) for (const r of qualityHeadlines(p.code, p.country, p.city)) if (r.from) sources.set(r.from.label, r.from);
  return sources.size ? <SourceLink sources={[...sources.values()]} className={className} /> : null;
}
