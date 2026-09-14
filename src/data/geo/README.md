# Vendored boundary data

First-order administrative divisions — states, provinces, territories — from
**Natural Earth 1:10m**, public domain.

Source:
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_1_states_provinces.geojson

## Why it is split up

The source file is 38.8 MB and covers 4,596 divisions in 241 countries. The
maps page shows one country at a time, so bundling it would mean shipping the
whole world to draw one border. `build-admin1.cjs` at the repo root splits it
into one quantised TopoJSON per country under `static/geo/admin1/`, keyed by
ISO 3166-1 alpha-2:

- 241 files, 7.2 MB on disk in total
- about 30 KB for a typical country, 551 KB for Russia, the largest
- served statically and fetched only when that country is selected

`manifest.json` in the same folder maps each country code to its division
count, so the page knows what exists without probing for files.

Every property except the division name was dropped — the country code is the
filename — and coordinates are quantised at 1e4.

## Regenerating

```bash
curl -sL -o admin1-10m-raw.geojson \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
node --max-old-space-size=4096 build-admin1.cjs
node build-admin1-borders.cjs
rm admin1-10m-raw.geojson
```

## The world map's border layer

`static/geo/admin1-borders.json` is built from the per-country files, so it
must be regenerated after them. It keeps only the borders a country's
divisions share with one another — no coastlines, no country outlines — for
the 194 countries that have any, simplified with Douglas-Peucker to within
0.02° (under half a pixel at the map's 8x zoom) with endpoints kept, so the
lines still meet the coast. About 690 KB, 226 KB gzipped, fetched once.

The raw download is deliberately not committed.

## The world map's overlay layers

`build-map-layers.cjs` writes four more files into `static/geo/`, each fetched
only when its toggle on the maps page is first switched on:

| file | what it holds | source | on the wire |
|---|---|---|---|
| `rivers.json` | 1,454 rivers and lake centrelines | Natural Earth 1:10m | 161 KB gzipped |
| `lakes.json` | 1,310 lakes and reservoirs | Natural Earth 1:10m | 100 KB gzipped |
| `ports.json` | 1,081 ports | Natural Earth 1:10m | 16 KB gzipped |
| `infrastructure.json` | trunk roads, principal railways, 893 airports | Natural Earth 1:10m | 396 KB gzipped |
| `mines.json` | 16,424 mineral sites | USGS, three surveys | 256 KB gzipped |

Every layer is drawn on all three maps — the world map, the United States map
and the per-country map — in whatever projection that map uses, clipped to the
country in view. One set of switches drives all of them.

Natural Earth is public domain. The two USGS datasets are US Government work
and likewise public domain.

Lines and rings are simplified with the same Douglas-Peucker pass as the border
layer — `geo-simplify.cjs`, shared by both scripts — at 0.02°, under half a
pixel at the map's deepest zoom. Point layers are written as index rows against
a string table rather than as GeoJSON, which is what keeps 9,639 mineral sites
down to 157 KB.

### What the infrastructure layer does not say

It is the **trunk network** — major highways, secondary highways, beltways and
bypasses, plus principal railways — not every road. The full 1:10m files hold
82,013 separate ways and 2.1 million positions; written out whole they came to
8 MB, with the per-way overhead dominating. Merging each network into one
geometry and keeping the trunk routes brings it into line with the other layers.

More importantly, **coverage is uneven between regions**, so the layer must not
be read as a measure of how much road or rail a country has. Clipping Natural
Earth's railways to country boundaries and comparing with the World Bank's
route-km (`IS.RRS.TOTL.KM`, latest per country, 2021) gives:

| country | Natural Earth km | World Bank km | ratio |
|---|---|---|---|
| India | 41,300 | 68,103 | 0.61x |
| United States | 91,404 | 148,553 | 0.62x |
| China | 70,329 | 109,767 | 0.64x |
| Canada | 35,426 | 48,150 | 0.74x |
| France | 21,858 | 27,716 | 0.79x |
| Germany | 31,798 | 33,401 | 0.95x |
| Poland | 24,540 | 18,620 | 1.32x |
| Russia | 119,275 | 85,544 | 1.39x |

A spread of 0.61x to 1.39x. The layer is a cartographic reference, not a
network census, and the note under the map says so.

### What the mineral layer does not say

It merges three USGS surveys that answer different questions, and **none is
current** — the newest is 2008 and the rest are 2003. USGS publishes no later
point-location dataset at this coverage:

- **Mineral operations outside the United States** — working mines, plants,
  refineries and smelters, surveyed 2003–2008. As its title says, it contains
  no United States records at all.
- **Active mines and mineral plants in the United States** — the companion
  survey that does, from 2003. Without it the map showed an empty United States
  and relied on a note to explain why.
- **Major mineral deposits of the world** (OFR 2005-1294) — known deposits,
  which is not the same thing as a working mine.

Operations and deposits are kept apart by a `record` flag rather than summed,
because a deposit and an operation at the same place are two different facts.
The map draws an operation as a filled circle and a deposit as a hollow one,
and the note under the map carries every survey date.

On the United States map, Albers USA does not clip hard at the border, so a
site just inside Canada or Mexico is drawn too; the country outline is the
guide to what is actually inside.

### Regenerating

```bash
node build-map-layers.cjs
```

It downloads what it needs into a cache directory under the system temp folder,
so a re-run costs nothing. Raw downloads are not committed.
