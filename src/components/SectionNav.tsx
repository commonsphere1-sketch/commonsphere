import { useEffect, useState } from "react";

export type NavSection = { id: string; label: string };

/**
 * Sticky chips to each section of a long page, the one in view marked, in
 * the style of the other pages' filter bars. Each section needs its id and
 * scroll-mt-36, so a chip brings it in below the bar rather than behind it.
 * Pass the sections as a module-level constant.
 */
export function SectionNav({ label, sections }: { label: string; sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  useEffect(() => {
    // The section being read is the last whose top has come a third of the
    // way down the screen - or, at the foot of the page, the last section,
    // whose top may never get that high. Checked on every scroll: a few
    // positions read, and setting the same section again does not re-render.
    const check = () => {
      const line = Math.max(180, window.innerHeight / 3);
      const atFoot = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = sections[0]?.id ?? "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && (el.getBoundingClientRect().top <= line || atFoot)) current = s.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", check, { passive: true, capture: true });
    check();
    return () => window.removeEventListener("scroll", check, { capture: true } as EventListenerOptions);
  }, [sections]);
  return (
    <nav aria-label={label} className="search-sticky sticky top-16 z-30 border border-border/60 rounded-2xl px-3 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            aria-current={active === s.id ? "true" : undefined}
            className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 ${
              active === s.id ? "chip-selected" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
