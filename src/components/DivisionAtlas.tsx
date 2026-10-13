/**
 * The Maps page's third map: one division of the country in focus - a state,
 * a province, a region - drawn close enough for what is inside it. Its
 * counties or districts are the shapes, from the same tracing as its outline
 * so that the two meet; its municipalities are the dots, the places GeoNames
 * lists in it, largest first.
 *
 * It follows the maps above it: a country, a state or a province pointed at
 * there, or the state a county pointed at lies in, is what this map draws
 * next, and it stays on it until another is pointed at or picked from its
 * menu. Nothing is fetched for it until the page reaches it.
 *
 * It has two menus of its own, so that any division of any country can be
 * drawn without going by way of the maps above: every country the site
 * holds divisions for, and the divisions of the one chosen. A third menu
 * lists every municipality of the division drawn, and opens the one picked. A country
 * picked here stays until another is picked, or one is pointed at above.
 *
 * It is the map at the head of a division's own window, given room and
 * those menus. Drawn closer, a county or district is
 * pointed at and pressed to open its window; a dot opens the town's or
 * city's. Nothing is shaded by a figure: the site holds none county by
 * county outside the United States, and a colour would imply one. The whole
 * map is in the colour its division - or, outside the United States, its
 * country - has on the maps above.
 *
 * A country with no divisions held, or a division the maps draw no outline
 * for, is told so.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { PLACE_COUNTRIES, PLACES_SOURCE } from "../data/placesIndex";
import { SUBNATIONS } from "../data/subnations";
import { flagColor } from "../lib/flagColor";
import { useAdmin1 } from "../lib/outlines";
import { useSecondOrder } from "../lib/secondOrder";
import { insideOf, usePlaces } from "./DivisionPlaces";
import { OutlineMap, placeDots } from "./OutlineMap";
import { SourceLink } from "./SourceLink";
import { StyledSelect } from "./StyledSelect";

const whole = (v: number) => Math.round(v).toLocaleString("en-US");
/** How many municipalities are named under the map. */
const NAMED = 12;
/** How many are drawn as dots: the largest of them. */
const DOTS = 300;

/** Every country the site holds divisions for, by name: what the map's first menu offers. */
const COUNTRIES = [...new Set(SUBNATIONS.map((s) => s.cc))].map((cc) => ({ value: cc, label: PLACE_COUNTRIES[cc]?.[0] ?? cc })).sort((a, b) => a.label.localeCompare(b.label));

type Props = {
  /** The ISO code of the country in focus on the map above, or of the one last pointed at there. */
  code: string;
  country: string;
  /** The division last pointed at on a map above, by its name: this map draws it. */
  division?: string;
  /** The colour the country has on the maps above. */
  color: string;
  /** The colour a division has there, by its name, where divisions are coloured: the states of the United States. */
  colorOf?: (division: string) => string;
};

