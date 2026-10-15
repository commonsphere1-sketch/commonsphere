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
import { useEffect, useId, useMemo, useState } from "react";
import { geoContains } from "d3-geo";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Subnation } from "../data/subnations";
import { usStatesData } from "../data/statesData";
import { STATE_INDICATORS, STATE_SOURCES } from "../data/stateIndicators";
import { citiesData } from "../data/citiesData";
import { CITY_FIGURES, CITY_FIGURES_SOURCE } from "../data/cityFigures";
import { useTokens, type Tokens } from "./DataExplorer";
import { INK, Panel, Note, Foot, Tiles, Stack, Ring, Section } from "./CountryFigures";
import SlimBars, { SlimColumns } from "./SlimBars";

/** A city of 100,000 or more that lies in a place, by GeoNames' count. */
type InCity = { name: string; people: number };
export type PressedPlace =
  | { kind: "region"; cc: string; name: string; cities?: InCity[]; geo?: unknown }
  | { kind: "county"; cc: string; id: string; name: string; parent?: string; sub?: string; cities?: InCity[]; areaKm2?: number; geo?: unknown }
  | { kind: "city"; cc: string; name: string; people: number; region?: string };
const GEONAMES = { label: "GeoNames — cities of 100,000 or more (CC BY 4.0)", url: "https://www.geonames.org/" };

/** The cities of 100,000 or more inside a place's outline, largest first. */
function CitiesIn({ t, cities, where }: { t: Tokens; cities: InCity[]; where: string }) {
  return (
    <Panel t={t} title="Its largest cities" meta={`${cities.length} of 100,000 or more`}>
      <SlimBars
        label={`The cities of 100,000 people or more in ${where}`}
        labelWidth="7rem"
        rows={cities.map((c, i) => ({ key: c.name, label: c.name, v: c.people, color: INK[i % INK.length] }))}
        fmt={(v) => big(v)}
      />
      <Note t={t}>Each city of 100,000 or more whose point lies inside its outline, by GeoNames' count of the city itself.</Note>
      <Foot sources={[GEONAMES]} />
    </Panel>
  );
}

/** The record of the state, province or region a place lies in: its own figures, which are that region's, not the place's. */
function RegionRecord({ t, cc, name, country }: { t: Tokens; cc: string; name: string; country: string }) {
  const [subs, setSubs] = useState<{ list: Subnation[]; sources: Record<string, { label: string; url: string }> } | null>(null);
  useEffect(() => {
    let off = false;
    import("../data/subnations").then((m) => !off && setSubs({ list: m.SUBNATIONS, sources: m.SUBNATIONS_SOURCES }));
    return () => {
      off = true;
    };
  }, []);
  const rec = subs?.list.find((x) => x.cc === cc && x.name === name);
  if (!rec) return null;
  return (
    <Panel t={t} title={`The region it lies in`} meta={rec.kind ? `${rec.kind}, ${country}` : country}>
      <p className="text-sm font-bold font-sans" style={{ color: t.headText }}>
        {rec.name}
      </p>
      <Tiles
        t={t}
        items={[
          ...(rec.capital ? [{ label: "Capital", text: rec.capital }] : []),
          ...(rec.pop ? [{ label: "People", text: whole(rec.pop[1]), y: rec.pop[0] }] : []),
          ...(rec.areaKm2 ? [{ label: "Area", text: `${whole(rec.areaKm2)} km²` }] : []),
          ...(rec.legislature ? [{ label: "Legislature", text: rec.legislature }] : []),
        ]}
      />
      <Note t={t}>The figures of {rec.name} as a whole, from its own record.</Note>
      <Foot sources={[subs!.sources.naturalEarth, subs!.sources.wikidata, ...(rec.popBy || rec.areaBy === "wp" ? [subs!.sources.wikipedia] : [])]} />
    </Panel>
  );
}

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


