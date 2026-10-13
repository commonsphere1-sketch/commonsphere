/**
 * Getting to work, in a city's window: how long the journey takes and how
 * people make it (data/commute.ts).
 *
 * The city's own figures come first, where an official series has them: the
 * Census Bureau's for a city of the United States - the Census place of its
 * name, within its own boundary - and Eurostat's city statistics for a city
 * of Europe. Under them is the country's, said to be the country's. The
 * series are different surveys of different years and are not ranked against
 * each other; each figure carries whose it is and its year.
 *
 * A city neither series covers is told so, with what the site does hold:
 * no figure is put in the gap.
 */
import { COMMUTE_EU, COMMUTE_EUROPE, COMMUTE_SOURCES, COMMUTE_UN_CITIES, COMMUTE_US, COMMUTE_US_CITIES, type CityCommute } from "../data/commute";
import type { ReactNode } from "react";
import { UN_OF_PROFILE } from "../lib/profiledCities";
import { inSentence } from "./CountryQuality";
import { ChartNote, ChartTitle, PartsDonut } from "./ModalCharts";
import { SourceLink } from "./SourceLink";

type Source = { label: string; url: string };
type Tile = { label: string; value: string; sub: string };

const min = (v: number) => `${v} min`;
const ACS: Source = { label: COMMUTE_SOURCES.acs.label, url: COMMUTE_SOURCES.acs.url };
const LFS: Source = { label: COMMUTE_SOURCES.eurostat.label, url: COMMUTE_SOURCES.eurostat.url };
const URB: Source = { label: COMMUTE_SOURCES.cities.label, url: COMMUTE_SOURCES.cities.url };
const UN_HELD = Object.values(COMMUTE_UN_CITIES);
const US_CITIES = UN_HELD.filter((c) => c.from === "acs").length;
const EUROPE_CITIES = UN_HELD.length - US_CITIES;

/** The city's own figures: by the Cities page's id for a profile, or by the UN's id for the city. */
function ownOf(city: string | undefined): CityCommute | undefined {
  if (!city) return undefined;
  const byHand = COMMUTE_US_CITIES[city];
  if (byHand) return { from: "acs", ...byHand };
  return COMMUTE_UN_CITIES[city] ?? COMMUTE_UN_CITIES[UN_OF_PROFILE.get(city) ?? ""];
}

