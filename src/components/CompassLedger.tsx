/**
 * The Dashboard's political compass, as asked: the legend of the grid - not where countries stand, but what each part of it
 * means and the political ideas it is read by. A face card, centred on the page and made as the Dashboard's focus card is
 * (a banner with its name - the compass's four colours in place of a flag - the grid small, a few rows, and a bar along its
 * foot), that opens the site's window with all of it: the grid large - a true grid, each idea a point where the two-axis
 * model places it, its name and description shown only when pointed at, in a frosted card - the two axes, what each quarter
 * means, the sources, and the way on to Polls & Elections.
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

type Described = { said: string; sources: { label: string; url: string }[] };
const civOf = (i: CompassIdea) => (i.y + 1) / 2;
const quarterOf = (i: CompassIdea) => QUARTERS.find((Q) => inQuarter(i.x, civOf(i), Q));
/** The opening's first two sentences, for the card by the pointer. */
const brief = (s: string) => s.split(/(?<=[.!?])\s+(?=[A-Z])/).slice(0, 2).join(" ");
const AXES: [string, string][] = [
  ["Across", "The economy: common or state ownership, planning and the sharing of wealth on the left; private property and free markets on the right"],
  ["Up and down", "Authority over personal life - the state's, tradition's or faith's: the most at the top, each person's liberty at the foot"],
];
const label = "The political compass: each idea a point on the grid, its name and description shown when pointed at";

/** The ideas' descriptions: the site's record of political ideas, read when the card is first drawn, and those it does not hold. */
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

/** Each idea as a point in its quarter's colour; the one pointed at drawn larger. */
const dotsOf = (t: Tokens, lit: string | null): CompassDot[] =>
  COMPASS_IDEAS.map((i) => ({ key: i.name, across: i.x, civ: civOf(i), r: lit === i.name ? 4.6 : 3, fill: quarterOf(i)?.colour ?? t.mutedText, stroke: t.isLight ? "#ffffff" : "#0b0906", strokeWidth: 0.8 }));

/** The banner, as the focus card's flag: the compass's four colours, its name over them. */
function Banner({ big = false }: { big?: boolean }) {
  return (
    <div className={`relative overflow-hidden grid grid-cols-2 grid-rows-2 ${big ? "h-24 rounded-xl" : "h-20"}`} aria-hidden>
      {QUARTERS.map((Q) => (
        <div key={Q.name} style={{ background: Q.colour, opacity: 0.85 }} />
      ))}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)" }} />
      <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
        <span className={`text-white font-bold font-sans leading-tight drop-shadow ${big ? "text-base" : "text-sm"}`}>Political compass</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-semibold shrink-0 text-white" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)" }}>
          {COMPASS_IDEAS.length} ideas
        </span>
      </div>
    </div>
  );
}

