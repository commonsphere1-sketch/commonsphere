/**
 * SourceLink.tsx
 * Small reusable citation component placed under displayed data.
 * Renders a subtle hyperlink with an external-link icon so users can
 * verify where a statistic comes from.
 */
import React from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";

interface Source {
  label: string;
  url: string;
}

interface SourceLinkProps {
  sources: Source | Source[];
  className?: string;
}

export function SourceLink({ sources, className = "" }: SourceLinkProps) {
  const list = Array.isArray(sources) ? sources : [sources];

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 ${className}`}
      aria-label="Data sources"
    >
      <span className="text-[9px] font-sans text-muted-foreground/60 uppercase tracking-wider shrink-0">
        Source:
      </span>
      {list.map((src, i) => (
        <a
          key={i}
          href={src.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/60 hover:text-secondary transition-colors underline underline-offset-2 decoration-dotted"
          title={`Open ${src.label}`}
        >
          {src.label}
          <ArrowSquareOut size={8} className="shrink-0 opacity-70" />
        </a>
      ))}
    </div>
  );
}
