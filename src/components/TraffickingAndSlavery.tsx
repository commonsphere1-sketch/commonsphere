/**
 * Human trafficking and modern slavery, on the Crime page.
 *
 * The page once had both as sections typed by hand, with figures that were
 * not their sources'. They are back on what is published:
 *
 *   Trafficking in persons   the victims authorities detected, who they were
 *                            and what they were trafficked for, and the
 *                            people prosecuted and convicted - UNODC's
 *                            GLOTIP data, as each country reported it
 *                            (crimeOffences.ts), summed here across the
 *                            places reporting and listed place by place
 *   Modern slavery           the estimates for any given day in 2021 that
 *                            the ILO, Walk Free and the IOM published, with
 *                            the Global Slavery Index's regions and the
 *                            countries it names, and the forms it takes as
 *                            the ILO gives them (modernSlavery.ts)
 *
 * The two are different things measured differently: a detected victim is a
 * person an authority identified and recorded; the slavery figures are
 * estimates from household surveys of people nobody has identified. The
 * section says so, and does not add one to the other.
 */
import { TRAFFICKING, OFFENCE_SOURCES, type SmallCount } from "../data/crimeOffences";
import { MODERN_SLAVERY, MODERN_SLAVERY_SOURCES } from "../data/modernSlavery";
import { ChartNote, ChartTitle, FigureRow, MeasureBars, PartsBar, PartsDonut } from "./ModalCharts";
import { TraffickingByPlace } from "./RecordedCrime";
import { SourceLink } from "./SourceLink";

const ACCENT = "#ef4444";
const whole = (n: number) => Math.round(n).toLocaleString("en-US");
/** A count UNODC withholds as "fewer than five" is left out of a sum, not guessed. */
const num = (c: SmallCount | undefined) => (typeof c === "number" ? c : 0);
const millions = (v: number) => `${v % 1 === 0 ? v : v.toFixed(1)} million`;
const share = (part: number, of: number) => `${((100 * part) / of).toFixed(1)}%`;

/** UNODC's trafficking figures, summed over the places that report them - each place's latest year. */
function traffickingTotals() {
  const all = Object.values(TRAFFICKING);
  const counted = all.filter((t): t is typeof t & { victims: number; y: number } => typeof t.victims === "number" && t.y !== undefined);
  const years = counted.map((t) => t.y);
  const sum = (pick: (t: (typeof all)[number]) => SmallCount | undefined, among = all) => among.reduce((a, t) => a + num(pick(t)), 0);
  const who = { women: sum((t) => t.women), men: sum((t) => t.men), girls: sum((t) => t.girls), boys: sum((t) => t.boys) };
  const byPurpose = counted.filter((t) => t.sexual !== undefined || t.labour !== undefined);
  const sexual = sum((t) => t.sexual, byPurpose);
  const labour = sum((t) => t.labour, byPurpose);
  const purposeBase = byPurpose.reduce((a, t) => a + t.victims, 0);
  return {
    places: counted.length,
    victims: counted.reduce((a, t) => a + t.victims, 0),
    from: Math.min(...years),
    to: Math.max(...years),
    who,
    whoTotal: who.women + who.men + who.girls + who.boys,
    sexual,
    labour,
    otherPurpose: Math.max(0, purposeBase - sexual - labour),
    purposePlaces: byPurpose.length,
    prosecuted: all.reduce((a, t) => a + num(t.prosecuted?.[0]), 0),
    prosecutedPlaces: all.filter((t) => typeof t.prosecuted?.[0] === "number").length,
    convicted: all.reduce((a, t) => a + num(t.convicted?.[0]), 0),
    convictedPlaces: all.filter((t) => typeof t.convicted?.[0] === "number").length,
  };
}
const TIP = traffickingTotals();