export function CompassLedger() {
  const t = useTokens();
  const [open, setOpen] = useState(false);
  const line = t.gridLine;
  return (
    <div className="lg:col-span-2 flex justify-center">
      <div
        className="rounded-xl overflow-hidden w-full max-w-sm"
        style={{ background: t.isLight ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.06)", border: `1px solid ${line}`, boxShadow: t.isLight ? "0 2px 8px rgba(0,0,0,0.07)" : "none" }}
      >
        <button type="button" onClick={() => setOpen(true)} className="block w-full text-left cursor-pointer" aria-label="Open the political compass: every idea on the grid, described">
          <Banner />
          <div className="px-3 py-2.5 flex flex-col gap-2">
            <div className="text-foreground px-6">
              <CompassPlot dots={dotsOf(t, null)} label={label} grid={10} cornerNames={false} />
            </div>
            {[
              ["Ideas on the grid", `${COMPASS_IDEAS.length}`],
              ["Across", "the economy"],
              ["Up and down", "authority"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-sans" style={{ color: t.mutedText }}>
                  {k}
                </span>
                <span className="text-[11px] font-bold font-mono truncate" style={{ color: t.headText }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </button>
        <button type="button" onClick={() => setOpen(true)} className="w-full py-1.5 text-[11px] font-semibold font-sans cursor-pointer chip-selected" style={{ borderRadius: 0 }}>
          Open the compass
        </button>
      </div>
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
  const [lit, setLit] = useState<string | null>(null);
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
  const onDot = (e: MouseEvent, n: number) => {
    const p = at(e);
    const idea = COMPASS_IDEAS[n];
    const d = described.get(idea.name);
    setLit(idea.name);
    if (p) setTip({ ...p, title: shownName(idea.name), lines: [d ? brief(d.said) : "Reading its description…", `${quarterOf(idea)?.name ?? "On a middle line"}${d ? ` · read: ${[...new Set(d.sources.map((s) => s.label.replace(/ — .*/, "")))].join(", ")}` : ""}`] });
  };
  const onQuarter = (e: MouseEvent, Q: Quarter) => {
    const p = at(e);
    setLit(null);
    if (p) setTip({ ...p, title: Q.name, lines: [Q.means] });
  };
  const leave = () => {
    setTip(null);
    setLit(null);
  };
  const line = t.gridLine;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="The political compass">
      <div className={`relative z-10 rounded-2xl w-full shadow-2xl animate-fade-in modal-glass border overflow-y-auto transition-all duration-300 ${expanded ? "max-w-full max-h-full m-0" : "max-w-4xl max-h-[90vh]"}`}>
        <div className="p-6">
          <WindowTitle title="The political compass" note="what each part of the grid means, and the ideas it is read by">
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
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,28rem)_1fr] gap-6 mt-4 items-start">
            <div>
              <div ref={box} className="relative text-foreground">
                <CompassPlot dots={dotsOf(t, lit)} label={label} grid={10} cornerNames={false} onDot={onDot} onQuarter={onQuarter} onLeave={leave} />
                {tip && <TipCard tip={tip} room={box.current?.clientWidth ?? 300} />}
              </div>
              <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2 text-center">Point at a point for the idea and what it is, or at a quarter for what it means.</p>
            </div>
            <div className="min-w-0 flex flex-col gap-3">
              <Banner big />
              <div className="flex flex-col gap-1.5">
                {AXES.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <span className="text-[10px] font-sans shrink-0 text-muted-foreground">{k}</span>
                    <span className="text-[11px] font-sans text-right text-foreground">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col" style={{ borderTop: `1px solid ${line}` }}>
                {QUARTERS.map((Q) => (
                  <div key={Q.name} className="py-2" style={{ borderBottom: `1px solid ${line}` }}>
                    <p className="flex items-center gap-2 text-[11px] font-bold font-sans" style={{ color: Q.colour }}>
                      <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: Q.colour, opacity: 0.8 }} aria-hidden />
                      {Q.name}
                      <span className="ml-auto text-[10px] font-mono font-normal text-muted-foreground">{COMPASS_IDEAS.filter((i) => quarterOf(i) === Q).length} ideas</span>
                    </p>
                    <p className="text-[11px] font-sans leading-snug mt-0.5 text-foreground">{Q.means}</p>
                  </div>
                ))}
                <div className="py-2">
                  <p className="flex items-center gap-2 text-[11px] font-bold font-sans text-muted-foreground">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: t.mutedText, opacity: 0.8 }} aria-hidden />
                    On a middle line
                    <span className="ml-auto text-[10px] font-mono font-normal">{COMPASS_IDEAS.filter((i) => !quarterOf(i)).length} ideas</span>
                  </p>
                  <p className="text-[11px] font-sans leading-snug mt-0.5 text-foreground">
                    An idea about one of the two questions only - the state's power and shape, or the economy alone - stands on the other's middle line.
                  </p>
                </div>
              </div>
              <p className="text-[10px] font-sans text-muted-foreground leading-snug">
                Ideologies, political theories and philosophies, and forms of government: each placed by a reading of its defining principles on the grid's two questions - a guide,
                not a measurement; many span more than one place, and their parties have governed in other places than their principles would put them. Each description is the
                opening of its Wikipedia article, with the Encyclopaedia Britannica's or a philosophy encyclopedia's entry named to read.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <SourceLink sources={COMPASS_MODEL_SOURCES} />
                <button type="button" onClick={() => navigate("/dashboard/elections")} className="px-2.5 py-1 rounded-full text-[10px] font-semibold font-sans cursor-pointer chip-selected">
                  A country's place on it, year by year
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
