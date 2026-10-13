/**
 * A group of related panels in a place's window, under one heading: its
 * people and society together, its money and work, its safety and justice,
 * and so on - so that what belongs together is read together, in every
 * window alike.
 *
 * The groups run in one order across the site: what a reader most often
 * comes for first, the reference detail last. The site holds no count of
 * what is searched for, so that order is a judgement, not a measurement.
 *
 * A group none of whose panels has anything to show takes its heading away
 * with it (index.css, .window-group).
 */
import type { ReactNode } from "react";

export function WindowGroup({
  title,
  bodyClass = "",
  children,
}: {
  title: string;
  /** How the panels inside are spaced, where the window spaces its sections itself. */
  bodyClass?: string;
  children: ReactNode;
}) {
  return (
    <section className="window-group">
      <div className="flex items-center gap-2 pt-5 mb-3">
        <h3 className="text-sm font-bold font-sans text-foreground">{title}</h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className={`window-group-body ${bodyClass}`.trim()}>{children}</div>
    </section>
  );
}
