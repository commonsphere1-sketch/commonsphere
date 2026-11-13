/**
 * The Dashboard's political compass, as asked: the legend of the grid - not where countries stand, but what each part of it
 * means and the political ideas it is read by. A slim bar, centred on the page, made as the compass bar on Polls & Elections
 * is (the compass small, and a line of what it holds), that opens the site's window: the grid - a true grid, each idea a
 * point where the two-axis model places it - with, beside it, what the point or quarter pointed at is (its name alone is
 * shown by the pointer, in a frosted card), and under it the legend: the two axes, what each quarter means, the sources,
 * and the way on to Polls & Elections.
 */
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowsIn, ArrowsOut, X } from "@phosphor-icons/react";
import { CompassPlot, inQuarter, QUARTERS, type CompassDot, type Quarter } from "./PoliticalCompass";
import { SourceLink } from "./SourceLink";
import { WindowTitle } from "./WindowTitle";
import { type Tip, TipCard } from "./TipCard";
import { COMPASS_IDEAS, COMPASS_MODEL_SOURCES, MORE_IDEAS, shownName, type CompassIdea } from "../data/compassIdeologies";
import { useTokens, type Tokens } from "../lib/cardTokens";
import { lockScroll } from "../lib/scrollLock";

type Described = { said: string; sources: { label: string; url: string }[]; noEncyclopedia?: true };
const civOf = (i: CompassIdea) => (i.y + 1) / 2;
const quarterOf = (i: CompassIdea) => QUARTERS.find((Q) => inQuarter(i.x, civOf(i), Q));
const AXES: [string, string][] = [
  ["Across", "The economy: common or state ownership, planning and the sharing of wealth on the left; private property and free markets on the right"],
  ["Up and down", "Authority over personal life - the state's, tradition's or faith's: the most at the top, each person's liberty at the foot"],
];
const MIDDLE = "An idea about one of the two questions only - the state's power and shape, or the economy alone - stands on the other's middle line.";
const label = "The political compass: each idea a point on the grid; point at one for what it is";

/** The ideas' descriptions: the site's record of political ideas, read when the window opens, and those it does not hold. */
function useDescriptions() {
  const [map, setMap] = useState<Map<string, Described>>(() => new Map(MORE_IDEAS.map((m) => [m.name, m])));
  useEffect(() => {
    let live = true;
    void import("../data/politicalTheories").then((m) => {
      if (!live) return;
      const want = new Set(COMPASS_IDEAS.map((i) => i.name));
      setMap(new Map([...m.POLITICAL_IDEAS.filter((i) => want.has(i.name)).map((i) => [i.name, { said: i.said, sources: i.sources }] as const), ...MORE_IDEAS.map((x) => [x.name, x] as const)]));
    });
    return () => {
      live = false;
    };
  }, []);
  return map;
}

/** Each idea as a point in its quarter's colour; the one being read drawn larger. */
const dotsOf = (t: Tokens, lit: string | null): CompassDot[] =>
  COMPASS_IDEAS.map((i) => ({ key: i.name, across: i.x, civ: civOf(i), r: lit === i.name ? 4.8 : 3, fill: quarterOf(i)?.colour ?? t.mutedText, stroke: t.isLight ? "#ffffff" : "#0b0906", strokeWidth: lit === i.name ? 1.4 : 0.8 }));

export function CompassLedger() {
  const t = useTokens();
  const [open, setOpen] = useState(false);
  return (
    // Across the whole row, as the Dashboard's other cards are.
    <div className="lg:col-span-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        // No frame, as asked: the bar sits on the page, and lights when pointed at.
        // A light grey when pointed at in the light theme, a faint white in the dark one, as asked.
        className="rounded-2xl p-5 w-full text-left flex items-center gap-5 cursor-pointer transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        aria-label="Open the political compass: every idea on its grid, and what each part means"
      >
        <span className="w-28 shrink-0 text-foreground">
          <CompassPlot dots={dotsOf(t, null)} label={label} grid={10} cornerNames={false} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">The political compass</span>
          <span className="block text-[13px] font-semibold font-sans text-foreground mt-1">
            {COMPASS_IDEAS.length} political ideas on its grid, and what each part of it means
          </span>
          <span className="block text-[11px] font-sans text-muted-foreground mt-0.5">
            Across, the economy · up and down, authority · ideologies, theories, philosophies and forms of government, each described · open to point at each
          </span>
        </span>
      </button>
      {open && <CompassWindow onClose={() => setOpen(false)} />}
    </div>
  );
}

