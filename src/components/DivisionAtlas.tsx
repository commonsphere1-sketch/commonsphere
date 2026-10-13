/**
 * The Maps page's third map: one division of the country in focus - a state,
 * a province, a region - drawn close enough for what is inside it. Its
 * counties or districts are the shapes, from the same tracing as its outline
 * so that the two meet; its municipalities are the dots, the places GeoNames
 * lists in it, largest first.
 *
 * It is the map at the head of a division's own window, given room and a
 * menu of the country's divisions. Drawn closer, a county or district is
 * pointed at and pressed to open its window; a dot opens the town's or
 * city's. Nothing is shaded by a figure: the site holds none county by
 * county outside the United States, and a colour would imply one. The whole
 * map is in the colour its division - or, outside the United States, its
 * country - has on the maps above.
 *
 * A country with no divisions held, or a division the maps draw no outline
 * for, is told so.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { PLACES_SOURCE } from "../data/placesIndex";
import { SUBNATIONS } from "../data/subnations";
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

export default function DivisionAtlas({
  code,
  country,
  color,
  colorOf,
}: {
  /** The ISO code of the country in focus on the map above. */
  code: string;
  country: string;
  /** The colour the country has on the maps above. */
  color: string;
  /** The colour a division has there, by its name, where divisions are coloured: the states of the United States. */
  colorOf?: (division: string) => string;
}) {
  const navigate = useNavigate();
  const divisions = useMemo(() => SUBNATIONS.filter((s) => s.cc === code).sort((a, b) => a.name.localeCompare(b.name)), [code]);
  /** The one first shown: the country's most populous, by the latest figure each one's record holds, or the first by name. */
  const first = useMemo(() => [...divisions].filter((s) => s.pop).sort((a, b) => b.pop![1] - a.pop![1])[0] ?? divisions[0], [divisions]);
  const [picked, setPicked] = useState<string | null>(null);
  // Another country in focus: its own first division, not the last one picked.
  useEffect(() => setPicked(null), [code]);
  const s = divisions.find((d) => d.id === picked) ?? first;

  const drawn = useAdmin1(s ? code : null);
  const outline = useMemo(() => (drawn && s ? drawn.filter((f) => f.properties.n === s.name) : []), [drawn, s]);
  const second = useSecondOrder(s ? code : null, s?.name);
  const listed = usePlaces(code);
  const within = useMemo(() => (listed && s ? insideOf(listed, s) : null), [listed, s]);
  const dots = useMemo(() => placeDots(within?.rows ?? [], DOTS, listed), [within, listed]);
  const shapes = second?.outline ?? outline;
  const ink = (s && colorOf?.(s.name)) || color;

  const head = (
    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-secondary">Counties and municipalities · {country}</p>
        <h2 className="text-sm font-bold font-sans text-foreground">{s ? `${s.name}${s.kind ? ` · ${s.kind}` : ""}` : country}</h2>
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
    </div>
  );

  if (!s)
    return (
      <>
        {head}
        <p className="text-xs font-sans text-muted-foreground">No divisions are held for {country}, so there is nothing to draw here. Pick another country on the map above.</p>
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
          by a figure - the colour is the one {colorOf ? s.name : country} has on the map above.
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
