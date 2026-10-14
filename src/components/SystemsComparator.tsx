/**
 * The government and political systems comparison - a view of the Rankings
 * page's Compare card, which draws SystemsTable for the countries pinned
 * there: countries side by side on how each is governed - what kind of
 * government it has, how its executive is chosen, how its legislature is
 * made up and elected, who judges, how its constitution is changed, who may
 * vote - and how the World Bank scores the way it is governed.
 *
 * Every line is its source's own (static/law, built by
 * build-country-law.cjs): the CIA World Factbook's final edition for how a
 * country is constituted, and the World Bank's Worldwide Governance
 * Indicators for the scores. Nothing is judged here. Under a country's type
 * of government are the words its own line uses - federal, presidential,
 * parliamentary, monarchy - picked out by a search for those words, so a
 * country is called federal only where the Factbook's line says federal.
 * Where the line does not say whether a state is unitary, the comparator
 * does not say it for it.
 *
 * Who holds an office is not shown: the Factbook's last edition was January
 * 2026, and the Countries and World Leaders pages keep office-holders by
 * rules of their own. How far local government has authority and money of
 * its own is not held, and is said not to be.
 */
import { GitDiff, X } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { COUNTRY_INDEXES, INDEX_DEFS, type IndexId } from "../data/countryIndexes";
import { COUNTRY_LAW_HELD, COUNTRY_LAW_SOURCES as SRC, type Chamber, type CountryLawFile } from "../data/countryLaw";
import { PLACE_COUNTRIES } from "../data/placesIndex";
import { Clauses } from "./SaidList";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

const ACCENT = "#6366f1";
const MAX = 4;
const OPEN = ["US", "GB", "DE", "CN"];
/** The words of a "Government type" line that say how authority is arranged: each is shown only where the line itself uses it. */
const WORDS = ["federal", "confederation", "presidential", "semi-presidential", "parliamentary", "monarchy", "republic", "communist", "theocratic", "dictatorship", "constitutional", "absolute"];
const SCORES: IndexId[] = ["voice", "ruleOfLaw", "effectiveness", "corruption", "stability"];
const COUNTRIES = [...COUNTRY_LAW_HELD].map((code) => ({ value: code, label: PLACE_COUNTRIES[code]?.[0] ?? code })).sort((a, b) => a.label.localeCompare(b.label));
const nameOf = (code: string) => PLACE_COUNTRIES[code]?.[0] ?? code;

const FILES = new Map<string, Promise<CountryLawFile | null>>();
const load = (code: string) => {
  if (!FILES.has(code))
    FILES.set(
      code,
      fetch(`/law/${code}.json`)
        // Only JSON is read: for a file that is not there, the dev server answers with the page itself.
        .then((r) => (r.ok && /json/.test(r.headers.get("content-type") ?? "") ? (r.json() as Promise<CountryLawFile>) : null))
        .catch(() => null),
    );
  return FILES.get(code)!;
};
/** Each chosen country's file: undefined while it is fetched, null where it cannot be read. */
function useFiles(codes: string[]) {
  const [got, setGot] = useState<Record<string, CountryLawFile | null>>({});
  const key = codes.join(",");
  useEffect(() => {
    let off = false;
    for (const code of key ? key.split(",") : []) load(code).then((file) => !off && setGot((old) => (code in old ? old : { ...old, [code]: file })));
    return () => {
      off = true;
    };
  }, [key]);
  return got;
}

/** Where the file holds nothing for a cell: the Factbook may say something of it that was not kept, so it is said not to be held, and no more. */
const none = <span className="text-[11px] font-sans text-muted-foreground">Not held</span>;
const said = (text: string | undefined): ReactNode => (text ? <Clauses text={text} /> : none);
const chamberName = (c: Chamber) => (c.which === "lower" ? "Lower chamber" : c.which === "upper" ? "Upper chamber" : "Its one chamber");
function Chambers({ list }: { list: Chamber[] | undefined }) {
  if (!list?.length) return none;
  return (
    <div className="flex flex-col gap-2.5">
      {list.map((c) => (
        <div key={c.which} className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{chamberName(c)}</p>
          {c.name && <p className="text-xs font-semibold font-sans text-foreground leading-snug">{c.name}</p>}
          <dl className="mt-1 grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5 text-[11px] font-sans">
            {(
              [
                ["Seats", c.seats],
                ["Elected by", c.system],
                ["Renewed", c.scope],
                ["Term", c.term],
                ["Women", c.women],
              ] as const
            ).flatMap(([k, v]) =>
              v
                ? [
                    <dt key={k} className="text-muted-foreground">
                      {k}
                    </dt>,
                    <dd key={`${k}-v`} className="text-foreground min-w-0">
                      {v}
                    </dd>,
                  ]
                : [],
            )}
          </dl>
        </div>
      ))}
    </div>
  );
}

