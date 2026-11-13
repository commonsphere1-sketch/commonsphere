/**
 * The Dashboard's political compass, as asked: every country the records place, each in its latest year with both its
 * government's leaning and V-Dem's civil liberties - the same compass, by the same rules, as Polls & Elections draws for one
 * country through the years (build-compass-world.cjs writes static/elections/compass.json from that page's files). A card
 * with the compass small and how many countries stand in each quarter, that opens the site's window: the compass large,
 * each country's dot in its flag's colour, described in a frosted card when pointed at - and each quarter too - and every
 * country listed under its position, each pressed to show where it stands and why.
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowsIn, ArrowsOut, Compass as CompassIcon, X } from "@phosphor-icons/react";
import { Card, Go, Head, Kicker } from "./DashboardCitiesSectors";
import { CompassPlot, CompassPositions, inQuarter, QUARTERS, type CompassDot, type Quarter } from "./PoliticalCompass";
import { SourceLink } from "./SourceLink";
import { WindowTitle } from "./WindowTitle";
import { type Tip, TipCard } from "./TipCard";
import { countriesData } from "../data/countriesData";
import { ELECTION_HISTORY_SOURCES } from "../data/electionHistory";
import { flagColor } from "../lib/flagColor";
import { useTokens } from "../lib/cardTokens";
import { lockScroll } from "../lib/scrollLock";
import { downloadCsv } from "../lib/csv";

type Row = { cc: string; name: string; year: number; across: number; civ: number; who: string; lean: string; source: string };
type CompassFile = { fields: string[]; today: string; rows: [string, number, number, number, string, string, string][] };

const NAME = new Map(countriesData.map((c) => [c.code, c.name]));
const COLOUR = "#a855f7";
/** Where a country stands: its quarter, or the middle line it is on. */
const placeOf = (r: Row) => QUARTERS.find((Q) => inQuarter(r.across, r.civ, Q))?.name ?? "On a middle line";
const describe = (r: Row) => [`${placeOf(r)} · ${r.year}`, `Governing: ${r.who}`, `Leaning: ${r.lean} (${r.source})`, `Civil liberties: ${r.civ.toFixed(3)} (V-Dem, 0 to 1)`];
const sourcesOf = (rows: Row[]) => [
  ...(rows.some((r) => r.source === "ParlGov") ? [ELECTION_HISTORY_SOURCES.parlgov] : []),
  ...(rows.some((r) => r.source === "Wikidata") ? [ELECTION_HISTORY_SOURCES.wikidata] : []),
  ELECTION_HISTORY_SOURCES.vdemIndices,
];

function dotsOf(rows: Row[], focus: string | null): CompassDot[] {
  // The country chosen drawn last, so that it stands over the rest.
  const ordered = focus ? [...rows.filter((r) => r.cc !== focus), ...rows.filter((r) => r.cc === focus)] : rows;
  return ordered.map((r) => ({
    key: r.cc,
    across: r.across,
    civ: r.civ,
    r: r.cc === focus ? 6 : 3.6,
    fill: flagColor(r.cc) ?? "#94a3b8",
    fillOpacity: focus && r.cc !== focus ? 0.45 : 0.9,
    stroke: "currentColor",
    strokeWidth: r.cc === focus ? 2 : 0.6,
  }));
}

