/**
 * The outline map as a country's or a US state's window shows it, on any page:
 * the place as the site's maps draw it, with the places listed in it as dots,
 * each saying its name and what it belongs to when it is pointed at.
 *
 *   A country     its first-order divisions (Natural Earth), framed without
 *                 its far-off parts, with its largest listed places - or the
 *                 dots the window gives instead: the Cities page gives the
 *                 cities the United Nations counts
 *   A US state    its outline among the same divisions, with the places
 *                 GeoNames lists whose point lies inside it
 *
 * A dot, pressed, goes straight to the place's own window: a listed place's
 * on the Municipalities page, by a link; a dot the window gave, wherever the
 * window says.
 *
 * Each fetches what it draws when it is first shown, and shows nothing where
 * no outline is held. It measures nothing: every dot is one size.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PLACES_SOURCE } from "../data/placesIndex";
import { flagColor } from "../lib/flagColor";
import { framed, placesWithin, useAdmin1, usePlacesFile } from "../lib/outlines";
import { OutlineMap, placeDots, type MapDot } from "./OutlineMap";
import { SourceLink } from "./SourceLink";

const COLOR = "#0ea5e9";
const NATURAL_EARTH = { label: "Natural Earth — admin-1 divisions (public domain)", url: "https://www.naturalearthdata.com/" };
const GEONAMES = { label: PLACES_SOURCE.geonames.label, url: PLACES_SOURCE.geonames.url };

export function CountryOutline({
  code,
  name,
  dots,
  dotsAre,
  dotsSource,
  mark,
  className = "mb-4",
  onDot,
}: {
  /** The country's ISO code. */
  code: string;
  name: string;
  /** The dots to show in place of its largest listed places, with what they are in a few words ("the 56 cities the United Nations counts") and whose they are. */
  dots?: MapDot[];
  dotsAre?: string;
  dotsSource?: { label: string; url: string };
  /** The one place the window is about, marked on the country. */
  mark?: MapDot;
  className?: string;
  /** What a press on one of the window's own dots does. A listed place goes to its window on the Municipalities page without being told. */
  onDot?: (d: MapDot) => void;
}) {
  const navigate = useNavigate();
  const drawn = useAdmin1(code);
  const frame = useMemo(() => (drawn ? framed(drawn) : undefined), [drawn]);
  // Its own places are fetched only where the window gives no dots of its own.
  const file = usePlacesFile(dots || mark ? null : code);
  const own = useMemo(() => placeDots(file?.places ?? [], 150, file), [file]);
  const shown = dots ?? (mark ? [] : own);
  if (!drawn || !drawn.length) return null;
  return (
    <div className={className}>
      <OutlineMap
        onDot={dots ? onDot : (d) => navigate(`/dashboard/subnations?open=place:${code}:${d.id}`)}
        // A division pointed at is picked out and named; pressed, it opens on the Municipalities page.
        onShape={(f) => f.properties.n && navigate(`/dashboard/subnations?country=${code}&name=${encodeURIComponent(f.properties.n)}`)}

        shapes={drawn}
        frame={frame}
        dots={shown}
        mark={mark}
        color={flagColor(code) ?? COLOR}
 label={`${name} and its ${drawn.length} divisions${mark ? `, with ${mark.name} marked` : shown.length ? `, with ${shown.length} places` : ""}`} />
      <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
        {name}'s divisions as the site's maps draw them
        {mark ? `, with ${mark.name} marked` : shown.length ? `, with ${dotsAre ?? `the ${shown.length} largest places GeoNames lists for it`} as dots - point at one for its name and what it belongs to, and press it for its own window` : ""}
        {frame && frame.length < drawn.length ? "; framed without its far-off parts" : ""}.
      </p>
      <SourceLink sources={[NATURAL_EARTH, ...(mark ? [] : [dotsSource ?? GEONAMES])]} className="mt-1" />
    </div>
  );
}

export function StateOutline({ name, className = "mb-4" }: { /** The state's name, as the maps have it. */ name: string; className?: string }) {
  const navigate = useNavigate();
  const drawn = useAdmin1("US");
  const shapes = useMemo(() => (drawn ? drawn.filter((f) => f.properties.n === name) : []), [drawn, name]);
  const file = usePlacesFile("US");
  const rows = useMemo(() => (shapes[0] && file ? placesWithin(shapes[0], file.places) : null), [shapes, file]);
  const dots = useMemo(() => placeDots(rows ?? [], 300, file), [rows, file]);
  if (!shapes.length) return null;
  return (
    <div className={className}>
      <OutlineMap onDot={(d) => navigate(`/dashboard/subnations?open=place:US:${d.id}`)} shapes={shapes} dots={dots} color={flagColor("US") ?? COLOR} label={`The outline of ${name}, with ${dots.length} of the places listed inside it`} />
      <p className="text-[10px] font-sans text-muted-foreground leading-snug mt-1">
        {name} as the site's maps draw it
        {rows ? `, with the ${rows.length > dots.length ? `${dots.length} largest of the ${rows.length.toLocaleString("en-US")}` : rows.length.toLocaleString("en-US")} places GeoNames lists inside it as dots - point at one for its name and its county, and press it for its own window` : ""}. Which

        places lie inside it is worked out here from the outline, so one at its very edge can fall on the other side.
      </p>
      <SourceLink sources={[NATURAL_EARTH, GEONAMES]} className="mt-1" />
    </div>
  );
}
