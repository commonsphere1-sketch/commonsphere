/**
 * What fills the Worldview page under its map when a state, province or
 * region, a county or a city is pressed on it, as asked: that place's own
 * figures, above its country's.
 *
 * Every figure is its publisher's, read from data the site already holds,
 * each with its year:
 *
 *   a state, province or region   its record - Natural Earth's division with
 *                                 its own Wikidata record (population over
 *                                 the years, capital, area, legislature,
 *                                 neighbours); and for a US state the Census
 *                                 Bureau's, the BEA's, the BLS's and the
 *                                 EIA's figures the site holds for it. The
 *                                 Tax Foundation's rates are left out: they
 *                                 are for non-commercial use only.
 *   a US county                   the Census Bureau's population estimates,
 *                                 2020 to 2025, with the year's births,
 *                                 deaths and migration, and its Gazetteer
 *                                 area.
 *   a city                        the UN's World Urbanization Prospects, for
 *                                 the cities the site profiles; otherwise
 *                                 GeoNames' count of its people.
 *
 * A density, a change or a share worked out here says so. Where nothing more
 * than the outline of a place is held, the section says that and no more.
 */
import { useEffect, useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Subnation } from "../data/subnations";
import { usStatesData } from "../data/statesData";
import { STATE_INDICATORS, STATE_SOURCES } from "../data/stateIndicators";
import { citiesData } from "../data/citiesData";
import { CITY_FIGURES, CITY_FIGURES_SOURCE } from "../data/cityFigures";
import { useTokens, type Tokens } from "./DataExplorer";
import { INK, Panel, Note, Foot, Tiles, Stack, Ring, Section } from "./CountryFigures";
import SlimBars, { SlimColumns } from "./SlimBars";