/**
 * What lies inside a place's outline, as asked of the smaller places - every figure counted here from a dataset the
 * site holds for points, each found by whether its point lies inside the outline: its towns and villages (GeoNames'
 * places of more than 500 people and seats of administration), its mines, plants and refineries (USGS), its airports
 * and ports (Natural Earth), and the heads of its places that three records agree on.
 */
type PlacesFile = { regions: string[]; districts: string[]; places: [name: string, lat: number, lon: number, population: number, region: number, kind: number, id: number, district: number][] };
type Mines = { sources: { label: string; url: string; surveyed?: string | null }[]; commodities: string[]; kinds: string[]; rows: [name: string, commodity: number, country: number, kind: number, record: number, lon: number, lat: number][] };
type Infra = { sources: { label: string; url: string }[]; airports: [name: string, lon: number, lat: number, major: number][] };
type Ports = { source: { label: string; url: string }; rows: [name: string, lon: number, lat: number, rank: number][] };
function Inside({ t, cc, geo, name }: { t: Tokens; cc: string; geo: unknown; name: string }) {
  const [got, setGot] = useState<{ places?: PlacesFile; mines?: Mines; infra?: Infra; ports?: Ports; heads?: typeof import("../data/representatives"); kinds?: string[]; placesSource?: { label: string; url: string } } | null>(null);
  useEffect(() => {
    let off = false;
    const json = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    Promise.all([json(`/places/${cc}.json`), json("/geo/mines.json"), json("/geo/infrastructure.json"), json("/geo/ports.json"), import("../data/representatives"), import("../data/placesIndex")]).then(([places, mines, infra, ports, heads, idx]) => {
      if (!off) setGot({ places: places ?? undefined, mines: mines ?? undefined, infra: infra ?? undefined, ports: ports ?? undefined, heads, kinds: idx.PLACE_KINDS, placesSource: idx.PLACES_SOURCE.geonames });
    });
    return () => {
      off = true;
    };
  }, [cc]);
  const at = useMemo(() => {
    if (!got) return null;
    const inn = (lon: number, lat: number) => geoContains(geo as never, [lon, lat]);
    const places = (got.places?.places ?? []).filter((p) => inn(p[2], p[1]));
    const mines = (got.mines?.rows ?? []).filter((m) => inn(m[5], m[6]));
    const airports = (got.infra?.airports ?? []).filter((a) => inn(a[1], a[2]));
    const ports = (got.ports?.rows ?? []).filter((p) => inn(p[1], p[2]));
    const heads = (got.heads?.REPRESENTATIVES ?? []).filter((r) => r[0] === cc && inn(r[7], r[6]));
    return { places, mines, airports, ports, heads };
  }, [got, geo, cc]);
  if (!got || !at) return <p className="text-[11px] font-sans px-1" style={{ color: t.mutedText }}>Counting what lies in {name}…</p>;
  const { places, mines, airports, ports, heads } = at;
  const peopled = places.filter((p) => p[3] > 0);
  const byKind = Object.entries(places.reduce<Record<string, number>>((o, p) => ((o[got.kinds?.[p[5]] ?? "Other"] = (o[got.kinds?.[p[5]] ?? "Other"] ?? 0) + 1), o), {})).sort((a, b) => b[1] - a[1]);
  const byCommodity = Object.entries(mines.reduce<Record<string, number>>((o, m) => ((o[got.mines!.commodities[m[1]]] = (o[got.mines!.commodities[m[1]]] ?? 0) + 1), o), {})).sort((a, b) => b[1] - a[1]);
  return (
    <Section t={t} title="What lies in it" kicker="its towns and villages, what it mines and makes, how it connects, who leads its places">
      {places.length > 0 && (
        <Panel t={t} title="Its towns and villages" meta={`${whole(places.length)} places`}>
          <Tiles
            t={t}
            items={[
              { label: "Places", text: whole(places.length), y: "of more than 500 people, or seats" },
              ...(peopled.length ? [{ label: "People in them", text: whole(peopled.reduce((n, p) => n + p[3], 0)), y: "GeoNames, added here" }] : []),
              ...(peopled[0] ? [{ label: "The largest", text: peopled[0][0], y: whole(peopled[0][3]) }] : []),
            ]}
          />
          {peopled.length > 1 && (
            <SlimBars labelWidth="7rem" rows={peopled.slice(0, 10).map((p, i) => ({ key: `${p[6]}`, label: p[0], v: p[3], color: INK[i % INK.length] }))} fmt={big} />
          )}
          <Note t={t}>Every populated place GeoNames lists inside its outline - its count of each place's own people, not of the land around it, so the sum is not the whole population.</Note>
          <Foot sources={[got.placesSource]} />
        </Panel>
      )}
      {byKind.length > 1 && (
        <Panel t={t} title="What its places are" meta="by GeoNames' kind">
          <Ring t={t} slices={byKind.slice(0, 6).map(([k, n]) => ({ name: k, v: (n / places.length) * 100 }))} />
          <Note t={t}>Each place as GeoNames classes it - a seat of administration, or a town or village - as a share of the places counted, worked out here.</Note>
          <Foot sources={[got.placesSource]} />
        </Panel>
      )}
      {mines.length > 0 && (
        <Panel t={t} title="What it mines and refines" meta={`${mines.length} sites · USGS`}>
          <SlimBars labelWidth="7rem" rows={byCommodity.slice(0, 8).map(([k, n], i) => ({ key: k, label: k, v: n, color: INK[(i + 2) % INK.length] }))} fmt={whole} />
          <ul className="flex flex-col gap-0.5">
            {mines.filter((m) => !m[0].includes("�")).slice(0, 6).map((m) => (
              <li key={`${m[0]}-${m[5]}`} className="text-[11px] font-sans leading-snug" style={{ color: t.bodyText }}>
                {m[0]}
                <span style={{ color: t.mutedText }}> · {got.mines!.kinds[m[3]]}, {got.mines!.commodities[m[1]]}</span>
              </li>
            ))}
          </ul>
          <Note t={t}>Mines, plants, refineries and fields the USGS records inside its outline, by what each produces; its surveys date from 2003 to 2008, so some may have closed since.</Note>
          <Foot sources={got.mines!.sources} />
        </Panel>
      )}
      {(airports.length > 0 || ports.length > 0) && (
        <Panel t={t} title="How it connects" meta="airports and ports">
          <Tiles
            t={t}
            items={[
              { label: "Airports", text: String(airports.length), y: `${airports.filter((a) => a[3]).length} major` },
              { label: "Seaports", text: String(ports.length) },
            ]}
          />
          <ul className="flex flex-col gap-0.5">
            {[...airports.map((a) => `${a[0]} · airport`), ...ports.map((p) => `${p[0]} · port`)].slice(0, 8).map((s) => (
              <li key={s} className="text-[11px] font-sans" style={{ color: t.bodyText }}>
                {s}
              </li>
            ))}
          </ul>
          <Note t={t}>The airports and ports Natural Earth maps at its 1:10m scale: the larger ones, not every airstrip and harbour.</Note>
          <Foot sources={[...(airports.length ? [got.infra!.sources[2] ?? got.infra!.sources[0]] : []), ...(ports.length ? [got.ports!.source] : [])]} />
        </Panel>
      )}
      {heads.length > 0 && (
        <Panel t={t} title="Who leads its places" meta={`${heads.length} confirmed`}>
          <ul className="flex flex-col">
            {heads.slice(0, 8).map((h) => (
              <li key={h[9]} className="flex items-baseline justify-between gap-2 py-1 border-b last:border-b-0" style={{ borderColor: t.gridLine }}>
                <span className="text-[11px] font-sans" style={{ color: t.bodyText }}>
                  {h[1]}
                  <span style={{ color: t.mutedText }}> · {h[4]}</span>
                </span>
                <span className="text-[11px] font-sans font-semibold text-right" style={{ color: t.headText }}>
                  {h[3]}
                </span>
              </li>
            ))}
          </ul>
          <Note t={t}>Only heads that three records agree on: the place's own Wikidata record, its office's holders, and its Wikipedia article. Others are left out, not guessed.</Note>
          <Foot sources={[got.heads!.REPRESENTATIVES_SOURCES.wikidata, got.heads!.REPRESENTATIVES_SOURCES.wikipedia]} />
        </Panel>
      )}
    </Section>
  );
}

