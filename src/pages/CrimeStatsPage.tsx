/**
 * Crime and justice in figures: homicide, recorded crime, prisons and
 * terrorism, each from the body that counts it.
 *
 *   World Bank (UNODC's series)   the world's homicide rate, year by year,
 *                                 and by region (worldview.ts, regionSeries.ts)
 *   UNODC                         each country's homicide rate with its year
 *                                 (countryCrime.ts), and what police, courts
 *                                 and customs record (RecordedCrime)
 *   World Prison Brief            each country's prison population rate,
 *                                 with the date of the count (prisonRates.ts)
 *   Global Terrorism Database     attacks and deaths in the world, to the
 *                                 last year it has published (worldview.ts)
 *
 * What this page replaced. It was built on tables typed by hand, and they
 * did not hold up against the sources they named. The terrorism series
 * matched neither the Global Terrorism Database nor itself from year to
 * year; the regional slavery figures, the "government response" scores and
 * the split of forced labour's profits were not the Global Slavery Index's
 * or the ILO's for the years given; the terrorism index scores were not the
 * index's. A "global crime trend" indexed to 100, a "safety index" credited
 * to two publishers at once, regional rates of burglary and car theft, and
 * cybercrime losses by region are published by nobody. A dual-axis chart set
 * deaths against incidents on two scales. All of it is gone; nothing typed
 * stands in for it. Modern slavery and the terrorism index can return when a
 * build script reads them from their publishers.
 *
 * A rank here is among the places that report, each for its own latest
 * year, and the lists say which years. A small population makes a rate jump
 * on a handful of cases, so the country lists start with places of a
 * million people or more; all places are one press away.
 */
import { ShieldCheck } from "@phosphor-icons/react";
import { HeadlinesBanner } from "../components/HeadlinesBanner";
import { RecordedCrime } from "../components/RecordedCrime";
import { TraffickingAndSlavery } from "../components/TraffickingAndSlavery";
import { JusticeSection } from "../components/JusticeSection";
import { ACCENT, RankCard, SectionHead, useLook, type Ranked } from "../components/CrimeParts";
import { StatCard, type StatCardData } from "../components/StatCard";
import { CategoryCharts } from "../components/CategoryCharts";
import { countriesData } from "../data/countriesData";
import { COUNTRY_CRIME, CRIME_SOURCE } from "../data/countryCrime";
import { PRISON_RATES, PRISON_RATES_SOURCE } from "../data/prisonRates";
import { WORLD, type WorldIndicator } from "../data/worldview";

