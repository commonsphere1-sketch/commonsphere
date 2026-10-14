/**
 * The head of a page: its name, a line under it saying what the page holds,
 * and - at the right, small - whose figures they are and when they were read.
 *
 * It is the plain header the Countries and Cities pages have always had. The
 * Municipalities, Worldview, Trends, Crime and Dashboard pages opened on a
 * card instead, with a kicker, a paragraph and a figure in very large type;
 * they were brought down to this as asked, so that every page opens the same
 * quiet way. A figure a card showed large is kept, in the line or beside it.
 */
import type { ReactNode } from "react";

export function PageHeader({
  title,
  children,
  aside,
  className = "",
}: {
  title: ReactNode;
  /** The line under the name: what the page holds. */
  children?: ReactNode;
  /** At the right, small: the sources, the day they were read, or a figure the page leads with. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-x-6 gap-y-3 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold font-sans text-foreground">{title}</h1>
        {children && <p className="text-muted-foreground text-sm font-sans max-w-3xl">{children}</p>}
      </div>
      {aside && <div className="text-[11px] font-sans text-muted-foreground sm:text-right shrink-0 leading-relaxed">{aside}</div>}
    </div>
  );
}
