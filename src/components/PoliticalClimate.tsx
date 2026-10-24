/**
 * A country's political climate, in its window: how it is governed as the
 * World Bank scores it on six counts, and what has happened there this year
 * - the court cases, votes, protests, scandals and crises - day by day.
 *
 * The site passes no judgement and writes none of it. The scores are the
 * World Bank's (data/countryIndexes.ts). The year's entries are the dated
 * lines of Wikipedia's article for the year in the country, in its editors'
 * words, each beside the report it cites (static/year, built by
 * build-country-year.cjs): the report is linked first, and the revision of
 * the article that was read is given last, with its licence. What is being
 * reported today is in the panel under this one.
 *
 * A country with no readable article for the year is told so, and a score
 * the Bank does not give is left out.
 */
import { useEffect, useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { COUNTRY_INDEXES, INDEX_DEFS, type IndexId } from "../data/countryIndexes";
import { COUNTRY_YEAR, COUNTRY_YEAR_LICENCE, COUNTRY_YEAR_PAGES, COUNTRY_YEAR_RETRIEVED, type CountryYearFile } from "../data/countryYear";
import { inSentence } from "./CountryQuality";
import { ChartNote, ChartTitle } from "./ModalCharts";
import { SourceLink } from "./SourceLink";
import { SLIM_TRACK, slimFill } from "./SlimBars";

/** The World Bank's six counts of how a country is governed. */
const GOVERNANCE: IndexId[] = ["voice", "stability", "effectiveness", "regulation", "ruleOfLaw", "corruption"];
const COLOR = "#6366f1";
/** How many of the year's entries are shown before the rest are asked for. */
const FIRST = 8;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (iso: string, year = true) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${year ? ` ${y}` : ""}`;
};

const FILES = new Map<string, Promise<CountryYearFile | null>>();
const load = (code: string) => {
  if (!FILES.has(code))
    FILES.set(
      code,
      fetch(`/year/${code}.json`)
        // Only JSON is read: for a file that is not there, the dev server answers with the page itself.
        .then((r) => (r.ok && /json/.test(r.headers.get("content-type") ?? "") ? (r.json() as Promise<CountryYearFile>) : null))
        .catch(() => null),
    );
  return FILES.get(code)!;
};
/** A country's year: undefined while it is fetched, null where there is no file for it. */
function useYear(code: string): CountryYearFile | null | undefined {
  const [got, setGot] = useState<{ code: string; file: CountryYearFile | null } | null>(null);
  const listed = Boolean(COUNTRY_YEAR_PAGES[code]);
  useEffect(() => {
    if (!listed) return;
    let off = false;
    load(code).then((file) => !off && setGot({ code, file }));
    return () => {
      off = true;
    };
  }, [code, listed]);
  if (!listed) return null;
  return got && got.code === code ? got.file : undefined;
}

export default function PoliticalClimate({ code, country, className = "" }: { /** The country's ISO code. */ code: string; country: string; className?: string }) {
  const land = inSentence(country);
  const held = COUNTRY_INDEXES[code] ?? {};
  const scores = GOVERNANCE.flatMap((id) => {
    const d = INDEX_DEFS.find((x) => x.id === id);
    const f = held[id];
    return d && f ? [{ d, f }] : [];
  });
  const year = useYear(code);
  const page = COUNTRY_YEAR_PAGES[code];
  const [all, setAll] = useState(false);
  // Another country's window: its own first few, not the last one's whole list.
  useEffect(() => setAll(false), [code]);
  const entries = year?.e ?? [];
  const shown = all ? entries : entries.slice(0, FIRST);

  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">🏛️ Political climate</h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
        How {land} is governed, as the World Bank scores it, and what has happened there in {COUNTRY_YEAR}. The site passes no judgement of its own: every line is its source's, with the report behind it.
      </p>

      {scores.length > 0 && (
        <>
          <ChartTitle>How it is governed · World Bank governance scores, 0 to 100 · more is the better</ChartTitle>
          <div className="tile-fill gap-2">
            {scores.map(({ d, f }) => (
              <div key={d.id} className="modal-tile rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-sans">{d.name}</p>
                <p className="text-base font-bold font-sans text-foreground leading-snug">{f.v}</p>
                <div className="h-1.5 rounded-full overflow-hidden my-1" style={{ background: SLIM_TRACK }} role="img" aria-label={`${d.name}: ${f.v} of 100`}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, Math.min(100, f.v))}%`, background: slimFill(COLOR) }} />
                </div>
                <p className="text-xs text-muted-foreground font-sans leading-snug">
                  {f.place && f.of ? `${f.place.toLocaleString("en-US")} of ${f.of} scored, counted here · ` : ""}
                  {f.y}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className={scores.length ? "mt-3" : ""}>
        <ChartTitle>
          {country} in {COUNTRY_YEAR} · day by day, newest first
        </ChartTitle>
        {year === undefined ? (
          <p className="text-[11px] font-sans text-muted-foreground">Reading the year…</p>
        ) : !entries.length ? (
          <p className="text-[11px] font-sans text-muted-foreground leading-snug">
            No list of the year's events is held for {land}: Wikipedia's article for {COUNTRY_YEAR} there has none that could be read whole, each line with its report. What is being reported today is below.
          </p>
        ) : (
          <>
            <ol className="modal-tile rounded-xl px-4 py-1 divide-y divide-border/40">
              {shown.map(([d, text, outlet, url], i) => (
                <li key={`${d}-${i}`} className="py-2 flex flex-col sm:flex-row sm:items-baseline gap-x-3 gap-y-0.5">
                  <time dateTime={d} className="text-[10px] font-mono text-muted-foreground shrink-0 sm:w-24">
                    {day(d, false)}
                  </time>
                  <span className="text-[12px] font-sans text-foreground leading-snug">
                    {text}{" "}
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground whitespace-nowrap">
                      {outlet} <ArrowSquareOut size={10} aria-hidden />
                    </a>
                  </span>
                </li>
              ))}
            </ol>
            {entries.length > FIRST && (
              <button
                type="button"
                onClick={() => setAll((v) => !v)}
                className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium font-sans border border-border text-foreground hover:border-secondary/60 transition-colors cursor-pointer"
                aria-expanded={all}
              >
                {all ? `Show the newest ${FIRST}` : `Show all ${entries.length}`}
              </button>
            )}
          </>
        )}
      </div>

      <ChartNote className="mt-2">
        {page && entries.length
          ? `The year's entries are Wikipedia's, in its editors' words: the newest ${page.n} of the ${page.of} dated lines of “${page.title}” that could be read whole, as it stood on ${day(COUNTRY_YEAR_RETRIEVED)}. Each is beside the first report it cites - read that first. They are what its editors chose to record, not a full account, and a line can be wrong or out of date. `
          : ""}
        {scores.length ? "A place among those scored is counted here from the Bank's scores for the same year." : ""}
      </ChartNote>
      <SourceLink
        sources={[
          ...(scores.length ? [scores[0].d.source] : []),
          ...(page && entries.length
            ? [
                { label: `Wikipedia — ${page.title} (revision ${page.revid})`, url: `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(page.title.replace(/ /g, "_"))}&oldid=${page.revid}` },
                { label: `Its text is under ${COUNTRY_YEAR_LICENCE.label}`, url: COUNTRY_YEAR_LICENCE.url },
              ]
            : []),
        ]}
        className="mt-1"
      />
    </section>
  );
}
