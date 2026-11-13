/** What a hover card says, and where the pointer is in its box. */
export type Tip = { x: number; y: number; title: string; lines: string[] };

/**
 * The card by the pointer, for the site's timelines, compasses and histories alike: frosted, as asked, so that it reads over
 * what is under it in a light page and a dark one; kept inside its box (`room`, the box's width).
 */
export function TipCard({ tip, room }: { tip: Tip; room: number }) {
  return (
    <div
      className="absolute z-10 pointer-events-none rounded-lg border border-border bg-background/70 backdrop-blur-md backdrop-saturate-150 shadow-lg px-2.5 py-2 max-w-[18rem]"
      style={{ left: Math.max(0, Math.min(tip.x + 14, room - 290)), top: tip.y + 14 }}
    >
      <p className="text-[11px] font-semibold font-sans text-foreground leading-snug">{tip.title}</p>
      {tip.lines.map((l, i) => (
        <p key={i} className="text-[10px] font-sans text-muted-foreground leading-snug mt-0.5">
          {l}
        </p>
      ))}
    </div>
  );
}