/** A state, province or region: its record, and for a US state the federal statistics the site holds. */
function RegionFigures({ t, cc, name, country, cities = [], geo }: { t: Tokens; cc: string; name: string; country: string; cities?: InCity[]; geo?: unknown }) {
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
        {cities.length > 0 && <CitiesIn t={t} cities={cities} where={name} />}
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
      {geo ? <Inside t={t} cc={cc} geo={geo} name={name} /> : null}
    </>
  );
}

/** A county: the Census Bureau's figures in the United States; elsewhere nothing but its outline is held. */
function CountyFigures({ t, cc, id, name, parent, country, sub, cities = [], areaKm2, geo }: { t: Tokens; cc: string; id: string; name: string; parent?: string; country: string; sub?: string; cities?: InCity[]; areaKm2?: number; geo?: unknown }) {
  const [data, setData] = useState<typeof import("../data/usCounties") | null>(null);
  const [econ, setEcon] = useState<typeof import("../data/usCountyEcon") | null>(null);
  useEffect(() => {
    if (cc !== "US") return;
    let off = false;
    import("../data/usCounties").then((m) => !off && setData(m));
    import("../data/usCountyEcon").then((m) => !off && setEcon(m));
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
        <Head t={t} name={name} sub={`${sub ?? `a division of ${where}`} · what is held of it, pressed on the map · the country's figures are below`} />
        <Section t={t} title="The place" kicker="how large it is, what lies in it, and the region around it">
          <Panel t={t} title="At a glance">
            <Tiles
              t={t}
              items={[
                ...(areaKm2 ? [{ label: "Area", text: `${whole(areaKm2)} km²`, y: "worked out from its outline" }] : []),
                ...(parent ? [{ label: "In", text: parent }] : []),
                { label: "Cities of 100,000+", text: String(cities.length) },
                ...(cities.length ? [{ label: "People in them", text: whole(cities.reduce((n, c) => n + c.people, 0)), y: "GeoNames, added here" }] : []),
              ]}
            />
            <Note t={t}>No body the site draws on publishes this division's own figures: its area is measured here from the outline its publisher gives, and the people counted are those of its large cities only.</Note>
            <Foot sources={[{ label: "geoBoundaries — gbOpen, second-order boundaries", url: "https://www.geoboundaries.org/" }, cities.length ? GEONAMES : undefined]} />
          </Panel>
          {cities.length > 0 && <CitiesIn t={t} cities={cities} where={name} />}
          {parent && <RegionRecord t={t} cc={cc} name={parent} country={country} />}
        </Section>
        {geo ? <Inside t={t} cc={cc} geo={geo} name={name} /> : null}
      </>
    );
  if (!data) return <Head t={t} name={name} sub="reading its figures…" />;
  if (!r) return <Head t={t} name={name} sub={`no record of it is held · ${where}`} />;
  const people = r[7];
  const last = people[people.length - 1];
  // Its place among its state's counties by people, and its share of them: worked out here from the same estimates.
  const sameState = data.US_COUNTIES.filter((x) => x[0].slice(0, 2) === r[0].slice(0, 2));
  const rank = [...sameState].sort((a, b) => b[7][b[7].length - 1] - a[7][a[7].length - 1]).findIndex((x) => x[0] === r[0]) + 1;
  const statePeople = sameState.reduce((n, x) => n + x[7][x[7].length - 1], 0);
  const ec = econ?.COUNTY_ECON_ROWS[r[0]];
  const st = econ?.STATE_ECON[r[0].slice(0, 2)];
  const us = econ?.NATION_ECON;
  const lastOf = (a?: (number | null)[]) => (a ? [...a].reverse().find((v) => v !== null) ?? null : null);
  const cmp = (label: string, i: 3 | 4) =>
    [
      { key: `c${i}`, label: r[1].replace(/ (County|Parish|Borough|Census Area|Municipality|city)$/i, ""), v: ec?.[i] ?? null, color: INK[0] },
      { key: `s${i}`, label: `${r[2]} (state)`, v: st?.[i] ?? null, color: INK[3] },
      { key: `n${i}`, label: "United States", v: us?.[i] ?? null, color: INK[5] },
    ].flatMap((x) => (x.v === null ? [] : [{ ...x, v: x.v as number, tip: `${x.label}: ${x.v}% ${label}` }]));
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
        {cities.length > 0 && <CitiesIn t={t} cities={cities} where={r[1]} />}
        <Panel t={t} title="Change, year by year" meta={`people · ${years[1]}–${years[years.length - 1]}`}>
          <SlimColumns
            height={150}
            label={`The change in the population of ${r[1]} on each year before`}
            rows={people.slice(1).map((v, i) => ({ key: String(years[i + 1]), label: String(years[i + 1]), v: v - people[i] }))}
            fmt={(v) => `${v > 0 ? "+" : ""}${whole(v)}`}
          />
          <Note t={t}>Each year's estimate less the year before's, worked out here.</Note>
          <Foot sources={[data.US_COUNTY_SOURCES.estimates]} />
        </Panel>
        <Panel t={t} title="Its place in its state" meta={r[2]}>
          <Tiles
            t={t}
            items={[
              { label: "By people", text: `${rank} of ${sameState.length}`, y: `counties of ${r[2]}` },
              { label: "Of the state's people", text: `${((last / statePeople) * 100).toFixed(1)}%`, y: `${years[years.length - 1]} · worked out here` },
              { label: "Births per 1,000", text: ((r[8] / last) * 1000).toFixed(1), y: "the year · worked out here" },
              { label: "Deaths per 1,000", text: ((r[9] / last) * 1000).toFixed(1), y: "the year · worked out here" },
              ...(ec?.[6] ? [{ label: "Rural-urban code", text: String(ec[6]), y: "USDA, 2023" }] : []),
            ]}
          />
          {ec?.[6] && econ ? <Note t={t}>{econ.RUCC[ec[6]]}.</Note> : null}
          <Foot sources={[data.US_COUNTY_SOURCES.estimates, ec?.[6] && econ ? econ.COUNTY_ECON_SOURCES.rucc : undefined]} />
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
      {ec && econ && (
        <Section t={t} title="Work, income and schooling" kicker="each beside its state's and the nation's">
          <Panel t={t} title="Unemployment, year by year" meta={`% of the labour force · ${econ.COUNTY_ECON.years[0]}–${econ.COUNTY_ECON.laborYear}`}>
            <Series t={t} rows={ec[0].flatMap((v, i) => (v === null ? [] : [{ y: String(econ.COUNTY_ECON.years[i]), v }]))} fmt={(v) => `${v.toFixed(1)}%`} color={INK[4]} />
            <Note t={t}>
              {lastOf(ec[0])}% in {econ.COUNTY_ECON.laborYear}; {r[2]} {lastOf(st?.[0])}%, the United States {lastOf(us?.[0])}%.{ec[1] ? ` A labour force of ${whole(ec[1])}.` : ""}
            </Note>
            <Foot sources={[econ.COUNTY_ECON_SOURCES.unemployment]} />
          </Panel>
          <Panel t={t} title="Income" meta={`median household · ${econ.COUNTY_ECON.povertyYear}`}>
            <SlimBars
              labelWidth="7rem"
              rows={[
                { key: "c", label: r[1].replace(/ (County|Parish|Borough|Census Area|Municipality|city)$/i, ""), v: ec[2], color: INK[1] },
                { key: "s", label: `${r[2]} (state)`, v: st?.[2] ?? null, color: INK[3] },
                { key: "n", label: "United States", v: us?.[2] ?? null, color: INK[5] },
              ].flatMap((x) => (x.v === null ? [] : [{ ...x, v: x.v as number }]))}
              fmt={(v) => `$${whole(v)}`}
            />
            <Foot sources={[econ.COUNTY_ECON_SOURCES.poverty]} />
          </Panel>
          <Panel t={t} title="Poverty" meta={`% below the poverty line · ${econ.COUNTY_ECON.povertyYear}`}>
            <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>All people</p>
            <SlimBars labelWidth="7rem" rows={cmp("of all people", 3)} fmt={(v) => `${v.toFixed(1)}%`} />
            <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.mutedText }}>Children under 18</p>
            <SlimBars labelWidth="7rem" rows={cmp("of children", 4)} fmt={(v) => `${v.toFixed(1)}%`} />
            <Foot sources={[econ.COUNTY_ECON_SOURCES.poverty]} />
          </Panel>
          <Panel t={t} title="How far its adults went in school" meta={`adults 25 and over · ${econ.COUNTY_ECON.schooling}`}>
            <Stack
              t={t}
              parts={["No high school diploma", "High school only", "Some college", "A bachelor's degree or more"].flatMap((n, i) => (ec[5][i] === null ? [] : [{ name: n, v: ec[5][i] as number }]))}
            />
            <SlimBars
              labelWidth="7rem"
              max={100}
              rows={[
                { key: "c", label: r[1].replace(/ (County|Parish|Borough|Census Area|Municipality|city)$/i, ""), v: ec[5][3], color: INK[6] },
                { key: "s", label: `${r[2]} (state)`, v: st?.[5][3] ?? null, color: INK[3] },
                { key: "n", label: "United States", v: us?.[5][3] ?? null, color: INK[5] },
              ].flatMap((x) => (x.v === null ? [] : [{ ...x, v: x.v as number }]))}
              fmt={(v) => `${v.toFixed(1)}%`}
            />
            <Note t={t}>The bars are the share with a bachelor's degree or more.</Note>
            <Foot sources={[econ.COUNTY_ECON_SOURCES.education]} />
          </Panel>
        </Section>
      )}
      {geo ? <Inside t={t} cc={cc} geo={geo} name={r[1]} /> : null}
    </>
  );
}

