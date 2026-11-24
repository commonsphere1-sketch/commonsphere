import { useEffect, useRef, useState } from "react";
import { ChipRow } from "./ChipRow";

export type NavSection = { id: string; label: string };

/**
 * Sticky chips to each section of a long page, the one in view marked, in
 * the style of the other pages' filter bars. Each section needs its id and
 * scroll-mt-36, so a chip brings it in below the bar rather than behind it.
 * Pass the sections as a module-level constant.
 *
 * Given `picked` and `onPick`, the chips are tabs instead: the page shows one
 * section at a time, the bar says which and asks for another, and nothing is
 * scrolled to (the Trends page, whose sections ran to thirty screens).
 */
export function SectionNav({
  label,
  sections,
  picked,
  onPick,
}: {
  label: string;
  sections: NavSection[];
  /** The section shown, where the page shows one at a time. */
  picked?: string;
  /** Asks the page for another section; with it, a chip picks and does not scroll. */
  onPick?: (id: string) => void;
}) {
  const [seen, setActive] = useState(sections[0]?.id ?? "");
  /* The sections not on the page now - a country's, while the Worldview page shows the whole world - whose chips are not
     drawn, so that no chip is pressed for nothing. Checked as the page scrolls, and every second and a half, since what a
     page shows can change without a scroll. */
  const [absent, setAbsent] = useState<string>("");
  const tabs = !!onPick;
  const active = tabs ? (picked ?? "") : seen;
  const rowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // The section being read is the last whose top has come a third of the
    // way down the screen - or, at the foot of the page, the last section,
    // whose top may never get that high. Checked on every scroll: a few
    // positions read, and setting the same section again does not re-render.
    if (tabs) return;
    const check = () => {
      const line = Math.max(180, window.innerHeight / 3);
      const atFoot = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = sections[0]?.id ?? "";
      const missing: string[] = [];
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) missing.push(s.id);
        if (el && (el.getBoundingClientRect().top <= line || atFoot)) current = s.id;
      }
      setActive(current);
      // A string, so that the same sections absent again does not re-render.
      setAbsent(missing.join(" "));
    };
    window.addEventListener("scroll", check, { passive: true, capture: true });
    const every = window.setInterval(check, 1500);
    check();
    return () => {
      window.removeEventListener("scroll", check, { capture: true } as EventListenerOptions);
      window.clearInterval(every);
    };
  }, [sections, tabs]);
  useEffect(() => {
    // On a narrow screen the marked chip can be scrolled out of the row:
    // bring it back, sideways only, so the page itself does not move.
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !chip) return;
    const r = row.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    if (c.left < r.left) row.scrollBy({ left: c.left - r.left - 32, behavior: "smooth" });
    else if (c.right > r.right) row.scrollBy({ left: c.right - r.right + 32, behavior: "smooth" });
  }, [active]);
  return (
    <nav aria-label={label} className="search-sticky sticky top-16 z-30 border border-border/60 rounded-2xl px-3 py-2">
      <ChipRow rowRef={rowRef}>
        {sections.filter((s) => tabs || !absent.split(" ").includes(s.id)).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => (onPick ? onPick(s.id) : document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }))}
            aria-current={active === s.id ? "true" : undefined}
            className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
              active === s.id ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </ChipRow>
    </nav>
  );
}