const S = MODERN_SLAVERY;
const w = S.world;
// The forms modern slavery takes: forced labour's three, and forced marriage. Each is rounded on its own, so the ring is on their sum.
const f = S.forcedLabourForms;
const who = S.forcedLabourWho;
const forms = [
  { label: "Forced labour in the private economy", short: "Private economy", value: f.privateEconomy },
  { label: "Forced marriage", short: "Forced marriage", value: w.forcedMarriage },
  { label: "Forced commercial sexual exploitation", short: "Sexual exploitation", value: f.sexualExploitation },
  { label: "Forced labour imposed by the state", short: "State-imposed", value: f.stateImposed },
];
const formsSum = forms.reduce((a, x) => a + x.value, 0);

/**
 * The forms modern slavery takes, in detail: the ring of the four forms, and
 * forced labour in figures - where it is, the women and girls and the children
 * in it, and the profits made from it. The ILO's own counts, read by
 * build-modern-slavery.cjs. It stands in the page's modern slavery section,
 * with the page's older card of the forms; the fuller section lower down
 * (TraffickingAndSlavery) carries the regions and the countries.
 */
export function SlaveryForms({ isLight }: { isLight: boolean }) {
  const card = {
    background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
    border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
    boxShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
  };
  return (
    <div className="rounded-2xl p-5" style={card}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <ChartTitle>The forms modern slavery takes · millions of people · {S.year}</ChartTitle>
          <PartsDonut label={`People in modern slavery by the form it takes, ${S.year}`} parts={forms.map((x) => ({ label: x.label, value: x.value, text: `${x.value}M · ${share(x.value, formsSum)}`, mid: { text: `${x.value}M`, label: x.short } }))} />
        </div>
        <div>
          <ChartTitle>Forced labour · {millions(w.forcedLabour)} people · {S.year}</ChartTitle>
          <FigureRow label="In the private economy, outside the sex trade" value={millions(f.privateEconomy)} sub={share(f.privateEconomy, w.forcedLabour)} />
          <FigureRow label="In forced commercial sexual exploitation" value={millions(f.sexualExploitation)} sub={share(f.sexualExploitation, w.forcedLabour)} />
          <FigureRow label="Imposed by the state" value={millions(f.stateImposed)} sub={share(f.stateImposed, w.forcedLabour)} />
          <FigureRow label="Women and girls among them" value={`${who.womenAndGirlsPct}%`} sub={`${millions(who.womenInSexualExploitation)} in commercial sexual exploitation, ${millions(who.womenInOtherSectors)} in other sectors`} />
          <FigureRow label="Children among them" value={`${who.childrenPct}%`} sub={millions(who.children)} />
          <FigureRow label="Illegal profits made from it" value={`US$${S.profits.billions} billion a year`} sub={`ILO, ${S.profits.report}`} />
        </div>
      </div>
      <ChartNote className="mt-4">
        These are estimates for any given day in {S.year}, built from household surveys and case records, not counts of identified people. The forms are the ILO's figures,
        each rounded on its own, so the four come to {formsSum.toFixed(1)} million against the {millions(w.people)} the estimates round to; the ring and its shares are of the
        four.
      </ChartNote>
      <SourceLink sources={[MODERN_SLAVERY_SOURCES.estimates, MODERN_SLAVERY_SOURCES.ilo]} className="mt-2" />
    </div>
  );
}