/** A city: the UN's figures for a city the site profiles, otherwise GeoNames' count. */
function CityFigures({ t, cc, name, people, country, region }: { t: Tokens; cc: string; name: string; people: number; country: string; region?: string }) {
  const city = citiesData.find((c) => c.countryCode === cc && c.name === name);
  const f = city ? CITY_FIGURES[city.id] : undefined;
  const { firstYear, baseYear } = CITY_FIGURES_SOURCE;
  const series = f ? f.pop.flatMap((v, i) => (v !== null && firstYear + i <= baseYear ? [{ y: String(firstYear + i), v }] : [])) : [];
  const at = (arr: (number | null)[] | undefined) => (arr ? arr[baseYear - firstYear] : null);
  const geo = GEONAMES;
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
        {region && <RegionRecord t={t} cc={cc} name={region} country={country} />}
      </Section>
    </>
  );
}

export default function PlaceFigures({ place, country }: { place: PressedPlace; country: string }) {
  const t = useTokens();
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {place.kind === "region" ? (
        <RegionFigures t={t} cc={place.cc} name={place.name} country={country} cities={place.cities} geo={place.geo} />
      ) : place.kind === "county" ? (
        <CountyFigures t={t} cc={place.cc} id={place.id} name={place.name} parent={place.parent} country={country} sub={place.sub} cities={place.cities} areaKm2={place.areaKm2} geo={place.geo} />
      ) : (
        <CityFigures t={t} cc={place.cc} name={place.name} people={place.people} country={country} region={place.region} />
      )}
    </div>
  );
}