/** All of it, in the site's window: its title bar, expanded or not, closed by Escape or a press beside it. */
function CompassWindow({ onClose }: { onClose: () => void }) {
  const t = useTokens();
  const navigate = useNavigate();
  const described = useDescriptions();
  const [expanded, setExpanded] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  // What is being read beside the grid: the last idea or quarter pointed at, kept until another is.
  const [reading, setReading] = useState<{ idea: CompassIdea } | { quarter: Quarter } | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [onClose]);
  const at = (e: MouseEvent) => {
    const r = box.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : null;
  };
  // By the pointer, its name alone; what it is, beside the grid.
  const onDot = (e: MouseEvent, n: number) => {
    const p = at(e);
    const idea = COMPASS_IDEAS[n];
    setReading({ idea });
    if (p) setTip({ ...p, title: shownName(idea.name), lines: [] });
  };
  const onQuarter = (e: MouseEvent, Q: Quarter) => {
    const p = at(e);
    setReading({ quarter: Q });
    if (p) setTip({ ...p, title: Q.name, lines: [] });
  };
  const lit = reading && "idea" in reading ? reading.idea.name : null;
  const line = t.gridLine;
  const idea = reading && "idea" in reading ? reading.idea : null;
  const quarter = reading && "quarter" in reading ? reading.quarter : idea ? (quarterOf(idea) ?? null) : null;
  const d = idea ? described.get(idea.name) : undefined;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="The political compass">
      <div className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${expanded ? "max-w-full max-h-full m-0" : "max-w-4xl max-h-[90vh]"}`}>
        <div className="p-6">
          <WindowTitle title="The political compass" note={`${COMPASS_IDEAS.length} ideas on its grid, and what each part means`}>
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

          {/* The grid, and beside it what is pointed at. */}
          {/* The panel stands level with the middle of the grid, as asked. */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,28rem)_1fr] gap-6 mt-4 items-center">
            <div ref={box} className="relative text-foreground">
              <CompassPlot dots={dotsOf(t, lit)} label={label} grid={10} cornerNames={false} onDot={onDot} onQuarter={onQuarter} onLeave={() => setTip(null)} />
              {tip && <TipCard tip={tip} room={box.current?.clientWidth ?? 300} />}
            </div>
            <div className="min-w-0 modal-tile rounded-xl px-4 py-3 md:min-h-[16rem]" aria-live="polite">
              {idea ? (
                <>
                  <p className="text-base font-semibold font-sans text-foreground">{shownName(idea.name)}</p>
                  <p className="text-[11px] font-semibold font-sans mt-0.5" style={{ color: quarter?.colour ?? t.mutedText }}>
                    {quarter?.name ?? "On a middle line"}
                  </p>
                  <p className="text-[12px] font-sans text-foreground leading-relaxed mt-2">{d ? d.said : "Reading its description…"}</p>
                  {d && (
                    <p className="text-[10px] font-sans leading-snug mt-2 text-muted-foreground">
                      To read:{" "}
                      {d.sources.map((s, n) => (
                        <span key={s.url}>
                          {n > 0 && " · "}
                          <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
                            {s.label}
                          </a>
                        </span>
                      ))}
                      {d.noEncyclopedia && " · no entry in the Encyclopaedia Britannica or an encyclopedia of philosophy is recorded for it, so its Wikidata record is given beside its article"}
                    </p>
                  )}
                  <p className="text-[10px] font-sans leading-snug mt-2 text-muted-foreground">{quarter ? quarter.means : MIDDLE}</p>
                </>
              ) : quarter ? (
                <>
                  <p className="text-base font-semibold font-sans" style={{ color: quarter.colour }}>
                    {quarter.name}
                  </p>
                  <p className="text-[12px] font-sans text-foreground leading-relaxed mt-2">{quarter.means}</p>
                  <p className="text-[10px] font-sans leading-snug mt-2 text-muted-foreground">
                    {COMPASS_IDEAS.filter((i) => quarterOf(i) === quarter)
                      .map((i) => shownName(i.name))
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[13px] font-semibold font-sans text-foreground">Point at a point on the grid</p>
                  <p className="text-[12px] font-sans text-muted-foreground leading-relaxed mt-1">
                    Its name shows by the pointer, and what it is shows here: its description and the works to read. Point at a quarter for what it means.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* The legend, under the grid: the two axes, each quarter, the middle lines. */}
          <section aria-label="The legend" className="mt-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">The legend</p>
            <div className="flex flex-col gap-1.5 mb-3">
              {AXES.map(([k, v]) => (
                <div key={k} className="flex items-baseline gap-3">
                  <span className="text-[10px] font-sans shrink-0 w-20 text-muted-foreground">{k}</span>
                  <span className="text-[12px] font-sans text-foreground">{v}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUARTERS.map((Q) => (
                <div key={Q.name} className="modal-tile rounded-xl px-3 py-2.5" style={{ borderColor: `${Q.colour}55` }}>
                  <p className="flex items-center gap-2 text-[12px] font-semibold font-sans" style={{ color: Q.colour }}>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: Q.colour, opacity: 0.8 }} aria-hidden />
                    {Q.name}
                    <span className="ml-auto text-[10px] font-mono font-normal text-muted-foreground">{COMPASS_IDEAS.filter((i) => quarterOf(i) === Q).length} ideas</span>
                  </p>
                  <p className="text-[11px] font-sans leading-snug mt-1 text-foreground">{Q.means}</p>
                </div>
              ))}
            </div>
            <div className="modal-tile rounded-xl px-3 py-2.5 mt-3" style={{ borderColor: line }}>
              <p className="flex items-center gap-2 text-[12px] font-semibold font-sans text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: t.mutedText, opacity: 0.8 }} aria-hidden />
                On a middle line
                <span className="ml-auto text-[10px] font-mono font-normal">{COMPASS_IDEAS.filter((i) => !quarterOf(i)).length} ideas</span>
              </p>
              <p className="text-[11px] font-sans leading-snug mt-1 text-foreground">{MIDDLE}</p>
            </div>
            <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-3">
              Ideologies, political theories and philosophies, and forms of government, from the site's record of political ideas: each placed by a reading of its defining
              principles on the grid's two questions - a guide, not a measurement; many span more than one place, and their parties have governed in other places than their
              principles would put them. Each description is the opening of its Wikipedia article, with the Encyclopaedia Britannica's or a philosophy encyclopedia's entry to read.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <SourceLink sources={COMPASS_MODEL_SOURCES} />
              <button type="button" onClick={() => navigate("/dashboard/elections")} className="px-2.5 py-1 rounded-full text-[10px] font-semibold font-sans cursor-pointer chip-selected">
                A country's place on it, year by year
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