export function WorldCompass() {
  const t = useTokens();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/elections/compass.json")
      .then((r) => (r.ok ? (r.json() as Promise<CompassFile>) : null))
      .then((j) => {
        if (!live || !j) return;
        setRows(j.rows.filter((x) => NAME.has(x[0])).map(([cc, year, across, civ, who, lean, source]) => ({ cc, name: NAME.get(cc)!, year, across, civ, who, lean, source })));
      })
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, []);
  const years = rows?.length ? [Math.min(...rows.map((r) => r.year)), Math.max(...rows.map((r) => r.year))] : null;
  const label = "Every country on the political compass, each in its latest year held";
  return (
    <Card t={t} className="lg:col-span-2">
      <Head t={t} icon={<CompassIcon size={16} weight="fill" />} label="Political compass" badge={rows ? `${rows.length} countries` : "reading"} color={COLOUR} cta="Polls & Elections" to="/dashboard/elections" />
      <Kicker t={t}>Each country in its latest year with both records · its government's leaning across, its civil liberties up and down</Kicker>
      {rows && rows.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,15rem)_1fr] gap-5 items-center">
          <button type="button" onClick={() => setOpen(true)} className="text-foreground cursor-pointer rounded-xl transition-opacity hover:opacity-85" aria-label={`Open ${label}`}>
            <CompassPlot dots={dotsOf(rows, null)} label={label} />
          </button>
          <div className="min-w-0">
            <ul className="flex flex-col">
              {[...QUARTERS, null].map((Q, i) => {
                const here = rows.filter((r) => (Q ? inQuarter(r.across, r.civ, Q) : !QUARTERS.some((q) => inQuarter(r.across, r.civ, q))));
                return (
                  <li key={Q?.name ?? "middle"} className="flex items-center gap-2 py-1.5" style={{ borderBottom: i < QUARTERS.length ? `1px solid ${t.gridLine}` : "none" }} title={Q?.say}>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: Q?.colour ?? t.mutedText, opacity: 0.7 }} aria-hidden />
                    <span className="text-xs font-semibold font-sans shrink-0" style={{ color: t.headText }}>
                      {Q?.name ?? "On a middle line"}
                    </span>
                    <span className="text-[10px] font-sans truncate flex-1 min-w-0" style={{ color: t.mutedText }}>
                      {here
                        .slice(0, 4)
                        .map((r) => r.name)
                        .join(", ")}
                      {here.length > 4 ? ` and ${here.length - 4} more` : ""}
                    </span>
                    <span className="text-[11px] font-mono font-bold shrink-0" style={{ color: t.headText }}>
                      {here.length}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-[10px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
              {years && `Latest years ${years[0] === years[1] ? years[0] : `${years[0]} to ${years[1]}`}. `}Across: ParlGov's place for the prime minister's party where it holds the country, else the
              alignment Wikidata records for the head of government's party. Up and down: V-Dem's civil liberties index. Not The Political Compass's own test.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Go color={COLOUR} onClick={() => setOpen(true)}>
                Every country and what puts it there
              </Go>
              <Go color={COLOUR} onClick={() => navigate("/dashboard/elections")}>
                A country through the years
              </Go>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[11px] font-sans" style={{ color: t.mutedText }}>
          {rows ? "Not held: no country has both records for the same year." : "Reading the compass…"}
        </p>
      )}
      {rows && rows.length > 0 && <SourceLink sources={sourcesOf(rows)} className="mt-3" />}
      {open && rows && <WorldCompassWindow rows={rows} label={label} onClose={() => setOpen(false)} />}
    </Card>
  );
}

