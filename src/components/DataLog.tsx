/**
 * The Dashboard's data log: when each of the site's data sets was last read
 * from its sources, newest first, with whose figures they are and the page
 * that shows them - and, above them, when the live refresh last checked the
 * sources and how many figures it has moved on since the site was built.
 *
 * It stands where an "Event Log" stood: five news events typed by hand, the
 * newest from July 2025. The site's headlines are read live elsewhere; this
 * is the log the site can keep truthfully, of its own data. The dates are
 * read from the data files themselves (dataLog.ts, build-data-log.cjs), and
 * the live line from the refresh's own status. Nothing is typed in here.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Database } from "@phosphor-icons/react";
import { DATA_LOG, DATA_LOG_FILES } from "../data/dataLog";
import { useLiveStatus } from "../lib/liveFigures";
import { useTokens } from "./DataExplorer";

const COLOR = "#0ea5e9";
/** How many data sets the card lists before "Show all". */
const FIRST = 6;

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function DataLog() {
  const t = useTokens();
  const navigate = useNavigate();
  const { lastChecked, patched } = useLiveStatus();
  const [all, setAll] = useState(false);
  const rows = all ? DATA_LOG : DATA_LOG.slice(0, FIRST);
  return (
    <div className="rounded-2xl p-5" style={{ background: t.cardBg, border: t.cardBorder, boxShadow: t.cardShadow }}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Database size={16} weight="fill" style={{ color: COLOR }} aria-hidden />
          <h2 className="text-base font-bold font-sans" style={{ color: t.headText }}>
            Data log
          </h2>
        </div>
        <span className="text-[9px] font-mono px-2 py-1 rounded-full shrink-0" style={{ background: COLOR + "15", color: COLOR }}>
          {DATA_LOG.length} data sets · {DATA_LOG_FILES} files
        </span>
      </div>
      <p className="text-[11px] font-sans leading-snug mb-3" style={{ color: t.mutedText }}>
        When each of the site's data sets was last read from its sources, newest first.
      </p>

      {/* The live refresh, in its own words: when it last looked, and what it changed. */}
      <div className="rounded-xl px-3 py-2 mb-2" style={{ background: t.tile, border: `1px solid ${t.gridLine}` }}>
        <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>
          Live refresh
        </p>
        <p className="text-[11px] font-sans leading-snug mt-0.5" style={{ color: t.bodyText }}>
          {lastChecked ? (
            <>
              Sources last checked{" "}
              <span className="font-mono font-bold" style={{ color: t.headText }}>
                {lastChecked.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, {lastChecked.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {" · "}
              {patched > 0 ? (
                <>
                  <span className="font-mono font-bold" style={{ color: t.headText }}>
                    {patched.toLocaleString("en-US")}
                  </span>{" "}
                  figure{patched === 1 ? "" : "s"} moved on to a newer period since the site was built
                </>
              ) : (
                "no figure has a newer period than the one the site was built with"
              )}
              .
            </>
          ) : (
            "The figures shown are the ones the site was built with; the live refresh has not reported in this browser."
          )}
        </p>
      </div>

      <ul className="flex flex-col">
        {rows.map((e, i) => (
          <li key={e.what} className="flex items-start gap-3 py-2.5" style={{ borderBottom: i < rows.length - 1 ? `1px solid ${t.gridLine}` : "none" }}>
            <span className="text-[10px] font-mono w-[4.75rem] shrink-0 pt-0.5" style={{ color: t.mutedText }}>
              {day(e.read)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold font-sans leading-snug" style={{ color: t.headText }}>
                {e.what}
              </span>
              <span className="block text-[10px] font-sans leading-snug mt-0.5" style={{ color: t.mutedText }}>
                {e.from}
              </span>
            </span>
            <button
              type="button"
              onClick={() => navigate(e.page)}
              title={`Open ${e.where}`}
              className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full shrink-0 transition-opacity hover:opacity-70 cursor-pointer"
              style={{ background: COLOR + "15", color: COLOR }}
            >
              {e.where} <ArrowRight size={8} weight="bold" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {DATA_LOG.length > FIRST && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          aria-expanded={all}
          className="mt-2 text-[10px] font-sans font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
          style={{ background: t.tile, border: `1px solid ${t.gridLine}`, color: t.headText }}
        >
          {all ? `Show the newest ${FIRST}` : `Show all ${DATA_LOG.length}`}
        </button>
      )}
      <p className="text-[9px] font-sans leading-snug mt-2" style={{ color: t.mutedText }}>
        A date is the day the site's build read the source, taken from the data file itself. Headlines are apart from this: they are read from their feeds every half hour.
      </p>
    </div>
  );
}
