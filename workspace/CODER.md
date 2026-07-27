<instructions>
This file will be automatically added to your context. 
It serves multiple purposes:
  1. Storing frequently used tools so you can use them without searching each time
  2. Recording the user's code style preferences (naming conventions, preferred libraries, etc.)
  3. Maintaining useful information about the codebase structure and organization
  4. Remembering tricky quirks from this codebase

When you spend time searching for certain configuration files, tricky code coupled dependencies, or other codebase information, add that to this CODER.md file so you can remember it for next time.
Keep entries sorted in DESC order (newest first) so recent knowledge stays in prompt context if the file is truncated.
</instructions>

<coder>

## SDK & Auth (as of 2026-04-12)
- **SDK**: `@animaapp/playground-react-sdk` v0.10.0 — import `useQuery`, `useMutation`, `useLazyQuery`, `useAuth`
- **AnimaProvider**: wraps app in `src/index.tsx`
- **Entities**: `Note`, `Collection`, `Bookmark` — all backed by SDK hooks, no local state stores

## Project Structure (as of 2026-04-12)
- **Framework**: React + TypeScript + Vite + Tailwind CSS
- **Router**: React Router v6 — all routes nested under `/dashboard` via `DashboardLayout` outlet
- **Icons**: `@phosphor-icons/react` — always import named icons, use `weight="fill"` for active/accent states
- **Charts**: `recharts` — `AreaChart`, `BarChart`, `LineChart` all work; use inline `<defs>/<linearGradient>` in JSX (NOT imported from recharts)
- **Fonts**: DM Sans (sans), IBM Plex Mono (mono) — loaded via Google Fonts in `index.css`
- **Color tokens**: all defined in `tailwind.config.js` — use `bg-secondary`, `text-success`, `text-destructive`, `bg-card`, `border-border`, etc.

## Data Layer
- `src/data/statesData.ts` — 8 US states, typed `USState`
- `src/data/countriesData.ts` — 8 countries, typed `Country`
- `src/data/citiesData.ts` — 8 global cities, typed `City`
- `src/data/economiesData.ts` — 6 economies (Country | Region | Bloc), typed `Economy`

## Route Map
| Path | Component |
|------|-----------|
| /dashboard | DashboardPage |
| /dashboard/states | StatesPage |
| /dashboard/countries | CountriesPage |
| /dashboard/cities | CitiesPage |
| /dashboard/economies | EconomiesPage |
| /dashboard/notes | NotesPage |
| /dashboard/settings | SettingsPage |

## Key Patterns
- Entity pages follow: PageHeader → SummaryStrip (4 cards) → Filters (search + pill buttons + sort select) → 2/3 grid (cards | detail panel)
- Detail panels use `animate-fade-in` and are shown inline (not modal)
- Each recharts gradient `id` must be unique — use `${entity.id}` suffix to avoid collisions across multiple rendered panels

</coder>
