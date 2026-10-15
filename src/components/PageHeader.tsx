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
import { SiteMark } from "./SiteMark";

export function PageHeader({
  title,
  className = "",
}: {
  title: ReactNode;
  /** The line that stood under the name: no longer drawn, as asked, and kept only so that the pages' calls need not change. */
  children?: ReactNode;
  /** What stood at the right, small - sources, the day they were read, a figure: no longer drawn, as asked, only the name is left at the top. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-x-6 gap-y-3 ${className}`}>
      <div className="min-w-0">
        {/* The site's globe on the left of the name, and only the name, as asked: the line of writing that stood under it is no longer drawn. */}
        <h1 className="text-2xl font-bold font-sans text-foreground flex items-center gap-3">
          <SiteMark />
          {title}
        </h1>
      </div>
    </div>
  );
}
