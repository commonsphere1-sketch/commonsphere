import { SourceLink } from "../components/SourceLink";
import { SiteMark } from "../components/SiteMark";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { HeadlinesBanner, SUBJECT } from "../components/HeadlinesBanner";
import { CLIMATE_INDICATORS } from "../data/climateIndicators";
import { BOUNDARIES, PHC_2026, TRANSGRESSED } from "../data/planetaryBoundaries";
import type { FigureCard } from "../data/climateFigures";
import { LIFE_CARDS, LIFE_CHECKED } from "../data/lifeOnEarth";
import { EndangeredSpeciesList, NewSpeciesList, type SpeciesWhere } from "../components/SpeciesLists";
import { PlaceHistory } from "../components/PlaceHistory";
import ClimateWatch from "../components/ClimateWatch";
import EarthStatus from "../components/EarthStatus";
import { Leaf } from "@phosphor-icons/react";

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

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export function PlanetaryBoundariesPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  // The place chosen in the climate history, which the species lists follow, as asked.
  const [where, setWhere] = useState<SpeciesWhere | undefined>(undefined);

  const mutedText = isLight ? "rgba(30,41,59,0.64)" : "rgba(255,255,255,0.66)";
  const headText = isLight ? "#0f172a" : "#f1f0ff";
  const gridLine = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)";

  const co2 = CLIMATE_INDICATORS.find((i) => i.id === "co2-global");
  const byId = (id: string) => BOUNDARIES.find((b) => b.id === id);
  const extinction = byId("biosphere")?.variables[0];
  const nitrogen = byId("biogeochemical")?.variables[1];

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* ── HERO HEADER ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground flex items-center gap-3">
              <SiteMark />
              Climate
            </h1>
          </div>
        </div>

        {/* ── CLIMATE HEADLINES: the climate desks' news, kept current ── */}
        <HeadlinesBanner
          label="Climate headlines"
          topics={["climate"]}
          subject={SUBJECT.climate}
          days={5}
          className="mb-6"
          note={(outlets) => (
            <>
              The last five days' climate headlines from {outlets} (five at most from each), refreshed every half hour. The tag is the
              place a story is about, violet for more than one. Each links to the outlet.
            </>
          )}
        />

        {/* ── CLIMATE HISTORY, PLACE BY PLACE, as asked: each country's, and its divisions' where they are published ── */}
        <PlaceHistory
          topic="climate"
          title="Climate history, place by place"
          onPlace={setWhere}
          events
          accent="#06b6d4"
          groups={[
            { title: "Temperature", sub: "Means of the year", lines: [["tempMax", "#ef4444"], ["temp", "#f59e0b"], ["tempMin", "#3b82f6"], ["tempMaxF", "#ef4444"], ["tempF", "#f59e0b"], ["tempMinF", "#3b82f6"]], kind: "band" },
            { title: "Each Year in Colour", sub: "The year's mean temperature", lines: [["temp", "#f59e0b"], ["tempF", "#f59e0b"]], kind: "stripes" },
            { title: "Heat and Cold Extremes", sub: "The year's hottest day and coldest night, averaged over the place", lines: [["hottestDay", "#ef4444"], ["coldestNight", "#3b82f6"]] },
            { title: "Hot Days, Warm Nights and Frost", sub: "Days in the year, averaged over the place", lines: [["hotDays", "#ef4444"], ["tropicalNights", "#f59e0b"], ["frostDays", "#3b82f6"]] },
            { title: "Precipitation", sub: "Rain and snow in the year", lines: [["precip", "#06b6d4"], ["precipIn", "#06b6d4"]], kind: "bars" },
            { title: "Wettest Day", sub: "The year's most rain in one day, averaged over the place", lines: [["wettestDay", "#06b6d4"]], kind: "bars" },
            { title: "Heavy Rain and Dry Spells", sub: "Days in the year, averaged over the place", lines: [["heavyRainDays", "#06b6d4"], ["drySpell", "#d97706"]] },
            { title: "Heating and Cooling Degree-Days", sub: "NOAA's degree-days in the year, °F below or above 65 °F", lines: [["heatingDD", "#3b82f6"], ["coolingDD", "#ef4444"]] },
            { title: "Drought", sub: "NOAA's Palmer Drought Severity Index, the year's average · -4 extreme, +4 extreme wet", lines: [["pdsi", "#d97706"]], kind: "bars" },
            { title: "Months in Drought", sub: "Months of moderate drought or worse in the year", lines: [["droughtMonths", "#b45309"]], kind: "bars" },
            { title: "Air Pollution", sub: "Fine particles, PM2.5, people's mean exposure · the WHO's guideline is 5 µg/m³", lines: [["pm25", "#78716c"]], kind: "area" },
            { title: "People Above the WHO Guideline", sub: "Share of people exposed to more fine particles than it", lines: [["pm25AboveWho", "#a8a29e"]], kind: "bars" },
            { title: "Air Quality, Day by Day", sub: "Days of the year in each band of the EPA's Air Quality Index", lines: [["aqiGood", "#22c55e"], ["aqiModerate", "#eab308"], ["aqiSensitive", "#f97316"], ["aqiUnhealthy", "#ef4444"], ["aqiVeryUnhealthy", "#a855f7"], ["aqiHazardous", "#7f1d1d"]], kind: "stack" },
            { title: "Air Quality Index", sub: "The year's median and highest daily reading", lines: [["aqiMedian", "#eab308"], ["aqiMax", "#ef4444"]] },
            { title: "Disaster Alerts", sub: "Orange and red alerts in the year, by kind · GDACS", lines: [["quakeAlerts", "#a16207"], ["cycloneAlerts", "#6366f1"], ["floodAlerts", "#06b6d4"], ["droughtAlerts", "#d97706"], ["volcanoAlerts", "#ef4444"], ["fireAlerts", "#f97316"]], kind: "stack" },
            { title: "Strongest Earthquake", sub: "The strongest alerted earthquake of the year, magnitude", lines: [["strongestQuake", "#a16207"]], kind: "bars" },
            { title: "Records", sub: "Each figure's highest and lowest year", lines: [["temp", ""], ["tempF", ""], ["tempMax", ""], ["tempMaxF", ""], ["tempMin", ""], ["tempMinF", ""], ["hottestDay", ""], ["coldestNight", ""], ["hotDays", ""], ["frostDays", ""], ["precip", ""], ["precipIn", ""], ["wettestDay", ""], ["drySpell", ""], ["heatingDD", ""], ["coolingDD", ""], ["pdsi", ""], ["droughtMonths", ""], ["pm25", ""], ["aqiMedian", ""], ["aqiMax", ""], ["co2", ""]], kind: "records" },
            { title: "Carbon Dioxide Emitted", sub: "Fossil fuels and industry", lines: [["co2", "#a855f7"]], kind: "area" },
            { title: "Carbon Dioxide per Person", sub: "Fossil fuels and industry", lines: [["co2PerHead", "#ec4899"]] },
          ]}
          tiles={["temp", "tempF", "pm25", "aqiMedian", "hottestDay", "hotDays", "precip", "precipIn", "co2", "co2PerHead"]}
          compare={["tempF", "precipIn", "pdsi", "coolingDD", "aqiMedian"]}
          chooserLabel="Choose a country to see its climate history"
          empty="No climate history is held for {country}."
          notes={
            <p>
              A country's climate is the Climatic Research Unit's record of the world's weather stations (CRU TS 4.09), set on a grid and averaged over the country by the
              World Bank's Climate Change Knowledge Portal, each year since 1901: its mean temperature, the means of its days' highs and lows, and the rain and snow of
              the year. Its emissions of carbon dioxide are the Global Carbon Budget's, from fossil fuels and industry, as Our World in Data publishes them - not from
              land use, and where they are produced, not where the goods are used. Its extremes since 1950 - the year's hottest day and coldest night, its hot days,
              warm nights and frost days, its wettest day, heavy rain and longest dry spell - are from ERA5, the Copernicus reanalysis, as the same portal gives them: each
              place's own extreme, averaged over the country, not the single highest reading anywhere in it. Its disasters are the events
              GDACS, the UN and European Commission's Global Disaster Alert and Coordination System, raised an orange or red alert for since 2000 - earthquakes, tropical
              cyclones, floods, droughts, volcanic eruptions and wildfires - with each event's scale in GDACS's own words: its alerts, not every disaster. Its air pollution is people's mean exposure to
              fine particles (PM2.5) and the share above the World Health Organization's guideline, as the World Bank publishes them; for the United States' counties and
              metropolitan areas, the Environmental Protection Agency's yearly summaries of the daily Air Quality Index from its monitors since 1980 - a place with no
              monitor has none. Records are each series' highest and lowest year, worked out
              here. The United States' states and counties are NOAA's own record, nClimDiv, each month since 1895 from its weather stations set on a
              5 km grid, in degrees Fahrenheit and inches; the year's figure is worked out here from its twelve months, only for a year with all twelve. A year a source does not
              give is a gap in its line. For the states and counties, NOAA's heating and cooling degree-days (how far, and on how many days, the
              day's mean fell below or rose above 65 °F, summed over the year) and its Palmer Drought Severity Index (the year's average of its months, and how many months
              were of moderate drought or worse by NOAA's own scale) are worked out here from its monthly figures in the same way.
            </p>
          }
        />

        {/* The explorer of what is happening now (ClimateNowExplorer) stood here; it was taken off as asked - only the
            Dashboard keeps its explorer. */}

        {/* ── KPI STRIP ─────────────────────────────────────────────────── */}
        {/* Each figure is the source's own: the boundary count and the two
            boundary measures from the Planetary Health Check 2026, carbon
            dioxide from NOAA's latest global mean (the same reading as the
            "Measured now" table below). */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Boundaries transgressed",
              value: `${TRANSGRESSED} / 9`,
              color: "text-red-500",
              sub: "Planetary Health Check 2026",
              href: PHC_2026.summaryUrl,
            },
            co2 && {
              label: "Carbon dioxide, global mean",
              value: `${co2.value.toFixed(1)} ppm`,
              color: "text-orange-500",
              sub: `Boundary 350 ppm · NOAA, ${co2.period}`,
              href: co2.url,
            },
            extinction && {
              label: "Extinction rate",
              value: extinction.current,
              color: "text-red-600",
              sub: "per million species-years · boundary 10",
              href: PHC_2026.summaryUrl,
            },
            nitrogen && {
              label: "Nitrogen fixed for farming",
              value: `${nitrogen.current} Tg/yr`,
              color: "text-red-500",
              sub: "Boundary 62 Tg/yr · PHC 2026",
              href: PHC_2026.summaryUrl,
            },
          ]
            .filter((k): k is { label: string; value: string; color: string; sub: string; href: string } => !!k)
            .map((k) => (
              <div key={k.label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-sans">{k.label}</p>
                <p className={`text-xl font-bold font-mono ${k.color}`}>{k.value}</p>
                <a
                  href={k.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-muted-foreground font-sans mt-0.5 underline decoration-dotted hover:text-foreground"
                >
                  {k.sub}
                </a>
              </div>
            ))}
        </div>

        {/* ── WHAT IS HAPPENING, AND WHAT IS PROJECTED: El Niño and La Niña, the records in the measured series, the
            countries disasters struck, erosion, and each country's projected warming - each card its sources' own. ── */}
        <ClimateWatch />

        {/* The list of the nine boundaries and the panel of the one chosen stood here; they were taken off, as asked. The wheel
            below still draws all nine. */}

        {/* The planetary boundaries wheel and the note on the framework stood here; they were moved to the Dashboard, as asked
            (components/PlanetaryBoundariesWheel). */}

        {/* ── THE LIVING WORLD: its fresh water, its forests, its wildfires and its wildlife, each from the newest figures an open
            source publishes. They stand where the cards of tipping points, treaties and flashpoints (data/climateContext.ts)
            stood, which were taken off as asked. ── */}
        <EarthStatus />

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

        {/* The cards of the most-asked environmental figures (data/climateFigures.ts) stood here and were taken off as asked. */}

        {/* The table of the agencies' latest readings stood here and was taken off as asked: the readings are in the explorer at the head of the page. */}
        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div className="text-center py-3 border-t border-border mt-2">
          <p className="text-[11px] font-sans text-muted-foreground">
            © {new Date().getFullYear()} CommonSphere · Planetary Boundaries ·
            every figure links to its source
          </p>
        </div>
      </div>
    </div>
  );
}
