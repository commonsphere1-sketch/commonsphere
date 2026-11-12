/**
 * A place's photo at ground level, near the top of its window, as asked: the photograph its Wikidata record names, from
 * Wikimedia Commons (build-place-photos.cjs), with its author and its licence as Commons gives them - read from Commons
 * when the window opens - and links to the place's gallery on Commons and to Mapillary's street-level pictures of it.
 *
 * Commons takes only licences that allow any use with credit - public domain, CC0, CC BY, CC BY-SA - and every photo is
 * shown as its page has it, uncut, with its credit under it. A place whose record names no photograph - only a map, a
 * flag or a picture from the air or space, or nothing - has none here: only the links, never a stand-in.
 */
import { useEffect, useState } from "react";

type Entry = [file: string | null, category?: string];
type Kind = "countries" | "divisions" | "counties" | "places";

const FILES = new Map<string, Promise<Record<string, Entry> | null>>();
const load = (path: string) => {
  if (!FILES.has(path))
    FILES.set(
      path,
      fetch(`/photos/${path}`)
        .then((r) => (r.ok ? (r.json() as Promise<Record<string, Entry>>) : null))
        .catch(() => null),
    );
  return FILES.get(path)!;
};

/** What Commons says of a file: a copy sized for the window, its page, its author and its licence. */
type Meta = { thumb: string; page: string; author: string; licence: string; licenceUrl?: string };
const METAS = new Map<string, Promise<Meta | null>>();
/** Text of the HTML Commons gives an author as: its tags dropped, its entities read. */
const plain = (html: string) => {
  const d = new DOMParser().parseFromString(html, "text/html");
  return (d.body.textContent ?? "").replace(/\s+/g, " ").trim();
};
const metaOf = (file: string) => {
  if (!METAS.has(file))
    METAS.set(
      file,
      fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=960&titles=${encodeURIComponent(`File:${file}`)}`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const info = j && (Object.values(j.query?.pages ?? {})[0] as { imageinfo?: { thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] })?.imageinfo?.[0];
          if (!info?.thumburl || !info.descriptionurl) return null;
          const m = info.extmetadata ?? {};
          return {
            thumb: info.thumburl,
            page: info.descriptionurl,
            author: plain(m.Artist?.value ?? "") || "author named on its page",
            licence: plain(m.LicenseShortName?.value ?? "") || "see its page",
            licenceUrl: m.LicenseUrl?.value || undefined,
          };
        })
        .catch(() => null),
    );
  return METAS.get(file)!;
};

export function PlacePhoto({ kind, id, cc, name, at }: { kind: Kind; /** Its key in its kind's file: an ISO code, a division's id, a county's FIPS code, a town's GeoNames id. */ id: string; /** A town's country, whose file it is in. */ cc?: string; name: string; /** Where it is, for the street-level link. */ at?: { lat: number; lon: number } | null }) {
  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);
  const [meta, setMeta] = useState<Meta | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setEntry(undefined);
    setMeta(undefined);
    void load(kind === "places" ? `places/${cc}.json` : `${kind}.json`).then((f) => {
      if (!live) return;
      const e = f?.[id] ?? null;
      setEntry(e);
      if (e?.[0]) void metaOf(e[0]).then((m) => live && setMeta(m));
      else setMeta(null);
    });
    return () => {
      live = false;
    };
  }, [kind, id, cc]);
  if (entry === undefined) return null;
  const file = entry?.[0] ?? null;
  const gallery = entry?.[1] ? `https://commons.wikimedia.org/wiki/Category:${encodeURIComponent(entry[1].replace(/ /g, "_"))}` : `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(name)}&title=Special:MediaSearch&type=image`;
  const street = at && Number.isFinite(at.lat) && Number.isFinite(at.lon) ? `https://www.mapillary.com/app/?lat=${at.lat.toFixed(5)}&lng=${at.lon.toFixed(5)}&z=15` : null;
  const link = "underline decoration-dotted underline-offset-2 hover:text-foreground";
  return (
    <figure className="m-0">
      {file && meta && (
        <a href={meta.page} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-border bg-muted" title={`${file} - on Wikimedia Commons`}>
          <img src={meta.thumb} alt={`${name}: ${file.replace(/\.[a-z]+$/i, "")}`} loading="lazy" className="w-full h-48 sm:h-60 object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
        </a>
      )}
      {file && meta === undefined && <div className="w-full h-48 sm:h-60 rounded-xl border border-border bg-muted animate-pulse" aria-hidden />}
      <figcaption className="text-[10px] font-sans text-muted-foreground leading-snug mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
        {file && meta ? (
          <span>
            Photo: {meta.author} ·{" "}
            {meta.licenceUrl ? (
              <a href={meta.licenceUrl} target="_blank" rel="noopener noreferrer" className={link}>
                {meta.licence}
              </a>
            ) : (
              meta.licence
            )}{" "}
            ·{" "}
            <a href={meta.page} target="_blank" rel="noopener noreferrer" className={link}>
              Wikimedia Commons
            </a>
          </span>
        ) : file && meta === null ? (
          <span>Its photo on Wikimedia Commons could not be read just now.</span>
        ) : !file ? (
          <span>No photograph at ground level is on its Wikidata record.</span>
        ) : null}
        <a href={gallery} target="_blank" rel="noopener noreferrer" className={link}>
          {entry?.[1] ? "More photos on Wikimedia Commons ↗" : "Search Wikimedia Commons ↗"}
        </a>
        {street && (
          <a href={street} target="_blank" rel="noopener noreferrer" className={link} title="Mapillary's street-level pictures, open (CC BY-SA), taken by its contributors">
            Street level on Mapillary ↗
          </a>
        )}
      </figcaption>
    </figure>
  );
}
