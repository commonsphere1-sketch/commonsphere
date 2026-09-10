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
rm admin1-10m-raw.geojson
```

The raw download is deliberately not committed.
