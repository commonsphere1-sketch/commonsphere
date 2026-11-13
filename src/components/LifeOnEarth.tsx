/**
 * Life on Earth, as asked moved from the Climate page to the Worldview page: species found and lost, ecosystems recovering
 * and dying, what ecological projects have done (data/lifeOnEarth.ts), and the lists of newly described and endangered
 * species - which follow the place chosen on the Worldview map (`where`), with "All the world" a press away.
 */
import { Leaf } from "@phosphor-icons/react";
import { SourceLink } from "./SourceLink";
import { EndangeredSpeciesList, NewSpeciesList, type SpeciesWhere } from "./SpeciesLists";
import { useTheme } from "../contexts/ThemeContext";
import type { FigureCard } from "../data/climateFigures";
import { LIFE_CARDS, LIFE_CHECKED } from "../data/lifeOnEarth";

/* ─── Figure card ───────────────────────────────────────────────────────── */
function FigureCardView({
  card,
  isLight,
  headText,
  mutedText,
  gridLine,
  wide = false,
}: {
  card: FigureCard;
  isLight: boolean;
  headText: string;
  mutedText: string;
  gridLine: string;
  /** Across the whole row, its rows in two columns, as asked for the ecological projects. */
  wide?: boolean;
}) {
  const tile = isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.04)";
  const track = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)";
  return (
    <div className={`bg-card border border-border rounded-2xl p-5 flex flex-col ${wide ? "lg:col-span-2" : ""}`}>
      <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: mutedText }}>
        {card.kicker}
      </p>
      <h3 className="text-sm font-bold font-sans mb-3" style={{ color: headText }}>
        {card.title}
      </h3>

      {card.figures && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {card.figures.map((f) => (
            <div key={f.label} className="rounded-xl px-3 py-2.5" style={{ background: tile, border: `1px solid ${gridLine}` }}>
              <p className="text-[15px] font-bold font-mono leading-tight" style={{ color: headText }}>
                {f.value}
              </p>
              <p className="text-[9px] font-sans leading-tight mt-0.5" style={{ color: mutedText }}>
                {f.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {card.bars && (
        <div className="mb-3">
          <div className="flex flex-col gap-2">
            {card.bars.rows.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="text-[9px] font-sans w-28 shrink-0 font-semibold leading-tight" style={{ color: headText }}>
                  {r.label}
                </span>
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: track }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (r.value / card.bars!.max) * 100)}%`, background: r.color }} />
                </div>
                <span className="text-[10px] font-bold font-mono text-right shrink-0 whitespace-nowrap" style={{ color: headText }}>
                  {r.display}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] font-sans mt-2" style={{ color: mutedText }}>
            {card.bars.caption}
          </p>
        </div>
      )}

      {card.events && (
        <div className={wide ? "grid grid-cols-1 md:grid-cols-2 gap-x-8 mb-3" : "flex flex-col gap-0 mb-3"}>
          {card.events.map((e, i) => (
            <div
              key={e.title}
              className="py-2"
              style={{ borderBottom: i < card.events!.length - 1 ? `1px solid ${gridLine}` : "none" }}
            >
              <p className="text-[10px] font-bold font-sans" style={{ color: headText }}>
                {e.title}
              </p>
              <p className="text-[9px] font-sans" style={{ color: mutedText }}>
                {e.detail}
              </p>
            </div>
          ))}
        </div>
      )}

      {card.callout && (
        <div className="rounded-xl px-3 py-2.5 mb-1" style={{ background: card.callout.color + "12", border: `1px solid ${card.callout.color}25` }}>
          <p className="text-[10px] font-bold font-sans" style={{ color: card.callout.color }}>
            {card.callout.title}
          </p>
          <p className="text-[9px] font-sans mt-0.5" style={{ color: mutedText }}>
            {card.callout.body}
          </p>
        </div>
      )}

      <SourceLink sources={card.sources} className="mt-auto pt-3" />
    </div>
  );
}

export function LifeOnEarth({ where }: { where?: SpeciesWhere }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const mutedText = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)";
  return (
    <section aria-label="Life on Earth">
  {/* ── LIFE ON EARTH ────────────────────────────────────────────────
      Species found and lost, ecosystems recovering and dying, and what
      ecological projects have done; see data/lifeOnEarth.ts. */}
  <div id="life" className="flex items-center gap-3 mb-2 scroll-mt-24">
    <Leaf size={16} weight="fill" className="text-emerald-500" />
    <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-500">Life on Earth: species, ecosystems and ecological projects</span>
    <div className="flex-1 h-px bg-border" />
  </div>
  <p className="text-[11px] font-sans mb-4 max-w-4xl" style={{ color: mutedText }}>
    Species discovered and species lost, ecosystems that are recovering and ecosystems that are dying, and what the projects meant to protect them have done. Each
    figure is from the source its card links to, read on {LIFE_CHECKED}; where a source gives no figure, the card says so.
  </p>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    {LIFE_CARDS.map((card) => (
      <FigureCardView key={card.id} card={card} isLight={isLight} headText={headText} mutedText={mutedText} gridLine={gridLine} wide={card.id === "restoration"} />
    ))}
    {/* The species themselves: those newly named, and those endangered with about how many are left. */}
    <NewSpeciesList where={where} />
    <EndangeredSpeciesList where={where} />
  </div>
    </section>
  );
}
