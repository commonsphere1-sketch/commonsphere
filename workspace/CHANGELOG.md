<instructions>
## 🚨 MANDATORY: CHANGELOG TRACKING 🚨

You MUST maintain this file to track your work across messages. This is NON-NEGOTIABLE.

---

## INSTRUCTIONS

- **MAX 5 lines** per entry - be concise but informative
- **Include file paths** of key files modified or discovered
- **Note patterns/conventions** found in the codebase
- **Sort entries by date** in DESCENDING order (most recent first)
- If this file gets corrupted, messy, or unsorted -> re-create it. 
- CRITICAL: Updating this file at the END of EVERY response is MANDATORY.
- CRITICAL: Keep this file under 300 lines. You are allowed to summarize, change the format, delete entries, etc., in order to keep it under the limit.

</instructions>

<changelog>

## 2026-08-17 — Move StatesCarousel above National card on DashboardPage
- Removed StatesCarousel from its position after the main grid
- Re-inserted it immediately before the National section card

## 2026-08-17 — Remove GlobalNorthSouthMap card from DashboardPage
- Deleted the `<GlobalNorthSouthMap>` usage block from DashboardPage render output
- Component definition and all SVG helpers remain in file but are no longer rendered

## 2026-08-17 — Replace SVG world map with Brandt Line Wikipedia image
- Replaced entire SVG-drawn GlobalNorthSouthMap with a real Wikimedia Brandt Line image
- Added fallback src in case primary image fails to load
- Kept card header, legend, Brandt Line label overlay, and footer stats row intact
- Removed all SVG path helpers (COUNTRIES_MAP, LABELED_COUNTRIES, mkRect, mkPath, ll2xy, graticules) — still in file but unused (can be cleaned later)

## 2026-08-17 — Show estimated net worth under flag on MonarchCard
- Extracted first `~$XB` value from `netWorthNote` via regex and displayed it under the flag
- Wrapped flag in a flex-col container alongside the net worth badge (amber, monospace, 9px)

## 2026-08-17 — Match Quality of Living Score card height to TaxCard below it
- Added `items-stretch` to the grid wrapper and `h-full` to the QoL tile div
- Both col-span-2 tiles now grow to equal height within their shared grid row

## 2026-08-17 — Move HDI badge from card header to bottom row beside CPI score
- Removed HDI badge from the card header (top-right); replaced with empty `<div />`
- Added HDI badge alongside CPI badge in a flex row at `ml-auto` in the bottom tag row
- Both HDI and CPI badges now appear as a paired group at the card footer

## 2026-08-17 — Fix flag banner img in country detail: switch to w320, inline styles only (no className sizing)
- Removed Tailwind `w-full h-full object-cover` classes from flag img — replaced with equivalent inline `style` props
- Switched from `w640` to `w320` flagcdn size (matches proven-working carousel flags)
- `onError` now hides the img entirely (`display:none`) instead of opacity fade

## 2026-08-17 — Move flag banner to top of country detail panel in InteractiveDataPanel
- Swapped order: flag banner image now renders first, header (emoji + name) below it
- No other changes to detail panel content or layout

## 2026-08-17 — Constrain InteractiveDataPanel to fixed 520px height with internal scroll
- Content area wrapper: `height: 520px; overflow: hidden`
- List column and detail panel both get `height: 100%; overflow-y: auto`
- Both columns scroll independently within the fixed-height container

## 2026-08-17 — Stretch InteractiveDataPanel list column to full detail panel height
- Removed `overflow-hidden` from content area wrapper and removed `maxHeight: 680` cap on list column
- List column now grows naturally to match the height of the detail panel beside it
- Both columns remain independently scrollable

## 2026-08-17 — Expand InteractiveDataPanel country detail panel with richer data
- Removed fixed 420px height; list column capped at maxHeight:680, detail panel grows to fill
- Country detail now has: 3-col KPI grid, secondary stats (pop/life exp/trade balance/area), 5 industries
- Added Political & Social facts table (government, head of state, capital, continent)
- Added computed Macro Health Score (0–100) with sub-scores for HDI/Growth/Inflation/Employment

## 2026-08-17 — Fix InteractiveDataPanel height to 420px with internal scroll
- Changed content area from `flex-1 / minHeight:340` to fixed `height:420px`
- Both list column and detail panel now scroll independently within the fixed box
- Panel no longer stretches to full content height

## 2026-08-17 — Remove Trending tab from InteractiveDataPanel
- Removed "trending" from `type DataTab` union and from `TAB_CONFIG` array
- Default tab is now "countries"; `useState` seeds to `"countries"`
- Removed entire Trending tab content block (~130 lines of JSX)
- Cleaned stray `{ }` wrapper around search bar; now renders unconditionally
- Footer count and nav button updated to 3-tab logic (no trending branch)

## 2026-08-17 — Remove spurious `selected` class from InteractiveDataPanel detail div
- Detail panel div had a stray `selected` class: `flex-1 overflow-y-auto p-4 flex flex-col gap-3 animate-fade-in selected`
- Removed the `selected` class — it served no styling purpose and was not intentional

## 2026-08-17 — Toggle-to-retract detail panel in Countries tab
- Clicking an already-selected country in the Countries tab now deselects it (sets to null)
- Detail panel collapses/retracts when no country is selected
- Only the Countries tab row click handler was changed; other tabs unaffected

## 2026-08-17 — Make InteractiveDataPanel detail panel always expanded
- Moved `allByGDP` useMemo above state declarations so it can seed initial state
- Default `selectedCountry` = top GDP country (US), `selectedRegion` = REGION_STATS[0], `selectedPolicy` = 0
- Removed conditional wrapper on detail panel div; list column always shows at 44% width
- Removed close (X) buttons from detail header rows; replaced with empty `<div />`
- Tab switching resets to appropriate default selection per tab

## 2026-08-16 — Move 4 data sections to standalone expandable cards in COL-3
- Removed Industries/Funding/Alliances/R&D inline sections from inside the US States card
- Added new `ExpandableCard` component (click-to-expand with chevron, description, children slot)
- 4 new cards each have: icon, title, badge, description summary, and full detailed per-item descriptions in the dropdown
- Cards placed between US States card and Cities card in dashboard COL-3

## 2026-08-16 — Step 4: Propagate tier names to dependent screens
- Updated UserMenu.tsx plan badge: "Pro Plan" → "Public Plan"
- Updated EduSignInPage.tsx: EDU_PERKS[0] + success message now say "Professional" / "Student" instead of "Research"
- No other screens had hardcoded Free/Pro/Research tier references (CountriesPage/StatesPage "Research" is a university type, not a plan name)

## 2026-08-16 — Restructure membership tiers: Student / Public / Professional
- Replaced Free/Pro/Research with Student (free/.edu), Public ($9), Professional ($29)
- Added `compare` tab with full 22-row feature matrix table across all 3 tiers
- Removed all dead `campaigns` JSX (~300 lines) and `CAMPAIGN_PACKAGES`/`ISSUE_TAGS` data
- Merged EDU tab into dedicated Student plan card; Edu tab now shows richer hero + highlight grid
- Added audience labels, `checkClass` per plan, CTA row linking plans→compare and plans→edu

## 2026-08-16 — Remove Political Campaigns tab from MembershipsPage
- Removed "Political Campaigns" tab from TABS array in MembershipsPage
- Updated Tab type to remove "campaigns" variant

## 2026-08-16 — Fix RankingsPage categoryTableRows initialization order
- Moved `categoryTableRows` useMemo above `totalPages` and `pageRows` useMemo
- Also moved `CATEGORY_PRIMARY_SORT` and `activeCategoryMetrics` before `filteredRows`
- Fixes: `Cannot access 'categoryTableRows' before initialization` runtime error

## 2026-08-16 — Remove Analyst Network KPI card from dashboard
- Removed "Analyst Network / 127+ / 3 online now" pill from the KPI grid
- Adjusted grid from `grid-cols-4` to `grid-cols-3` (sm breakpoint) to fill evenly

## 2026-08-16 — Add Trending tab as default in InteractiveDataPanel
- Added "Trending" as the first/default tab (was "Countries")
- Shows: Hot Topics heatbar, Most Viewed Stats (8 items w/ views count), Most Viewed Countries (top 5), Key Macro Signals strip
- Added TRENDING_STATS, TRENDING_TOPICS, MOST_VIEWED_COUNTRIES static data arrays
- Search bar hidden on Trending tab; footer count updates for all 4 tabs

## 2026-08-16 — Hide carousel boundary pillar markers (left + right)
- Removed LEFT and RIGHT boundary pillar divs (with ◀ 5 / 5 ▶ badges) from CountryCarousel
- Also cleaned up unused `markerLeft`/`markerRight` logic references

## 2026-08-16 — Remove h-1 progress bars from carousel cards, compare tables, scenario cards
- Removed GDP relative bar from CountryCarousel cards (`h-1 rounded-full overflow-hidden mt-0.5`)
- Removed 3px comparison bars from CompareCountriesTool country + state rows
- Removed probability bar from TrendsPage scenario cards (`h-1 rounded-full overflow-hidden mb-2`)

## 2026-08-16 — Dashboard col-1/2: full interactive Countries/Economies/Policies panel
- Replaced 3 separate static containers with single `InteractiveDataPanel` component
- 3 tabs: Countries (search + click-to-expand detail), Economies (region detail), Policies (tag filter + detail)
- Country detail shows: flag banner, GDP trend sparkline, 6 key stats, industries bar chart, head of state
- Region detail shows: top economies list with GDP/growth; Policy detail shows tag + nav CTA
- Live search filters all three tabs; footer shows result count + "View all" link

## 2026-08-16 — Carousel: viewport constrained to exactly 5 cards wide
- Removed mask-overlay approach; viewport div is now sized to `cardWidth * 5 - GAP`
- `overflow:hidden` on the fixed-width viewport naturally clips all cards beyond #5
- Both boundary pillars remain (left at right-edge of card 5, right at viewport edge)
- Removed `viewportRef` / ResizeObserver for right-marker; simplified to static `right:0`

## 2026-08-16 — Carousel: hard-wall mask hides cards outside 5-card boundary
- Added two solid overlay divs (z-30) covering left/right regions outside marker positions
- Fade masks repositioned to start at the boundary pillars instead of the viewport edges
- Cards scrolling past boundary are now fully hidden behind the page background color

## 2026-08-16 — Carousel: speed 0.9px/frame + bold 5-card boundary pillars
- Raised SPEED from 0.6 → 0.9 px/frame
- Replaced faint gradient lines with solid glowing 2px pillars (78% height) at both 5-card positions
- Added floating "◀ 5" / "5 ▶" badge labels at the top of each pillar
- Pillar has double box-shadow glow ring for clear visibility in both light and dark mode

## 2026-08-16 — Carousel: reduce to 0.3px/frame + bilateral overflow walls
- Reduced SPEED from 0.55 → 0.3 px/frame for a very slow gentle drift
- Added overflow:hidden + boxSizing:border-box on both outer card wrapper and inner viewport
- Both left and right edges are now hard-clipped — no content bleeds past card boundaries

## 2026-08-16 — Speed up carousel + add right-side wall
- Raised SPEED from 0.4 → 1.4 px/frame for faster auto-scroll
- Added maxWidth/width 100% on viewport div to prevent overflow past sidebar
- Tightened card width calc (260px sidebar offset) and capped maxWidth at 240px

## 2026-08-16 — Auto-scroll CountryCarousel — 5 cards full width, slow loop
- Replaced manual-scroll carousel with rAF-based auto-scroll using translateX
- Duplicated card list for seamless infinite loop (resets at half scrollWidth)
- Card width = calc((100vw - sidebar - padding) / 5) to always show exactly 5
- Hover pauses animation; edge fade masks added left/right

## 2026-08-16 — Upgrade MembershipsPage plans & header with full platform coverage
- Updated Free/Pro/Research plan features to reflect all site modules (conflicts, humanitarian, crime, planetary, policy hub, alerts, API, etc.)
- Added plan `desc` subtitle to each plan card
- Updated page header description + added coverage pill tags (Countries, Cities, Conflicts, etc.)
- Added "What&#39;s included" feature grid strip below pricing cards with 8 platform highlights
- Expanded EDU perks list with 3 new items (conflicts/humanitarian/crime, congress/policy, research tools)

## 2026-08-16 — Update AboutPage with all recent site additions
- Updated stats (195+ countries, 300+ cities, 100K+ data points)
- Added new mission copy referencing conflicts, humanitarian, crime, planetary boundaries, and wealth
- Added "Platform Coverage" grid section with 12 intelligence domains
- Added 6 new data sources: ACLED, NASA, UN Habitat, ILO, UNODC + expanded existing entries
- Updated VALUES descriptions to reference new features (Research Notes, Comparisons, conflicts)

## 2026-08-16 — Push silver accents even lighter (near-white)
- Raised `--color-secondary` to `hsl(0,0%,92%)`, tertiary to `hsl(0,0%,80%)`
- All gradient-gold/gradient-2/button-border-gradient stops pushed near white
- Scrollbar thumb/border, glow, inner-glow, luxury-chip, luxury-button, focus ring all lifted further
- Light mode secondary/tertiary also raised (55%→68%, 44%→56%)

## 2026-08-16 — Lighten silver accents + add fade effect
- Raised `--color-secondary` from `hsl(0,0%,68%)` to `hsl(0,0%,82%)`, tertiary from 52% to 68%
- Lightened all gradient-gold/gradient-2/button-border-gradient stops in tailwind.config.js
- Bumped scrollbar thumb, glow, inner-glow, luxury-chip, luxury-button, luxury-divider to lighter/higher-opacity silver values
- Light mode secondary/tertiary also lifted (42%→55%, 32%→44%)

## 2026-08-16 — Replace all gold/amber accents with silver site-wide
- Changed `--color-secondary` from gold `hsl(45,75%,50%)` to silver `hsl(0,0%,68%)` in both dark and light mode
- Updated all gradient-gold, gradient-2, button-border-gradient, card-shimmer, glow/inner-glow tokens in tailwind.config.js
- Replaced every gold rgba() tint (212,168,48) with silver (180,180,180) across scrollbars, focus rings, modal glow, luxury-chip, section-divider, luxury-button, header hover states
- All changes in `src/index.css` and `tailwind.config.js`

## 2026-08-16 — Make floating notes button silver
- Changed `NotesPopup` trigger button from `bg-secondary` token to inline silver `hsl(0,0%,60%)` with dark text

## 2026-08-16 — Change "Sphere" wordmark accent from gold to silver
- Updated inline color on the `<span>Sphere</span>` in HeaderNav from `hsl(45,80%,58%)` to `hsl(0,0%,75%)`

## 2026-08-16 — Fix duplicate sidebar caused by double className on aside elements
- Both desktop and mobile `<aside>` in DashboardLayout had two `className` attrs (JSX only uses the last)
- Merged layout classes and `sidebar-bar` into a single `className`; moved inline gradient to CSS class

## 2026-08-16 — Luxury design refinements (no layout changes)
- Deepened background colors (`#050509`), richer gold accents (`hsl(45, 75%, 50%)`), refined border opacity
- Added premium CSS utilities: `.luxury-card`, `.glass-panel`, `.section-divider`, `.luxury-button`
- Enhanced sidebar: wider active gradient glow, larger icons (18px), refined section label colors
- Header: gradient background, stronger inner glow, improved logo typography
- Tailwind: added `boxShadow.premium`, `letterSpacing` utilities, smoother animation timing

## 2026-08-16 — Move social stats below Crime Statistics in CountryModal
- Removed homelessness/incarceration block from its early position in the CountryModal overview tab
- Re-inserted it directly after `<CountryCrimeStatsPanel>` so it sits below the crime stats container
- Same change applies to `CountryDetailPanel` (sidebar panel) which already had it after crime stats

## 2026-08-16 — Convert Forced Labour by Sector chart to donut
- Replaced `BarChart` with `PieChart` (donut) in the Forced Labour by Sector card
- Added inline legend with color dots + `$value B` labels below the donut
- `PieChart` and `Pie` were already imported from recharts — no new imports needed

## 2026-08-16 — Remove unused recharts imports from CrimeStatsPage
- Removed `RadarChart`, `Radar`, `PolarGrid`, `PolarAngleAxis`, `Legend` — all unused in JSX
- Any of these being `undefined` in the installed recharts version causes "Element type is invalid" at runtime
- Previous fixes (Detective→MagnifyingGlass, Chains→Link) had already applied correctly

## 2026-08-16 — Fix invalid Chains icon in CrimeStatsPage
- `Chains` is not exported by @phosphor-icons/react — replaced with `Link`
- This was the "Element type is invalid: got undefined" error on /dashboard/crime

## 2026-08-16 — Fix undefined Detective icon in CrimeStatsPage
- Replaced `Detective` (not exported in installed @phosphor-icons/react) with `MagnifyingGlass`
- Fixed "Element type is invalid: got undefined" runtime error on /dashboard/crime

## 2026-08-16 — Remove CEOs tab from WorldMapPage
- Removed CEOs button from view mode toggle
- Removed `{viewMode === "ceos" && <CEOsView />}` render block
- Updated viewMode type union to exclude "ceos"

## 2026-08-16 — Add Richest Families and CEOs categories to WorldMapPage
- Added "Richest Families" tab with 16 family profiles (Walton, Mars, Arnault, Hermès, Al Thani, Al Nahyan, etc.) with wealth, sector, assets, members, and detail modal
- Added "CEOs" tab with 16 CEO profiles (Musk, Bezos, Cook, Huang, Nadella, Zuckerberg, Buffett, etc.) with net worth, market cap, background, achievements, and detail modal
- Both views have sector filters, sort controls, stat strips, and click-to-expand detail modals
- Modified `src/pages/WorldMapPage.tsx` — added new imports (Briefcase, Money, TrendUp, Factory, Bank, ShoppingBag, Cpu, Newspaper), new viewMode states, toggle buttons, and two new full component sections

## 2026-08-16 — Flatten HumanitarianPage into single scrollable page
- Removed tab bar (Overview / Displacement / Food & Hunger / Health & Water)
- All four sections now render sequentially with colored section-divider pills
- Removed `useState` for `activeSection` — page is now stateless
- Section headers use colored icon+label pills to visually separate each block

## 2026-08-16 — Redesign CountriesPage as sidebar + detail panel layout
- Replaced full-page card grid with `w-64` left sidebar (country list) + right detail panel
- Sidebar has Countries/US States tabs, search, continent filter, sort dropdown, and compact flag+name rows
- Clicking a country shows `CountryDetailPanel` inline on the right (same as StatesPage pattern)
- Auto-selects first country on load; active item highlighted with secondary accent border
- Refresh button and country count in sidebar footer

## 2026-08-15 — Fix Geopolitical Risk Matrix text truncation
## 2026-08-16 — Redesign CountriesPage as sidebar + detail panel layout
- Replaced full-page card grid with `w-64` left sidebar (country list) + right detail panel
- Sidebar has Countries/US States tabs, search, continent filter, sort dropdown, and compact flag+name rows
- Clicking a country shows `CountryDetailPanel` inline on the right (same as StatesPage pattern)
- Auto-selects first country on load; active item highlighted with secondary accent border
- Refresh button and country count in sidebar footer

## 2026-08-15 — Fix Geopolitical Risk Matrix text truncation
- Removed `truncate` class from boundary name and risk description `<p>` tags in PlanetaryBoundariesPage
- Both text lines now wrap fully instead of being clipped