/** The compass's window, the site's own: its title bar, expanded or not, closed by Escape or a press beside it. */
function WorldCompassWindow({ rows, label, onClose }: { rows: Row[]; label: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [tip, setTip] = useState<Tip | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [onClose]);
  const dots = useMemo(() => dotsOf(rows, focus), [rows, focus]);
  const byCc = useMemo(() => new Map(rows.map((r) => [r.cc, r])), [rows]);
  const chosen = focus ? byCc.get(focus) : undefined;
  const at = (e: MouseEvent) => {
    const r = box.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : null;
  };
  const showDot = (e: MouseEvent, i: number) => {
    const p = at(e);
    const r = byCc.get(String(dots[i].key));
    if (p && r) setTip({ ...p, title: r.name, lines: describe(r) });
  };
  const showQuarter = (e: MouseEvent, Q: Quarter) => {
    const p = at(e);
    const n = rows.filter((r) => inQuarter(r.across, r.civ, Q)).length;
    if (p) setTip({ ...p, title: Q.name, lines: [Q.say, `${n} of the ${rows.length} countries stand here in their latest year held.`] });
  };
  const middle = rows.filter((r) => !QUARTERS.some((Q) => inQuarter(r.across, r.civ, Q)));
  const chip = (r: Row) => (
    <button
      key={r.cc}
      type="button"
      onClick={() => setFocus((f) => (f === r.cc ? null : r.cc))}
      aria-pressed={focus === r.cc}
      title={describe(r).join(" · ")}
      className={`px-2 py-0.5 rounded-full text-[10px] font-sans border transition-colors cursor-pointer ${focus === r.cc ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      {r.name}
    </button>
  );
  const sorted = (list: Row[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={label}>
      <div className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${expanded ? "max-w-full max-h-full m-0" : "max-w-4xl max-h-[90vh]"}`}>
        <div className="p-6">
          <WindowTitle title="The political compass" note={`${rows.length} countries, each in its latest year held`}>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              aria-label={expanded ? "Collapse the window" : "Expand the window to the whole screen"}
              title={expanded ? "Collapse" : "Expand to the whole screen"}
            >
              {expanded ? <ArrowsIn size={18} /> : <ArrowsOut size={18} />}
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer" aria-label="Close">
              <X size={18} />
            </button>
          </WindowTitle>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,24rem)_1fr] gap-6 mt-4 items-start">
            <div ref={box} className="relative text-foreground">
              <CompassPlot dots={dots} label={label} tag={chosen ? { key: chosen.cc, text: chosen.name } : undefined} onDot={showDot} onQuarter={showQuarter} onLeave={() => setTip(null)} />
              {tip && <TipCard tip={tip} room={box.current?.clientWidth ?? 300} />}
            </div>
            <div className="min-w-0 space-y-3">
              {chosen ? (
                <div className="modal-tile rounded-xl px-3 py-2.5">
                  <p className="text-[13px] font-semibold font-sans text-foreground">{chosen.name}</p>
                  {describe(chosen).map((l) => (
                    <p key={l} className="text-[11px] font-sans text-muted-foreground leading-snug mt-0.5">
                      {l}
                    </p>
                  ))}
                  <button type="button" onClick={() => setFocus(null)} className="mt-1.5 text-[10px] font-sans text-muted-foreground hover:text-foreground cursor-pointer">
                    Show every country alike
                  </button>
                </div>
              ) : (
                <p className="text-[12px] font-sans text-foreground leading-snug">Point at a dot for its country, or at a quarter for what it means; press a country's name below to mark where it stands.</p>
              )}
              <p className="text-[11px] font-sans text-muted-foreground leading-snug">
                Across, the government's leaning in the year: ParlGov's place for the prime minister's party, left (0) to right (10), from experts' surveys, where ParlGov holds the
                country - each cabinet until the next, or until a head of government it is not named after takes office - and elsewhere, and after ParlGov's last cabinet, the
                political alignment Wikidata records for the head of government's party, its seven steps set evenly. Up and down, V-Dem's civil liberties index for the year, the
                freest at the foot. The government is the one in office at the middle of the year; each country is drawn in its latest year with both. A country with neither, or
                whose party is given more than one alignment, is not drawn. Each dot is in its flag's colour. The two records are set side by side, not combined: this is not The
                Political Compass's own test, which places a person by their answers.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      "political-compass-every-country.csv",
                      ["country", "year", "position", "governing", "leaning", "leaning source", "left (-1) to right (1)", "civil liberties (V-Dem, 0 to 1)"],
                      sorted(rows).map((r) => [r.name, r.year, placeOf(r), r.who, r.lean, r.source, r.across, r.civ]),
                    )
                  }
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-sans border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Every country's place on the compass, with what it is made of, as a spreadsheet"
                >
                  Download CSV
                </button>
                <SourceLink sources={sourcesOf(rows)} />
              </div>
            </div>
          </div>

          {/* The positions on the compass, as asked: each quarter, what puts a government there, and every country standing in it. */}
          <CompassPositions
            count={(Q) => `${rows.filter((r) => inQuarter(r.across, r.civ, Q)).length} countries`}
            list={(Q) => <div className="flex flex-wrap gap-1 mt-2">{sorted(rows.filter((r) => inQuarter(r.across, r.civ, Q))).map(chip)}</div>}
          />
          {middle.length > 0 && (
            <div className="modal-tile rounded-xl px-3 py-2.5 mt-3">
              <p className="text-[12px] font-semibold font-sans text-foreground flex items-center gap-2">
                On a middle line
                <span className="ml-auto text-[10px] font-mono font-normal text-muted-foreground">{middle.length} countries</span>
              </p>
              <p className="text-[11px] font-sans text-muted-foreground leading-snug mt-1">A government of a party placed at the centre, or a year of civil liberties of exactly 0.5: in no one quarter.</p>
              <div className="flex flex-wrap gap-1 mt-2">{sorted(middle).map(chip)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
