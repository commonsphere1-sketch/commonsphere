import React, { useEffect } from "react";
import { RESOURCE_DETAILS } from "../data/resourceDetails";

export interface ResourceSummary {
  name: string;
  unit: string;
  price: number;
  change: number;
  holder: string;
  reserve: string;
  color: string;
}

/**
 * Detail view for a commodity card: what it is used for, where it comes out
 * of the ground, and how it is priced.
 *
 * Follows the page's existing modal shape — scrim, .modal-glass panel,
 * gradient header — so it reads as part of the same family as the economy
 * modal rather than a new pattern.
 */
export function ResourceModal({
  resource,
  onClose,
}: {
  resource: ResourceSummary;
  onClose: () => void;
}) {
  const detail = RESOURCE_DETAILS[resource.name];

  // Escape closes, and the page behind must not scroll while this is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const up = resource.change >= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${resource.name} detail`}
    >
      <div className="relative z-10 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl animate-fade-in modal-glass border overflow-y-auto">
        <div className="p-6">
          {/* ── Header ── */}
          <div className="relative flex items-start justify-between -mx-6 -mt-6 px-6 pt-6 pb-5 rounded-t-2xl overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, ${resource.color}33, ${resource.color}14, ${resource.color}26)`,
              }}
            />
            <div className="relative">
              <h2 className="text-xl font-bold font-sans text-foreground leading-tight">
                {resource.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="text-lg font-bold font-mono"
                  style={{ color: resource.color }}
                >
                  {resource.price.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {resource.unit}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                    up
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {up ? "+" : ""}
                  {resource.change}%
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <span className="text-xs font-sans font-medium">Close</span>
            </button>
          </div>

          {detail ? (
            <>
              <p className="text-[13px] font-sans leading-relaxed text-muted-foreground mt-5">
                {detail.summary}
              </p>

              {/* ── Headline holdings ── */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="modal-tile rounded-xl p-3">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                    Top Holder
                  </p>
                  <p className="text-sm font-semibold font-sans text-foreground">
                    {resource.holder}
                  </p>
                </div>
                <div className="modal-tile rounded-xl p-3">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                    Reserve
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {resource.reserve}
                  </p>
                </div>
              </div>

              {/* ── Uses ── */}
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
                What it is used for
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detail.uses.map((u) => (
                  <div key={u.label} className="modal-tile rounded-xl p-3">
                    <p className="text-[11px] font-bold font-sans text-foreground mb-0.5">
                      {u.label}
                    </p>
                    <p className="text-[11px] font-sans leading-relaxed text-muted-foreground">
                      {u.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* ── Deposits ── */}
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
                Where it comes from
              </p>
              <div className="flex flex-col gap-2">
                {detail.deposits.map((d) => (
                  <div key={d.place} className="flex gap-2.5">
                    <div
                      className="w-1 rounded-full shrink-0 mt-1"
                      style={{ background: resource.color, minHeight: 14 }}
                    />
                    <div>
                      <p className="text-[11px] font-bold font-sans text-foreground">
                        {d.place}
                      </p>
                      <p className="text-[11px] font-sans leading-relaxed text-muted-foreground">
                        {d.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Value ── */}
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
                How it is valued
              </p>
              <div className="flex flex-col gap-2">
                {detail.value.map((v, i) => (
                  <div
                    key={i}
                    className="modal-tile rounded-xl p-3 text-[11px] font-sans leading-relaxed text-muted-foreground"
                  >
                    {v}
                  </div>
                ))}
              </div>

              <p className="text-[9px] font-sans text-muted-foreground mt-5 pt-3 border-t border-border/40">
                Prices and shares are indicative and move year to year. Reserve
                and output rankings are approximate.
              </p>
            </>
          ) : (
            <p className="text-[13px] font-sans text-muted-foreground mt-5">
              No background is recorded for this commodity yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