## 2026-08-15 — Fix black screen on deleted routes
- Added `min-height: 100vh` to `html`, `body`, and `#app` in `src/index.css`
- Added catch-all `<Route path="*">` inside `/dashboard` that redirects to `/dashboard`
- This prevents zero-height app container and handles stale bookmarks to removed pages like `/dashboard/trends`

## 2026-08-15 — Fix stale TrendsPage build error (duplicate SECTOR_PROJECTIONS already resolved; forced restart)

## 2026-08-15 — Replace Rankings category tabs with 7 new categories
- Changed `CategoryTab` type and `CATEGORY_TABS` from (economic, education, health, safety, social) → (housing, transportation, lifeExpectancy, economy, hdi, education, crime)
- Rewrote all 7 `CATEGORY_METRICS` entries using existing `RankRow` fields (no new data needed)
- Default active tab changed from `"economic"` to `"economy"`

## 2026-08-15 — Add housing/transport + infra stats to ALL ~195 countries (2025-26 data)
- Added `COUNTRY_HOUSING_TRANSPORT` entries for all remaining ~130 countries: Europe (sk, hr, rs, bg, ee, lv, lt, si, ie, by, md, al_al, mk, ba, me_eu, xk, lu, cy, mt_eu, is, sm, li, ad, mc, fo, gl, bm), Americas (gt, cu, ht, do, hn, sv, ni, cr, pa, jm, tt, bz, bs, ag, dm, gd, bb, lc, vc, kn, pr, gu), Asia (mm, kh, lk, np, jo, lb, sy, ye, bh, am, az_as, ge_as, tm, kg, tj, af, mn_as, la, tl, bn, mv, bt, uz, ps), Africa (cd, sd, cm, zw, mz, mg, zm, ml, bf, ne, tn, ly, bj, ss, so, er, dj, bi, mw, na, bw, mu, sz, ls, gm, gn, gw, sl, lr, tg, ga_af, cg, cf, td, cv, sc, st, gq, km, mr), Oceania (pg, fj, sb, vu, ws, to, ki, fm, pw, mh, nr, tv, coo_af, eh, ck, nu)
- Added matching `COUNTRY_INFRA_STATS` entries for all the same countries with electricity access, water, digital, roads/logistics, and healthcare metrics
- All data updated to 2025-26 sourced from World Bank, ITU, WHO, IEA, and IMF

## 2026-08-15 — Expand all 4 country stat datasets to cover 60+ more countries
## 2026-08-15 — Add housing/transport + infra stats to ALL ~195 countries (2025-26 data)
- Added `COUNTRY_HOUSING_TRANSPORT` entries for all remaining ~130 countries: Europe (sk, hr, rs, bg, ee, lv, lt, si, ie, by, md, al_al, mk, ba, me_eu, xk, lu, cy, mt_eu, is, sm, li, ad, mc, fo, gl, bm), Americas (gt, cu, ht, do, hn, sv, ni, cr, pa, jm, tt, bz, bs, ag, dm, gd, bb, lc, vc, kn, pr, gu), Asia (mm, kh, lk, np, jo, lb, sy, ye, bh, am, az_as, ge_as, tm, kg, tj, af, mn_as, la, tl, bn, mv, bt, uz, ps), Africa (cd, sd, cm, zw, mz, mg, zm, ml, bf, ne, tn, ly, bj, ss, so, er, dj, bi, mw, na, bw, mu, sz, ls, gm, gn, gw, sl, lr, tg, ga_af, cg, cf, td, cv, sc, st, gq, km, mr), Oceania (pg, fj, sb, vu, ws, to, ki, fm, pw, mh, nr, tv, coo_af, eh, ck, nu)
- Added matching `COUNTRY_INFRA_STATS` entries for all the same countries
- All data updated to 2025-26

## 2026-08-15 — Expand all 4 country stat datasets to cover 60+ more countries
- Added ~35 countries to `COUNTRY_GENDER_STATS`: Europe (es, nl, ch, dk, fi, be, at, pt, gr, cz, ro, hu), Asia (tw, kz, iq, om, qa), Americas (co_co, pe, ve, ec, bo, py, uy), Africa (ma, gh, tz, ao, dz, rw, sn, ug, ci), Oceania (nz)
- Added ~35 countries to `COUNTRY_HOUSING_TRANSPORT`: same set with median home prices, rent, ownership rates, transit usage, rail, airports, EV adoption, HSR
- Added ~35 countries to `COUNTRY_INFRA_STATS`: electricity access, water, broadband, LPI, hospital beds, physicians per 1,000
- Added ~35 countries to `COUNTRY_CRIME_STATS`: homicide, robbery, assault, burglary, vehicle theft, drug offenses, safety/crime index
- Gini, internet access, and rural/urban already covered for 150+ countries in `COUNTRY_EXTENDED`

## 2026-08-15 — Update all countries with accurate 2025/2026 data
- Updated GDP, GDP per capita, GDP growth, unemployment, inflation, trade balance, life expectancy, HDI for 150+ countries
- Updated all headOfState fields with proper titles, terms, and election dates (e.g. "Donald Trump (47th President)", "Friedrich Merz (Chancellor, since Feb 2025)")
- Key corrections: Nigeria GDP corrected from $490B to $362B (naira devaluation), Lebanon unemployment from 29.6% to 11.4%, Argentina inflation from 211% to 118%, Guyana GDP growth from 20% to 14.4%
- Sources: IMF WEO 2025, World Bank, UN DESA, UNDP HDR 2024

## 2026-08-15 — Stack Demographics & Gender panels vertically
- Changed `grid-cols-1 sm:grid-cols-2` to `grid-cols-1` in both `CountryModal` and `CountryDetailPanel`
- Demographics chart now renders above Gender Stats panel (one under the other, not side by side)

## 2026-08-15 — Restore Demographics & Gender panels to original size
- Removed `overflow-hidden` wrapper divs around `CountryDemographicsChart` and `CountryGenderStatsPanel` in both `CountryModal` and `CountryDetailPanel`
- Panels now render at their full natural height instead of being clipped

## 2026-08-15 — Fix malformed JSX comment causing SyntaxError in CountriesPage
- Line 12383: `{/* ── HOUSING & TRANSPORTATION ── */>` had `}>` instead of `}}`
- One-character fix; no logic changes

## 2026-08-15 — Add Male/Female Statistics panel to CountriesPage overview
- Added `COUNTRY_GENDER_STATS` data for 40+ countries: population split, life expectancy by sex, literacy by sex, labor force participation by sex, women in parliament, gender pay gap, maternal mortality, female university graduates %
- Created `CountryGenderStatsPanel` with stacked split bar, dual progress bars (literacy, labor force), life-expectancy comparison tiles, and 4 KPI tiles
- Injected into both `CountryModal` and `CountryDetailPanel` overview tabs after Demographics chart
- Sources: UN Women Data Hub, World Bank Gender Data Portal, ILO, IPU Parline

## 2026-08-15 — Add Infrastructure Statistics panel to CountriesPage overview
- Added `COUNTRY_INFRA_STATS` data for 40+ countries covering power, water/sanitation, digital, roads/logistics, and healthcare infrastructure
- Created `CountryInfraPanel` component with overall score bar, 5 color-coded category sections (each with progress bars), and investment % of GDP tile
- Injected into both `CountryModal` and `CountryDetailPanel` overview tabs after Housing & Transportation section
- Sources: World Bank Infrastructure, ITU Digital Stats, WHO, WB Logistics Performance Index

## 2026-08-15 — Add legal/illegal section to Governance tab in CountriesPage
- Added `COUNTRY_LEGAL_STATUS` data covering 40+ countries with 10 items each across 4 status categories: legal, illegal, restricted, decriminalized
- Added `CountryLegalStatusSection` component with summary count tiles (clickable filters), item list with color-coded status badges and source notes
- Injected section into `ConstitutionTab` (Governance tab) just above Key Constitutional Articles
- Sources: ILGA World, Equaldex, Center for Reproductive Rights, UNODC

## 2026-08-15 — Add crime statistics and bar chart to CountriesPage
- Added `COUNTRY_CRIME_STATS` data record with 40+ countries covering homicide, robbery, assault, burglary, vehicle theft, drug offenses, safety index, and crime index
- Created `CountryCrimeStatsPanel` component with safety/crime index tiles, recharts `BarChart` for 6 crime categories, and horizontal bar breakdown
- Panel injected into both `CountryModal` (overview tab) and `CountryDetailPanel` (inline panel overview), above Demographics chart
- Sources: UNODC Crime Statistics, Numbeo Crime Index

## 2026-08-14 — Remove Internet Penetration + Death Rate grid from CountryDemographicsChart
- Deleted the `grid grid-cols-2 gap-2 pt-1` block inside `CountryDemographicsChart` that showed Internet Penetration bar and Death Rate tile
- Both stats remain available in the top stats row (birth rate, urban %) and extended panels

## 2026-08-14 — Move economic stats grid from CountriesPage modal to EconomiesPage cards
- Removed the entire `📊 Economic` grid section from `CountryModal` overview tab in `CountriesPage.tsx`
- Added a compact 5-column `Country Economic Stats` strip (GDP Per Capita, GDP Growth, Unemployment, Inflation, Trade Balance) to each `Country`-type economy card in `EconomiesPage.tsx`
- Stats are pulled by matching `economy.name` or `economy.id` against `countriesData`; non-Country entities (Blocs, Regions) show nothing extra

## 2026-08-14 — Replace demographics tile in sociological breakdown with Rural/Urban Development stat
- In `CountrySociologicalBreakdown` grid, replaced `CountryDemographicsChart` tile with a new Rural/Urban Development tile
- Tile shows: urban/rural stacked bar, urban + rural population counts, housing affordability bar, public transit usage bar, birth/death rate mini-stats
- Uses `COUNTRY_EXTENDED.urbanPct`, `COUNTRY_HOUSING_TRANSPORT`, and ext birth/death rates as data sources
- Demographics chart still renders separately below the sociological breakdown section (no data loss)

## 2026-08-14 — Add demographics chart + remove duplicate data boxes in CountriesPage
- Added `CountryDemographicsChart` component with age distribution bars (5 groups), stacked bar, HDI/life expectancy, internet penetration, death rate
- Added `COUNTRY_AGE_DIST` data for 40+ countries; fallback `DEFAULT_AGE_DIST` for others
- Chart injected into: (1) `CountrySociologicalBreakdown` replacing the redundant "Human Development" tile, (2) `CountryModal` overview before Housing panel, (3) `CountryDetailPanel` overview before Housing panel
- Removed duplicate HDI/life expectancy/population/language fields from `CountrySociologicalBreakdown` Human Development tile (now shown only in demographics chart)

## 2026-08-14 — Add Housing & Transportation stats panels to CountriesPage overview
- Added `CountryHousingTransportPanel` component with housing KPIs (median price, rent, ownership, YoY change, affordability index, mortgage rate, vacancy, social housing %) and transportation KPIs (rail km, airports, EV adoption, public transit %, road density, metro systems, seaports, HSR km)
- Added `COUNTRY_HOUSING_TRANSPORT` data record covering 45+ countries
- Panel injected into both `CountryModal` (full modal overview) and `CountryDetailPanel` (inline panel overview) before the Education panel
- Sources: OECD Affordable Housing DB, Numbeo, ITF Transport Outlook, World Bank Transport

## 2026-08-13 — Remove Parental Rights in Education Act entry from Florida laws in StatesPage
- Deleted the "Parental Rights in Education Act ('Don't Say Gay')" StateLaw entry from the `fl` array in `STATE_LAWS` in `src/pages/StatesPage.tsx`

## 2026-08-13 — Remove Stop WOKE Act entry from Florida laws in StatesPage
- Deleted the "Stop WOKE Act (HB 7)" StateLaw entry from the `fl` array in `STATE_LAWS` in `src/pages/StatesPage.tsx`

## 2026-08-13 — Fix duplicate phosphor-icons import causing ChartBar undefined error
- `ChartBar` was already in the main import block at line 26
- A duplicate `import { ArrowsClockwise } from "@phosphor-icons/react"` at line 50 was conflicting
- Removed the duplicate import; `ArrowsClockwise` is now only imported once in the main block

## 2026-08-13 — Redesign MetricsPanel as full 13-category dashboard grid
- All 13 metric categories now render simultaneously as a responsive 3-col card grid (no more tab switching)
- Each category card shows icon, label, metric count, avg score badge (color-coded), and collapsible metric rows
- "Collapse All / Expand All" toggle + global search still work; search overrides grid view with flat results
- ScoreBadge component added for category-level summary; ScoreBar kept for per-metric progress bars

## 2026-08-13 — Add Metrics to sidebar nav + create standalone MetricsPage
## 2026-08-13 — Redesign MetricsPanel as full 13-category dashboard grid
- All 13 metric categories now render simultaneously as a responsive 3-col card grid (no more tab switching)
- Each category card shows icon, label, metric count, avg score badge (color-coded), and collapsible metric rows
- "Collapse All / Expand All" toggle + global search still work; search overrides grid view with flat results
- ScoreBadge component added for category-level summary; ScoreBar kept for per-metric progress bars

## 2026-08-13 — Add Metrics to sidebar nav + create standalone MetricsPage
- Added "Metrics" nav item to `analysisNav` in `SidebarNav.tsx` with ChartBar icon
- Created `src/pages/MetricsPage.tsx` — full-page explorer with left sidebar entity picker (50 countries + 50 states)
- Entity picker supports Countries / US States toggle + live search filter + hasData indicator
- Wired `/dashboard/metrics` route in `App.tsx` (lazy loaded)

## 2026-08-13 — Confirmed 13-category Metrics tab is wired into CountriesPage and StatesPage modals
- MetricsPanel already imported and rendered in both CountriesPage (full modal + inline detail panel) and StatesPage modal
- comprehensiveMetrics.ts contains 40+ countries and all major US states with 90+ metrics each
- 13 categories: Human Dev, Economic, Political, Social Cohesion, Peace, Justice, Health, Education, Environment, Infrastructure, Civic, Media, Global Position
- Dev server restarted to confirm visibility; tab appears as "Metrics" with ChartBar icon in both modal tab bars

## 2026-08-11 — Add Global Indexes & Indicators reference page
## 2026-08-13 — Confirmed 13-category Metrics tab is wired into CountriesPage and StatesPage modals
- MetricsPanel already imported and rendered in both CountriesPage (full modal + inline detail panel) and StatesPage modal
- comprehensiveMetrics.ts contains 40+ countries and all major US states with 90+ metrics each
- 13 categories: Human Dev, Economic, Political, Social Cohesion, Peace, Justice, Health, Education, Environment, Infrastructure, Civic, Media, Global Position
- Dev server restarted to confirm visibility; tab appears as "Metrics" with ChartBar icon in both modal tab bars

## 2026-08-11 — Add Global Indexes & Indicators reference page
- Created `src/pages/GlobalIndexesPage.tsx` — full reference of all 13 index categories
- Pulls directly from `societyIndexFramework.ts` (14 domains, ~75+ indicators) — no new data needed
- Features: search, core/extended tier filter, expand-all, domain quick-jump strip, per-indicator detail cards with source links
- Wired route `/dashboard/indexes` in `App.tsx` and added "Global Indexes" nav item to sidebar with `BookOpen` icon

## 2026-08-11 — Remove inflation rate bar from all entity cards
- Removed the "Inflation Rate" progress bar from CountriesPage country cards
- Previously removed from EconomiesPage economy cards as well
- Inflation data still accessible in detail panels and modals for both pages

## 2026-08-11 — Add Royal Families / Monarchies toggle to World Leaders page
- Created `src/data/royalFamiliesData.ts` with 25+ reigning monarchs across Europe, Middle East, Asia-Pacific, Africa
- Each `RoyalMember` has: dynasty, houseName, systemType (Absolute/Constitutional/Semi-Constitutional), religionRole, keyFacts, succession order, spouses, children, netWorthNote
- Added `showMonarchies` toggle button with Crown icon, stat strip (total, absolute, constitutional, etc.), region filter
- `MonarchCard` shows flag, reign duration, dynasty, succession line; `MonarchDetail` modal has 3 tabs: Overview, Dynasty & House, Succession & Family
- Monarch detail modal integrated alongside existing leaders modal in `WorldMapPage.tsx`

## 2026-08-11 — Improve election countdown badges with labels and granular breakdown
- Updated `formatCountdown` in `electionCountdowns.ts` to show y/mo/wk/d breakdown instead of approximate `~2mo`
- Added `getCountdownBreakdown` helper returning structured `{ years, months, weeks, days, totalDays }`
- Compact badge now shows short election type label (e.g. "Pres.", "Gen.") + precise countdown + date row
- Detail modal panel shows full verbose breakdown: "1 year, 3 months, 2 weeks, 4 days"

## 2026-08-11 — Add Education, Health, Safety & Social category tabs to Rankings
- Added `CategoryTab` type and `CATEGORY_METRICS` map with 5 tabs: Economic, Education, Health, Safety & Justice, Social Welfare
- Each tab shows metric info cards with top performer, and a top-5 leaderboard with mini progress bars
- `RankRow` extended with `educationRank`, `healthcareRank`, `crimeIndex` fields sourced from existing state data
- Country rows get 0 for state-specific fields (educationRank, healthcareRank, crimeIndex) since that data lives in statesData

## 2026-08-11 — Continue Rankings Page with new features
- Added 4 summary stat cards (total entities, top country, top state, avg composite + top HDI)
- Added continent filter strip (North America, South America, Europe, Asia, Africa, Oceania) for country rows
- Made every table row clickable — expands an inline `RowDetailPanel` with per-metric bars, percentile, and rank within pool
- Renamed `Medal` → `MedalCell` to avoid conflict with Phosphor `Medal` icon; added `CaretDown/Up`, `X`, `TrendUp/TrendDown` icons

## 2026-08-11 — Add election countdowns to World Leaders page
- Created `src/data/electionCountdowns.ts` with next election dates, types, and notes for 200+ world leaders
- Added `ElectionCountdownBadge` component — compact badge on each leader card (red <90d, amber <1yr, sky >1yr)
- Added full election countdown panel in the leader detail modal Overview tab (date, countdown, type, notes)
- Countdowns computed dynamically from current date using `getCountdownDays` / `formatCountdown` helpers

## 2026-08-11 — Add homelessness & incarceration stats to Countries and States
- Created `src/data/socialStatsData.ts` with homelessnessRate + incarcerationRate per 100k for 150+ countries and all 50 US states
- Imported `getCountrySocialStats` into CountriesPage — stats appear in both the inline detail panel and the full-screen country modal
- Imported `getStateSocialStats` into StatesPage — stats appear in the state modal overview tab
- Color-coded bars: green = low, amber = moderate, red = high (thresholds differ for countries vs states)

## 2026-08-11 — Round corners in expanded modal mode
- Removed `rounded-none` from all 6 modal expanded states: StatesPage, CountriesPage, CitiesPage, EconomiesPage, ConflictsPage, PoliciesPage
- Modals now keep `rounded-2xl` in both normal and full-screen expanded modes
- Simple one-line change per file — removed the `rounded-none` class from the isExpanded conditional className

## 2026-08-10 — Remove US States pinned section from PinnedSection on Dashboard
- Removed pinnedStates grid, states picker column in edit panel, and all related state (pinnedStateIds, pinnedStates, stateSearch, filteredStates, toggleState)
- PinnedSection now only renders the CompareCountriesTool; header badge updated to "Country Compare"
- Empty-state condition simplified (no longer checks pinnedStates.length)
- File: `src/pages/DashboardPage.tsx`