function Tiles({ tiles }: { tiles: Tile[] }) {
  if (!tiles.length) return null;
  return (
    <div className="tile-fill gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="modal-tile rounded-lg p-3">
          <p className="text-xs text-muted-foreground font-sans">{t.label}</p>
          <p className="text-base font-bold font-sans text-foreground leading-snug">{t.value}</p>
          <p className="text-xs text-muted-foreground font-sans leading-snug">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default function CommutePanel({
  code,
  country,
  place,
  city,
  className = "",
}: {
  /** The country's ISO code. */
  code: string;
  country: string;
  /** The city whose window this is. */
  place: string;
  /** The city's id: the UN's for it ("un-US-8354"), or its profile's on the Cities page. */
  city?: string;
  className?: string;
}) {
  const own = ownOf(city);
  const eur = COMMUTE_EUROPE[code];
  const usa = code === "US" ? COMMUTE_US : undefined;
  const sources = new Map<string, Source>();
  const cite = (s: Source) => sources.set(s.url, s);
  const land = inSentence(country);
  const share = (c: { modes: [string, number][] }, way: string) => c.modes.find(([w]) => w === way)?.[1];

  let cityTiles: Tile[] = [];
  let cityRing: ReactNode = null;
  let cityNote = "";
  if (own?.from === "acs") {
    cite(ACS);
    const year = COMMUTE_SOURCES.acs.year;
    const transit = share(own, "Public transport");
    const home = share(own, "Worked from home");
    cityTiles = [
      { label: "Average Journey, One Way", value: min(own.minutes), sub: `workers who travel to work · ${year} · the United States ${min(COMMUTE_US.minutes)}` },
      { label: "Journeys Of An Hour Or More", value: `${own.hourPlusPct}%`, sub: `of those who travel · ${year} · the United States ${COMMUTE_US.hourPlusPct}%` },
      ...(transit != null ? [{ label: "By Public Transport", value: `${transit}%`, sub: `of all workers · ${year} · the United States ${share(COMMUTE_US, "Public transport")}%` }] : []),
      ...(home != null ? [{ label: "Worked From Home", value: `${home}%`, sub: `of all workers · ${year} · the United States ${share(COMMUTE_US, "Worked from home")}%` }] : []),
    ];
    cityRing = own.modes.length ? (
      <div className="mt-3">
        <ChartTitle>
          How people in {own.place} get to work · % of workers · {year}
        </ChartTitle>
        <PartsDonut label={`How workers in ${own.place} get to work, ${year}`} parts={own.modes.map(([way, v]) => ({ label: way, value: v, text: `${v}%` }))} />
      </div>
    ) : null;
    cityNote = `These are the Census Bureau's figures for ${own.place}: the city within its own boundary, not the wider built-up area around it.${
      own.modes.length ? "" : " The Bureau gives the ways people get to work in full only for its larger places; for this one it gives the length of the journey."
    }`;
  } else if (own?.from === "eurostat") {
    cite(URB);
    const { minutes, modes } = own;
    const est = (e?: true) => (e ? " · Eurostat's estimate" : "");
    const way = (name: string) => modes?.parts.find(([w]) => w === name)?.[1];
    cityTiles = [
      ...(minutes ? [{ label: "Average Journey To Work", value: min(minutes.v), sub: `the city, as Eurostat draws it · ${minutes.y}${est(minutes.est)}` }] : []),
      ...(modes && way("Public transport") != null ? [{ label: "By Public Transport", value: `${way("Public transport")}%`, sub: `of journeys to work · ${modes.y}${est(modes.est)}` }] : []),
      ...(modes && way("Car") != null ? [{ label: "By Car", value: `${way("Car")}%`, sub: `of journeys to work · ${modes.y}${est(modes.est)}` }] : []),
      ...(modes && way("Bicycle") != null ? [{ label: "By Bicycle", value: `${way("Bicycle")}%`, sub: `of journeys to work · ${modes.y}${est(modes.est)}` }] : []),
    ];
    cityRing = modes ? (
      <div className="mt-3">
        <ChartTitle>
          How journeys to work in {place} are made · % of journeys · {modes.y}
        </ChartTitle>
        <PartsDonut
          label={`How journeys to work in ${place} are made, ${modes.y}`}
          parts={[
            ...modes.parts.map(([w, v]) => ({ label: w, value: v, text: `${v}%` })),
            ...(modes.rest ? [{ label: "Other ways, or not given", value: modes.rest, text: `${modes.rest}%` }] : []),
          ]}
        />
      </div>
    ) : null;
    cityNote = `From Eurostat's city statistics, for the city it lists as ${own.place}. The figures are gathered from national censuses and surveys, so their years differ from city to city.${
      modes?.rest ? " What the shares leave of the whole is worked out here." : ""
    }`;
  }

  // The country's, under the city's: for a city of the United States that has its own, the country's figure already stands beside each of them.
  let countryTiles: Tile[] = [];
  let countryRing: ReactNode = null;
  if (eur) {
    cite(LFS);
    const year = COMMUTE_SOURCES.eurostat.year;
    const row = (label: string, v: number | undefined, eu: number | undefined, who: string): Tile[] => (v == null ? [] : [{ label, value: min(v), sub: `${who} · ${year}${eu != null ? ` · the European Union ${min(eu)}` : ""}` }]);
    countryTiles = [
      ...row("Average Journey, One Way", eur.all, COMMUTE_EU.all, "employed people who travel to work"),
      ...row("People Living In Cities", eur.cities, COMMUTE_EU.cities, "cities as Eurostat classes them"),
      ...row("In Towns And Suburbs", eur.towns, COMMUTE_EU.towns, "one way"),
      ...row("In Rural Areas", eur.rural, COMMUTE_EU.rural, "one way"),
    ];
  } else if (usa && own?.from !== "acs") {
    cite(ACS);
    const year = COMMUTE_SOURCES.acs.year;
    countryTiles = [
      { label: "Average Journey, One Way", value: min(usa.minutes), sub: `workers who travel to work · ${year}` },
      { label: "Journeys Of An Hour Or More", value: `${usa.hourPlusPct}%`, sub: `of those who travel · ${year}` },
    ];
    countryRing = (
      <div className="mt-3">
        <ChartTitle>How people in the United States get to work · % of workers · {year}</ChartTitle>
        <PartsDonut label={`How workers in the United States get to work, ${year}`} parts={usa.modes.map(([way, v]) => ({ label: way, value: v, text: `${v}%` }))} />
      </div>
    );
  }
  const held = cityTiles.length > 0 || cityRing !== null;

  return (
    <section className={className}>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest">🚆 Getting to work</h3>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      {held ? (
        <>
          <Tiles tiles={cityTiles} />
          {cityRing}
          <ChartNote className="mt-2">{cityNote}</ChartNote>
        </>
      ) : (
        <p className="text-[11px] font-sans text-muted-foreground leading-snug mb-2">
          No figure is held for {place} itself. No body publishes the journey to work for every city on one footing: the site has the Census Bureau's for {US_CITIES} cities of the United States and Eurostat's for {EUROPE_CITIES}{" "}
          cities of Europe, and no ranking from a traffic app or an opinion survey is put in their place.
        </p>
      )}
      {countryTiles.length > 0 ? (
        <div className={held ? "mt-3" : ""}>
          <ChartTitle>
            {country} as a whole{eur && own?.from === "eurostat" ? " · a different survey from the city's" : ""}
          </ChartTitle>
          <Tiles tiles={countryTiles} />
          {countryRing}
        </div>
      ) : (
        !held && <p className="text-[11px] font-sans text-muted-foreground leading-snug">Nor is one held for {land}: Eurostat has it for {Object.keys(COMMUTE_EUROPE).length} European countries, and the Census Bureau for the United States.</p>
      )}
      {sources.size > 0 && <SourceLink sources={[...sources.values()]} className="mt-2" />}
    </section>
  );
}