export type PressedPlace =
  | { kind: "region"; cc: string; name: string }
  | { kind: "county"; cc: string; id: string; name: string; parent?: string }
  | { kind: "city"; cc: string; name: string; people: number };

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
const big = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : whole(v));
const usd = (v: number) => (v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${whole(v)}`);

/** A figure year by year, as the GDP panel draws one: a line over a gradient. */
function Series({ t, rows, fmt, color = INK[0], height = 160 }: { t: Tokens; rows: { y: string; v: number }[]; fmt: (v: number) => string; color?: string; height?: number }) {
  const id = useId().replace(/:/g, "");
  const axis = { tick: { fontSize: 9, fill: t.mutedText, fontFamily: "monospace" }, axisLine: false, tickLine: false } as const;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={t.gridLine} vertical={false} />
        <XAxis dataKey="y" {...axis} interval="preserveStartEnd" minTickGap={20} />
        <YAxis {...axis} width={48} tickFormatter={(v: number) => big(v)} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ background: t.tooltipBg, border: t.cardBorder, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: t.headText }} itemStyle={{ color: t.headText }} formatter={(v: number) => [fmt(v), "people"]} />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Head({ t, name, sub }: { t: Tokens; name: string; sub: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
      <h2 className="text-lg font-bold font-sans" style={{ color: t.headText }}>
        {name}
      </h2>
      <span className="text-[11px] font-sans" style={{ color: t.mutedText }}>
        {sub}
      </span>
    </div>
  );
}

/** A state, province or region: its record, and for a US state the federal statistics the site holds. */
function RegionFigures({ t, cc, name, country }: { t: Tokens; cc: string; name: string; country: string }) {
  const [subs, setSubs] = useState<{ list: Subnation[]; sources: Record<string, { label: string; url: string }> } | null>(null);
  useEffect(() => {
    let off = false;
    import("../data/subnations").then((m) => !off && setSubs({ list: m.SUBNATIONS, sources: m.SUBNATIONS_SOURCES }));
    return () => {
      off = true;
    };
  }, []);
  const rec = subs?.list.find((x) => x.cc === cc && x.name === name);
  const state = cc === "US" ? usStatesData.find((s) => s.name === name) : undefined;
  const si = state ? STATE_INDICATORS[state.abbreviation.toLowerCase()] : undefined;
  const recSources = subs && rec ? [subs.sources.naturalEarth, subs.sources.wikidata, ...(rec.capitalBy === "gn" ? [subs.sources.geonames] : []), ...(rec.capitalBy === "wp" || rec.areaBy === "wp" || rec.popBy ? [subs.sources.wikipedia] : [])] : [];
  const series = rec?.series?.map(([y, v]) => ({ y: String(y), v })) ?? [];
  const pop = si?.population ? { v: si.population.v, y: si.population.y } : rec?.pop ? { v: rec.pop[1], y: String(rec.pop[0]) } : null;
  return (
    <>
      <Head t={t} name={name} sub={`${rec?.kind ?? "a division"} of ${country} · its own figures, pressed on the map · the country's figures are below`} />
      <Section t={t} title="The place" kicker="what it is, and how many live there">
        <Panel t={t} title="At a glance" meta={rec?.kind}>
          {rec || si ? (
            <>
              <Tiles
                t={t}
                items={[
                  ...(rec?.capital ? [{ label: "Capital", text: rec.capital }] : []),
                  ...(pop ? [{ label: "People", text: whole(pop.v), y: pop.y }] : []),
                  ...(rec?.areaKm2 ? [{ label: "Area", text: `${whole(rec.areaKm2)} km²` }] : []),
                  ...(rec?.areaKm2 && pop ? [{ label: "People per km²", text: (pop.v / rec.areaKm2).toFixed(1), y: "worked out here" }] : []),
                  ...(rec?.founded ? [{ label: "Formed", text: String(rec.founded) }] : []),
                  ...(si?.medianAge ? [{ label: "Median age", text: `${si.medianAge.v.toFixed(1)} yrs`, y: si.medianAge.y }] : []),
                ]}
              />
              {rec?.legislature && <Note t={t}>Its legislature: {rec.legislature}.</Note>}
              <Foot sources={[...recSources, si ? STATE_SOURCES.population : undefined]} />
            </>
          ) : (
            <Note t={t}>{subs ? `No record of ${name} is held.` : "Reading its record…"}</Note>
          )}
        </Panel>
        {series.length >= 3 ? (
          <Panel t={t} title="Its people over the years" meta={`${series[0].y}–${series[series.length - 1].y}`}>
            <Series t={t} rows={series} fmt={whole} />
            <Note t={t}>Each dated, referenced count its record holds.</Note>
            <Foot sources={recSources} />
          </Panel>
        ) : null}
        {rec?.borders?.length ? (
          <Panel t={t} title="Its neighbours" meta={`${rec.borders.length}`}>
            <ul className="flex flex-wrap gap-1.5">
              {rec.borders.map((b) => (
                <li key={b} className="text-[10px] font-sans px-2 py-0.5 rounded-full" style={{ color: t.bodyText, background: t.tile, border: `1px solid ${t.gridLine}` }}>
                  {b}
                </li>
              ))}
            </ul>
            <Foot sources={recSources} />
          </Panel>
        ) : null}
      </Section>
      {si && (
        <Section t={t} title="Its economy and people" kicker="the federal statistics for the state">
          <Panel t={t} title="Work and income">
            <Tiles
              t={t}
              items={[
                { label: "GDP", text: usd(si.gdp.v * 1e9), y: si.gdp.y },
                { label: "Average income", text: `$${whole(si.averageIncome.v)}`, y: si.averageIncome.y },
                { label: "Median household income", text: `$${whole(si.medianIncome.v)}`, y: si.medianIncome.y },
                { label: "Unemployment", text: `${si.unemploymentRate.v.toFixed(1)}%`, y: si.unemploymentRate.y },
                { label: "Minimum wage", text: `$${si.minimumWage.v.toFixed(2)} an hour`, y: si.minimumWage.y },
                { label: "In prison, per 100,000", text: whole(si.incarcerationRate.v), y: si.incarcerationRate.y },
              ]}
            />
            <Foot sources={[STATE_SOURCES.bea, STATE_SOURCES.acs, STATE_SOURCES.bls, STATE_SOURCES.dol, STATE_SOURCES.bjs]} />
          </Panel>
          <Panel t={t} title="Its people" meta={`race and Hispanic origin · ${si.ethnicity.y}`}>
            <Ring t={t} slices={si.ethnicity.groups.map((g) => ({ name: g.group, v: g.pct }))} />
            <Note t={t}>White, Black and Asian are non-Hispanic and of one race; Hispanic is of any race.</Note>
            <Foot sources={[STATE_SOURCES.population]} />
          </Panel>
          <Panel t={t} title="By age" meta={si.ageGroups.y}>
            <Stack t={t} parts={si.ageGroups.groups.map((g) => ({ name: g.group, v: g.pct }))} />
            <Foot sources={[STATE_SOURCES.population]} />
          </Panel>
          <Panel t={t} title="Homes" meta={`ACS · ${si.housing.y}`}>
            <Tiles
              t={t}
              items={[
                { label: "Median home value", text: `$${whole(si.housing.medianHomeValue)}` },
                { label: "Median rent a month", text: `$${whole(si.housing.medianRent)}` },
                { label: "Owner-occupied", text: `${si.housing.homeOwnershipPct.toFixed(1)}%` },
                { label: "Rent-burdened renters", text: `${si.housing.rentBurdenPct.toFixed(1)}%` },
              ]}
            />
            <Foot sources={[STATE_SOURCES.acs]} />
          </Panel>
          <Panel t={t} title="Getting to work" meta={`ACS · ${si.commute.y}`}>
            <SlimBars
              labelWidth="6.5rem"
              max={100}
              rows={[
                { key: "car", label: "Car, truck, van", v: si.commute.carTruckVanPct, color: INK[0] },
                { key: "home", label: "Work from home", v: si.commute.workFromHomePct, color: INK[1] },
                { key: "transit", label: "Public transport", v: si.commute.transitPct, color: INK[2] },
                { key: "walk", label: "Walk or bike", v: si.commute.walkBikePct, color: INK[3] },
              ]}
              fmt={(v) => `${v.toFixed(1)}%`}
            />
            <Note t={t}>An average journey to work of {si.commute.meanCommuteMin.toFixed(1)} minutes.</Note>
            <Foot sources={[STATE_SOURCES.acs]} />
          </Panel>
          <Panel t={t} title="Schooling and the poor" meta={`ACS · ${si.education.y}`}>
            <SlimBars
              labelWidth="7rem"
              max={100}
              rows={[
                { key: "hs", label: "High school or more", v: si.education.highSchoolOrHigherPct, color: INK[5] },
                { key: "ba", label: "Bachelor's or more", v: si.education.bachelorsOrHigherPct, color: INK[6] },
                ...si.poverty.groups.map((g, i) => ({ key: `p${i}`, label: g.label, v: g.pct, color: INK[(i + 4) % INK.length] })),
              ]}
              fmt={(v) => `${v.toFixed(1)}%`}
            />
            <Foot sources={[STATE_SOURCES.acs]} />
          </Panel>
          <Panel t={t} title="Electricity it generates" meta={si.energyMix.y}>
            <Ring t={t} slices={si.energyMix.groups.map((g) => ({ name: g.source, v: g.pct }))} />
            <Foot sources={[STATE_SOURCES.eia]} />
          </Panel>
          <Panel t={t} title="Its 2024 presidential vote" meta={si.voterShare.y}>
            <Stack t={t} parts={si.voterShare.groups.map((g) => ({ name: g.party, v: g.pct, color: /democrat/i.test(g.party) ? "#2563eb" : /republican/i.test(g.party) ? "#dc2626" : undefined }))} />
            <Foot sources={[STATE_SOURCES.fec]} />
          </Panel>
        </Section>
      )}
    </>
  );
}

