# Vendored boundary data

`admin1.topo.json` — first-order administrative divisions (states, provinces,
territories) from Natural Earth 1:50m, public domain.

Source:
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_1_states_provinces.geojson

Processed before committing: every property except the ISO 3166-1 alpha-2
country code (`c`) and the subdivision name (`n`) was dropped, then converted to
TopoJSON quantised at 1e5. That took it from 2.22 MB to 0.48 MB.

Coverage is nine countries, which is what Natural Earth ships at this
resolution — Russia, the United States, India, Indonesia, China, Brazil,
Canada, Australia and South Africa. Global admin-1 coverage exists only in the
1:10m file, which is 38.8 MB and too heavy to ship. The maps page names the
countries it can draw internal borders for rather than leaving the omission to
be guessed at.