const PLACE = new Map(countriesData.map((c) => [c.id, c]));
/** Every place with a homicide rate from UNODC, with the year it is for. */
const HOMICIDE: Ranked[] = Object.entries(COUNTRY_CRIME).flatMap(([id, c]) => {
  const place = PLACE.get(id);
  return c.homicide && place ? [{ id, name: place.name, population: place.population, value: c.homicide.v, text: `${c.homicide.v}`, sub: c.homicide.y }] : [];
});
/** Every place with a prison population rate from the World Prison Brief, with the date of its count. */
const PRISONS: Ranked[] = Object.entries(PRISON_RATES).flatMap(([id, p]) => {
  const place = PLACE.get(id);
  return place ? [{ id, name: place.name, population: place.population, value: p.v, text: `${p.approx ? "c. " : ""}${p.v.toLocaleString("en-US")}`, sub: p.at }] : [];
});
const compact = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.round(v).toLocaleString("en-US"));
const print = (ind: WorldIndicator, v: number) => (ind.format === "count" ? compact(v) : Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-US") : v.toFixed(ind.dp));
const publisher = (label: string) => label.split(/ \(| — /)[0];

/** A world series as a card: its latest figure, what it counts, its series, and its change on the year before - two published figures. */
function worldCard(id: string): StatCardData | null {
  const ind = WORLD[id];
  if (!ind || ind.series.length < 3) return null;
  const s = ind.series;
  const [year, value] = s[s.length - 1];
  const [prevYear, prev] = s[s.length - 2];
  const d = value - prev;
  const same = print(ind, value) === print(ind, prev);
  return {
    label: ind.label,
    value: print(ind, value),
    sub: `${ind.unit} · ${publisher(ind.source.label)} · ${year}`,
    about: ind.note,
    series: s,
    fmt: (v) => print(ind, v),
    color: ACCENT,
    source: ind.source,
    // More killing is for the worse; less, for the better.
    change: same ? { chip: "no change", caption: `on ${prevYear}`, dir: "flat" } : { chip: `${d > 0 ? "+" : "−"}${print(ind, Math.abs(d))}`, caption: `on ${prevYear}`, dir: d > 0 ? "up" : "down", verdict: d > 0 ? "worse" : "better" },
  };
}

export function CrimeStatsPage() {
  const look = useLook();
  const { isLight, head, muted } = look;
  const homicide = WORLD.homicide;
  const [homYear, homRate] = homicide.series[homicide.series.length - 1];
  const [firstYear, firstRate] = homicide.series[0];
  const cards = ["homicide", "terrorAttacks", "terrorDeaths"].map(worldCard).filter((c): c is StatCardData => !!c);
  const gtdEnd = WORLD.terrorDeaths.series[WORLD.terrorDeaths.series.length - 1][0];

  return (
    <div className="min-h-screen w-full animate-fade-in" style={{ background: "var(--color-background)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* ── Hero ── */}
        <div className="rounded-2xl relative overflow-hidden" style={{ background: isLight ? "#ffffff" : "#0b0b0d", border: isLight ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.12)" }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle, ${isLight ? "#000000" : "#ffffff"} 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
          <div className="relative px-5 py-6 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: muted }}>
                <ShieldCheck size={12} weight="fill" aria-hidden /> CommonSphere · Crime and justice
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold font-sans" style={{ color: head }}>
                Crime and justice in figures
              </h1>
              <p className="text-sm font-sans mt-1.5" style={{ color: muted }}>
                Homicide, the offences police record, trafficking and modern slavery, how justice systems work, prison populations and terrorism - each as the body that counts it
                publishes it, with the year it is for. {HOMICIDE.length} places report
                a homicide rate and {PRISONS.length} a prison population.
              </p>
              <p className="text-[11px] font-sans mt-2" style={{ color: muted }}>
                UNODC · World Bank · World Prison Brief · ILO · Walk Free · CIA World Factbook · Global Terrorism Database
              </p>
            </div>
            <div className="lg:text-right">
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: muted }}>
                Homicides in the world · per 100,000 people · {homYear}
              </p>
              <p className="text-4xl sm:text-5xl font-bold font-mono leading-none mt-1" style={{ color: head }}>
                {homRate.toFixed(1)}
              </p>
              <p className="mt-2 text-[11px] font-mono" style={{ color: muted }}>
                from <span style={{ color: head }}>{firstRate.toFixed(1)}</span> in {firstYear} · World Bank, from UNODC
              </p>
              <p className="mt-1 text-[10px] font-sans max-w-sm lg:ml-auto" style={{ color: muted }}>
                The count lags: countries report a year or two behind, so {homYear} is the latest the series has.
              </p>
            </div>
          </div>
        </div>

        <HeadlinesBanner
          label="Crime and justice headlines"
          topics={["crime"]}
          days={5}
          read={100}
          note={(outlets) => (
            <>
              The last five days' crime and justice news - organised crime and corruption reporting worldwide, and US and UK crime desks - from {outlets} (five at most from each),
              refreshed every half hour. The tag is the place a story is about, violet for more than one. Each links to the outlet.
            </>
          )}
        />

        {/* ── The world's counts ── */}
        <section className="flex flex-col gap-4" aria-labelledby="crime-world">
          <div id="crime-world">
            <SectionHead look={look} title="The world's counts" kicker="Each a published series: its latest year, its change on the year before, and the years behind it" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cards.map((c) => (
              <StatCard key={c.label} s={c} more="The full series and its figures" />
            ))}
          </div>
        </section>

        {/* ── Homicide ── */}
        <section className="flex flex-col gap-4" aria-labelledby="crime-homicide">
          <div id="crime-homicide">
            <SectionHead look={look} title="Homicide" kicker="Intentional homicides per 100,000 people: by region over the years, and by country for each one's latest year" />
          </div>
          <CategoryCharts frame="card" charts={[{ kind: "regions", id: "homicide", title: "Homicide by region" }]} />
          <RankCard
            look={look}
            title="Homicide by country"
            unit="Intentional homicides per 100,000 people · UNODC"
            rows={HOMICIDE}
            note="Each rate is UNODC's for the latest year the country reported, shown beside it. Countries count and report differently, so a rate is surest against the same country's earlier years."
            source={CRIME_SOURCE}
          />
        </section>

        {/* ── Recorded crime: what police, courts and customs report to UNODC ── */}
        <RecordedCrime isLight={isLight} />

        {/* ── Human trafficking and modern slavery: UNODC's detected victims, and the published estimates ── */}
        <TraffickingAndSlavery isLight={isLight} />

        {/* ── Justice: its kinds, the legal traditions, the steps of a case, and a justice system in figures ── */}
        <JusticeSection look={look} />

        {/* ── Prisons ── */}
        <section className="flex flex-col gap-4" aria-labelledby="crime-prisons">
          <div id="crime-prisons">
            <SectionHead look={look} title="Prisons" kicker="People held in prison per 100,000 of the population, at the date of each country's latest count" />
          </div>
          <RankCard
            look={look}
            title="Prison population rate"
            unit="Prisoners per 100,000 people · World Prison Brief"
            rows={PRISONS}
            note="Counts are for different dates in different countries, given beside each; “c.” is a rate the Brief gives as approximate. It publishes no single rate for the United Kingdom, which it reports in parts."
            source={PRISON_RATES_SOURCE}
          />
        </section>

        {/* ── Terrorism ── */}
        <section className="flex flex-col gap-4" aria-labelledby="crime-terrorism">
          <div id="crime-terrorism">
            <SectionHead look={look} title="Terrorism" kicker={`Attacks and the deaths in them, in the world, to ${gtdEnd} - the last year the Global Terrorism Database has published`} />
          </div>
          {/* Two charts, an axis each: attacks and deaths are different counts, and one chart with two scales reads as whatever the scales are set to. */}
          <CategoryCharts
            frame="card"
            charts={[
              { kind: "world", ids: ["terrorAttacks"], title: "Terrorist attacks", unit: "attacks a year" },
              { kind: "world", ids: ["terrorDeaths"], title: "Deaths from terrorism", unit: "deaths a year, perpetrators included" },
            ]}
          />
          <p className="text-[11px] font-sans leading-relaxed max-w-4xl" style={{ color: muted }}>
            The Global Terrorism Database, kept by START at the University of Maryland, has released nothing after {gtdEnd}, so the series stops there and no later year is filled in. By
            region, by group and by country it is not held here.
          </p>
        </section>

        <p className="text-[10px] font-sans leading-relaxed max-w-4xl px-1" style={{ color: muted }}>
          Every figure on this page is its publisher's, read by the site's build scripts and dated where it appears. The page once also carried a "safety index", crime trends by
          category, regional crime rates, cybercrime losses and terrorism by region and group; those were typed by hand, did not match the sources they named, and have been
          taken down rather than left looking current. Human trafficking and modern slavery are back, on UNODC's reported figures and the published estimates; the Justice section
          explains in Wikipedia's words and counts in the Factbook's and UNODC's.
        </p>
      </div>
    </div>
  );
}