/** A county: the Census Bureau's figures in the United States; elsewhere nothing but its outline is held. */
function CountyFigures({ t, cc, id, name, parent, country }: { t: Tokens; cc: string; id: string; name: string; parent?: string; country: string }) {
  const [data, setData] = useState<typeof import("../data/usCounties") | null>(null);
  useEffect(() => {
    if (cc !== "US") return;
    let off = false;
    import("../data/usCounties").then((m) => !off && setData(m));
    return () => {
      off = true;
    };
  }, [cc]);
  const r = data?.US_COUNTIES.find((x) => x[0] === id);
  const years = data?.US_COUNTY_YEARS ?? [];
  const where = `${parent ? `${parent}, ` : ""}${country}`;
  if (cc !== "US")
    return (
      <>
        <Head t={t} name={name} sub={`a division of ${where}`} />
        <p className="text-[11px] font-sans px-1" style={{ color: t.mutedText }}>
          Only its outline is held: no body the site draws on publishes its figures. Below, {country}'s.
        </p>
      </>
    );
  if (!data) return <Head t={t} name={name} sub="reading its figures…" />;
  if (!r) return <Head t={t} name={name} sub={`no record of it is held · ${where}`} />;
  const people = r[7];
  const last = people[people.length - 1];
  return (
    <>
      <Head t={t} name={r[1]} sub={`${where} · its own figures, pressed on the map · the country's figures are below`} />
      <Section t={t} title="The county" kicker="how many live there, and how that changes">
        <Panel t={t} title="Its people, year by year" meta={`1 July · ${years[0]}–${years[years.length - 1]}`}>
          <Series t={t} rows={people.map((v, i) => ({ y: String(years[i]), v }))} fmt={whole} />
          <Note t={t}>
            {whole(last)} in {years[years.length - 1]}: {last >= people[0] ? "+" : ""}
            {whole(last - people[0])} on {years[0]}, worked out here.
          </Note>
          <Foot sources={[data.US_COUNTY_SOURCES.estimates]} />
        </Panel>
        <Panel t={t} title="What changed it" meta={`the year to 1 July ${years[years.length - 1]}`}>
          <SlimColumns
            height={150}
            label={`What changed the population of ${r[1]} in the year to 1 July ${years[years.length - 1]}`}
            rows={[
              { key: "b", label: "Births", v: r[8] },
              { key: "d", label: "Deaths", v: -r[9] },
              { key: "i", label: "From abroad", v: r[10] },
              { key: "m", label: "Moved, net", v: r[11] },
            ]}
            fmt={(v) => `${v > 0 ? "+" : ""}${whole(v)}`}
          />
          <Note t={t}>Deaths are drawn as a fall; migration is net - those who came less those who left.</Note>
          <Foot sources={[data.US_COUNTY_SOURCES.estimates]} />
        </Panel>
        <Panel t={t} title="Its land" meta="Gazetteer">
          <Tiles
            t={t}
            items={[
              ...(r[5] !== null ? [{ label: "Land", text: `${whole(r[5])} km²` }] : []),
              ...(r[6] !== null ? [{ label: "Water", text: `${whole(r[6])} km²` }] : []),
              ...(r[5] ? [{ label: "People per km² of land", text: (last / r[5]).toFixed(1), y: "worked out here" }] : []),
            ]}
          />
          <Foot sources={[data.US_COUNTY_SOURCES.gazetteer]} />
        </Panel>
      </Section>
    </>
  );
}

