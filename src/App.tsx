import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import { NotesProvider } from "./contexts/NotesContext";

/* ─── Eager (small / always needed) ────────────────────────── */
import { DashboardPage } from "./pages/DashboardPage";
import { SettingsPage } from "./pages/SettingsPage";

/* ─── Lazy (large or rarely-visited on first load) ─────────── */
const StatesPage = lazy(() =>
  import("./pages/StatesPage").then((m) => ({ default: m.StatesPage })),
);
const CountriesPage = lazy(() =>
  import("./pages/CountriesPage").then((m) => ({ default: m.CountriesPage })),
);
const CitiesPage = lazy(() =>
  import("./pages/CitiesPage").then((m) => ({ default: m.CitiesPage })),
);
const EconomiesPage = lazy(() =>
  import("./pages/EconomiesPage").then((m) => ({ default: m.EconomiesPage })),
);
const NotesPage = lazy(() =>
  import("./pages/NotesPage").then((m) => ({ default: m.NotesPage })),
);
const ComparisonsPage = lazy(() =>
  import("./pages/ComparisonsPage").then((m) => ({
    default: m.ComparisonsPage,
  })),
);
const MembershipsPage = lazy(() =>
  import("./pages/MembershipsPage").then((m) => ({
    default: m.MembershipsPage,
  })),
);
const EduSignInPage = lazy(() =>
  import("./pages/EduSignInPage").then((m) => ({ default: m.EduSignInPage })),
);
const PolicyPage = lazy(() =>
  import("./pages/PolicyPage").then((m) => ({ default: m.PolicyPage })),
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const PlanetaryBoundariesPage = lazy(() =>
  import("./pages/PlanetaryBoundariesPage").then((m) => ({
    default: m.PlanetaryBoundariesPage,
  })),
);
const CrimeStatsPage = lazy(() =>
  import("./pages/CrimeStatsPage").then((m) => ({ default: m.CrimeStatsPage })),
);
const HumanitarianPage = lazy(() =>
  import("./pages/HumanitarianPage").then((m) => ({
    default: m.HumanitarianPage,
  })),
);
const RankingsPage = lazy(() =>
  import("./pages/RankingsPage").then((m) => ({ default: m.RankingsPage })),
);
const GlobalIndexesPage = lazy(() =>
  import("./pages/GlobalIndexesPage").then((m) => ({
    default: m.GlobalIndexesPage,
  })),
);
// WorldMapPage fetches a 3MB TopoJSON file — keep lazy to avoid stalling the bundler
const WorldMapPage = lazy(() =>
  import("./pages/WorldMapPage").then((m) => ({ default: m.WorldMapPage })),
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm font-sans">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NotesProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/membership" element={<MembershipsPage />} />
            <Route path="/edu" element={<EduSignInPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="states" element={<StatesPage />} />
              <Route path="countries" element={<CountriesPage />} />
              <Route path="cities" element={<CitiesPage />} />
              <Route path="economies" element={<EconomiesPage />} />
              <Route path="policy" element={<PolicyPage />} />
              <Route path="worldmap" element={<WorldMapPage />} />
              <Route path="comparisons" element={<ComparisonsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route
                path="planetary-boundaries"
                element={<PlanetaryBoundariesPage />}
              />
              <Route path="crime" element={<CrimeStatsPage />} />
              <Route path="humanitarian" element={<HumanitarianPage />} />
              <Route path="rankings" element={<RankingsPage />} />
              <Route path="indexes" element={<GlobalIndexesPage />} />
              {/* Catch-all: redirect unknown dashboard routes to /dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </NotesProvider>
    </BrowserRouter>
  );
}
