/**
 * The political compass, drawn once for the site, as asked: for Polls & Elections (a country through the years) and the
 * Dashboard (every country in its latest year). Across, a government's leaning, left to right; up and down, how free its
 * people are - V-Dem's civil liberties index, 0 to 1 - authoritarian at the top, libertarian at the foot. Two records set
 * side by side: not The Political Compass's own test, which places a person by their answers.
 */
import type { MouseEvent, ReactNode } from "react";

const LIBERTIES = "V-Dem's index of how free people are from the state's violence - torture, political killings - and free to speak, gather, move, worship, own property and work unforced";
/**
 * The compass's four positions, each said by what places a government there - its party's leaning and its people's civil
 * liberties in the year - and not by any one doctrine; each in the compass's own colour.
 */
export const QUARTERS = [
  { name: "Authoritarian left", colour: "#ef4444", right: false, low: true, say: `A government of a party placed left of centre, in a year its people's civil liberties are in the lower half: below 0.5 on ${LIBERTIES}.` },
  { name: "Authoritarian right", colour: "#3b82f6", right: true, low: true, say: `A government of a party placed right of centre, in a year its people's civil liberties are in the lower half: below 0.5 on ${LIBERTIES}.` },
  { name: "Libertarian left", colour: "#22c55e", right: false, low: false, say: `A government of a party placed left of centre, in a year its people's civil liberties are in the upper half: 0.5 or more on ${LIBERTIES}.` },
  { name: "Libertarian right", colour: "#a855f7", right: true, low: false, say: `A government of a party placed right of centre, in a year its people's civil liberties are in the upper half: 0.5 or more on ${LIBERTIES}.` },
] as const;
export type Quarter = (typeof QUARTERS)[number];
/** A place in a quarter: off the middle lines, on its side of both. `across` is left (-1) to right (1); `civ` V-Dem's 0 to 1. */
export const inQuarter = (across: number, civ: number, q: Quarter) => across !== 0 && across > 0 === q.right && civ < 0.5 === q.low;

/** What the middle lines mean, said under the positions. */
export const MIDDLE_LINES =
  "On the middle lines: across, a party placed at the centre - 5 on ParlGov's scale, or Wikidata's \"centrism\" - stands on the line up and down, in neither the left's quarters nor the right's; up and down, civil liberties of exactly 0.5 stand on the line across. Left and right here are where the records place the party, not a judgement of its policies; authoritarian and libertarian are only how free its people were that year by V-Dem's measure, whoever was to account for it.";

export type CompassDot = { key: string | number; across: number; civ: number; r: number; fill: string; fillOpacity?: number; stroke?: string; strokeWidth?: number };

/**
 * The compass drawn: its four quarters, a path through the dots where `path` is set, each dot. Pointed at, a dot's card -
 * where `onDot` is given - and a quarter's, named in its corner, where `onQuarter` is.
 */