/** A city: the UN's figures for a city the site profiles, otherwise GeoNames' count. */
function CityFigures({ t, cc, name, people, country }: { t: Tokens; cc: string; name: string; people: number; country: string }) {
  const city = citiesData.find((c) => c.countryCode === cc && c.name === name);
  const f = city ? CITY_FIGURES[city.id] : undefined;
  const { firstYear, baseYear } = CITY_FIGURES_SOURCE;
  const series = f ? f.pop.flatMap((v, i) => (v !== null && firstYear + i <= baseYear ? [{ y: String(firstYear + i), v }] : [])) : [];
  const at = (arr: (number | null)[] | undefined) => (arr ? arr[baseYear - firstYear] : null);
  const geo = { label: "GeoNames — cities of 100,000 or more (CC BY 4.0)", url: "https://www.geonames.org/" };
  return (
    <>
      <Head t={t} name={name} sub={`City, ${country} · its own figures, pressed on the map · the country's figures are below`} />
      <Section t={t} title="The city" kicker="how many live there, and on how much land">
        <Panel t={t} title="At a glance">
          <Tiles
            t={t}
            items={[
              { label: "People (GeoNames)", text: whole(people) },
              ...(f && at(f.pop) ? [{ label: "People (UN)", text: whole(at(f.pop)!), y: baseYear }] : []),
              ...(f ? [{ label: "Its place among cities", text: `${whole(f.rank)} of ${whole(CITY_FIGURES_SOURCE.cities)}`, y: baseYear }] : []),
              ...(f && at(f.density) ? [{ label: "People per km²", text: whole(at(f.density)!), y: baseYear }] : []),
              ...(f && at(f.built) ? [{ label: "Built-up land", text: `${whole(at(f.built)!)} km²`, y: baseYear }] : []),
              ...(f && at(f.share) ? [{ label: `Of ${country}'s city dwellers`, text: `${at(f.share)!.toFixed(1)}%`, y: baseYear }] : []),
            ]}
          />
          <Note t={t}>
            GeoNames counts the city itself{f ? `; the UN counts the city as it spreads on the ground, which its rating calls ${f.plausibility.toLowerCase()} in plausibility` : ""}.
          </Note>
          <Foot sources={[geo, f ? CITY_FIGURES_SOURCE : undefined]} />
        </Panel>
        {series.length > 2 && (
          <Panel t={t} title="Its people over the years" meta={`UN · ${series[0].y}–${series[series.length - 1].y}`}>
            <Series t={t} rows={series} fmt={whole} />
            <Note t={t}>The UN's estimates to {baseYear}; its projections beyond are in the city's window.</Note>
            <Foot sources={[CITY_FIGURES_SOURCE]} />
          </Panel>
        )}
      </Section>
    </>
  );
}

export default function PlaceFigures({ place, country }: { place: PressedPlace; country: string }) {
  const t = useTokens();
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {place.kind === "region" ? (
        <RegionFigures t={t} cc={place.cc} name={place.name} country={country} />
      ) : place.kind === "county" ? (
        <CountyFigures t={t} cc={place.cc} id={place.id} name={place.name} parent={place.parent} country={country} />
      ) : (
        <CityFigures t={t} cc={place.cc} name={place.name} people={place.people} country={country} />
      )}
    </div>
  );
}