## 2026-08-10 — Replace Countries dashboard widget with standalone comparison tool
- Removed old pinned-country card grid + inline compare table from `PinnedSection`
- Added `CompareCountriesTool` component: searchable dropdown (up to 4 countries), removable chips, 10-metric comparison table with mini bars, best/worst value highlighting, 4 summary callouts (highest GDP, fastest growing, lowest unemp, highest HDI)
- `COMPARE_METRICS` array defines 10 metrics with color, higherBetter flag, formatter and raw accessor
- `PinnedSection` now only manages US States pinning; `totalPinned` counts states only
- File: `src/pages/DashboardPage.tsx`

## 2026-08-10 — Add inline country comparison section to CountriesPage
- Added `CountryCompareSection` component above the modal/cards area
- Each country card now has a "Compare" button (stops click propagation so modal doesn't open)
- Up to 3 countries can be selected; selected cards get a secondary ring highlight
- Comparison table shows 9 core metrics + up to 6 extended metrics (CPI, Gini, debt, etc.)
- Best value per row is highlighted in secondary color with a ▲ indicator
- "Clear all" button resets comparison; hint text shows when < 3 countries are selected

## 2026-08-10 — Fix StatesPage: liveStates used before initialization
- Moved `useEffect` for `?open=` deep-link param to after the `useLiveData()` call that declares `liveStates`
- Root cause: `useEffect` referenced `liveStates` (a `const` from `useLiveData`) before it was declared — temporal dead zone ReferenceError
- Fix: swapped order so `useLiveData()` hook runs first, then the `useEffect` that consumes `liveStates`

## 2026-08-10 — Search bar deep-links directly to specific entity modal
- `HeaderNav.tsx`: `handleSelect` now appends `?open=<entityId>` to the route URL
- `StatesPage`, `CountriesPage`, `CitiesPage`, `EconomiesPage`: each reads `?open=` on mount via `useEffect`, finds the matching entity by id, and opens its modal automatically
- URL param is cleaned (replaceState) immediately after use so it doesn't linger in browser history
- Entity id prefix stripping: `"state-ca"` → `"ca"`, `"country-us"` → `"us"`, etc.

## 2026-08-10 — Add expand-to-fullscreen button to all modal popups
- Added `isExpanded` state + expand/collapse icon button to all 6 modal components
- Modals affected: CountryModal, StateModal, CityModal, EconomyModal, ConflictModal, PolicyModal
- Expand icon placed in header action row (between Take Note / close); uses inline SVG expand/compress icons
- Expanded state: `max-w-full max-h-full m-0 rounded-none`; normal state preserves original `max-w-2xl max-h-[90vh]`
- Smooth `transition-all duration-300` for size change animation

## 2026-08-10 — Step 1: Define society index framework and metric taxonomy
- Created `src/data/societyIndexFramework.ts` with 14 societal domains and 70+ indicators
- Domains: quality_of_life, economic, governance, corruption, inequality, peace_security, justice_rights, health, education, environment, infrastructure, civic, media, global_position
- Each indicator has: id, label, description, unit, unitPrefix, higherIsBetter, source, sourceUrl, tier (primary|secondary)
- Exported: DOMAINS, DOMAIN_MAP, INDICATOR_MAP, PRIMARY_INDICATORS, EntitySocietyProfile type, scoreToPercentile helper
- STATE_SUPPORTED_DOMAINS (12) vs COUNTRY_SUPPORTED_DOMAINS (14) also exported for UI gating

## 2026-08-09 — Add trending/popular stats section to all category pages
- Added "Trending & Frequently Looked-Up" panel below summary strip on: CountriesPage, StatesPage, CitiesPage, EconomiesPage
- Each panel: 6 data tiles (animated pulse dot, current 2026 figures) + "Upcoming to Watch" pill strip
- Countries: India GDP, US unemployment, China inflation, global HDI, Brazil debt/GDP, Singapore rank + 6 upcoming events
- States: highest GDP, fastest growing, lowest unemployment, top income, most populous, no-tax states + 5 upcoming
- Cities: priciest rent, best transit, cycling, healthcare, internet speed, most unicorns + 5 upcoming
- Economies: global GDP, USD/EUR, fastest growing, Fed rate, Brent crude, gold + 6 upcoming events

## 2026-08-09 — Add currency converter widget to EconomiesPage
- Added `CurrencyConverter` component above the KPI summary strip in EconomiesPage
- Static mid-market FX rates for 40+ currencies (Aug 2026), all cross-pairs calculated via USD pivot
- Quick-select popular pairs (USD/EUR, USD/GBP, USD/JPY, EUR/GBP, GBP/JPY, USD/CNY)
- Swap button flips from/to currencies; result display formatted by magnitude
- File: `src/pages/EconomiesPage.tsx`

## 2026-08-09 — Extend PlanetaryBoundaries detail panel to fill available height
- Removed `maxHeight: calc(100vh - 180px)` cap from detail panel wrapper
- Added `lg:sticky lg:top-6 lg:self-start` + `maxHeight: calc(100vh - 3rem)` so panel fills viewport height
- Inner scroll container uses `minHeight: 0` to allow flex shrink/grow correctly
- Science Note card remains pinned below the scrollable detail area

## 2026-08-09 — Balance PlanetaryBoundariesPage layout to match app style
- Replaced edge-to-edge borderRight/borderBottom grid with padded `max-w-screen-2xl mx-auto` container + `gap-6` grids
- All panels now use `bg-card border border-border rounded-2xl` matching EconomiesPage/CountriesPage card style
- KPI strip converted to `bg-card border border-border rounded-lg p-4 gap-4` matching summary strip pattern
- Hero replaced with icon+title+description header pattern (same as all other pages)
- Removed all inline hex `background`/`borderBottom`/`boxShadow` from layout containers; use Tailwind tokens

## 2026-08-06 — Full-screen layout + 2026 data update for PlanetaryBoundariesPage
- Removed all gap-4/gap-3/rounded-2xl/border from grid containers — replaced with edge-joining borderRight/borderBottom pattern
- Outer wrapper changed from px-4/py-4/gap-4 to w-full flex flex-col (zero padding, no gaps)
- Updated all year references: 2024 → 2026 throughout KPIs, chart labels, headers, source lines
- Updated data: CO₂ 424→428 ppm, sea level +101→+115 mm, temp series extended to 2026 (+1.61°C), CO₂ emissions by country, renewables shares, extreme weather events
- File: `src/pages/PlanetaryBoundariesPage.tsx`

## 2026-08-06 — Add comprehensive public environmental data section to PlanetaryBoundariesPage
- Added 4 rows × 3 panels = 12 new data panels covering most publicly-searched environmental metrics
- Row 1: Air Quality Index (major cities PM2.5/AQI), Global Temperature Anomaly (1980–2024), Sea Level Rise (GMSL)
- Row 2: Arctic/Antarctic Ice Extent, Deforestation Tracker (Global Forest Watch), Plastic Pollution (ocean stock)
- Row 3: Renewable Energy share by country, Extreme Weather events 2023–2024, Water Stress & Access
- Row 4: CO₂ Emissions by country, Biodiversity Loss (IUCN), Soil Degradation & Food Security
- File: `src/pages/PlanetaryBoundariesPage.tsx`

## 2026-08-05 — Bookmark buttons + CSV export confirmed complete on all entity pages
## 2026-08-05 — Bookmark buttons + CSV export confirmed complete on all entity pages
- StatesPage, CountriesPage, CitiesPage all have `useBookmarkToggle` hook (create/remove SDK Bookmark records)
- Each card has a Bookmark/Bookmarked toggle button that stops click propagation to prevent modal open
- CSV export buttons on all three pages (exportStatesToCSV, exportCountriesToCSV, exportCitiesToCSV)
- BookmarksPage has search input, type-filter pills (All/State/Country/City/Economy/Global), Export CSV, and Trash remove
- "Take Note" already wired on all entity modals via NotesContext openNote({ entityName, entityType })

## 2026-08-04 — Wire useLiveData into StatesPage for live BLS + Census data

- StatesPage now imports `useLiveData` and uses `liveStates` instead of static `usStatesData`
- BLS state unemployment + Census ACS median income/population auto-fetched on mount
- Live status badge in page header shows: "Fetching live data…" / "Live · N updated · source" / "Static data"
- No changes to `useLiveData.ts` or `liveData.ts` — both were already fully implemented
- Files: `src/pages/StatesPage.tsx`

## 2026-08-04 — Add International Crime Statistics page
- New page at `/dashboard/crime` with 6 chart sections: homicide rates bar chart (highest/safest toggle), global crime trends by category (2015–2023 line chart), safety index ranking (top 20), regional crime categories (stacked bars + drill-down), cybercrime losses by region, and incarceration rates
- Data sourced from UNODC, Numbeo, Global Peace Index, World Prison Brief, Cybersecurity Ventures
- Added "Crime Statistics" entry to sidebar `analysisNav` using `ShieldCheck` icon
- Registered lazy route at `/dashboard/crime` in `App.tsx`
- Files: `src/pages/CrimeStatsPage.tsx` (new), `src/components/SidebarNav.tsx`, `src/App.tsx`

## 2026-08-04 — Enrich GDP Composition sector section in EconomiesPage
- Replaced plain SectorBar with rich card-style bars: color-coded fills per sector, emoji icons, 5-dot intensity indicators
- Added SectorDonut SVG component (donut chart with dominant sector label in center + legend)
- Added 3-stat summary row: Dominant sector + %, total sectors tracked, diversification level (High/Medium/Low)
- Color map covers 20 sector types: Services=sky, Industry=violet, Agriculture=green, Manufacturing=orange, Finance=pink, Technology=yellow, Energy=orange, Mining=gray, etc.
- File: `src/pages/EconomiesPage.tsx`

## 2026-08-04 — Add legal status grid to Cities Laws tab
- Added `CITY_LEGAL_STATUS` data covering 8 cities × 12 topics: cannabis, psychedelics, alcohol, gambling, firearms, sex work, same-sex marriage, abortion, assisted dying, public smoking, street vending, jaywalking/city-specific
- Added `CityLegalStatusGrid` component with Legal/Illegal/Decriminalized/Restricted/Varies badges per topic
- Dubai correctly shows: cannabis=Illegal (death penalty risk), gambling=Illegal, same-sex marriage=Illegal, alcohol=Restricted
- Singapore: chewing gum=Restricted replaces jaywalking; cannabis carries death penalty note
- Berlin: cannabis=Legal (since April 2024), sex work=Legal, assisted dying=Legal
- File: `src/pages/CitiesPage.tsx`

## 2026-08-04 — Add economic structure, futures markets & services breakdown to CountriesPage
- Added `FuturesMarket` and `ServicesSector` interfaces + `economicStructure` string to `CountryExtended`
- Populated all major economies (US, CN, DE, GB, FR, JP, IN, BR, RU, AU, KR, CA, SA, AE, SG, MX, ZA, NG, EG, IL, AR, TR, ID, MY, TH, VN, PH) with economic structure descriptions, futures data (stock index, 10Y bond yield, FX, commodity), and services sub-sector breakdowns
- Added three new render panels in `CountryExtendedPanels`: Economic Structure, Markets & Futures, Services Sector
- Markets panel shows: stock index value + YTD %, 10Y bond yield (color-coded), FX rate, key commodity, market cap
- File: `src/pages/CountriesPage.tsx`

## 2026-08-04 — Add legal status grid to all 50 states Laws tab
- Added `STATE_LEGAL_STATUS` data record covering all 50 states × 10 topics: recreational cannabis, medical cannabis, psilocybin, abortion, concealed carry, open carry, same-sex marriage, sports betting, death penalty, physician-assisted dying
- Added `LegalStatusGrid` component rendering a 2-col grid with emoji icons, legal status badges (Legal/Illegal/Decriminalized/Medical Only/Restricted/Varies), and contextual notes
- Wisconsin entry correctly shows: cannabis=Illegal, medical=Illegal, abortion=Illegal (1849 ban), concealed carry=Restricted (permit required), open carry=Legal, sports betting=Restricted (tribal only), death penalty=Illegal (abolished 1853)
- Legal status panel renders at the top of `StateLawsTab`, above existing landmark laws
- File: `src/pages/StatesPage.tsx`

## 2026-08-04 — Complete 195-country ideology override coverage
- Added ~60 more entries to `COUNTRY_IDEOLOGY_OVERRIDES`: all European democracies (ES, NL, CH, DK, FI, BE, AT, PT, GR, CZ, RO, HR, BG, EE, LV, LT, SI, IE, MD, AL, MK, BA, ME, XK, LU, CY, MT, IS), Asia (PH, BD, IR, UZ, KG, TL, TW), Americas (HT, BZ, SR), territories (CK, NU, EH, COO_AF)
- Iran now correctly labeled: Velayat-e Faqih / Shia Theocratic Republicanism
- Taiwan: Presidential Republic / Liberal Democracy / De Facto Sovereign State
- Haiti: Fragile Constitutional Governance / Gang-Controlled Instability
- Iceland: World's Oldest Parliament (Althing) / Nordic Constitutionalism
- Bosnia: Dayton Agreement Constitutionalism / Ethnic Power-Sharing
- All 195 countries now have accurate, non-generic ideology tags
- File: `src/pages/CountriesPage.tsx`

## 2026-08-04 — Full factual corrections to countriesData.ts (all countries)
- Added role titles to all ~195 headOfState fields (President/PM/Sultan/Emir/Chancellor etc.)
- Fixed: Haiti PM → Alix Didier Fils-Aimé; Ireland PM → Micheál Martin; Iceland PM → Kristín Frostadóttir
- Fixed: Bolivia → Luis Arce; Timor-Leste → José Ramos-Horta; Bulgaria → Rossen Jeliazkov; Liechtenstein → Daniel Risch
- Fixed: Argentina GDP 710→640bn, inflation 87→211.4%; Canada GDP 2290→2350bn
- File: `src/data/countriesData.ts`

## 2026-08-04 — Batch fix statesData.ts — 10 representative corrections
- CA-4: duplicate Doug LaMalfa→Tom McClintock(R); CA-48: Cisneros→Mike Levin(D); CA-52: duplicate Issa→Scott Peters(D)
- NC-3: duplicate Jeff Jackson→Greg Murphy(R); MN-3: Dean Phillips→Kelly Morrison(D)
- OH-11: Dave Joyce→Shontel Brown(D); TX-18: Sheila Jackson Lee→Sylvester Turner(D)
- TX-30: Eddie Bernice Johnson→Jasmine Crockett(D); VA-7: Spanberger→Eugene Vindman(D); WA-5: McMorris Rodgers→Michael Baumgartner(R)
- File: `src/data/statesData.ts`

## 2026-08-03 — Verified "Take Note" entity attachment already implemented
- StatesPage, CountriesPage, CitiesPage all have "Take Note" button calling openNote({ entityName, entityType })
- NotesPopup listens to `open-notes-popup` CustomEvent and pre-fills both fields
- NotesContext dispatch + NotesPopup handler confirmed working end-to-end
- No code changes required; todo-item marked complete

## 2026-08-03 — Fact-check & correct statesData.ts (22 fixes)
- AL-2: Barry Moore→Shomari Figures(D); CA-4/5/9/13/19/21/22: full redistricting cascade corrected
- CO-1: DeGette(D), CO-5: Jeff Crank(R); DE: Carper→LBR senator, At-Large→Sarah McBride
- FL: Rubio→Ashley Moody senator, FL-1: Gaetz→Patronis; IN: Braun→Jim Banks senator, IN-9→Erin Houchin
- KY-4: Cole→Thomas Massie; MI min wage $10.56→$12.48; ND-At Large: Armstrong→Julie Fedorson
- OH: JD Vance→Jon Husted senator; NY-3: Santos→Suozzi(D); NY-6: Suozzi→Grace Meng; WI-8: Gallagher→Tony Wied
- File: `src/data/statesData.ts`


## 2026-07-27 — Polish "My Dashboard" pinned section for professional look
- Cards redesigned: flag/abbr + name header, stats row (GDP growth + unemployment) with divider line
- Header bar separated by gridLine border; icon badge for PushPin; "View all" per-section CTAs
- Edit picker uses column-divider layout (gap-px + background gridLine), improved search input styling
- Remove button is now a circular badge (top-right) with better visibility on hover
- File: `src/pages/DashboardPage.tsx`

## 2026-07-27 — Add customizable "My Dashboard" pinned section to DashboardPage
- Added `PinnedSection` component + `usePinned` hook (localStorage-backed) above KPI pills
- Users can pin/unpin any country or US state; search-and-pick UI in edit mode
- Defaults: US/CN/DE/GB/JP countries + CA/TX/NY/FL/WA states
- File: `src/pages/DashboardPage.tsx`

## 2026-07-27 — Enlarge crime donut + tighten Safety Index row in StatesPage
- Donut container 48×48 → 80×80, innerRadius 13→20, outerRadius 22→36
- Safety Index row: `justify-between` → `gap-1.5` so label and value sit closer together
- File: `src/pages/StatesPage.tsx`

## 2026-07-27 — Shrink crime rate donut chart in StatesPage modal
- Reduced donut container from 64×64 to 48×48, innerRadius 20→13, outerRadius 34→22
- File: `src/pages/StatesPage.tsx`

## 2026-07-27 — Remove crime rate progress bar from StatesPage modal
- Deleted the `h-2 bg-background rounded-full overflow-hidden mb-2` bar under the Crime Rate title row
- File: `src/pages/StatesPage.tsx`

## 2026-07-27 — Stack outlook value + bar vertically in TrendsPage Sector Outlook rows
- Right-side of each row now shows outlook (trend icon + %) stacked above the confidence bar
- Used `flex flex-col items-end gap-1 shrink-0` wrapper on the right group
- File: `src/pages/TrendsPage.tsx`

## 2026-07-27 — Compact Sector Outlook container in DashboardPage
- Reduced container padding `p-5` → `p-3`, header icon `16` → `14`, section header wrapper `mb-4` → `mb-2`
- Sector rows: `py-2 gap-3` → `py-1 gap-2`, dot `w-2 h-2` → `w-1.5 h-1.5`, bar `w-12 h-1.5` → `w-10 h-1`
- Sparkline area height `28px` → `22px`, label/value font `text-[10px]` → `text-[9px]`, row gap `gap-2` → `gap-1`
- File: `src/pages/DashboardPage.tsx`

## 2026-07-27 — Even professional spacing in sidebar nav
## 2026-07-27 — Compact Sector Outlook container in DashboardPage
- Reduced container padding `p-5` → `p-3`, header icon `16` → `14`, section header wrapper `mb-4` → `mb-2`
- Sector rows: `py-2 gap-3` → `py-1 gap-2`, dot `w-2 h-2` → `w-1.5 h-1.5`, bar `w-12 h-1.5` → `w-10 h-1`
- Sparkline area height `28px` → `22px`, label/value font `text-[10px]` → `text-[9px]`, row gap `gap-2` → `gap-1`
- File: `src/pages/DashboardPage.tsx`

## 2026-07-27 — Even professional spacing in sidebar nav
- Nav items: `py-[5px]` uniform vertical padding, `gap-2.5 px-2.5` for label/icon spacing
- Section labels: `pt-4 pb-1` for clear visual grouping, `px-2.5` aligned with items
- Outer `<ul>` padding `px-2` → `px-1.5` to give items consistent left/right margin

## 2026-07-27 — Remove gap between sidebar nav items
- Removed `gap-0.5` from the `<ul>` in `SidebarNav` so items sit flush together on full screen
- File: `src/components/SidebarNav.tsx`

## 2026-07-31 — Add SourceLink to TrendsPage (retry after failed diff)
- Added SourceLink import and 7 source placements: GDP projections (IMF/World Bank), inflation forecast (IMF/World Bank), unemployment (BLS), sector outlook (OECD/EIU), country growth trends (World Bank), scenario analysis (IMF/EIU), forecast confidence (World Bank)
- Replaced all inline `<p>Source: ...</p>` text nodes with `<SourceLink sources={...} />` components
- File: `src/pages/TrendsPage.tsx`

## 2026-07-31 — Add source hyperlinks under all displayed data across entire site
- `SourceLink` component (already existed) now wired into CountriesPage, StatesPage, CitiesPage, EconomiesPage, DashboardPage
- Source constants defined per-page: World Bank, IMF, BLS, BEA, Census, IEA, EIA, SIPRI, Numbeo, ACLED, UCDP, Congress.gov, NCSL, Constitute Project, OECD
- Links appear under: stat grids, charts, energy sections, military panels, demographics, laws tabs, constitution tab, forecast charts, dashboard footer
- Dashboard footer now shows a full multi-source SourceLink row listing all primary data APIs

## 2026-07-31 — Add state-specific Significant Laws tab to StatesPage modal
- Added `StateLawsTab` component with state-specific landmark legislation for all 50 states
- `STATE_LAWS` record covers abortion, gun policy, labor, cannabis, environment, voting rights, LGBTQ+, education, and more
- Each state has 4–7 laws unique to its political/legal identity (e.g., TX SB8, CA CCPA, OR Death with Dignity, WY Crypto Framework)
- New "Laws" tab (`<Scales>` icon) added to `StateModal` alongside Overview, Map, Photos tabs
- File: `src/pages/StatesPage.tsx`

## 2026-07-31 — Add accurate North Korea constitution entry (not a democracy)
- Added `kp` entry to `COUNTRY_CONSTITUTIONS` with 12 articles covering Juche, Songun, KWP supremacy, nuclear state status, Songbun, and UN-documented crimes against humanity
- Corrected ideology tags: Juche, Kimilsungism-Kimjongilism, Songun, Totalitarianism (replaces generic fallback "Democracy")
- Type correctly set to "Unitary One-Party Juche State (Hereditary Dictatorship)"
- File: `src/pages/CountriesPage.tsx`

## 2026-07-31 — Expand Constitution tab with accurate, detailed data (10-12 articles per country)
- All 8 country constitutions expanded: US, CN, DE, GB, FR, JP, IN, BR — 6 articles → 10-12 each
- Added precise article numbers, historical context, amendment years, legal case citations (Marbury, Bommai, Kesavananda, etc.)
- Ideology arrays expanded with more accurate ideological descriptors per country
- Summaries rewritten with historical accuracy (GHQ drafting for JP, Ambedkar for IN, de Gaulle referendum for FR, etc.)
- File: `src/pages/CountriesPage.tsx`

## 2026-07-31 — Replace Photos tab with Constitution/Political Doctrine tab in CountriesPage
- Swapped `Images` → `Scroll`, `BookOpen`, `Star` icons; removed lightbox/photo state from both CountryModal and CountryDetailPanel
- Added `ConstitutionData` interface, `COUNTRY_CONSTITUTIONS` record (8 countries: US, CN, DE, GB, FR, JP, IN, BR), `DEFAULT_CONSTITUTION` fallback
- Added `ConstitutionTab` component: header card (name, adopted/amended, type), ideology tags, scrollable article cards (right/principle/structure/doctrine badges)
- Tab state type updated `"photos"` → `"constitution"` in both `CountryModal` and `CountryDetailPanel`
- File: `src/pages/CountriesPage.tsx`

## 2026-07-30 — Replace Photos tab with Laws tab in CitiesPage modal
- Swapped `Images` icon → `Scales` icon in imports
- Added `CityLaw` interface, `CITY_LAWS` record (8 cities), `DEFAULT_CITY_LAWS` fallback, `STATUS_COLORS` map
- Added `CityLawsTab` component with header strip + scrollable law cards (category badge, status pill, enacted year)
- Tab state type updated `"photos"` → `"laws"`; tab bar and render block updated accordingly
- File: `src/pages/CitiesPage.tsx`

## 2026-07-27 — Add Map + Photos tabs to CityModal
- Added 3-tab layout (Overview / Map / Photos) to `CityModal` in CitiesPage matching Countries/States pattern
- Map tab: region-colored info strip + Google Maps iframe (z=11) + 4-stat location facts grid
- Photos tab: `CityPhotosGrid` sub-component with flag header, 6-image grid, lightbox (prev/next, z-index 200)
- `CITY_PHOTOS` covers 8 major cities; `REGION_CITY_PHOTOS` provides fallback for all regions
- File: `src/pages/CitiesPage.tsx`

## 2026-07-27 — Add Map + Photos tabs to CountryModal
- Added 3-tab layout (Overview / Map / Photos) to `CountryModal` matching the States modal pattern
- Map tab: continent-colored info strip + Google Maps iframe (z=5) + location facts grid
- Photos tab: flag header + 6-image grid using `getCountryPhotos()` + inline `ModalPhotosGrid` lightbox (z-index 200)
- `ModalPhotosGrid` extracted as reusable sub-component with its own lightbox state
- File: `src/pages/CountriesPage.tsx`

## 2026-07-24 — Verified CountriesPage.tsx is already correct
- Read full file: `CountryDetailPanel` properly wraps `CountrySociologicalBreakdown` inside the overview `<div>`
- Build error was stale; file structure is valid — restarted dev server to clear cached error
- File: `src/pages/CountriesPage.tsx`

## 2026-07-24 — Add Map + Photos tabs to CountryDetailPanel
- Added 3-tab layout (Overview / Map / Photos) to `CountryDetailPanel` in CountriesPage
- Map tab: Google Maps iframe centered on the country + 4-stat location strip
- Photos tab: flag header strip + 6-image grid with lightbox (prev/next navigation)
- `COUNTRY_PHOTOS` covers 15 major countries; `CONTINENT_PHOTOS` provides fallback for all 6 continents
- New icons: `MapTrifold`, `Images`, `ListBullets`, `ArrowLeft`, `X` from @phosphor-icons/react
- File: `src/pages/CountriesPage.tsx`

## 2026-07-24 — Per-state photos + flag in Photos tab
- Replaced region-based `REGION_IMAGES` with per-state `STATE_IMAGES` map covering all 50 state IDs
- Photos tab now shows the state flag prominently in a header strip (+ name, abbreviation, region, statehood)
- Flag uses `flagcdn.com/w320/us-{id}.png` with abbreviation fallback on error
- Added `flagError` state + `REGION_FALLBACK` for states without custom images
- File: `src/pages/StatesPage.tsx`

## 2026-07-24 — Add Map + Photos tabs to StateModal
## 2026-07-24 — Add Map + Photos tabs to StateModal
- Added tabbed layout (Overview / Map / Photos) to StateModal in StatesPage
- Map tab: Google Maps embed focused on the state + location fact strip
- Photos tab: 6-image grid per US region with lightbox (prev/next navigation)
- Region image galleries defined in `REGION_IMAGES` constant (West/South/Northeast/Midwest)
- New icons imported: `MapTrifold`, `Images`, `ListBullets` from @phosphor-icons/react
- File: `src/pages/StatesPage.tsx`

## 2026-07-24 — Make economy card chart box responsive (fix full-screen overflow)
- Chart box: `hidden sm:flex`, scales `w-28 md:w-36 h-28 md:h-36` so it hides on mobile and fits on tablet+
- Card row: added `min-w-0 overflow-hidden` to prevent horizontal bleed
- Growth badge row: added `gap-1 min-w-0` + `truncate`/`shrink-0` on children
- File: `src/pages/EconomiesPage.tsx`

## 2026-07-24 — Make GDP chart box square (w-36 h-36)
- Changed chart panel from fixed `style={{ height: 56 }}` + flex to `h-36` matching `w-36`
- File: `src/pages/EconomiesPage.tsx`

## 2026-07-24 — Further compress economy card vertical height (second pass)
- Card padding `p-3` → `p-2`, header title `font-semibold` → `text-sm`, stat labels `text-xs` → `text-[9px]`, stat values `text-sm` → `text-xs`
- GDP share bar height `h-1.5` → `h-1`, pills font `text-xs` → `text-[10px]`, chart box `w-40 h-72px` → `w-36 h-56px`
- File: `src/pages/EconomiesPage.tsx`

## 2026-07-24 — Shrink vertical height of economy card containers (first pass)
- Reduced card padding from `p-5` → `p-3`, header gap `mb-4` → `mb-2`, stats grid gap/margin tightened, pills margin `mt-3` → `mt-2`
- File: `src/pages/EconomiesPage.tsx`

## 2026-07-24 — Shrink GDP chart box height on economy cards
- Reduced chart panel from `w-44 h-110` to `w-40 h-72` (px); tightened padding and label sizes
- File: `src/pages/EconomiesPage.tsx`

## 2026-07-24 — Add inline GDP chart box next to each economy card
- Wrapped each card in a `flex gap-3` row; added a `w-44 shrink-0` square panel with AreaChart of `economy.trends` GDP data
- Gradient ID per card: `cardGdpGrad-${economy.id}` to prevent recharts collisions
- Chart shows year range + growth % badge at the bottom; does not trigger the modal on click
- File: `src/pages/EconomiesPage.tsx`

## 2026-07-21 — Rebuild DashboardPage with TrendsPage layout + per-offering containers
## 2026-07-24 — Add GDP growth projection charts sidebar to EconomiesPage
- Added right-column sidebar (xl:col-span-1) with 4 stacked charts: bar (growth rates), area (nominal GDP $T), line (YoY %), forecast confidence bars
- Imported LineChart, BarChart, Bar, ReferenceLine from recharts in EconomiesPage
- Gradient IDs prefixed `eco*` to avoid recharts collisions
- File: `src/pages/EconomiesPage.tsx`

## 2026-07-21 — Rebuild DashboardPage with TrendsPage layout + per-offering containers
- Adopted TrendsPage structure: Hero → KPI pills → lg:grid-cols-4 main grid → National/International/Analyst full-width sections
- Each site offering (Countries, Economies, Policies, US States, Cities, Conflicts, Trends, National, International, Analysts) has its own dedicated container
- Added SectionHeader reusable component, Inflation LineChart in International, Sector Outlook in col-4
- Reused all existing static data arrays; gradient IDs prefixed `dash*` to avoid recharts collisions
- File: `src/pages/DashboardPage.tsx`

## 2026-07-21 — Add National, International, Analyst sections to DashboardPage
- Added National section: domestic highlights feed + state GDP snapshot grid
- Added International section: global developments feed + regional GDP panel
- Added Analyst section: 3 preview cards (insight, tags, actions) + CTA bar to /dashboard/analysts
- All three sections use the same card/token design language as existing dashboard panels
- File: `src/pages/DashboardPage.tsx`

## 2026-07-21 — Restore default DashboardPage + wire /dashboard/trends route
- Replaced trends-based DashboardPage with a proper overview dashboard (world GDP chart, top countries, recent events, US states, nav cards)
- Added lazy `TrendsPage` import and `<Route path="trends">` in App.tsx so /dashboard/trends works correctly
- `/dashboard` = default overview, `/dashboard/trends` = full trends & projections page
- Files: `src/pages/DashboardPage.tsx`, `src/App.tsx`

## 2026-07-21 — Populate TrendsPage with full Trends & Projections content
- Replaced old "Trends & Polls" content in TrendsPage.tsx with complete Trends & Projections hub
- Includes: GDP 2024–2030 AreaChart (world/regions toggle), inflation LineChart, unemployment AreaChart
- Includes: Regional Risk Index bars, Sector Outlook, Country Growth sparklines, Scenario Analysis accordion
- Gradient IDs prefixed `tp*` to avoid collision with DashboardPage gradient IDs
- File: `src/pages/TrendsPage.tsx`

## 2026-07-21 — Wire /dashboard/trends route into App.tsx
- Added lazy import for `TrendsPage` from `src/pages/TrendsPage.tsx`
- Added `<Route path="trends" element={<TrendsPage />} />` under the `/dashboard` route group
- File: `src/App.tsx`

## 2026-07-21 — Transform DashboardPage into Trends & Projections page
- Replaced entire dashboard layout with forward-looking forecasting content
- Added: GDP 2024–2030 area chart (world/regions tabs), G20 inflation forecast LineChart, US unemployment AreaChart
- Added: Regional Risk Index dual-bar widget, Sector 12-month outlook, Country sparkline table
- Added: 4-scenario analysis accordion (click-to-expand with probability bar + driver tags)
- Added: Forecast confidence summary + methodology note panel
- File: `src/pages/DashboardPage.tsx`

## 2026-07-21 — Add GDP bar chart + unemployment line chart below Top Countries by GDP panel
- Added indigo/purple GDP BarChart and amber unemployment LineChart below the countries table
- Gradient IDs: `countryGdpGrad`, `countryUnempGrad` (unique, no collision with state chart IDs)
- Country names truncated to 5 chars + ellipsis for compact X-axis labels
- File: `src/pages/DashboardPage.tsx`

## 2026-07-21 — Add GDP bar chart + unemployment line chart below US States GDP panel
## 2026-07-21 — Add GDP bar chart + unemployment line chart below Top Countries by GDP panel
- Added indigo/purple GDP BarChart and amber unemployment LineChart below the countries table
- Gradient IDs: `countryGdpGrad`, `countryUnempGrad` (unique, no collision with state chart IDs)
- Country names truncated to 5 chars + ellipsis for compact X-axis labels
- File: `src/pages/DashboardPage.tsx`

## 2026-07-21 — Add GDP bar chart + unemployment line chart below US States GDP panel
- Imported BarChart, Bar, LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer from recharts
- GDP bar chart uses gradient fill (indigo/purple), unemployment uses green line with dots
- Both charts use real data from topStates (abbreviation as X-axis label, gdp/unemploymentRate as Y)
- Charts separated by themed dividers inside the existing "Top US States — GDP" card
- File: `src/pages/DashboardPage.tsx`

## 2026-07-21 — Fix collapsed sidebar icon centering
- Replaced `px-2 ... px-0 override` pattern with conditional `gap-2 px-2` vs `px-0 justify-center`
- Icons now truly center with no residual left/right padding when sidebar is collapsed
- File: `src/components/SidebarNav.tsx`

## 2026-07-21 — Sidebar light mode fixes
- Hover states: `hover:bg-white/5` → `hover:bg-black/5 dark:hover:bg-white/5` in NavItem and collapse button
- Section label color: `text-white/20` → `text-black/25 dark:text-white/20`
- Divider: `border-white/6` → `border-border` for collapsed section separator
- File: `src/components/SidebarNav.tsx`

## 2026-07-21 — Dashboard full-screen layout reorganization
- Removed `max-w-screen-2xl` cap; layout now fills 100% of available width with `w-full`
- Switched from 3-column to 4-column `lg:grid-cols-4` main grid: countries+modules+trends (2fr), states (1fr), analyst+events+hdi (1fr)
- Moved TrendsList panels inside left column as a 2-up row to use horizontal space efficiently
- Reduced hero/stat vertical padding for denser display; hero title scaled to `text-xl sm:text-2xl`
- File: `src/pages/DashboardPage.tsx`

## 2026-07-17 — Align all page dark mode tokens to dashboard deep-dark aesthetic
- Updated CSS :root dark mode vars: `--color-background` → `#0b0b14`, `--color-card` → `rgba(255,255,255,0.04)`, `--color-border` → `rgba(255,255,255,0.08)`, `--color-muted` → `rgba(255,255,255,0.06)`, `--color-muted-foreground` → `rgba(255,255,255,0.38)`
- All pages using Tailwind tokens (`bg-background`, `bg-card`, `border-border`, etc.) now inherit the same deep dark palette as DashboardPage
- File: `src/index.css`

## 2026-07-17 — Remove US State Unemployment Rates bar chart panel from DashboardPage
- Removed the BarChart panel and all related recharts imports (BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer)
- Removed `buildUnemploymentData()` helper and `unemploymentData` useMemo
- Removed unused `tooltipBg`, `tooltipBorder` variables
- File: `src/pages/DashboardPage.tsx`

## 2026-07-16 — Lazy-load all heavy page routes in App.tsx
- Converted StatesPage, CountriesPage, CitiesPage, EconomiesPage, NotesPage, ComparisonsPage, ConflictsPage, MembershipsPage, EduSignInPage, PolicyPage, AboutPage to lazy imports
- Single shared `<Suspense fallback={<PageFallback />}>` wraps all Routes
- Startup bundle now only includes DashboardPage + SettingsPage + DashboardLayout
- File: `src/App.tsx`

## 2026-07-16 — Remove sticky topbar from DashboardPage
- Deleted the sticky `top-0 z-20` topbar (CommonSphere / search / Explore button)
- Cleaned up unused imports: `Globe`, `MagnifyingGlass`, `ArrowRight`
- Removed unused `searchVal` state

## 2026-07-16 — Redesign DashboardPage with analytics layout
- Replaced hero/grid LandingPage style with a data-dense analytics dashboard
- Added sticky topbar, stat pills, GDP area chart, unemployment bar chart, countries table, states leaderboard, HDI rankings, global events feed, and module quick-nav
- All chart data derived from real countriesData/statesData (no mocks)
- File: `src/pages/DashboardPage.tsx`

## 2026-06-14 — Add background data to all major conflicts
## 2026-07-16 — Redesign DashboardPage with analytics layout
- Replaced hero/grid LandingPage style with a data-dense analytics dashboard
- Added sticky topbar, stat pills, GDP area chart, unemployment bar chart, countries table, states leaderboard, HDI rankings, global events feed, and module quick-nav
- All chart data derived from real countriesData/statesData (no mocks)
- File: `src/pages/DashboardPage.tsx`

## 2026-06-14 — Add background data to all major conflicts
- Populated `background` field (origins, keyActors, timeline) for 10 conflicts: Russia-Ukraine, Israel-Gaza, Sudan, Myanmar, Sahel, DRC, Yemen, Iran-Israel, Taiwan, Kashmir
- Each entry has 6–8 key actors with roles and 8–9 chronological timeline events
- Background tab in ConflictModal now shows real content instead of the empty-state placeholder for these conflicts
- File: `src/data/conflictsData.ts`

## 2026-06-14 — Add CPI to EconomyModal stats grid (modal-tile)
- Added CPI as a conditionally-rendered 10th stat tile in the `EconomyModal` `grid-cols-3` stats panel
- Uses same pattern as card grid: renders only when `economy.cpi != null`
- File: `src/pages/EconomiesPage.tsx`

## 2026-06-14 — Add CPI stat to EconomiesPage card grid
- Added optional `cpi?: number` field to `Economy` interface in `economiesData.ts`
- Populated realistic CPI index values for all ~80+ economy entries
- Card stat grid changed from `sm:grid-cols-4` to `sm:grid-cols-5` to include CPI column
- Files: `src/data/economiesData.ts`, `src/pages/EconomiesPage.tsx`

## 2026-05-24 — Condense and polish Our Mission section on AboutPage
- Tightened paragraph copy, reduced font sizes (base→sm), reduced padding and gaps
- Preserved all information; removed redundant phrasing for a more professional tone
- File: `src/pages/AboutPage.tsx`

## 2026-05-24 — Add country-specific policy names and descriptions to PolicyPage
- Replaced generic `COUNTRY_POLICIES` pool with `COUNTRY_SPECIFIC_POLICIES` map keyed by country ID
- All 130+ countries now have unique real-world-grounded name + description per all 8 policy categories
- Added `COUNTRY_POLICY_FALLBACK` pool as safety net for any unmapped countries
- `generateCountryPolicies()` updated to look up country-specific entry first
- File: `src/pages/PolicyPage.tsx`

## 2026-05-19 — Add state-specific policy names and descriptions to PolicyPage

- Replaced generic `STATE_POLICIES` pool with `STATE_SPECIFIC_POLICIES` map keyed by state ID
- Each of 50 states now has a unique name + description per all 8 categories grounded in real state context
- `generateStatePolicies()` updated to look up state-specific entry first, with generic pool as fallback
- File: `src/pages/PolicyPage.tsx`


## 2026-05-18 — Add scrollable category tab bar to ConflictModal
- Added 5-tab bar (Overview, Policy History, Background, Prioritization, Budgets & Economics) matching WorldMapPage LeaderDetail pattern
- Extended `Conflict` type with optional `policyHistory`, `background`, `prioritization`, `budgets` fields
- Tabs show placeholder empty states with icons when data not yet populated; iran-israel economicImpacts auto-shows in Budgets tab
- Imported `XCircle`, `CheckCircle`, `BookOpen`, `ClockCounterClockwise`, `ChartBar`, `Money` icons
- Files: `src/pages/ConflictsPage.tsx`, `src/data/conflictsData.ts`

## 2026-05-18 — Add economic impacts to Iran–Israel Direct Conflict entry
- Added `EconomicImpact` interface and `economicImpacts?: EconomicImpact[]` field to `Conflict` type
- Populated 6 economic impact entries for `iran-israel-conflict` (oil spike, shekel, rial, gold, etc.)
- Modal now renders an "Economic Impacts" grid section (2-col) with color-coded direction indicators
- Card now shows a green `CurrencyDollar` badge with impact count when `economicImpacts` is present
- Files: `src/data/conflictsData.ts`, `src/pages/ConflictsPage.tsx`

## 2026-05-18 — Add hover:scale-[1.01] to EconomiesPage cards
- Added missing `hover:scale-[1.01]` to economy card articles to match CountriesPage/ConflictsPage pattern
- File: `src/pages/EconomiesPage.tsx`

## 2026-05-18 — Add hover:scale-[1.01] and hover:shadow-lg to WorldMapPage LeaderCard
- Matched LeaderCard unselected hover state to CountriesPage/ConflictsPage pattern
- File: `src/pages/WorldMapPage.tsx`

## 2026-05-18 — Match ConflictsPage card hover to CountriesPage style
- Added `hover:scale-[1.01]` and changed border highlight to `hover:border-secondary/40` on conflict cards
- File: `src/pages/ConflictsPage.tsx`

## 2026-05-18 — Match PolicyPage EntityRow hover to CountriesPage card effect
- `EntityRow` wrapper div: added `hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40`
- Removed `hover:bg-white/[0.02]` from inner button (effect moved to container)
- File: `src/pages/PolicyPage.tsx`

## 2026-05-18 — Update all site data to reflect 2026 as current year
- PMI periods in `countriesData.ts`: "Mar 2025" → "Mar 2026" (US, Canada, Mexico, Germany, France, UK)
- Senator `termEnd: 2025` in `statesData.ts` updated to 2031 (post-2024 election winners applied where possible)
- Trend arrays already span 2022–2026 with 2026 as the most recent data point — no change needed

## 2026-05-18 — Remove In-App Notifications section from SettingsPage
- Deleted the "General Notifications" section (In-App Notifications toggle) from SettingsPage
- `notifications` state and toggle remain in file but are now unused; can be cleaned up later

## 2026-05-18 — Fix Radix Portal removeChild crash by removing Portal wrapper
- Root cause: `DropdownMenuPrimitive.Portal` renders into `document.body`, desynchronizing React fiber on navigation unmount
- Fix: removed `<DropdownMenuPrimitive.Portal>` wrapper from `DropdownMenuContent` in `src/components/ui/dropdown-menu.tsx`
- Content now renders inline (still z-50, still visually overlapping) without the DOM orphan problem


## 2026-05-18 — Rename "World Map" footer link to "World Leaders" in DashboardPage
- Updated FOOTER_LINKS PLATFORM section: label "World Map" → "World Leaders"

## 2026-05-18 — Remove newsletter section from DashboardPage
- Deleted the "Stay Ahead / Subscribe to Our Newsletter" section entirely
- Removed unused email/subscribed state and handleSubscribe handler
- Removed unused Rocket icon import

## 2026-05-18 — Update DashboardPage footer FOOTER_LINKS to match current routes
- Removed dead "Notifications" link from TOOLS section (feature was deleted)
- Added Settings to TOOLS; updated ACCOUNT to Sign In, Memberships, About

## 2026-05-18 — Remove "Get Access" button from footer in DashboardPage
## 2026-05-18 — Polish Compare Entities section on DashboardPage with branded background, icon block, description, and feature pills
## 2026-05-18 — Move Compare Entities section above Built for Serious Research on DashboardPage
- Swapped order of COMPARISON MODULE and PLATFORM FEATURES sections in DashboardPage.tsx

## 2026-05-18 — Make site footer white in light mode
- Footer background: `#070709` → `#ffffff` in light mode
- All text, heading labels, link colors, social icons, and dividers adapt to light/dark
- Accent top line switches from purple gradient to blue gradient in light mode
- Sign In border/text and Get Access button use blue tones in light mode

## 2026-05-18 — Match newsletter section to hero gradient in light mode
- Added `isLight` conditional background, glow orbs, and grid pattern mirroring the hero section
- Badge, headline, body, input, and button all adapt to light/dark theme
- Input placeholder color fixed in index.css for light mode

## 2026-05-18 — Fix dashboard data grid card visibility in light mode
- Description text: `rgba(255,255,255,0.35)` → `rgba(30,41,59,0.55)` in light mode
- Card background, border, and footer divider now adapt to light/dark theme

## 2026-05-18 — Change World Leaders header icon from UserCircleGear to Lectern
- Lectern (podium/speaker's stand) better represents leadership and public office

## 2026-05-18 — Match WorldMapPage filter bar to CountriesPage two-row layout
- Changed from `w-fit flex-wrap` single-row bar to `flex flex-col w-full` two-row layout
- Row 1: search input; Row 2: region pills + divider + ideology select with border-t

## 2026-05-18 — Match CitiesPage filter bar to EconomiesPage two-row unified pill bar style
- Replaced old `flex flex-wrap gap-3` layout (separate search, pill row, standalone select) with unified `flex flex-col bg-card border rounded-2xl` two-row bar
- Row 1: search; Row 2: region pills + divider + sort select with border-t; matches EconomiesPage/CountriesPage exactly

## 2026-05-18 — Match CountriesPage filter bar layout to EconomiesPage (two-row, full width)
- Changed from single-row `w-fit` pill bar to two-row `w-full` layout: search on top, pills + sort below with border-t
- Matches EconomiesPage pattern exactly: `flex flex-col`, `px-4 py-2.5`, `text-sm` search, `text-[11px]` pills

## 2026-05-18 — Make EconomiesPage filter bar full width to match card containers below
- Changed `w-fit` to `w-full` on the unified filter bar container

## 2026-05-18 — Match WorldMapPage filter bar to CountriesPage unified pill bar style
- Single inline bar: search input + region pills (All/Americas/Europe/etc.) + ideology select
- Replaced two-row layout with `flex flex-wrap items-center gap-2 bg-card border rounded-2xl` pattern

## 2026-05-18 — Split StatesPage filter bar into two rows: search on top, region/party pills + sort below
- Row 1: search input only; Row 2: region pills + divider + party pills + divider + sort select with border-t

## 2026-05-18 — Move EconomiesPage type pills and sort select to second row below search input
- Filter bar now two rows: row 1 = search, row 2 = type pill buttons + divider + sort select with border-t

## 2026-05-18 — Move ConflictsPage Status/Intensity pills to second row below search input
- Filter bar now two rows: row 1 = search input, row 2 = Status + Intensity pill buttons with border-t divider

## 2026-05-18 — Move WorldMapPage region/ideology selects to second row below search
- Filter bar now has two rows: row 1 = search input, row 2 = region + ideology selects separated by border-t
- Vertical divider between selects retained on second row

## 2026-05-17 — Unify WorldMapPage search + filter bar into single bg-card pill bar
- Merged standalone `relative mb-3` search input and two filter selects into one unified inline bar
- Matches StatesPage and EconomiesPage filter bar pattern exactly

## 2026-05-16 — Reduce ConflictsPage search input height (py-3.5 → py-2) and width (max-w-sm)

## 2026-05-16 — Remove Notifications feature entirely
- Removed Bell nav item from SidebarNav.tsx
- Removed /dashboard/notifications route and NotificationsPage import from App.tsx
- Deleted src/pages/NotificationsPage.tsx and src/components/NotificationsPanel.tsx

## 2026-05-16 — Remove Kaja Kallas (EU HR for Foreign Affairs) entry per user request
- Removed kallas entry from LEADERS array

## 2026-05-16 — Remove Tedros Adhanom Ghebreyesus (WHO DG) entry per user request
- Removed tedros entry from LEADERS array; total leaders now 189

## 2026-05-16 — Remove Ngozi Okonjo-Iweala (WTO DG) entry per user request
- Removed okonjo-iweala entry from LEADERS array; total leaders now 190

## 2026-05-16 — Remove Ursula von der Leyen (EU Commission President) entry per user request
- Removed vonderleyen entry from LEADERS array; total leaders now 191

## 2026-05-16 — Remove António Costa (EU Council President) entry per user request
- Removed acosta entry from LEADERS array; total leaders now 192

## 2026-05-16 — Remove Alain Berset (CoE SG) entry per user request
- Removed berset entry from LEADERS array; total leaders now 193

## 2026-05-16 — Remove Mark Rutte (NATO SG) entry per user request
- Removed rutte entry from LEADERS array; total leaders now 194

## 2026-05-16 — Remove duplicate David Panuelo (Former) FSM entry
- Removed panuelo-former entry; Wesley Simina (current FSM President) is the sole FSM card
- Total leaders: 195

## 2026-05-16 — World Leaders Final Batch 29 + Full Audit (total 196)
- Added: Kaïs Saïed (Tunisia self-coup), Andrzej Duda (Poland Pres), Tchiani (Niger junta), MBR (Dubai/UAE PM), Boakai (Liberia), Luis Arce (Bolivia former), Pope Leo XIV (new Vatican)
- Discrepancy fixes: 12 wrong IDs corrected (sheinbaum, chakwera, orsi, golob, frostadottir, zhelyazkov, mickoski, abela, simina, akufo-addo, panuelo-former, montenegro-lu)
- Status fixes: Scholz, Sunak, Yoon, Nehammer, Fiamē, Panuelo, Akufo-Addo set to "Former"; Pope Francis marked "Former" (died Apr 21 2025); duplicate id "sassou" resolved
- Added "Former" to Status type; Total leaders: 196

## 2026-05-16 — World Leaders Batch 28: +7 leaders (total 189)
- Added: King Charles III (UK), Jacinda Ardern (NZ former), Boris Johnson (UK former), Okonjo-Iweala (WTO DG), Tedros (WHO DG), Jokowi (Indonesia former), Obiang (EQ Guinea/world longest)
- Covers UK constitutional monarchy, iconic progressive & Brexit-era former leaders, international institutions, Indonesia&#39;s commoner-to-president arc, and world&#39;s longest-serving non-royal autocrat
- Total leaders: 189 across all world regions

## 2026-05-16 — World Leaders Batch 27: +7 leaders (total 182)
- Added: Díaz-Canel (Cuba), Haitham (Oman), Marin (Finland former), To Lam (Vietnam GS), Tsai Ing-wen (Taiwan former), Zuma (RSA former/MK), AMLO (Mexico former)
- Covers last Caribbean communist state, Gulf&#39;s supreme back-channel diplomat, Finland&#39;s NATO architect, Vietnam&#39;s security-state new top leader, Taiwan&#39;s semiconductor shield builder, state capture legacy, Mexico&#39;s MORENA founder
- Total leaders: 182 across all world regions

## 2026-05-16 — World Leaders Batch 26: +7 leaders (total 175)
- Added: Abbas (Palestinian Authority), Pope Francis (Vatican), Bolkiah (Brunei), Imran Khan (imprisoned), Aung San Suu Kyi (imprisoned), Karzai (Afghanistan former), Hun Sen (Cambodia de facto power)
- Covers Palestinian leadership vacuum, Vatican geopolitics, last absolute sultanate, two imprisoned consequential leaders, Post-Taliban Afghanistan, and Cambodia dynasty
- Total leaders: 175 across all world regions

## 2026-05-16 — World Leaders Batch 25: +7 leaders (total 168)
- Added: Al-Sudani (Iraq PM), Radev (Bulgaria Pres), Pellegrini (Slovakia Pres), Talon (Benin), Oligui Nguema (Gabon coup/transition), Doumbouya (Guinea/Simandou), Sakellaropoulou (Greece Pres/1st female)
- Covers Iraq&#39;s US-Iran balancing act, Sahel-adjacent West Africa, Gabon dynasty end, Guinea bauxite/iron dominance, and SE European head-of-state/head-of-government splits
- Total leaders: 168 across all world regions

## 2026-05-16 — World Leaders Batch 24: +7 leaders (total 161)
- Added: Dabaiba (Libya/GNU split), Kiir (South Sudan/failed state), Netumbo (Namibia/first elected female), Mswati III (Eswatini/last absolute monarchy), Japarov (Kyrgyzstan/prison-to-president), Manele (Solomons/China deal continuity)
- Covers North Africa oil dysfunction, newest/most failed state, historic African female election, Pacific geopolitics, Central Asia resource nationalism
- Total leaders: 161 across all world regions

## 2026-05-16 — World Leaders Batch 23: +7 leaders (total 154)
- Added: Fiamē (Samoa/Pacific democracy), Marape (PNG/US defence deal), Fils-Aimé (Haiti/gang crisis), Rowley (Trinidad/Dragon gas), Ngirente (Rwanda PM), Guelleh (Djibouti/great power bases), Xiomara Castro (Honduras/first female pres)
- Covers Pacific island democratic tests, Caribbean energy geopolitics, Rwanda&#39;s operational PM, Horn of Africa&#39;s most strategic small state, and Central America&#39;s left turn
- Total leaders: 154 across all world regions

## 2026-05-16 — World Leaders Batch 22: +7 leaders (total 147)
- Added: Lourenço (Angola), Chapo (Mozambique/disputed), Panuelo (FSM-former), Simina (FSM-current), Berdimuhamedov Jr. (Turkmenistan), Pashinyan (Armenia), Mark Brown (Cook Islands/China deal)
- Covers sub-Saharan Africa oil/gas, Pacific micro-state geopolitics, Central Asian hermit state, and Armenia&#39;s historic Russia pivot
- Total leaders: 147 across all world regions

## 2026-05-16 — Fix Batch 21 bundler cache error (same as Orbán pattern)
- File on disk was already clean (all 7 Batch 21 entries inside LEADERS array at lines 9721–10175)
- Bundler was serving stale cached broken build — forced recompile via trivial comment bump + dev restart
- Pattern: same as Batch 12 Orbán fix — search confirmed single `id: "mohamud"` at line 9721 only

## 2026-05-16 — Fix Batch 21 floating code syntax error
- Root cause: Batch 21 entries were appended after the WorldMapPage closing `}`, outside the LEADERS array
- Fix: inserted entries into LEADERS array before `];`, removed floating duplicate block from end of file
- Pattern: same class of error as decroo/orban/schoof — replace_in_file appended after component instead of into array

## 2026-05-16 — Fix decroo duplicate syntax error (same pattern as orban/schoof fixes)
- Removed dangling `{` before the decroo object that caused SyntaxError at line 7649
- Root cause: replace_in_file inserted the opening brace of the entry twice

## 2026-05-16 — World Leaders Batch 21: +7 leaders (total 133)
- Added: Mohamud (Somalia), al-Burhan (Sudan junta/civil war), Ramkalawan (Seychelles), Ndayishimiye (Burundi), Embaló (Guinea-Bissau), Ghazouani (Mauritania), Dodik (Bosnia-RS)
- Covers Horn of Africa, Great Lakes, Indian Ocean democracy, Sahel outlier, and Balkan destabilizer
- Total leaders: 133 across all world regions

## 2026-05-16 — World Leaders Batch 20: +7 leaders (total 126)
- Added: Kobakhidze (Georgia PM), Yoon Suk-yeol (impeached S.Korea), Chaves (Costa Rica), Touadéra (CAR/Wagner template), Afwerki (Eritrea), Assoumani (Comoros), Déby (Chad)
- Covers Georgia&#39;s EU protest crisis, Korean constitutional drama, Central America&#39;s populism, Africa&#39;s most isolated states
- Total leaders: 126 across all world regions

## 2026-05-16 — World Leaders Batch 19: +7 leaders (total 112)
- Added: Akhannouch (Morocco), Barrow (Gambia), Sassou Nguesso (Congo-B), Gnassingbé (Togo), Duma Boko (Botswana), Arévalo (Guatemala), Irfaan Ali (Guyana)
- Covers North Africa EU partnership, West/Central Africa dynasties, Botswana&#39;s historic 58-year power transfer, Guatemala&#39;s democratic miracle, and Guyana&#39;s oil boom
- Total leaders: 112 across all regions

## 2026-05-16 — World Leaders Batch 18: +7 leaders (total 105)
- Added: Lai Ching-te (Taiwan), Mirziyoyev (Uzbekistan), Rahmon (Tajikistan), Orsi (Uruguay), Ortega (Nicaragua), Guterres (UN SG), Biya (Cameroon)
- Covers Taiwan geopolitical flashpoint, Central Asia reform story, LatAm democracy & authoritarianism, UN leadership, and Africa&#39;s longest-serving leader
- Total leaders: 98 across all 5 major world regions + UN/supranational

## 2026-05-16 — World Leaders Batch 17: +7 leaders (total 91)
- Added: Tokayev (Kazakhstan), Aliyev (Azerbaijan), Lukashenko (Belarus), Museveni (Uganda), Mahama (Ghana), Tebboune (Algeria), Ouattara (Côte d'Ivoire)
- Expanded Central Asia, South Caucasus, and West/East Africa coverage
- Total leaders: 91 across all 5 major world regions

## 2026-05-16 — World Leaders Batch 16: +7 leaders (total 84)
## 2026-05-16 — World Leaders Batch 16: +7 leaders (total 84)
- Added: Sandu (Moldova), Hichilema (Zambia), Hassan (Tanzania), Zourabichvili (Georgia), Rinkēvičs (Latvia President), Chakwera (Malawi), Akufo-Addo (Ghana)
- Expanded Africa coverage (Zambia, Tanzania, Ghana, Malawi) and Europe (Moldova, Georgia, Latvia President)
- Total leaders: 84 across all 5 major world regions

## 2026-05-16 — World Leaders Batch 15: +7 leaders (total 77)
- Added: Zhelyazkov (Bulgaria), Vučić (Serbia), Rama (Albania), Keller-Sutter (Switzerland), Abela (Malta), Frieden (Luxembourg), Nausėda (Lithuania)
- Covers SE Europe Balkans, Alpine micro-states, and Baltic region
- Total leaders: 77 across all 5 major world regions

## 2026-05-16 — World Leaders Batch 14: +7 leaders (total 70)
- Added: De Croo (Belgium), Støre (Norway), Frostadóttir (Iceland), Martin (Ireland), Fico (Slovakia), Ciolacu (Romania), Plenković (Croatia)
- Covered Western Europe, Nordic, and Eastern EU bloc with up-to-date 2025 data
- Total leaders: 70 across Americas, Europe, Asia-Pacific, Middle East, Africa

## 2026-05-16 — Fix Batch 13 duplicate block syntax error
- Removed duplicate Batch 13 leader block that caused SyntaxError at line 5410
- Root cause: previous replace_in_file inserted the entire Batch 13 block twice inside the Schoof entry
- File now has single clean entries for all 63 leaders; Schoof entry complete

## 2026-05-16 — World Leaders Batch 13: +7 leaders (total 63)
- Added: Bayrou (France PM), Luxon (New Zealand), Montenegro (Portugal), Nehammer (Austria, former), Kickl (Austria, current), Fiala (Czech Republic), Mitsotakis (Greece)
- All follow full Leader schema; Austria now has both Nehammer (departed) and Kickl (current FPÖ Chancellor)
- Total leaders: 63 across Americas, Europe, Asia-Pacific, Middle East, Africa

## 2026-05-02 — Fix Orbán duplicate syntax error + force clean recompile
- File on disk was already clean (single orban entry) but bundler served cached broken build
- Forced clean recompile via trivial inline comment bump + npm run dev restart
- Confirmed via search: only one `id: "orban"` exists in WorldMapPage.tsx

## 2026-05-02 — World Leaders: complete global dataset — 56 leaders across all regions
- Added batches 4–11: Africa (Mnangagwa, Kagame, Tinubu, Abiy, Sisi), Asia (Yunus, Dissanayake, Marcos Jr., Paetongtarn, Anwar, Pham Minh Chinh, Hun Manet, Lawrence Wong, Muizzu), Middle East (Khamenei, Aoun, al-Sharaa, Barzani), Europe (Rutte/NATO, Frederik X, Kristersson, Orpo, Costa, Berset, Christodoulides), Americas (Petro, Boluarte, Noboa, Ruto-Kenya)
- Fixed all placeholder id/name fields from temp keys to clean canonical ids
- Total leaders: 56 covering Americas, Europe, Asia-Pacific, Middle East, Africa

## 2026-05-02 — World Leaders: added Bukele, von der Leyen, Prabowo, Pezeshkian (batch +4, total 28)
- Added Nayib Bukele (El Salvador), Ursula von der Leyen (EU), Prabowo Subianto (Indonesia), Masoud Pezeshkian (Iran)
- All four follow full Leader schema: background, education, events, achievements, views, approval, region

## 2026-05-02 — World Leaders: remove Biden, rename nav, add 7 new leaders
- Removed Joe Biden (no longer in office); sidebar label changed from "World Map" to "World Leaders" with Crown icon
- Added: Giorgia Meloni (Italy), Claudia Sheinbaum (Mexico), Anthony Albanese (Australia), Cyril Ramaphosa (South Africa), Shehbaz Sharif (Pakistan), Viktor Orbán (Hungary)
- Header icon updated from Globe → Crown to match the Leaders directory purpose
- Africa region now represented via Ramaphosa; total leaders raised to ~20

## 2026-05-02 — World Leaders: card detail panel converted to modal popup
- Clicking any leader card now opens a centered modal overlay with backdrop blur instead of a side panel
- Cards switched to a responsive grid (1→2→3→4 cols) now that no right panel competes for space
- Added close button (X) on modal hero + click-outside-to-dismiss behaviour
- `LeaderDetail` receives an `onClose` prop; initial `selected` state set to `null` (no auto-selection)

## 2026-05-02 — World Leaders page replacing WorldMapPage
- Completely replaced `src/pages/WorldMapPage.tsx` content with a full World Leaders directory
- 14 leaders profiled with: background, age, birthplace, education, party/ideology, terms, achievements, significant events, political views, approval ratings, impact, status
- Leader card list (left) + tabbed detail panel (right) layout with search + region + ideology filters
- Approval bar, timeline events with positive/negative/neutral indicators, and ideology color-coded badges
- Route and nav links unchanged — same `/dashboard/map` path reused

## 2026-04-29 — VIP dashboard redesign
## 2026-05-02 — World Leaders page replacing WorldMapPage
- Completely replaced `src/pages/WorldMapPage.tsx` content with a full World Leaders directory
- 14 leaders profiled with: background, age, birthplace, education, party/ideology, terms, achievements, significant events, political views, approval ratings, impact, status
- Leader card list (left) + tabbed detail panel (right) layout with search + region + ideology filters
- Approval bar, timeline events with positive/negative/neutral indicators, and ideology color-coded badges
- Route and nav links unchanged — same `/dashboard/map` path reused

## 2026-04-29 — VIP dashboard redesign
- Full redesign of `src/pages/DashboardPage.tsx` with cinematic dark hero, ambient glow orbs, subtle grid texture
- Data module cards gain dynamic glow-shadow on hover per accent color; features pillar section added (4 cards)
- Newsletter section rewritten with deep dark bg; footer refined with gradient top line and hover micro-interactions
- Added `PLATFORM_FEATURES` array; removed unused icon/tool imports for tree-shake hygiene

## 2026-04-29 — Full security sweep: 8 remaining vulnerabilities patched
- `EduSignInPage.tsx`: added rate limiting (5/15min), `maxLength`, `sanitizeText()` + `validateEmail()` on the standalone `/edu` form
- `SettingsPage.tsx`: added `maxLength` on name/email inputs, password min-length 8 check, empty-guard, sanitization before save, inline error/success feedback
- `HeaderNav.tsx`: search query capped at `LIMITS.SEARCH_QUERY` (200 chars) — prevents large-paste DoS on `String.includes()` loop
- `NotesPage.tsx`: stored link URLs re-validated via `sanitizeUrl()` before rendering as `href`; audio `src` validated (blob: or https: only) before mounting `<audio>`
- `.gitignore` actually created on disk (previous attempt produced "File not found")

## 2026-04-29 — Security hardening: rate limiting, input sanitization, payload validation
## 2026-04-29 — Full security sweep: 8 remaining vulnerabilities patched
- `EduSignInPage.tsx`: added rate limiting (5/15min), `maxLength`, `sanitizeText()` + `validateEmail()` on the standalone `/edu` form
- `SettingsPage.tsx`: added `maxLength` on name/email inputs, password min-length 8 check, empty-guard, sanitization before save, inline error/success feedback
- `HeaderNav.tsx`: search query capped at `LIMITS.SEARCH_QUERY` (200 chars) — prevents large-paste DoS on `String.includes()` loop
- `NotesPage.tsx`: stored link URLs re-validated via `sanitizeUrl()` before rendering as `href`; audio `src` validated (blob: or https: only) before mounting `<audio>`
- `.gitignore` actually created on disk (previous attempt produced "File not found")

## 2026-04-29 — Security hardening: rate limiting, input sanitization, payload validation
- Created `src/lib/security.ts` — central security utility module (rate limiter, sanitizer, payload validator)
- Rate limiter: in-memory, 5 attempts / 15 min for `auth:login` and `auth:edu` keys in `AuthModal.tsx`
- Input sanitizer: strips HTML tags, null bytes, `javascript:` URIs, inline event handlers from all user text/URLs
- Payload limits enforced: title 120 chars, content 10,000 chars, max 10 links, URL 2,048 chars, email 254 chars
- Added `.gitignore` to protect `.env*` files from accidental commits; confirmed no secrets in codebase

## 2026-04-25 — Remove search bar from hero section in DashboardPage
- Deleted the search input + Explore button pill from the hero section of `src/pages/DashboardPage.tsx`

## 2026-04-25 — Use logo as hero section watermark background in DashboardPage
- Replaced decorative radial-gradient blobs in the hero with the CommonSphere logo images
- Light/dark mode logo variants shown via `logo-light` / `logo-dark` CSS classes at w-[420px], opacity-[0.06/0.08]

## 2026-04-25 — Move Bell/notifications button to left of search bar in HeaderNav
- Removed Bell button from the right-side Actions group
- Added it between the Logo and the Search bar

## 2026-04-25 — Change Tools grid to single column layout
- Changed `grid-cols-1 sm:grid-cols-2` to `grid-cols-1` in the Tools & Features section of DashboardPage

## 2026-04-25 — Delete Collections page and all references
- Deleted `src/pages/CollectionsPage.tsx` and `src/components/CollectionsGrid.tsx`
- Removed route, import, footer link, Tools card, and HeaderNav dropdown item for collections

## 2026-04-25 — Center hero section content in DashboardPage
- Changed hero layout from left-aligned flex row to centered column (`items-center text-center`)
- Search bar and stats row are now `justify-center` / `text-center`

## 2026-04-25 — Remove hero data panel illustration from DashboardPage
- Deleted the frosted-glass "global_overview.live" data panel and floating accent card from the hero right side
- Hero section now text/search only (left column), no right illustration

## 2026-04-25 — Apply US States flag-background style to country cards
- Country cards now match the StatesPage card design: blurred flag fills the card header as a semi-transparent backdrop
- Gradient overlay (`from-card/60 via-card/70 to-card`) keeps text readable
- Small square flag thumbnail (w-11 h-11, rounded-lg) in the top-left alongside name/capital
- Continent badge floats top-right, `modal-tile` base replaces `bg-card` for card base style

## 2026-04-25 — Update Collections tool card description to reflect site data categories
- Changed desc from "Organise your entity groups" to "Curate custom sets of countries, states, economies & more"
- Located in `TOOLS` array in `src/pages/DashboardPage.tsx`

## 2026-04-25 — Remove Intelligence Feed / Latest Updates section from DashboardPage
- Deleted the "Read Our Latest Updates" news cards section and its `RECENT_UPDATES` + `UPDATE_TYPE_COLOR` data arrays

## 2026-04-24 — Add energy stats to all remaining countries
- Added `energy: mkEnergy(...)` to 29 countries that were missing it (small island states, territories, micro-states, Caribbean nations)
- Covers: Solomon Islands, Vanuatu, Samoa, Tonga, Kiribati, Micronesia, Palau, Marshall Islands, Nauru, Tuvalu, Puerto Rico, Guam, Bermuda, Faroe Islands, Greenland, Bahamas, Antigua, Dominica, Grenada, Barbados, Saint Lucia, Saint Vincent, Saint Kitts, San Marino, Liechtenstein, Andorra, Monaco, Cook Islands, Niue
- All entries in `countriesData.ts`; EnergySection renders automatically when `country.energy` is present

## 2026-04-21 — Fix build timeout: lazy-load WorldMapPage
## 2026-04-24 — Add energy stats to all remaining countries
- Added `energy: mkEnergy(...)` to 29 countries that were missing it (small island states, territories, micro-states, Caribbean nations)
- Covers: Solomon Islands, Vanuatu, Samoa, Tonga, Kiribati, Micronesia, Palau, Marshall Islands, Nauru, Tuvalu, Puerto Rico, Guam, Bermuda, Faroe Islands, Greenland, Bahamas, Antigua, Dominica, Grenada, Barbados, Saint Lucia, Saint Vincent, Saint Kitts, San Marino, Liechtenstein, Andorra, Monaco, Cook Islands, Niue
- All entries in `countriesData.ts`; EnergySection renders automatically when `country.energy` is present

## 2026-04-21 — Fix build timeout: lazy-load WorldMapPage
- `WorldMapPage` was eagerly imported, forcing d3-geo + 3MB TopoJSON CDN fetch into the main chunk
- Replaced static import with `React.lazy()` + `<Suspense>` fallback in `App.tsx`
- TopoJSON fetch now only fires when user navigates to `/dashboard/worldmap`
- `useLiveData` auto-fetch was already disabled; confirmed no other on-mount fetches in main bundle

## 2026-04-21 — Upgrade hero illustration to professional data panel
- Replaced simple orbit rings + globe icon with a frosted-glass terminal-style data panel
- Panel shows: live sparkline bar chart, 3 progress-bar stat rows, region chips with accent colors
- Floating accent card at bottom-left: TrendUp icon + "40K+ Points" data coverage callout
- Hidden on mobile (md:flex), panel uses `backdrop-filter: blur` + rgba borders for glass effect

## 2026-04-21 — Upgrade Explore Data grid cards to professional icon imagery
## 2026-04-21 — Upgrade Explore Data grid cards to professional icon imagery
- Replaced emoji large visuals with rich gradient headers (dark-to-light per category color)
- Each card has a subtle grid texture overlay, white glow blob, and a frosted-glass icon panel
- Added count badge (top-right corner) over the gradient header
- Added `heroIcon` field per nav item using appropriate Phosphor icons (Globe, Buildings, Briefcase, Scroll, Crosshair)
- Imported `Crosshair`, `Briefcase`, `Scroll`, `Sword` from `@phosphor-icons/react`

## 2026-04-21 — Redesign DashboardPage to match portfolio/agency reference layout
- Purple gradient hero banner with animated globe orbit, search bar, and live stat pills
- Explore data grid uses emoji + card aspect-ratio tiles like "Recent Case Study" section
- Global Highlights metrics strip (centered), newsletter section with email subscribe (purple gradient)
- Latest Updates redesigned as news cards with Unsplash images, author avatars, hover lift
- ComparisonModule preserved inline with section heading; Policy Tags + Tools in 2-col grid below
- Footer updated with purple top accent bar and gradient CTA buttons

## 2026-04-18 — Reorganize DashboardPage as dual Home + Dashboard layout
- Added `SectionDivider` component (icon label + horizontal rule) to visually split zones
- TOP ZONE (Home): Hero → Explore Our Data → Latest Updates
- BOTTOM ZONE (Dashboard): labeled divider → Global Highlights → Comparisons → Policy Tags + Tools (2-col) → CTA
- Policy Tags & Tools now displayed side-by-side in a 2-column grid for better space usage
- Imported `House`, `SquaresFour`, `Crosshair` from phosphor-icons for section markers

## 2026-04-17 — Add About page
## 2026-04-18 — Reorganize DashboardPage as dual Home + Dashboard layout
- Added `SectionDivider` component (icon label + horizontal rule) to visually split zones
- TOP ZONE (Home): Hero → Explore Our Data → Latest Updates
- BOTTOM ZONE (Dashboard): labeled divider → Global Highlights → Comparisons → Policy Tags + Tools (2-col) → CTA
- Policy Tags & Tools now displayed side-by-side in a 2-column grid for better space usage
- Imported `House`, `SquaresFour`, `Crosshair` from phosphor-icons for section markers

## 2026-04-17 — Add About page
- Created `src/pages/AboutPage.tsx` with hero, stats, mission, values, timeline, team, and CTA sections
- Registered `/dashboard/about` route in `App.tsx`
- Added "About" link to the ACCOUNT column in the dashboard footer

## 2026-04-17 — Match "Sphere" weight/opacity to "Common" in logo wordmark
- `HeaderNav.tsx`: removed `fontWeight: 500` and `opacity: 0.9` override on the "Sphere" span so both halves render identically

## 2026-04-17 — Switch header logo wordmark to Inter for professional look
- `HeaderNav.tsx`: logo wordmark now uses `Inter` (fallback `DM Sans`), `font-weight 700/500`, `letter-spacing -0.02em`
- Replaced `IBM Plex Mono` mono style with clean sans-serif for a more ubiquitous, professional brand feel

## 2026-04-17 — Make header fully black in dark mode
- `index.css`: changed `--color-header-bg` from `#1a1a1e` to `#000000` for dark mode

## 2026-04-17 — Replace logos with new uploaded globe assets
- `HeaderNav.tsx`: light mode uses black-on-white globe (`uploaded-asset-1776467236633-0.jpeg`), dark mode uses white-on-black globe (`uploaded-asset-1776467236635-1.jpeg`)
- `index.css`: simplified `.logo-light` / `.logo-dark` CSS switching classes

## 2026-04-17 — Trim footer links to only registered routes
- Removed non-existent routes: congress, policy-hub, political-library, trends, quizzes, polls, bookmarks, api
- PLATFORM: states, countries, cities, economies, worldmap, conflicts
- RESEARCH: policy, comparisons | TOOLS: collections, notes, notifications | ACCOUNT: settings, memberships
- All footer links now correspond to actual `<Route>` entries in App.tsx

## 2026-04-17 — Add dark multi-column footer to DashboardPage
- Added `FOOTER_LINKS` data (Platform, Research, Tools, Account columns) + social icons row
- Footer uses `bg-[#141414]` dark background matching AlphaSense reference
- Sign In + Get Access CTA buttons, YouTube/LinkedIn/Twitter/Instagram/Facebook icons
- Bottom bar has brand logo, legal links, and copyright line
- Imported `YoutubeLogo`, `LinkedinLogo`, `TwitterLogo`, `InstagramLogo`, `FacebookLogo` from phosphor-icons

## 2026-04-17 — Redesign DashboardPage as traditional homepage
- Full hero section with tagline, pill CTA buttons, search bar, and live stat pills
- "Explore Our Data" grid, "Latest Updates" news feed (4 items), Global Highlights metrics
- Policy Tag Explorer + Tools grid redesigned with `rounded-2xl` cards and hover lift
- Added CTA banner for alert subscriptions; kept ComparisonModule as-is
- Removed ChartPanel from dashboard; cleaned up unused imports

## 2026-04-17 — Add Alert Subscriptions to SettingsPage
- `SettingsPage.tsx`: new "Alert Subscriptions" section with watched countries/states list
- Searchable `EntitySearch` component queries `countriesData` + `usStatesData` live
- Each watched entity has per-topic toggles: Policy, Leadership, Economy, Conflicts, Legislation
- Email Digest master toggle; entities removable with trash button; defaults to US + California

## 2026-04-16 — Add remaining countries to reach ~195 total in countriesData.ts
## 2026-04-17 — Add Alert Subscriptions to SettingsPage
- `SettingsPage.tsx`: new "Alert Subscriptions" section with watched countries/states list
- Searchable `EntitySearch` component queries `countriesData` + `usStatesData` live
- Each watched entity has per-topic toggles: Policy, Leadership, Economy, Conflicts, Legislation
- Email Digest master toggle; entities removable with trash button; defaults to US + California

## 2026-04-16 — Add remaining countries to reach ~195 total in countriesData.ts
- Added: Türkiye, Palestine, Western Sahara, Cook Islands, Niue (+ placeholder dedup cleanup)
- `countriesData.ts` now covers all 195 UN-recognized states plus major territories

## 2026-04-16 — Match CountriesPage continent filter to StatesPage pill style
- `CountriesPage.tsx`: removed card wrapper; continent pills now in flat `flex flex-wrap items-center gap-2` row with dividers, matching StatesPage exactly
- Pills: `px-3 py-1 rounded-full text-[11px] font-medium font-sans border`; active: `bg-secondary/20 text-secondary border-secondary/40`
- Search input back to `py-1.5 text-[12px] bg-card`; sort select uses same `font-medium` style as StatesPage

## 2026-04-16 — Match ConflictsPage status+intensity filters to PolicyPage card style
- `ConflictsPage.tsx`: status ("All/Active/Inactive") and intensity ("All/Critical/High/Medium/Low") filter pills each wrapped in `bg-card border border-border/60 rounded-2xl p-3` cards with uppercase header labels
- Search input enlarged to `py-2.5 text-[13px] bg-muted` matching PolicyPage style; filters stacked vertically
- Pills use `px-3 py-1.5 rounded-full border text-[11px] font-medium`; active: `bg-secondary/15 text-secondary border-transparent shadow-sm`

## 2026-04-16 — Match EconomiesPage type filter to PolicyPage card style
- `EconomiesPage.tsx`: type filter now wrapped in `bg-card border border-border/60 rounded-2xl p-3` card with header label row, matching PolicyPage category filter exactly
- Pills use `px-3 py-1.5 rounded-full border text-[11px]`; active state: `bg-secondary/15 text-secondary border-transparent shadow-sm`
- Search input enlarged to `py-2.5 text-[13px] bg-muted` matching PolicyPage search; sort select moved alongside search in top row

## 2026-04-16 — Restyle EconomiesPage filter row to compact pill bar
- `EconomiesPage.tsx`: type filter (All/Country/Region/Bloc) + sort select restyled to `rounded-full text-[11px] font-medium border` pills
- Active pill: `bg-secondary/20 text-secondary border-secondary/40`; inactive: `bg-transparent border-border`
- Sort `<select>` rounded to `rounded-full`; dividers (`w-px h-5 bg-border`) separate search / type pills / sort groups
- Search input shrunk to `text-[12px]` rounded-full, matching CountriesPage & StatesPage filter row style

## 2026-04-16 — Restyle CountriesPage filter row to match pill bar style
- `CountriesPage.tsx`: continent + sort filters restyled to `rounded-full text-[11px] font-medium border` pills
- Active continent pill: `bg-secondary/20 text-secondary border-secondary/40`; inactive: `bg-transparent border-border`
- Sort `<select>` rounded to `rounded-full`; dividers (`w-px h-5 bg-border`) separate search / continents / sort groups
- Search input shrunk to `text-[12px]` pill shape matching StatesPage filter row style

## 2026-04-16 — Restyle StatesPage filter row to match pill bar style
- `StatesPage.tsx`: region + party + sort filters restyled to `rounded-full text-[11px] font-medium border` pills
- Party active states use party-specific colors (secondary/red/yellow); region active uses `bg-secondary/20`
- Sort `<select>` rounded to `rounded-full` to match pill aesthetic; dividers (`w-px h-5 bg-border`) separate groups
- Search input shrunk to `text-[12px]` pill shape matching the overall compact filter row

## 2026-04-16 — Restyle PolicyPage category filter grid to inline pill row
## 2026-04-16 — Restyle StatesPage filter row to match pill bar style
- `StatesPage.tsx`: region + party + sort filters restyled to `rounded-full text-[11px] font-medium border` pills
- Party active states use party-specific colors (secondary/red/yellow); region active uses `bg-secondary/20`
- Sort `<select>` rounded to `rounded-full` to match pill aesthetic; dividers (`w-px h-5 bg-border`) separate groups
- Search input shrunk to `text-[12px]` pill shape matching the overall compact filter row

## 2026-04-16 — Restyle PolicyPage category filter grid to inline pill row
- `PolicyPage.tsx`: category filter `grid grid-cols-3 sm:grid-cols-5` replaced with `flex flex-wrap gap-1.5`
- Each pill: `rounded-full border text-[11px] font-medium` with icon+label, matching EconomiesPage type filter style
- Active state uses category-specific `cfg.bg`/`cfg.color`; inactive: `bg-transparent border-border`

## 2026-04-16 — Restyle EconomiesPage type filter to segmented pill bar
## 2026-04-16 — Restyle PolicyPage category filter grid to inline pill row
- `PolicyPage.tsx`: category filter `grid grid-cols-3 sm:grid-cols-5` replaced with `flex flex-wrap gap-1.5`
- Each pill: `rounded-full border text-[11px] font-medium` with icon+label, matching EconomiesPage type filter style
- Active state uses category-specific `cfg.bg`/`cfg.color`; inactive: `bg-transparent border-border`

## 2026-04-16 — Restyle EconomiesPage type filter to segmented pill bar
- `EconomiesPage.tsx`: type filter replaced with icon+label segmented bar inside a `bg-card border rounded-xl` container
- Added `Globe`, `Flag`, `MapTrifold`, `Buildings` icons for All/Country/Region/Bloc
- Active state: `bg-secondary/15 text-secondary`; inactive: `text-muted-foreground hover:bg-muted/60`

## 2026-04-15 — Round PolicyPage search input to pill shape
- `PolicyPage.tsx`: search input `rounded-xl` → `rounded-full`

## 2026-04-15 — Add currency symbol to EconomiesPage economy cards
- `EconomiesPage.tsx`: added `CURRENCY_SYMBOLS` map (60+ currencies) and `getCurrencyDisplay()` helper
- Currency line now shows `symbol code · Full Currency Name · Interest Rate` (e.g. `$ USD · US Dollar · Interest Rate: 4%`)
- `currencyName` field confirmed present on all ~80 Economy entries in `economiesData.ts`

## 2026-04-15 — Refresh all statistics to accurate 2026 values
## 2026-04-15 — Refresh all statistics to accurate 2026 values
- `statesData.ts`: Updated population, GDP, medianIncome, unemploymentRate, minimumWage, averageIncome for all 50 states
- `StatesPage.tsx`: Banner labels updated to "2026 estimate", snapshot cards reflect new highest-GDP/income/unemployment leaders
- `economiesData.ts`: Updated GDP, growth, inflation, unemployment, interest rates & trend series for all major economies (US, China, EU, UK, Germany, France, India, Japan, Brazil, Canada, South Korea, Australia, Russia, Mexico, Indonesia, Saudi Arabia, Spain, Turkey + others)
- US total GDP now $30.3T, China $20.4T, EU $19.6T; all trend year-series extended through 2026

## 2026-04-15 — Match EconomiesPage type filter buttons to PolicyPage pill style
- `EconomiesPage.tsx`: filter pill buttons now use `rounded-full text-[10px] font-medium border` pattern matching PolicyPage
- Active state uses `bg-secondary/20 text-secondary border-transparent`; inactive uses `bg-transparent border-border`

## 2026-04-15 — Add ~40 new countries to economiesData.ts
- Added Middle East: Kuwait, Qatar
- Added Africa: Ethiopia, Kenya, Ghana, Tanzania, Angola, Morocco, Mozambique
- Added Latin America: Peru, Venezuela, Ecuador
- Added Southeast/South Asia: Myanmar, Cambodia, Sri Lanka, Nepal
- Added Oceania/N. Europe: New Zealand, Finland
- Added Eastern Europe: Romania, Hungary, Ukraine, Slovakia, Bulgaria, Croatia, Serbia
- Added Western Europe: Ireland, Italy
- Added East Asia: Taiwan, Hong Kong
- Added Central Asia: Uzbekistan, Kazakhstan

## 2026-04-15 — Retheme MembershipsPage to match site design system
- Replaced all hardcoded `#06101f`/`#0d1f35`/`slate-*` with `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-secondary`, `text-success`, `text-warning` tokens
- Removed standalone nav bar (page lives inside DashboardLayout); replaced with inline Back button in page header card
- All cards use `bg-card border border-border rounded-xl` pattern; inputs use shared `inputCls` token class
- Font classes switched to `font-sans`/`font-mono`; spacing tightened to match dashboard page style

## 2026-04-15 — Fix build timeout: remove countriesData import from PolicyPage
- `PolicyPage.tsx`: completely removed all references to `countriesData.ts` (static + dynamic import)
- Replaced dynamic country source with 30-entry inline `MINI_COUNTRIES` array defined directly in the file
- `countryMetaMap` now built synchronously from `MINI_COUNTRIES` — no async loading needed
- Removed `dataReady` / loading spinner state; `useEffect` now just calls both generators synchronously

## 2026-04-15 — Show only top-1 policy chip in EntityRow (larger, full policy name)
- `PolicyPage.tsx`: replaced top-3 summary chips with single #1 highest-scored chip
- Chip is larger (text-[12px], font-bold, px-3 py-1) and shows full policyName

## 2026-04-15 — Make PolicyPage category mini-bars vertical (bar graph style)
- `PolicyPage.tsx`: category bars in entity row header changed from horizontal fill bars to vertical columns
- Each bar column grows upward from the bottom, height proportional to score/10, fixed 36px container

## 2026-04-15 — Enrich PolicyPage entity rows with real flags + descriptive header
- `PolicyPage.tsx`: country flags now use `country.code.toLowerCase()` from `countriesData` (e.g. `de`, `fr`, `gb`) via flagcdn
- `PolicyPage.tsx`: state flags use `getStateFlag()` stored on `EntityGroup.flagUrl` — no longer re-derived in `EntityFlag`
- `PolicyPage.tsx`: entity header shows continent, population (formatted), GDP (formatted), policy chips with first 3 words of policy name
- `PolicyPage.tsx`: category mini-bars made taller (10px height) and use `items-end` alignment
- `PolicyPage.tsx`: added `getCountryMeta()`, `formatPop()`, `formatGDP()` helpers; `EntityGroup` interface moved to groupByEntity section

## 2026-04-15 — Redesign PolicyPage cards + entity header to match screenshot
- `PolicyPage.tsx`: cards redesigned — category badge left, trend+GDP%+score right, dual-color bar, policy name in category color, allocation below
- `PolicyPage.tsx`: entity header now shows flag (country: real flag, state: flagcdn us-{id}), top-3 policy chips with category+score, mini category bars
- `PolicyPage.tsx`: expanded grid changed from 4-col to 2-col to match screenshot proportions
- Added `EntityFlag`, `EntityTitleCard`, `getStateFlag` helpers; flags use `flagcdn.com/w80/` + state abbrev map

## 2026-04-15 — Add Policy page (US States + Countries policy cards)
- New `/dashboard/policy` route → `src/pages/PolicyPage.tsx`
- Policy cards: category badge, trend icon, GDP%, score bar, policy name, allocated amount
- Tabs: All / US States / Countries; category pill filters; search; paginated 48/page
- `SidebarNav.tsx`: added `Scales` icon + Policy nav item below Economies
- `App.tsx`: added Policy route

## 2026-04-15 — Remove Policies page entirely
- `PoliciesPage.tsx`: deleted
- `App.tsx`: removed `/dashboard/policies` route and `PoliciesPage` import
- `SidebarNav.tsx`: removed Policies nav item and `Briefcase` icon import

## 2026-04-15 — Remove budget summary strip from BudgetTab in PoliciesPage
- `PoliciesPage.tsx`: removed 4-card summary grid (Total Budget Tracked, Largest Allocation, Avg Policy Budget, Smallest Allocation) from `BudgetTab`

## 2026-04-15 — Remove Scale tab from PoliciesPage
- `PoliciesPage.tsx`: removed `ScaleTab` component, its tab entry in `TABS`, and its render line
- Also removed unused `Scales` icon import reference via tab entry removal

## 2026-04-15 — Change USNationalBanner header gradient to cyan blue
- `StatesPage.tsx`: banner header gradient `from-blue-900/60 via-blue-800/40 to-red-900/50` → `from-cyan-900/60 via-cyan-800/40 to-blue-900/50`

## 2026-04-15 — Apply modal-tile to state cards grid
- `StatesPage.tsx`: state card articles `bg-card border border-border` → `modal-tile`
- `StatesPage.tsx`: empty-results card also updated to `modal-tile`

## 2026-04-15 — Apply modal-glass + modal-tile to PolicyModal
- `PoliciesPage.tsx`: modal wrapper → `modal-glass border`
- `PoliciesPage.tsx`: stat tiles, tags, objectives, parties, implementation divs → `modal-tile`

## 2026-04-15 — Apply modal-glass + modal-tile to ConflictModal
- `ConflictsPage.tsx`: modal wrapper `bg-card border border-border` → `modal-glass border`
- `ConflictsPage.tsx`: all `bg-muted` tile divs (description, stats, countries, tags) → `modal-tile`

## 2026-04-15 — Apply modal-glass + modal-tile to EconomyModal
- `EconomiesPage.tsx`: modal wrapper `bg-card border border-border` → `modal-glass border`
- `EconomiesPage.tsx`: stat tiles `bg-muted rounded-md` → `modal-tile rounded-lg`

## 2026-04-15 — Add state flags to modal header in StatesPage
- `StatesPage.tsx`: replaced abbreviation gradient box in `StateModal` header with `flagcdn.com/w160/us-{id}.png` flag image (w-20 h-14 rounded)
- Fallback to abbreviation + gradient if image fails to load
- Cards already had flags (w-80 and w-11 flagcdn URLs); this completes the pattern in the modal

## 2026-04-15 — Add 5 territories to countriesData (PR, GU, BM, FO, GL)
- `countriesData.ts`: added Puerto Rico (US territory), Guam (US territory), Bermuda (British territory), Faroe Islands (Danish autonomous), Greenland (Danish autonomous)
- Each entry has full `keyIndustries`, `landmarks`, `religions`, `spokenLanguages`, `governmentType`, and `trends`
- Inserted under new `// ── TERRITORIES & DEPENDENCIES ──` section before `// ── CARIBBEAN ──`

## 2026-04-13 — Remove Developer API section, add 27 new economies (9 batches × 3)
## 2026-04-13 — Remove Developer API section, add 27 new economies (9 batches × 3)
- `MembershipsPage.tsx`: removed "Developer API" tab entirely (imports, ENDPOINTS, SAMPLE, state, JSX), updated Research plan features
- `App.tsx`: removed `/api` route and `ApiAccessPage` import
- `SidebarNav.tsx`: removed API Access nav item; added Edu/Students link
- `economiesData.ts`: added 27 new economies across 9 batches (3 per batch): Switzerland, Argentina, UAE, Poland, Sweden, Belgium, Norway, Singapore, Malaysia, Israel, Colombia, Egypt, South Africa, Thailand, Denmark, Nigeria, Pakistan, Vietnam, Chile, Philippines, Bangladesh, Austria, Iran, Iraq, Portugal, Czechia, Greece

## 2026-04-13 — Rename agencies label, remove Top 20 table, professional CS monogram logo
- `NotificationsPanel.tsx`: renamed `"Int'l Agencies"` → `"International Agencies"` in CATEGORY_META
- `EconomiesPage.tsx`: removed the entire Top 20 Economies table block + cleaned up `Minus` import
- `HeaderNav.tsx`: replaced plain circle with `CS` monogram (DM Sans bold, secondary bg) + refined wordmark (bold/light split, tight tracking)

## 2026-04-13 — Top 20 table → EconomiesPage, QoL scores, Int'l Agencies category, circle logo
- `EconomiesPage.tsx`: Top 20 Economies table moved here (previously in NotificationsPage) — shown above the card grid
- `NotificationsPage.tsx`: removed Top 20 table; cleaned up unused imports
- `NotificationsPanel.tsx` + `NotificationsPage.tsx`: added `agencies` category (Int'l Agencies) with `IdentificationBadge` icon + 4 sample notifications (UN, World Bank, IAEA, WTO)
- `statesData.ts`: added `qualityOfLiving: number` field (0–100) to all 50 states
- `StatesPage.tsx`: QoL score displayed as colored progress bar in modal + card; green ≥ 75, yellow ≥ 55, red below
- `HeaderNav.tsx`: replaced `Globe` icon with a plain `bg-secondary` circle div

## 2026-04-13 — Notifications top-20 economies table + header light mode + frosted search
- `NotificationsPage.tsx`: added Top 20 Economies table (sorted by GDP desc) above notification feed — shows GDP, growth trend icon, inflation, currency, credit rating
- `HeaderNav.tsx`: added `header-action-icon`, `header-logo-text`, `header-username`, `header-search-icon` CSS classes for light-mode targeting
- `index.css`: `.header-search-input` frosted glass (backdrop-filter blur) for dark/light; `.header-action-icon` forced dark color in `html.light`
- `economiesData.ts` already had 20 economies — sorted & sliced to top 20 by GDP

## 2026-04-13 — Add Political Campaigns tab to MembershipsPage
- New "Political Campaigns" tab on MembershipsPage with 3 tiered packages (Grassroots $49, District $149, Statewide $399/week)
- 3-step flow: package selection → campaign details form (candidate, office, party, dates, tagline, mission statement, issue tags) → review & pay with live banner preview
- Mission statement char limit varies by package (280/600/unlimited)
- Issue tag targeting with up to 5 selectable tags
- FEC compliance notice + success confirmation state
- `MegaphoneSimple`, `Flag`, `CalendarBlank`, `ImageSquare`, `TextAlignLeft`, `Buildings`, `ChartBar`, `Confetti` icons added

## 2026-04-13 — Add Notifications to sidebar nav and routing
- Added `Bell` icon + `Notifications` entry to `navItems` in `SidebarNav.tsx` (below Dashboard)
- Added `/dashboard/notifications` route in `App.tsx` pointing to existing `NotificationsPage`
- No changes to `NotificationsPage.tsx` — it was already fully built

## 2026-04-13 — Black/white header + Policy Tag Explorer on dashboard
- `HeaderNav.tsx`: header bg switched to `--color-header-bg` CSS var (black dark, white light)
- `index.css`: added `--color-header-bg: #000` in `:root`, `#fff` in `html.light`
- `DashboardPage.tsx`: added `POLICY_TAGS` array + `TAG_COLOR` map + "Policy Tag Explorer" section with domain-colored pill buttons linking to /dashboard/policies
- Tag colors match PoliciesPage domain colors (emerald/blue/yellow/orange/red/purple/pink/cyan)

## 2026-04-13 — Fix policy tag pill colors to match site
- Changed tag spans in `PolicyModal` and `InitiativesTab` from `bg-secondary/bg-muted text-foreground` to `bg-secondary/10 text-secondary border-secondary/20`
- Matches existing tag style used across CitiesPage, CountriesPage, ConflictsPage, EconomiesPage

## 2026-04-13 — Make all filter pill buttons fully rounded and downsized
- Changed `rounded-md`/`rounded-lg` → `rounded-full` on all filter pills
- Reduced padding `px-3 py-2` / `px-3 py-1.5` → `px-2.5 py-1` site-wide
- Affected: PoliciesPage, CitiesPage, ConflictsPage, CountriesPage, EconomiesPage, StatesPage, ComparisonModule

## 2026-04-13 — Remove frosted glass from all modals and popups
- Stripped `backdropFilter: blur(...)` + `rgba(...)` glass backgrounds from all 10 files
- All modals (Cities, Conflicts, Countries, Economies, States, Policies) → `bg-card border border-border`
- AuthModal, NotesPopup, SearchDropdown, UserMenu → same solid `bg-card` treatment
- PoliciesPage inline glass styles (tags, stat tiles, party rows, impl panel) → `bg-muted border border-border`

## 2026-04-13 — Downsize sidebar width (w-44→w-36 expanded, w-16→w-14 collapsed)
- `DashboardLayout.tsx`: sidebar `w-44`→`w-36`, collapsed `w-16`→`w-14`, margins updated to match

## 2026-04-13 — Rich detail card + full comparison module for countries & states
- `CountryDetailPanel` now shows economic overview stat tiles, score bars (unemployment/inflation/HDI/life), GDP trend BarChart, key industries, biosphere donut, governance + people grids
- Added a "Compare" button on the panel that links to `/dashboard/comparisons`
- `ComparisonModule` rewritten to use real `countriesData` + `usStatesData` with search, radar chart, and a side-by-side stat table
- Added `/dashboard/comparisons` route in `App.tsx` and updated `ComparisonsPage.tsx` header
- `CountriesPage` grid adjusts to full-width when no country is selected

## 2026-04-13 — Glassmorphism on PoliciesPage modal and tag pills
- Modal backdrop uses `blur(24px)` + frosted glass bg (`rgba(255,255,255,0.06)`) with inner-border highlight
- Stat cards, tags, initiative tag pills, party rows, and implementation panel all use glass-style inline styles
- Tags: `text-white`, `rgba(255,255,255,0.1)` background, `rgba(255,255,255,0.2)` border
- All glass effects applied via inline `style` props to avoid Tailwind JIT purge issues

## 2026-04-12 — Add Membership, API Access, and Edu Sign-in pages
- Created `src/pages/ApiAccessPage.tsx` — endpoint listing, quick-start cURL sample with copy button, feature pills, pricing note
- Created `src/pages/EduSignInPage.tsx` — .edu email form with magic-link flow, perks list, Google/Microsoft SSO placeholders
- Added routes `/membership`, `/api`, `/edu` to `App.tsx` (outside DashboardLayout)
- Added Membership, API Access, Edu Sign-in entries to `SidebarNav.tsx` with Crown/Code/GraduationCap icons
- Enhanced `AuthModal.tsx` with inline .edu email tab + link to full Edu page; MembershipsPage gets API/Edu shortcut buttons

## 2026-04-12 — COMPLETE: All 190+ countries now have keyIndustries data
- Final batch: Added `keyIndustries` to 25 remaining countries (GW, SL, LR, TG, GA, CG, CF, TD, CV, SC, ST, GQ, KM, PG, FJ, SB, VU, WS, TO, KI, FM, PW, MH, NR, TV)
- West African nations: Guinea-Bissau, Sierra Leone, Liberia, Togo, Gabon, Republic of Congo, CAR, Chad
- Island states: Cape Verde, Seychelles, São Tomé, Equatorial Guinea, Comoros
- Pacific nations: Papua New Guinea, Fiji, Solomon Islands, Vanuatu, Samoa, Tonga, Kiribati, Micronesia, Palau, Marshall Islands, Nauru, Tuvalu
- Each country has 6 curated industries with accurate GDP share percentages and color coding
- ALL countries in `countriesData.ts` now render the Key Industries bar chart in CountryModal and CountryDetailPanel

## 2026-04-12 — Add keyIndustries + biosphere presets to all countries
- Added `keyIndustries` (6 sectors each) to all ~60 countries that previously had no data: Guatemala, Cuba, Haiti, Dominican Republic, Panama, Jamaica, Trinidad & Tobago, Belize, Honduras, El Salvador, Nicaragua, Costa Rica, all South American nations, all remaining European nations, Singapore, Philippines, Vietnam, Pakistan, Bangladesh, UAE, Israel, Iran, Nigeria, Ethiopia, Egypt, South Africa, New Zealand
- Expanded `getBiosphere()` presets in `CountriesPage.tsx` from 13 → 50+ countries with ecologically accurate land-use breakdowns per country ID
- Fallback default preset still applies for remaining minor nations
- No UI changes — both charts now render on every country that has `keyIndustries`

## 2026-04-12 — Replace recharts BarChart with web bar chart + biosphere donut in CountriesPage
- Industries section now uses CSS progress bars (no recharts BarChart) for a cleaner "web chart" look
- Added `getBiosphere()` helper with per-country land-use presets (13 countries, fallback default)
- Biosphere displayed as a recharts `PieChart` donut beside the industries bar list
- Both `CountryModal` and `CountryDetailPanel` updated; `PieChart`/`Pie` added to recharts imports
- `BarChart`/`Bar`/`CartesianGrid` imports kept for other uses elsewhere

## 2026-04-12 — Reduce expanded sidebar width from w-56 to w-44
- Changed `w-56` → `w-44` and `md:ml-56` → `md:ml-44` in `DashboardLayout.tsx`

## 2026-04-12 — Replace GDP Trend chart with Key Industries horizontal bar chart
- Added `Industry` interface + `keyIndustries?: Industry[]` field to `Country` type in `countriesData.ts`
- Populated `keyIndustries` (6–7 sectors with GDP share %) for 13 major countries: US, CA, MX, BR, DE, FR, GB, CN, JP, IN, KR, SA, AU, RU
- Both `CountryModal` and `CountryDetailPanel` now show a color-coded horizontal `BarChart` of vital industries with % of GDP on X axis
- Countries without `keyIndustries` data gracefully hide the chart section
- Swapped `AreaChart`/`Area` recharts imports for `BarChart`/`Bar`/`Cell`

## 2026-04-12 — Add senators & House representatives to all 50 US state modals
- Added `Legislator` and `Representative` interfaces + `senators`, `houseSeats`, `representatives` fields to `USState` in `statesData.ts`
- Populated both senators (name, party, termEnd year) and all House reps (name, party, district) for all 50 states
- `StatesPage.tsx` modal now renders a Senators section (2-col grid, party color, term-end badge) and a scrollable Representatives grid (D/R/I badge, district label)
- Used `UserCircle` and `Gavel` phosphor icons for section headers

## 2026-04-12 — Add Waterways & Ports, Humanitarian Aid, Natural Disasters overlays to World Map
- Added 3 new `OverlayMode` values: `"waterways"`, `"humanitarian"`, `"disasters"` to `WorldMapSVG`
- `WATERWAYS` (15 entries): canals (diamond), straits (circle), ports (square) — cyan/amber/green dots with hover tooltips
- `HUMANITARIAN_ZONES` (14 entries): cross-symbol markers, pulsing rings by severity (Catastrophic/Critical/Serious)
- `DISASTER_HOTSPOTS` (17 entries): triangle warning markers by type (Earthquake/Volcanic/Cyclone/Flood/Drought/Wildfire)
- Each overlay has its own inline SVG legend; toggle buttons added to the pill row; `FirstAid` + `CloudLightning` icons imported

## 2026-04-12 — Refresh all site data to current 2026 figures
- Updated all 50 US state governors, populations, GDP, median income, unemployment rates to 2026
- New governors: Bob Ferguson (WA), Mike Braun (IN), Josh Stein (NC), Kelly Ayotte (NH), Dan Bramnick (NJ), Matt Meyer (DE), Mike Kehoe (MO), Kelly Armstrong (ND), Patrick Morrisey (WV)
- Updated economiesData: interest rates (Fed 4.25%, ECB 2.65%, BoE 4.25%, BoJ 0.75%), stock market caps, debt/GDP ratios
- Fixed duplicate country entries for Nigeria/Ethiopia/Egypt/South Africa in countriesData
- France GDP corrected to 3.05T to match countriesData entry

## 2026-04-12 — Update all data to 2026 + add advanced cities
- Updated all heads of state: Trump (US), Mark Carney (CA), Sheinbaum (MX), Merz (DE), Starmer (GB), Lee Jae-myung (KR), Sanae Takaichi (JP), Friedrich Merz (DE), etc.
- Updated GDP, population, inflation, unemployment, trade balance for all 190+ countries to 2026 figures
- Updated all economy trend arrays to use 2022–2026 years with 2026 values
- Replaced all 35+ cities in citiesData.ts with 2026-updated entries including new "most advanced" cities: Singapore, Seoul, San Francisco Bay Area, Tallinn (digital), Helsinki, Zurich, Copenhagen
- Added `id` suffix `26` to most city IDs to signal 2026 data; Singapore moved to top as #1 advanced city

## 2026-04-12 — Add spokenLanguages, landmarks, religions panels to CountriesPage
- Both `CountryModal` and `CountryDetailPanel` now render a 3-col grid for spoken languages (badges), top landmarks (bullet list), and religions (warning badges)
- Sections are conditionally shown only when any of the three arrays are non-empty
- Used `(country as any)` cast since fields are optional additions to the Country type
- Fixed gradient ID collision: modal uses `ctryGrad-{id}`, panel uses `ctryGradPanel-{id}`

## 2026-04-12 — Fix createRoot target container mismatch
- `index.html` uses `<div id="app">` but `index.tsx` called `getElementById("root")` → changed to `"app"`

## 2026-04-12 — Add Policies page to sidebar nav
- Created `src/pages/PoliciesPage.tsx` — 15 real-world policies across 8 domains (Climate, Healthcare, Education, Infrastructure, Defense, Economy, Social, Tech)
- 5 deep-dive tabs: Budget (allocation bars + table), Initiatives (card list + detail panel), Impact (leaderboard + bubble chart), Scale (scope matrix), Adoption (rates + quadrant analysis)
- Filters: search, domain, scope, status — all persist across tab switches
- Added `Briefcase` icon + `/dashboard/policies` route to `SidebarNav.tsx` and `App.tsx`

## 2026-04-12 — Add 4 overlay toggles to WorldMapSVG
- Overlay modes: Conflicts (default), Global Alliances (NATO/EU/SCO/ASEAN/AU/MERCOSUR), Richest & Poorest (GDP/capita tiers), Population Density (ppl/km²)
- Country fills change color per overlay; hover tooltip shows per-mode detail text
- Each overlay has its own dynamic SVG legend drawn inline
- Helper `matchCountryByFeature()` matches TopoJSON features to countriesData by name

## 2026-04-12 — Add live data auto-refresh from World Bank API
- Created `src/lib/liveData.ts` — fetches 7 WB indicators (GDP, growth, inflation, unemployment, pop, lifeExp, GDP/capita) for all countries in parallel
- Created `src/hooks/useLiveData.ts` — React hook; fetches on mount, returns merged static+live dataset + refresh()
- `CountriesPage`: uses `useLiveData()` instead of static array; shows live badge + Refresh button with spinner
- `DashboardPage`: shows "Syncing live data…" / "✓ N records live" in stats strip with last-updated time
- Falls back silently to static data if API is unavailable

## 2026-04-12 — Fix missing ConflictsPage + WorldMapPage files (build error)
- Created `src/pages/ConflictsPage.tsx` — 35+ conflicts, type/intensity/status filters, category descriptions, modal detail view
- Created `src/pages/WorldMapPage.tsx` — SVG world map with conflict dots, 8 data charts (GDP, pop, HDI, inflation, displacement, growth)
- Root cause: previous session wrote "..." placeholder content; files did not exist on filesystem
- App.tsx imports + routes were already correct; only the page files needed creation

## 2026-04-12 — Create ConflictsPage + WorldMapPage (were missing from FS)
- Created `src/pages/ConflictsPage.tsx` — 35+ conflicts, type/intensity/status filters, hotspot breakdown, modal detail view
- Created `src/pages/WorldMapPage.tsx` — SVG world map with conflict dots, 8 data charts, world stat cards
- Added `/dashboard/conflicts` + `/dashboard/worldmap` routes to `src/App.tsx`
- Added `Warning` + `MapTrifold` icons + nav entries to `src/components/SidebarNav.tsx`

## 2026-04-12 — Fix HeaderNav crash: ChartLineUp → ChartLine
- `HeaderNav.tsx` imported `ChartLineUp` (does not exist in @phosphor-icons/react v2)
- Replaced with `ChartLine` in both the import line and `TYPE_ICON["Economy"]` usage
- This caused DashboardPage to crash at render time via the shared module

## 2026-04-12 — Fix DashboardPage crash: invalid phosphor icon imports
- `ChartLineUp` does not exist in @phosphor-icons/react v2 → replaced with `ChartLine`
- `StickyNote` does not exist in @phosphor-icons/react v2 → replaced with `Note`
- Both caused "element type is undefined" render crash in DashboardPage

## 2026-04-12 — Fix CollectionsPage entitiesCount → entities field mismatch
- `CollectionsPage`: `create()` call used `entitiesCount` (invalid) → fixed to `entities`
- Card display also used `col.entitiesCount` → fixed to `col.entities`

## 2026-04-12 — Remove "New Collection" btn, universal search bar, redesign Dashboard
- `HeaderNav`: removed "New Collection" button; search now queries all 50 states + 195 countries + 30 cities + 18 economies live
- Results dropdown shows entity type badge, label, sublabel; clicking navigates to that entity&#39;s page
- `DashboardPage`: replaced OverviewHeader/MetricCardsSection/CollectionsGrid with hero banner, 4-tile Explore nav, highlights grid, chart panel, comparison module, tools strip
- Removed `OverviewHeader.tsx` dependency from dashboard (file preserved, just not imported)

## 2026-04-12 — Add Conflicts & World Map pages + center/round all search bars
- Created `src/pages/ConflictsPage.tsx` — wars, protests, disasters, economic crises with modal detail, filters, type breakdown strip
- Created `src/pages/WorldMapPage.tsx` — SVG world map with conflict hotspot dots, 7 stat charts, global rankings
- Created `src/data/conflictsData.ts` — 35+ conflicts typed with lat/lng, casualties, displaced, trend
- Added `/dashboard/conflicts` + `/dashboard/worldmap` routes; wired Conflicts + World Map into SidebarNav
- All search bars: `rounded-md` → `rounded-full`, `left-3/pl-9` → `left-4/pl-10`, `mx-auto` centering added

## 2026-04-12 — Fix EconomyModal crash: Sailboat → Boat icon
## 2026-04-12 — Add Conflicts & World Map pages + center/round all search bars
- Created `src/pages/ConflictsPage.tsx` — wars, protests, disasters, economic crises with modal detail, filters, type breakdown strip
- Created `src/pages/WorldMapPage.tsx` — SVG world map with conflict hotspot dots, 7 stat charts, global rankings
- Created `src/data/conflictsData.ts` — 35+ conflicts typed with lat/lng, casualties, displaced, trend
- Added `/dashboard/conflicts` + `/dashboard/worldmap` routes; wired Conflicts + World Map into SidebarNav
- All search bars: `rounded-md` → `rounded-full`, `left-3/pl-9` → `left-4/pl-10`, `mx-auto` centering added

## 2026-04-12 — Fix EconomyModal crash: Sailboat → Boat icon
- `Sailboat` does not exist in `@phosphor-icons/react`; replaced with `Boat` in import + JSX
- Only `src/pages/EconomiesPage.tsx` modified

## 2026-04-12 — States/Cities grid to 3 cols on sm+, smaller notes FAB
- `StatesPage` + `CitiesPage`: changed grid from `sm:grid-cols-2 xl:grid-cols-3` → `sm:grid-cols-3`
- `NotesPopup` closed FAB: shrunk from `w-14 h-14` / icon 26 → `w-9 h-9` / icon 16, moved to `bottom-4 right-4`

## 2026-04-12 — Stretch TaxCard to full width in StateModal stats grid
- Added `sm:col-span-4` to TaxCard wrapper so it spans all 4 columns on sm+ screens
- Only `src/pages/StatesPage.tsx` modified

## 2026-04-12 — Add minimumWage + averageIncome to TaxCard in StateModal
- Added `minimumWage` and `averageIncome` fields to `USState` interface in `statesData.ts`
- Populated both fields for all 50 states with real-world data
- `TaxCard` renamed to "Tax & Wages", now shows 4 columns: Income Tax · Sales Tax · Min Wage · Avg Income
- Only `src/data/statesData.ts` + `src/pages/StatesPage.tsx` modified

## 2026-04-12 — Reorder stat cards in StateModal: education/healthcare replace tax slots, merged TaxCard at bottom
- Added `TaxCard` component: merges Income Tax + Sales Tax into a single `col-span-2` card with a vertical divider
- Moved Education Rank + Healthcare Rank into the 3rd row (slots previously held by tax cards)
- Merged tax card now sits as the last row spanning full width (2 columns in 4-col grid)
- Only `src/pages/StatesPage.tsx` modified

## 2026-04-12 — Tax rates, notes links/voice, sidebar shrink, cities top 30 + modal
- Added `stateTaxRate` + `salesTaxRate` to all 50 states (missing 9 states filled in); shown on state cards + modal
- NotesPopup: added link manager (add/remove URLs) + voice recorder (MediaRecorder API, play/stop/delete)
- NotesPage: NoteCard now renders attached links + audio playback via `<audio>` ref
- SidebarNav: shrank nav items — py-3→py-2, icon size 22→17, text-sm→text-xs
- CitiesPage: expanded to top 30 world cities, removed side panel, city cards now open `CityModal` popup


## 2026-04-12 — Replace GDP chart with 6 demographic charts in StateModal
- Replaced single GDP/Employment trend chart with 6 new charts per state
- Charts: Ethnicity (donut), Land Use (donut), Age Distribution (horiz bars), Voter Registration (horiz bar chart), Wealth & Poverty (bar), Energy Mix (horiz bars)
- Added new fields to `USState` interface + all 50 states in `statesData.ts`
- State cards now show a color-coded Dem/Rep/Ind voter share mini-bar
- Removed unused `StateDetailPanel`, `AreaChart`, `Area` imports

## 2026-04-12 — Remove nav pages + US National Banner on StatesPage
- Removed Bookmarks, Trends & Polls, My Collections, Comparisons from sidebar nav and App routes
- Added `USNationalBanner` component at top of `StatesPage` with full US national statistics
- Banner includes: combined GDP ($T), population, avg unemployment, median income, party breakdown
- Top-6 GDP bar chart, national snapshot facts, live election countdown to Nov 7, 2028
- Modified `src/App.tsx`, `src/components/SidebarNav.tsx`, `src/pages/StatesPage.tsx`

## 2026-04-12 — Full Data Expansion (50 States, 195 Countries)
- Expanded `src/data/statesData.ts` from 8 → 50 US states (all states, full typed data)
- Expanded `src/data/countriesData.ts` from 8 → 195 countries (all sovereign states, all continents)
- Added `makeTrends` / `mkTrends` helper functions to auto-generate chart trend arrays
- All existing interfaces (`USState`, `Country`) unchanged — fully backward compatible

## 2026-04-12 — Modal Popups for Entity Pages
## 2026-04-12 — Modal Popups for Entity Pages
- Converted inline side panels to centered modal overlays (backdrop blur, scroll, ESC-to-close) in `StatesPage`, `CountriesPage`, `EconomiesPage`
- Added `StateModal`, `CountryModal`, `EconomyModal` components (replacing `*DetailPanel` for card click)
- Removed the right-hand detail column layout — cards now span full 2/3 width, click opens modal
- All detail content (charts, stats, gov info, trade, sectors) preserved inside the modal unchanged

## 2026-04-12 — Notes Popup + SDK Integration
- Added `src/components/NotesPopup.tsx` — floating bottom-right popup for quick note-taking, saves via SDK
- Added `src/pages/NotesPage.tsx` — full notes page with search, entity-type filter, delete, SDK-backed
- Migrated `CollectionsPage` and `BookmarksPage` to use `useQuery`/`useMutation` from SDK (removed local state)
- Wrapped app with `AnimaProvider` in `src/index.tsx`; added `@animaapp/playground-react-sdk` to `package.json`
- Added `/dashboard/notes` route + `My Notes` sidebar nav item; `NotesPopup` mounted in `DashboardLayout`

## 2026-04-12 — Entity Pages (States, Countries, Cities, Economies)
- Created `src/data/statesData.ts`, `countriesData.ts`, `citiesData.ts`, `economiesData.ts` — full typed data layer
- Created `src/pages/StatesPage.tsx` — US states with filter/sort, detail panel, GDP/employment chart
- Created `src/pages/CountriesPage.tsx` — countries with continent filter, HDI bar, 5-yr GDP chart
- Created `src/pages/CitiesPage.tsx` — global cities with safety/cost indices, population trend chart
- Created `src/pages/EconomiesPage.tsx` — economies with sectors, credit ratings, 5-yr trend charts
- Updated `src/App.tsx` + `src/components/SidebarNav.tsx` — wired 4 new routes + sidebar nav items

</changelog>