export function CompassPlot({
  dots,
  label,
  path = false,
  tag,
  onDot,
  onQuarter,
  onLeave,
  children,
}: {
  dots: CompassDot[];
  label: string;
  path?: boolean;
  /** A word written by one dot: its key and the word. */
  tag?: { key: string | number; text: string };
  onDot?: (e: MouseEvent, i: number) => void;
  onQuarter?: (e: MouseEvent, q: Quarter) => void;
  onLeave?: () => void;
  children?: ReactNode;
}) {
  const S = 300; // its side
  const M = 26; // the margin its words stand in
  const px = (v: number) => M + ((v + 1) / 2) * (S - 2 * M);
  // Libertarian (the freest) at the foot: civil liberties of 1 at the foot, 0 at the top.
  const py = (civ: number) => px(2 * civ - 1);
  const q = (S - 2 * M) / 2;
  const tagged = tag ? dots.find((d) => d.key === tag.key) : undefined;
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-auto" role="img" aria-label={label}>
      {/* The four quarters, faintly in the compass's own colours; where they can be pointed at, each named in its outer corner. */}
      {QUARTERS.map((Q) => (
        <g key={Q.name} onMouseMove={onQuarter ? (e) => onQuarter(e, Q) : undefined} onMouseLeave={onQuarter ? onLeave : undefined}>
          <rect x={Q.right ? S / 2 : M} y={Q.low ? M : S / 2} width={q} height={q} fill={Q.colour} fillOpacity={0.1} />
          {onQuarter && (
            <text x={Q.right ? S - M - 5 : M + 5} y={Q.low ? M + 11 : S - M - 6} textAnchor={Q.right ? "end" : "start"} fontSize={7.5} fontWeight={600} fill={Q.colour} opacity={0.85}>
              {Q.name}
            </text>
          )}
        </g>
      ))}
      <rect x={M} y={M} width={S - 2 * M} height={S - 2 * M} fill="none" stroke="currentColor" strokeOpacity={0.25} pointerEvents="none" />
      <line x1={S / 2} y1={M} x2={S / 2} y2={S - M} stroke="currentColor" strokeOpacity={0.35} pointerEvents="none" />
      <line x1={M} y1={S / 2} x2={S - M} y2={S / 2} stroke="currentColor" strokeOpacity={0.35} pointerEvents="none" />
      <text x={S / 2} y={M - 9} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.75}>
        Authoritarian
      </text>
      <text x={S / 2} y={S - M + 16} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.75}>
        Libertarian
      </text>
      <text x={M - 12} y={S / 2} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.75} transform={`rotate(-90 ${M - 12} ${S / 2})`}>
        Left
      </text>
      <text x={S - M + 12} y={S / 2} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.75} transform={`rotate(90 ${S - M + 12} ${S / 2})`}>
        Right
      </text>
      {path && dots.length > 1 && <polyline points={dots.map((d) => `${px(d.across)},${py(d.civ)}`).join(" ")} fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} strokeLinejoin="round" pointerEvents="none" />}
      {dots.map((d, i) => (
        <circle
          key={d.key}
          cx={px(d.across)}
          cy={py(d.civ)}
          r={d.r}
          fill={d.fill}
          fillOpacity={d.fillOpacity ?? 1}
          stroke={d.stroke ?? "none"}
          strokeWidth={d.strokeWidth ?? 2}
          className={onDot ? "cursor-pointer" : undefined}
          onMouseMove={onDot ? (e) => onDot(e, i) : undefined}
          onMouseLeave={onLeave}
        />
      ))}
      {tagged && tag && (
        <text x={px(tagged.across) > S - 70 ? px(tagged.across) - 8 : px(tagged.across) + 8} y={py(tagged.civ) - 8} fontSize={9} fontWeight={700} fill="currentColor" textAnchor={px(tagged.across) > S - 70 ? "end" : "start"} pointerEvents="none">
          {tag.text}
        </text>
      )}
      {children}
    </svg>
  );
}

/** The four positions, each with what puts a government there and what of the compass stands in it (`count`, `list`). */
export function CompassPositions({ count, list }: { count: (q: Quarter) => string; list?: (q: Quarter) => ReactNode }) {
  return (
    <section aria-label="The positions on the compass" className="mt-6">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">The positions on the compass</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUARTERS.map((Q) => (
          <div key={Q.name} className="modal-tile rounded-xl px-3 py-2.5" style={{ borderColor: `${Q.colour}55` }}>
            <p className="text-[12px] font-semibold font-sans flex items-center gap-2" style={{ color: Q.colour }}>
              <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: Q.colour, opacity: 0.6 }} aria-hidden />
              {Q.name}
              <span className="ml-auto text-[10px] font-mono font-normal text-muted-foreground">{count(Q)}</span>
            </p>
            <p className="text-[11px] font-sans text-muted-foreground leading-snug mt-1">{Q.say}</p>
            {list?.(Q)}
          </div>
        ))}
      </div>
      <p className="text-[11px] font-sans text-muted-foreground leading-snug mt-3">{MIDDLE_LINES}</p>
    </section>
  );
}
