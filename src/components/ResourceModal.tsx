import { useEffect } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { RESOURCE_DETAILS } from "../data/resourceDetails";
import { RESOURCE_PRODUCERS } from "../data/resourceProducers";
import { ENERGY_PRODUCERS } from "../data/energyProducers";
import { OTHER_PRODUCERS } from "../data/otherProducers";
import type { Amount, ProducerUnit, ResourceProducers, Share } from "../data/resourceProducerTypes";
import { SourceLink } from "./SourceLink";

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
 * An amount in its own unit, read at a glance. Oil is in barrels and gas in
 * cubic metres as published; nothing is converted into a unit its source did
 * not use.
 */
function fmtAmount(a: Amount, unit: ProducerUnit): string {
  const v = a.value;
  const pre = a.lowerBound ? ">" : "";
  switch (unit) {
    case "t":
      if (v >= 1e9) return `${pre}${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)} bn t`;
      if (v >= 1e6) return `${pre}${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)} Mt`;
      return `${pre}${Math.round(v).toLocaleString()} t`;
    case "kb/d":
      // Thousand barrels a day; a million or more reads better as mb/d.
      return v >= 1000
        ? `${pre}${(v / 1000).toFixed(1)} mb/d`
        : `${pre}${Math.round(v).toLocaleString()} kb/d`;
    case "mb":
      // Million barrels; the large holders read better in billions.
      return v >= 1000
        ? `${pre}${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} bn bbl`
        : `${pre}${Math.round(v).toLocaleString()} m bbl`;
    case "bcm":
      return v >= 1000
        ? `${pre}${(v / 1000).toFixed(1)} tcm`
        : `${pre}${v >= 10 ? Math.round(v).toLocaleString() : v.toFixed(1)} bcm`;
  }
}

function fmtShare(s: Share | null): string | null {
  if (!s) return null;
  const mark = s.bound === "atMost" ? "≤" : s.bound === "atLeast" ? "≥" : "";
  return `${mark}${s.pct}%`;
}

/** Every commodity with a country table: USGS minerals, then energy. */
const PRODUCERS: Record<string, ResourceProducers> = {
  ...RESOURCE_PRODUCERS,
  ...ENERGY_PRODUCERS,
  ...OTHER_PRODUCERS,
};

/**
 * Every country the source lists for the commodity: its production and its
 * reserves, each with its share of the world. From resourceProducers.ts
 * (USGS) and energyProducers.ts (EIA, OPEC). A commodity without a table
 * renders nothing here rather than a table of guesses.
 */
function ProducerTable({ name }: { name: string }) {
  const p = PRODUCERS[name];
  if (!p) return null;
  const hasReserves = p.worldReserves !== null && p.reservesUnit !== null;
  const cols = hasReserves ? "grid-cols-[1fr_auto_auto]" : "grid-cols-[1fr_auto]";
  const years =
    hasReserves && p.reservesYear && p.reservesYear !== p.productionYear
      ? `production ${p.productionYear} · ${(p.reservesLabel ?? "reserves").toLowerCase()} ${p.reservesYear}`
      : p.productionYear;

  return (
    <>
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
        Countries · {years}
      </p>
      <div className="modal-tile rounded-xl p-3">
        <div className={`grid ${cols} gap-x-4 pb-1.5 mb-1 border-b border-border/50`}>
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Country</span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-right">
            Production
          </span>
          {hasReserves && (
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-right">
              {p.reservesLabel ?? "Reserves"}
            </span>
          )}
        </div>
        {p.countries.map((c) => (
          <div key={c.name} className={`grid ${cols} gap-x-4 py-1 items-baseline`}>
            <span className="text-[11px] font-sans text-foreground">{c.name}</span>
            <span className="text-[11px] font-mono text-foreground text-right">
              {c.production ? (
                <>
                  {fmtAmount(c.production, p.productionUnit)}
                  {p.estimated?.includes(c.name) && (
                    <span className="text-muted-foreground"> est.</span>
                  )}
                  {c.productionShare && (
                    <span className="text-muted-foreground"> · {fmtShare(c.productionShare)}</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">{c.productionWithheld ? "withheld" : "—"}</span>
              )}
            </span>
            {hasReserves && (
              <span className="text-[11px] font-mono text-foreground text-right">
                {c.reserves ? (
                  <>
                    {fmtAmount(c.reserves, p.reservesUnit!)}
                    {c.reservesShare && (
                      <span className="text-muted-foreground"> · {fmtShare(c.reservesShare)}</span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            )}
          </div>
        ))}
        <div className={`grid ${cols} gap-x-4 pt-1.5 mt-1 border-t border-border/50`}>
          <span className="text-[11px] font-sans font-semibold text-foreground">World</span>
          <span className="text-[11px] font-mono font-semibold text-foreground text-right">
            {fmtAmount(p.worldProduction, p.productionUnit)}
          </span>
          {hasReserves && p.worldReserves && (
            <span className="text-[11px] font-mono font-semibold text-foreground text-right">
              {fmtAmount(p.worldReserves, p.reservesUnit!)}
            </span>
          )}
        </div>
        <p className="text-[9px] font-sans text-muted-foreground mt-2 leading-snug">
          {p.measure}, with each country's share of the world.
          {p.countries.some((c) => c.productionWithheld) &&
            " “Withheld” means the figure is not published, to protect company data — not that there is none."}
          {p.worldReserves?.lowerBound &&
            " The world reserve total is a minimum, so a share of it (≤) is an upper bound."}
          {p.notes?.map((n) => ` ${n}`)}
        </p>
        <SourceLink sources={p.sources} className="mt-1" />
      </div>
    </>
  );
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  window.open(`/dashboard/resources/${resource.name.toLowerCase()}`, "_blank");
                }}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                title="Open in new tab"
                aria-label="Expand"
              >
                <ArrowUpRight size={14} weight="bold" />
              </button>
              <button
                onClick={onClose}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <span className="text-xs font-sans font-medium">Close</span>
              </button>
            </div>
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

              {/* ── Countries ── */}
              <ProducerTable name={resource.name} />

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