export function TraffickingAndSlavery({ isLight }: { isLight: boolean }) {
  const head = isLight ? "#0f172a" : "#f1f0ff";
  const muted = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const card = {
    background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
    border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.08)",
    boxShadow: isLight ? "var(--card-glow), 0 1px 10px rgba(0,0,0,0.07)" : "var(--card-glow)",
  };
  const tile = { background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)", border: isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)" };
  const Tile = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
    <div className="rounded-xl px-3 py-2.5 min-w-0" style={tile}>
      <p className="text-[9px] font-mono uppercase tracking-widest leading-snug" style={{ color: muted }}>
        {label}
      </p>
      <p className="text-lg font-bold font-mono leading-tight mt-1" style={{ color: head }}>
        {value}
      </p>
      <p className="text-[10px] font-sans leading-snug mt-0.5" style={{ color: muted }}>
        {sub}
      </p>
    </div>
  );

  return (
    <section className="flex flex-col gap-4" aria-labelledby="crime-trafficking">
      <div id="crime-trafficking">
        <h2 className="text-lg font-bold font-sans leading-tight" style={{ color: head }}>
          Human trafficking and modern slavery
        </h2>
        <p className="text-[11px] font-sans mt-0.5" style={{ color: muted }}>
          The victims of trafficking that authorities detected, as countries report them to UNODC; and the estimates of people in forced labour and forced marriage,
          from the ILO, Walk Free and the IOM. The first counts people who were found, the second estimates people who were not: they are not added together.
        </p>
      </div>

      {/* ── Trafficking in persons: the world's reported totals ── */}
      <div className="rounded-2xl p-5" style={card}>
        <ChartTitle>
          Trafficking in persons · victims detected · {TIP.places} places, each for its latest year reported ({TIP.from}–{TIP.to}) · UNODC
        </ChartTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <Tile label="Victims detected" value={whole(TIP.victims)} sub={`across the ${TIP.places} places reporting a count`} />
          <Tile label="Trafficked for sexual exploitation" value={share(TIP.sexual, TIP.sexual + TIP.labour + TIP.otherPurpose)} sub={`${whole(TIP.sexual)} of the victims in the ${TIP.purposePlaces} places that say what for`} />
          <Tile label="Prosecuted for trafficking" value={whole(TIP.prosecuted)} sub={`people, in the ${TIP.prosecutedPlaces} places reporting`} />
          <Tile label="Convicted of trafficking" value={whole(TIP.convicted)} sub={`people, in the ${TIP.convictedPlaces} places reporting`} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <ChartTitle>Who the detected victims were · share of those given by sex and age</ChartTitle>
            <PartsBar
              label="Detected victims of trafficking by sex and age"
              parts={[
                { label: "Women", value: TIP.who.women, text: `${share(TIP.who.women, TIP.whoTotal)} · ${whole(TIP.who.women)}` },
                { label: "Men", value: TIP.who.men, text: `${share(TIP.who.men, TIP.whoTotal)} · ${whole(TIP.who.men)}` },
                { label: "Girls", value: TIP.who.girls, text: `${share(TIP.who.girls, TIP.whoTotal)} · ${whole(TIP.who.girls)}` },
                { label: "Boys", value: TIP.who.boys, text: `${share(TIP.who.boys, TIP.whoTotal)} · ${whole(TIP.who.boys)}` },
              ]}
            />
          </div>
          <div>
            <ChartTitle>What they were trafficked for · share of victims in the places that say</ChartTitle>
            <PartsBar
              label="Detected victims of trafficking by the purpose they were trafficked for"
              columns={1}
              parts={[
                { label: "Sexual exploitation", value: TIP.sexual, text: `${share(TIP.sexual, TIP.sexual + TIP.labour + TIP.otherPurpose)} · ${whole(TIP.sexual)}` },
                { label: "Forced labour", value: TIP.labour, text: `${share(TIP.labour, TIP.sexual + TIP.labour + TIP.otherPurpose)} · ${whole(TIP.labour)}` },
                { label: "Other purposes, or not given", value: TIP.otherPurpose, text: `${share(TIP.otherPurpose, TIP.sexual + TIP.labour + TIP.otherPurpose)} · ${whole(TIP.otherPurpose)}` },
              ]}
            />
          </div>
        </div>
        <ChartNote className="mt-3">
          Sums of what each place reported for its own latest year, so the years differ; a count UNODC withholds as "fewer than five" is left out. A detected victim
          is one an authority identified: countries that look harder find more, so these totals measure detection as much as trafficking.
        </ChartNote>
        <SourceLink sources={OFFENCE_SOURCES.trafficking} className="mt-2" />
      </div>

      {/* ── Place by place ── */}
      <TraffickingByPlace isLight={isLight} />

      {/* ── Modern slavery: the published estimates ── */}
      <div className="rounded-2xl p-5" style={card}>
        <ChartTitle>Modern slavery · estimates for any given day in {S.year} · ILO, Walk Free and IOM</ChartTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          <Tile label="People in modern slavery" value={millions(w.people)} sub={`on any given day in ${S.year}`} />
          <Tile label="In forced labour" value={millions(w.forcedLabour)} sub="made to work under threat or coercion" />
          <Tile label="In forced marriage" value={millions(w.forcedMarriage)} sub="married without consent" />
          <Tile label="Children among them" value={`Over ${millions(w.childrenOver)}`} sub="of all people in modern slavery" />
          <Tile label="Women and girls" value={`${w.womenAndGirlsPct}%`} sub="of all people in modern slavery" />
          <Tile label="Since the 2016 estimates" value={`+${millions(w.risenSince2016)}`} sub="more people forced to work or to marry" />
        </div>

        <ChartNote className="mb-4">The forms modern slavery takes, and forced labour in figures, are drawn above, with the page's Forms of Modern Slavery.</ChartNote>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <ChartTitle>By region · people in modern slavery for every thousand · {S.year}</ChartTitle>
            <MeasureBars
              color={ACCENT}
              label={`Prevalence of modern slavery by region, ${S.year}`}
              rows={[...S.regions]
                .sort((a, b) => b.per1000 - a.per1000)
                .map((r) => ({ label: r.name, value: r.per1000, text: `${r.per1000}`, sub: `forced labour ${r.labourPer1000}, forced marriage ${r.marriagePer1000}` }))}
            />
          </div>
          <div>
            <ChartTitle>By region · people in modern slavery, millions · {S.year}</ChartTitle>
            <MeasureBars
              color={ACCENT}
              label={`People in modern slavery by region, ${S.year}`}
              rows={[...S.regions].sort((a, b) => b.millions - a.millions).map((r) => ({ label: r.name, value: r.millions, text: `${r.millions}M`, sub: share(r.millions, S.regions.reduce((a, x) => a + x.millions, 0)) + " of the five" }))}
            />
          </div>
          <div>
            <ChartTitle>The ten countries with the largest estimated numbers · millions · {S.year}</ChartTitle>
            <MeasureBars color={ACCENT} label="The ten countries with the largest estimated numbers of people in modern slavery" rows={S.largest.map((c) => ({ label: c.country, value: c.millions, text: `${c.millions}M` }))} />
          </div>
          <div>
            <ChartTitle>The ten countries with the highest prevalence · highest first</ChartTitle>
            <ol className="grid grid-cols-2 gap-x-4 gap-y-1 list-decimal list-inside">
              {S.highestPrevalence.map((c) => (
                <li key={c} className="text-[11px] font-sans" style={{ color: head }}>
                  {c}
                </li>
              ))}
            </ol>
            <ChartTitle className="mt-4">The ten with the lowest</ChartTitle>
            <p className="text-[11px] font-sans leading-relaxed" style={{ color: head }}>
              {S.lowestPrevalence.join(", ")}.
            </p>
          </div>
        </div>

        <ChartNote className="mt-4">
          These are estimates, built from household surveys and case records, not counts of identified people.
          Each bar is on the scale of the largest figure in its chart. The regions are the Global Slavery Index's; it names the highest- and lowest-prevalence countries but prints their rates only in a chart, so they are
          listed by name. It gives a figure for every country only on request, and the site does not hold that dataset.
        </ChartNote>
        <SourceLink sources={[MODERN_SLAVERY_SOURCES.estimates, MODERN_SLAVERY_SOURCES.ilo, MODERN_SLAVERY_SOURCES.index]} className="mt-2" />
      </div>
    </section>
  );
}