type Row = { title: string; sub?: string; cell: (code: string, law: CountryLawFile | null) => ReactNode };
const ROWS: { group: string; rows: Row[] }[] = [
  {
    group: "What kind of government",
    rows: [
      {
        title: "Type of government",
        sub: "the Factbook's line, and the words in it that say how authority is arranged",
        cell: (_c, law) => {
          const type = law?.gov?.type;
          if (!type) return none;
          const words = WORDS.filter((w) => new RegExp(`(?<![a-z-])${w}(?![a-z-])`, "i").test(type));
          return (
            <>
              <p className="text-xs font-semibold font-sans text-foreground leading-snug">{type}</p>
              {words.length > 0 && (
                <p className="flex flex-wrap gap-1 mt-1.5">
                  {words.map((w) => (
                    <span key={w} className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-px rounded-full border border-border bg-muted/60 text-foreground">
                      {w}
                    </span>
                  ))}
                </p>
              )}
            </>
          );
        },
      },
      { title: "Its divisions", sub: "the states, provinces or regions it is made of", cell: (_c, law) => said(law?.gov?.divisions) },
    ],
  },
  {
    group: "The executive",
    rows: [
      { title: "How it is chosen", sub: "its chief of state and head of government", cell: (_c, law) => said(law?.gov?.executive?.chosen) },
      { title: "The cabinet", cell: (_c, law) => said(law?.gov?.executive?.cabinet) },
    ],
  },
  {
    group: "The legislature",
    rows: [
      {
        title: "Its shape",
        sub: "of one chamber or two",
        cell: (_c, law) => {
          const l = law?.gov?.legislature;
          return l?.structure || l?.name ? (
            <>
              {l.structure && <p className="text-xs font-semibold font-sans text-foreground">{l.structure}</p>}
              {l.name && <p className="text-[11px] font-sans text-muted-foreground leading-snug">{l.name}</p>}
            </>
          ) : (
            none
          );
        },
      },
      { title: "Its chambers", sub: "seats, how they are elected, for how long, and the share held by women", cell: (_c, law) => <Chambers list={law?.gov?.legislature?.chambers} /> },
    ],
  },
  {
    group: "The courts and the constitution",
    rows: [
      { title: "Highest court", cell: (_c, law) => said(law?.courts?.highest) },
      { title: "How judges are chosen", sub: "and for how long", cell: (_c, law) => said(law?.courts?.judges) },
      { title: "Legal system", cell: (_c, law) => said(law?.system) },
      { title: "How the constitution is amended", cell: (_c, law) => said(law?.constitution?.amend) },
    ],
  },
  {
    group: "The people",
    rows: [{ title: "Who may vote", cell: (_c, law) => said(law?.suffrage) }],
  },
  {
    group: "How it is scored",
    rows: SCORES.flatMap((id): Row[] => {
      const d = INDEX_DEFS.find((x) => x.id === id);
      if (!d) return [];
      return [
        {
          title: d.name,
          sub: `${d.by} · 0 to 100, higher is better`,
          cell: (code) => {
            const f = COUNTRY_INDEXES[code]?.[id];
            if (!f) return none;
            return (
              <>
                <p className="text-sm font-bold font-mono text-foreground">
                  {f.v} <span className="text-[10px] font-normal text-muted-foreground">· {f.y}</span>
                </p>
                <span className="block h-1 rounded-full bg-muted mt-1 overflow-hidden" aria-hidden>
                  <span className="block h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, f.v))}%`, background: ACCENT }} />
                </span>
              </>
            );
          },
        },
      ];
    }),
  },
];
const SCORE_SOURCE = INDEX_DEFS.find((x) => x.id === "voice")?.source;

/**
 * The comparison itself: the countries given, side by side, with what is said of the comparison and its sources under it.
 * A page that keeps its own list of places to compare - the Rankings page's Compare card - draws this, and not the card below.
 */