function Atlas({ code: above, country: aboveName, division, color: aboveColor, colorOf: aboveColorOf }: Props) {
  const navigate = useNavigate();
  /** The country picked from this map's own menu: it stands until another is picked here or one is pointed at above. */
  const [here, setHere] = useState<string | null>(null);
  useEffect(() => setHere(null), [above, division]);
  const code = here ?? above;
  const own = code !== above;
  const country = own ? (PLACE_COUNTRIES[code]?.[0] ?? code) : aboveName;
  // A country picked here has no colour on the maps above to follow: it takes its flag's, where one is held.
  const color = own ? (flagColor(code) ?? aboveColor) : aboveColor;
  const colorOf = own ? undefined : aboveColorOf;
  const divisions = useMemo(() => SUBNATIONS.filter((s) => s.cc === code).sort((a, b) => a.name.localeCompare(b.name)), [code]);
  /** The one first shown: the country's most populous, by the latest figure each one's record holds, or the first by name. */
  const first = useMemo(() => [...divisions].filter((s) => s.pop).sort((a, b) => b.pop![1] - a.pop![1])[0] ?? divisions[0], [divisions]);
  const [picked, setPicked] = useState<string | null>(null);
  // The division pointed at above is drawn; another country without one named is drawn by its own first division, not the last one picked.
  useEffect(() => setPicked((!own && division && divisions.find((d) => d.name === division)?.id) || null), [code, own, division, divisions]);
  const s = divisions.find((d) => d.id === picked) ?? first;

  const drawn = useAdmin1(s ? code : null);
  const outline = useMemo(() => (drawn && s ? drawn.filter((f) => f.properties.n === s.name) : []), [drawn, s]);
  const second = useSecondOrder(s ? code : null, s?.name);
  const listed = usePlaces(code);
  const within = useMemo(() => (listed && s ? insideOf(listed, s) : null), [listed, s]);
  const dots = useMemo(() => placeDots(within?.rows ?? [], DOTS, listed), [within, listed]);
  /** Every municipality of the division, by name: what the third menu goes to. */
  const towns = useMemo(() => (within?.rows ?? []).map((p) => ({ value: String(p[6]), label: p[0] })).sort((a, b) => a.label.localeCompare(b.label)), [within]);
  const shapes = second?.outline ?? outline;
  const ink = (s && colorOf?.(s.name)) || color;

  const head = (
    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">Counties and municipalities · {country}</p>
        <h2 className="text-sm font-bold font-sans text-foreground">{s ? `${s.name}${s.kind ? ` · ${s.kind}` : ""}` : country}</h2>
      </div>
      {/* Its two menus: any country the site holds divisions for, and any division of the one chosen. */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-full border border-border px-3 py-1.5">
          <StyledSelect
            value={code}
            onValueChange={(cc) => setHere(cc === above ? null : cc)}
            options={COUNTRIES.some((c) => c.value === code) ? COUNTRIES : [{ value: code, label: country }, ...COUNTRIES]}
            ariaLabel="Which country the map draws a division of"
            triggerClassName="!text-[12px] font-semibold !text-foreground"
          />
        </div>
        {divisions.length > 1 && s && (
          <div className="rounded-full border border-border px-3 py-1.5">
            <StyledSelect
              value={s.id}
              onValueChange={setPicked}
              options={divisions.map((d) => ({ value: d.id, label: d.name }))}
              ariaLabel={`Which division of ${country} the map draws`}
              triggerClassName="!text-[12px] font-semibold !text-foreground"
            />
          </div>
        )}
        {/* And every municipality of the division drawn - not only the dots and the largest named below: one picked opens its window. */}
        {towns.length > 0 && s && (
          <div className="rounded-full border border-border px-3 py-1.5">
            <StyledSelect
              value="-"
              onValueChange={(id) => id !== "-" && navigate(`/dashboard/subnations?open=place:${code}:${id}`)}
              options={[{ value: "-", label: `Its ${whole(towns.length)} municipalities` }, ...towns]}
              ariaLabel={`Open a municipality of ${s.name}`}
              triggerClassName="!text-[12px] font-semibold !text-foreground"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (!s)
    return (
      <>
        {head}
        <p className="text-xs font-sans text-muted-foreground">No divisions are held for {country}, so there is nothing to draw here. Pick another country from the menu, or on the map above.</p>
      </>
    );

  const loading = drawn === undefined || second === undefined;
  return (
    <>
      {head}
      {shapes.length > 0 ? (
        <OutlineMap
          key={s.id}
          shapes={shapes}
          inner={second?.inner}
          parts={second?.lines}
          onPart={second ? (i) => navigate(second.open(i)) : undefined}
          dots={dots}
          color={ink}
          label={`${s.name}, with ${second && second.lines.length > 1 ? `its ${second.lines.length} ${second.are} and ` : ""}${dots.length} of the places listed in it`}
          onDot={(d) => navigate(`/dashboard/subnations?open=place:${code}:${d.id}`)}
        />
      ) : (
        <p className="text-xs font-sans text-muted-foreground modal-tile rounded-xl p-4">{loading ? `Drawing ${s.name}…` : `The site's maps draw no outline for ${s.name}, so it cannot be shown here. Its window still lists what is in it.`}</p>
      )}
      {shapes.length > 0 && (
        <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-2">
          {s.name} as the site's maps draw it
          {second && second.lines.length > 1 ? `, with the borders of its ${second.lines.length} ${second.are}: draw the map closer to point at one, and press it to open its window` : ", with no finer borders held for it"}
          {dots.length ? `. The dots are ${within!.rows.length > dots.length ? `the ${dots.length} largest of the ${whole(within!.rows.length)}` : `the ${dots.length}`} places GeoNames lists in it: press one to open it` : ""}. Nothing is shaded
          by a figure - the colour is {own ? `${country}'s, from its flag` : `the one ${colorOf ? s.name : country} has on the map above`}. This map follows the ones above - point at a country, a state or a province there and it is drawn here - and its menus reach any country, any of its divisions, and every municipality of the one drawn.
        </p>
      )}

      {within && within.rows.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5">Its largest municipalities · people as GeoNames has them</p>
          <div className="flex flex-wrap gap-1.5">
            {within.rows.slice(0, NAMED).map((p) => (
              <button
                key={p[6]}
                type="button"
                onClick={() => navigate(`/dashboard/subnations?open=place:${code}:${p[6]}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans border border-border text-foreground hover:border-secondary/60 transition-colors cursor-pointer"
              >
                {p[0]}
                {p[3] > 0 && <span className="font-mono text-muted-foreground">{whole(p[3])}</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate(`/dashboard/subnations?open=${encodeURIComponent(s.id)}`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-sans border border-border text-foreground hover:border-secondary/60 transition-colors cursor-pointer"
            >
              All of {s.name} <ArrowRight size={11} weight="bold" aria-hidden />
            </button>
          </div>
        </div>
      )}
      <SourceLink
        sources={[...(second ? [second.source] : []), { label: "Natural Earth — first-order divisions, 1:10m", url: "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/" }, { label: PLACES_SOURCE.geonames.label, url: PLACES_SOURCE.geonames.url }]}
        className="mt-3"
      />
    </>
  );
}

/** The map, once the page has come near it: until then nothing of it is fetched, whatever is pointed at above. */
export default function DivisionAtlas(props: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") return setSeen(true);
    const watch = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setSeen(true), { rootMargin: "400px" });
    watch.observe(el);
    return () => watch.disconnect();
  }, [seen]);
  return <div ref={box}>{seen ? <Atlas {...props} /> : <p className="text-xs font-sans text-muted-foreground">Counties and municipalities · {props.country}: the map is drawn when the page reaches it.</p>}</div>;
}
