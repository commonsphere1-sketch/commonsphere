/**
 * Under a commodity's price on the Dashboard: what it is used for, and who
 * has it - where it is found, the countries that produce the most, and those that hold the most
 * in the ground.
 *
 * Who has it is read from the same country tables the Resources window lists
 * (resourceProducers.ts, energyProducers.ts, otherProducers.ts - the US
 * Geological Survey's and the other agencies' own figures, each with its
 * year), through that window's own helpers, so this card and that window
 * cannot disagree. A bar is on the scale of the largest country shown. What
 * it is used for is the site's own background (resourceDetails.ts), which is
 * kept to what is settled and can be said without a number.
 *
 * Loaded with its tables when the card is shown, so the Dashboard does not
 * carry them before then.
 */
import { RESOURCE_DETAILS } from "../data/resourceDetails";
import type { Tokens } from "./DataExplorer";
import { leadingHolders, leadingProducers, producerFacts, producerSources } from "./ResourceModal";
import { SourceLink } from "./SourceLink";

type Bar = { name: string; value: number; amount: string; share: string | null };

/** Countries as bars on one scale, the largest filling the track: a name, its bar, its amount and its share of the world's. */
function Bars({ t, rows, color, label }: { t: Tokens; rows: Bar[]; color: string; label: string }) {
  const top = Math.max(0, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-1" aria-label={label}>
      {rows.map((r, i) => (
        <li key={r.name} className="flex items-center gap-2 min-w-0" title={`${r.name}: ${r.amount}${r.share ? `, ${r.share} of the world's` : ""}`}>
          <span className={`text-[10px] font-sans flex-1 min-w-0 truncate ${i === 0 ? "font-bold" : ""}`} style={{ color: t.headText }}>
            {r.name}
          </span>
          <span className="w-20 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: t.isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)" }} aria-hidden>
            <span className="block h-full rounded-full" style={{ width: `${top > 0 ? Math.max(1.5, (100 * r.value) / top) : 0}%`, background: color, opacity: i === 0 ? 1 : 0.6 }} />
          </span>
          <span className="text-[10px] font-mono text-right shrink-0 min-w-[6.5rem]" style={{ color: t.headText }}>
            {r.amount}
            {r.share && <span style={{ color: t.mutedText }}> · {r.share}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const Kicker = ({ t, children }: { t: Tokens; children: string }) => (
  <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: t.mutedText }}>
    {children}
  </p>
);

export default function CommodityBackground({ name, t, color }: { name: string; t: Tokens; color: string }) {
  const detail = RESOURCE_DETAILS[name];
  const facts = producerFacts(name);
  const producers = leadingProducers(name, 5);
  const holders = leadingHolders(name, 5);
  if (!detail && !facts) return null;
  return (
    <div className="mt-2 flex flex-col gap-2">
      {detail && (
        <div>
          <Kicker t={t}>What it is used for</Kicker>
          <p className="text-[10px] font-sans leading-snug" style={{ color: t.bodyText }}>
            {detail.summary}
          </p>
          <ul className="flex flex-col gap-0.5 mt-1">
            {detail.uses.slice(0, 4).map((u) => (
              <li key={u.label} className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                <span className="font-semibold" style={{ color: t.headText }}>
                  {u.label}
                </span>{" "}
                · {u.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
      {detail && detail.deposits.length > 0 && (
        <div>
          <Kicker t={t}>Where it is found</Kicker>
          <ul className="flex flex-col gap-0.5">
            {detail.deposits.slice(0, 3).map((d) => (
              <li key={d.place} className="text-[10px] font-sans leading-snug" style={{ color: t.mutedText }}>
                <span className="font-semibold" style={{ color: t.headText }}>
                  {d.place}
                </span>{" "}
                · {d.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
      {facts && producers.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),1fr))] gap-x-6 gap-y-2">
          <div className="min-w-0">
            <Kicker t={t}>{`Who produces it · ${facts.outputYear} · world ${facts.output}`}</Kicker>
            <Bars t={t} rows={producers} color={color} label={`The countries that produce the most ${name.toLowerCase()}`} />
          </div>
          {/* The second column is reserves for most, resources for uranium, and exports for wheat: it is called what it is. */}
          {holders.length > 0 && facts.held && (
            <div className="min-w-0">
              <Kicker t={t}>{`${facts.heldLabel === "exports" ? "Who exports it" : `Who holds it · ${facts.heldLabel}`}${facts.heldYear ? ` · ${facts.heldYear}` : ""} · world ${facts.held}`}</Kicker>
              <Bars t={t} rows={holders} color={color} label={`The countries with the largest ${facts.heldLabel} of ${name.toLowerCase()}`} />
            </div>
          )}
        </div>
      )}
      {facts && producers.length > 0 && (
        <p className="text-[9px] font-sans leading-snug" style={{ color: t.mutedText }}>
          As counted: {facts.measure}. A share is of the world's total.
        </p>
      )}
      {facts && <SourceLink sources={producerSources(name)} />}
    </div>
  );
}