export function SystemsTable({ codes, empty = "No country is chosen. Add one above." }: { /** The countries compared, by ISO code, in the order they are drawn. */ codes: string[]; /** What is said where there is none. */ empty?: string }) {
  const files = useFiles(codes);
  const cols = `clamp(120px, 20%, 180px) repeat(${Math.max(codes.length, 1)}, minmax(13rem, 1fr))`;
  return (
    <>
      {codes.length === 0 ? (
        <div className="rounded-xl px-4 py-6 text-center border border-dashed border-border bg-muted/20">
          <p className="text-[12px] font-sans text-muted-foreground">{empty}</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-auto max-h-[75vh] border border-border">
          <div style={{ minWidth: `${130 + codes.length * 210}px` }}>
            <div className="compare-head grid sticky top-0 z-10 border-b border-border" style={{ gridTemplateColumns: cols }}>
              <div className="px-3 py-2.5 flex items-center">
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">How it is governed</span>
              </div>
              {codes.map((code) => (
                <div key={code} className="px-3 py-2.5 flex items-center gap-2 min-w-0">
                  <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="" className="w-7 h-5 rounded-[3px] object-cover border border-border shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  <p className="text-xs font-bold font-sans text-foreground truncate" title={nameOf(code)}>
                    {nameOf(code)}
                  </p>
                </div>
              ))}
            </div>
            {ROWS.map((g) => (
              <div key={g.group}>
                <p className="px-3 py-1.5 text-[10px] font-bold font-sans uppercase tracking-widest text-muted-foreground bg-muted/30 border-b border-border">{g.group}</p>
                {g.rows.map((r) => (
                  <div key={r.title} className="grid border-b border-border/60 last:border-b-0" style={{ gridTemplateColumns: cols }}>
                    <div className="px-3 py-3 min-w-0">
                      <p className="text-xs font-semibold font-sans text-foreground leading-snug">{r.title}</p>
                      {r.sub && <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">{r.sub}</p>}
                    </div>
                    {codes.map((code) => (
                      <div key={code} className="px-3 py-3 min-w-0 border-l border-border/40">
                        {code in files ? r.cell(code, files[code]) : <span className="text-[11px] font-sans text-muted-foreground">Fetching…</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] font-sans text-muted-foreground leading-snug">
        How each country arranges authority, in the CIA World Factbook's own words, with the World Bank's scores of how it is governed; nothing is judged here. The tags under a type of government are words of the Factbook's own line,
        found by a search for them: a country is tagged federal only where its line says federal, and one whose line does not say unitary is not called so here. Who holds each office is not shown - the Factbook's last edition was
        January 2026 - and is on the Countries and World Leaders pages. Not held: how far local government has authority and money of its own.
      </p>
      <SourceLink sources={[SRC.factbook, ...(SCORE_SOURCE ? [SCORE_SOURCE] : [])]} />
    </>
  );
}

/** The comparison as a card of its own, with its own choice of up to four countries. It stood on the Worldview page and was taken off it; the Rankings page's Compare card draws the table above. */
export default function SystemsComparator({ className = "" }: { className?: string }) {
  const [codes, setCodes] = useState<string[]>(OPEN.filter((c) => COUNTRY_LAW_HELD.has(c)));
  const left = COUNTRIES.filter((c) => !codes.includes(c.value));
  return (
    <div className={`bg-card border border-border rounded-2xl ${className}`}>
      <div className="px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: ACCENT + "12", border: `1px solid ${ACCENT}22` }}>
            <GitDiff size={13} weight="fill" style={{ color: ACCENT }} />
          </div>
          <span className="text-sm font-bold font-sans text-foreground">Systems of government, side by side</span>
          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg" style={{ background: ACCENT + "18", color: ACCENT }}>
            {COUNTRIES.length} countries · up to {MAX}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {codes.map((code) => (
            <span key={code} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold font-sans text-foreground" style={{ background: ACCENT + "12", border: `1px solid ${ACCENT}30` }}>
              <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt="" className="w-4 h-3 rounded-[2px] object-cover border border-border shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              <span className="truncate max-w-[9rem]">{nameOf(code)}</span>
              <button type="button" onClick={() => setCodes((old) => old.filter((c) => c !== code))} aria-label={`Remove ${nameOf(code)}`} className="ml-0.5 text-muted-foreground hover:opacity-60 transition-opacity cursor-pointer">
                <X size={10} weight="bold" />
              </button>
            </span>
          ))}
          {codes.length < MAX && (
            <div className="rounded-full border border-border px-3 py-1.5">
              <StyledSelect
                value="-"
                onValueChange={(code) => code !== "-" && setCodes((old) => (old.includes(code) || old.length >= MAX ? old : [...old, code]))}
                options={[{ value: "-", label: "Add a country…" }, ...left]}
                ariaLabel="Add a country to compare"
                triggerClassName="!text-[12px] font-semibold !text-foreground"
              />
            </div>
          )}
        </div>
        <SystemsTable codes={codes} />
      </div>
    </div>
  );
}
