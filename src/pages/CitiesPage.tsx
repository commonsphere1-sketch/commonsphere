import React, { useState, useEffect } from "react";
import {
  Buildings,
  MagnifyingGlass,
  MapPin,
  X,
  ListBullets,
  MapTrifold,
  Images,
  ArrowLeft,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { citiesData, type City } from "../data/citiesData";

const regionColors: Record<string, string> = {
  "North America": "text-secondary border-secondary bg-secondary/10",
  "Western Europe": "text-purple-400 border-purple-500/40 bg-purple-500/10",
  "East Asia": "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  "Southeast Asia": "text-green-400 border-green-500/40 bg-green-500/10",
  "Middle East": "text-orange-400 border-orange-500/40 bg-orange-500/10",
  "Central Europe": "text-pink-400 border-pink-500/40 bg-pink-500/10",
  Oceania: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  "South Asia": "text-red-400 border-red-500/40 bg-red-500/10",
  "South America": "text-lime-400 border-lime-500/40 bg-lime-500/10",
  "Eastern Europe": "text-indigo-400 border-indigo-500/40 bg-indigo-500/10",
  "Northern Europe": "text-teal-400 border-teal-500/40 bg-teal-500/10",
  Africa: "text-amber-400 border-amber-500/40 bg-amber-500/10",
};

function IndexBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground font-sans">{label}</span>
        <span className={`font-mono ${color}`}>{value}</span>
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color.replace("text-", "bg-")}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

const CITY_PHOTOS: Record<string, string[]> = {
  "new-york": [
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
    "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=600&q=80",
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80",
    "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&q=80",
    "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=600&q=80",
    "https://images.unsplash.com/photo-1543716091-a840c05249ec?w=600&q=80",
  ],
  tokyo: [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    "https://images.unsplash.com/photo-1570521462033-3015e76e7432?w=600&q=80",
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80",
    "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&q=80",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80",
  ],
  london: [
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80",
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80",
    "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&q=80",
    "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=600&q=80",
    "https://images.unsplash.com/photo-1426684700239-c7b548f2cd99?w=600&q=80",
    "https://images.unsplash.com/photo-1543536448-1e76fc2795bf?w=600&q=80",
  ],
  paris: [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80",
    "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&q=80",
    "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=600&q=80",
    "https://images.unsplash.com/photo-1515266591878-f93e32bc5937?w=600&q=80",
    "https://images.unsplash.com/photo-1508050919630-b135583b29ab?w=600&q=80",
  ],
  dubai: [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80",
    "https://images.unsplash.com/photo-1547451742-56f0c1c63b33?w=600&q=80",
    "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&q=80",
  ],
  singapore: [
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80",
    "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80",
    "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=600&q=80",
    "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80",
    "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=600&q=80",
    "https://images.unsplash.com/photo-1555217851-6141535bd771?w=600&q=80",
  ],
  sydney: [
    "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80",
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    "https://images.unsplash.com/photo-1524293568345-75d62c3664f7?w=600&q=80",
    "https://images.unsplash.com/photo-1546268060-2592ff93ee24?w=600&q=80",
    "https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&q=80",
  ],
  berlin: [
    "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&q=80",
    "https://images.unsplash.com/photo-1582719202047-76d3432ee323?w=600&q=80",
    "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=600&q=80",
    "https://images.unsplash.com/photo-1566404791232-af9fe3ae2188?w=600&q=80",
    "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=600&q=80",
    "https://images.unsplash.com/photo-1549893072-4bc678117f45?w=600&q=80",
  ],
};

const REGION_CITY_PHOTOS: Record<string, string[]> = {
  "North America": [
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80",
    "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&q=80",
    "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=600&q=80",
  ],
  "Western Europe": [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80",
    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80",
    "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80",
    "https://images.unsplash.com/photo-1555992457-b8fefdd09069?w=600&q=80",
  ],
  "East Asia": [
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    "https://images.unsplash.com/photo-1570521462033-3015e76e7432?w=600&q=80",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80",
    "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=600&q=80",
    "https://images.unsplash.com/photo-1549092979-765a26b0ac7a?w=600&q=80",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80",
  ],
  "Southeast Asia": [
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80",
    "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=600&q=80",
    "https://images.unsplash.com/photo-1555217851-6141535bd771?w=600&q=80",
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80",
    "https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600&q=80",
    "https://images.unsplash.com/photo-1519625150589-7d6aaafe33a0?w=600&q=80",
  ],
  "Middle East": [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80",
    "https://images.unsplash.com/photo-1547451742-56f0c1c63b33?w=600&q=80",
    "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80",
    "https://images.unsplash.com/photo-1538766017398-415434a31a5b?w=600&q=80",
  ],
  Oceania: [
    "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80",
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    "https://images.unsplash.com/photo-1524293568345-75d62c3664f7?w=600&q=80",
    "https://images.unsplash.com/photo-1546268060-2592ff93ee24?w=600&q=80",
    "https://images.unsplash.com/photo-1589330979470-3595ac045ab0?w=600&q=80",
  ],
};

function getCityPhotos(city: City): string[] {
  return (
    CITY_PHOTOS[city.id] ??
    REGION_CITY_PHOTOS[city.region] ??
    REGION_CITY_PHOTOS["North America"]
  );
}

function CityPhotosGrid({ city }: { city: City }) {
  const photos = getCityPhotos(city);
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div>
      {/* Flag header strip */}
      <div className="relative rounded-xl overflow-hidden mb-4 h-20 flex items-center px-5 gap-4">
        <img
          src={`https://flagcdn.com/w320/${city.countryCode?.toLowerCase() ?? "un"}.png`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-card/60 to-card/40" />
        <img
          src={`https://flagcdn.com/w80/${city.countryCode?.toLowerCase() ?? "un"}.png`}
          alt={`${city.country} flag`}
          className="relative w-12 h-8 object-cover rounded shadow-md border border-white/20 shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="relative">
          <p className="font-bold text-foreground font-sans text-sm leading-tight">
            {city.name}
          </p>
          <p className="text-xs text-muted-foreground font-sans">
            {city.country} · {city.region}
          </p>
        </div>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((src, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <img
              src={src}
              alt={`${city.name} photo ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox - 1 + photos.length) % photos.length);
            }}
            className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <img
            src={photos[lightbox]}
            alt={`${city.name} photo ${lightbox + 1}`}
            className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lightbox + 1) % photos.length);
            }}
            className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft size={20} weight="bold" className="rotate-180" />
          </button>
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
          <div className="absolute bottom-4 text-white/60 text-xs font-mono">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}

function CityModal({ city, onClose }: { city: City; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "map" | "photos">(
    "overview",
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const regionColor =
    regionColors[city.region] ?? "text-muted-foreground border-border bg-muted";
  const regionBg =
    regionColor.split(" ").find((c) => c.startsWith("bg-")) ?? "bg-muted";
  const regionText =
    regionColor.split(" ").find((c) => c.startsWith("text-")) ??
    "text-muted-foreground";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 text-xs font-mono shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((e: any) => (
            <p key={e.name} style={{ color: e.color }}>
              {e.name}:{" "}
              {typeof e.value === "number" && e.value > 100000
                ? `${(e.value / 1e6).toFixed(2)}M`
                : e.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in modal-glass border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold font-sans text-foreground">
                {city.name}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-sans">
                  <MapPin size={12} /> {city.country}
                </span>
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-sans ${regionColors[city.region] ?? "text-muted-foreground border-border bg-muted"}`}
                >
                  {city.region}
                </span>
                <span className="text-xs text-muted-foreground font-sans">
                  Tourism #{city.tourismRankGlobal} globally
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 mb-5">
            {(
              [
                {
                  key: "overview",
                  label: "Overview",
                  icon: <ListBullets size={14} />,
                },
                { key: "map", label: "Map", icon: <MapTrifold size={14} /> },
                { key: "photos", label: "Photos", icon: <Images size={14} /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "City Population",
                    value: `${(city.population / 1e6).toFixed(1)}M`,
                  },
                  {
                    label: "Metro Area",
                    value: `${(city.metroPopulation / 1e6).toFixed(1)}M`,
                  },
                  { label: "GDP", value: `$${city.gdpBillions}B` },
                  {
                    label: "GDP Per Capita",
                    value: `$${city.gdpPerCapita.toLocaleString()}`,
                  },
                  {
                    label: "Area",
                    value: `${city.areaKm2.toLocaleString()} km²`,
                  },
                  {
                    label: "Density",
                    value: `${city.populationDensity.toLocaleString()}/km²`,
                  },
                  { label: "Avg Temp", value: `${city.avgTemperatureC}°C` },
                  { label: "Fortune HQs", value: `${city.fortuneHQs}` },
                  { label: "Universities", value: `${city.universities}` },
                ].map((s) => (
                  <div key={s.label} className="modal-tile rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-sans">
                      {s.label}
                    </p>
                    <p className="text-base font-bold font-mono text-foreground">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* City Indices */}
              <div className="modal-tile rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-2">
                  City Indices
                </h3>
                <IndexBar
                  label="Cost of Living Index"
                  value={city.costOfLivingIndex}
                  color="text-warning"
                />
                <IndexBar
                  label="Crime Index"
                  value={city.crimeIndex}
                  color="text-destructive"
                />
                <IndexBar
                  label="Safety Index"
                  value={city.safetyIndex}
                  color="text-success"
                />
                <IndexBar
                  label="Air Quality Index (AQI)"
                  value={city.airQualityIndex}
                  color="text-secondary"
                />
              </div>

              {/* Languages, Landmarks, Religions */}
              {(city.languages?.length ||
                city.landmarks?.length ||
                city.religions?.length) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {city.languages?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                        Languages Spoken
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {city.languages.map((l) => (
                          <span
                            key={l}
                            className="text-xs bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded-full font-sans"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {city.landmarks?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                        Top Landmarks
                      </p>
                      <ul className="space-y-1">
                        {city.landmarks.map((lm) => (
                          <li
                            key={lm}
                            className="text-xs text-foreground font-sans flex items-start gap-1.5"
                          >
                            <span className="text-secondary mt-0.5">•</span>
                            {lm}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {city.religions?.length ? (
                    <div className="modal-tile rounded-lg p-4">
                      <p className="text-xs text-muted-foreground font-sans mb-2 font-semibold uppercase tracking-wide">
                        Religions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {city.religions.map((r) => (
                          <span
                            key={r}
                            className="text-xs bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 rounded-full font-sans"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Population Trend */}
              <div className="modal-tile rounded-lg p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">
                  Population Trend
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={city.trends}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id={`cityModalGrad-${city.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(200,85%,50%)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(200,85%,50%)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(222,30%,25%)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        tick={{
                          fill: "hsl(0,0%,60%)",
                          fontSize: 10,
                          fontFamily: "IBM Plex Mono",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(0,0%,60%)",
                          fontSize: 10,
                          fontFamily: "IBM Plex Mono",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={52}
                        tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="population"
                        name="Population"
                        stroke="hsl(200,85%,50%)"
                        strokeWidth={2}
                        fill={`url(#cityModalGrad-${city.id})`}
                        dot={false}
                        isAnimationActive
                        animationDuration={600}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Map Tab */}
          {activeTab === "map" && (
            <div className="space-y-4">
              {/* Region color info strip */}
              <div
                className={`rounded-xl p-4 flex items-center gap-4 border ${regionBg} border-current/20`}
              >
                <div>
                  <p
                    className={`text-xs font-semibold font-sans uppercase tracking-wide ${regionText}`}
                  >
                    {city.region}
                  </p>
                  <p className="text-foreground font-bold font-sans text-lg leading-tight">
                    {city.name}
                  </p>
                  <p className="text-muted-foreground text-xs font-sans">
                    {city.country}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground font-sans">
                    Population
                  </p>
                  <p className={`font-mono font-bold text-sm ${regionText}`}>
                    {(city.population / 1e6).toFixed(1)}M city
                  </p>
                  <p className={`font-mono text-xs ${regionText} opacity-80`}>
                    {(city.metroPopulation / 1e6).toFixed(1)}M metro
                  </p>
                </div>
              </div>

              {/* Google Maps embed */}
              <div
                className="rounded-xl overflow-hidden border border-border"
                style={{ height: 320 }}
              >
                <iframe
                  title={`Map of ${city.name}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(city.name + ", " + city.country)}&z=11&output=embed`}
                />
              </div>

              {/* Location facts grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Area",
                    value: `${city.areaKm2.toLocaleString()} km²`,
                  },
                  {
                    label: "Pop. Density",
                    value: `${city.populationDensity.toLocaleString()}/km²`,
                  },
                  { label: "Avg Temp", value: `${city.avgTemperatureC}°C` },
                  {
                    label: "Tourism Rank",
                    value: `#${city.tourismRankGlobal} global`,
                  },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="modal-tile rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground font-sans">
                      {f.label}
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground mt-0.5">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === "photos" && <CityPhotosGrid city={city} />}
        </div>
      </div>
    </div>
  );
}

export function CitiesPage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [sortBy, setSortBy] = useState<
    "gdpBillions" | "population" | "safetyIndex" | "costOfLivingIndex"
  >("gdpBillions");
  const [modalCity, setModalCity] = useState<City | null>(null);

  const allRegions = [
    "All",
    ...Array.from(new Set(citiesData.map((c) => c.region))).sort(),
  ];

  const filtered = citiesData
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase());
      const matchRegion = regionFilter === "All" || c.region === regionFilter;
      return matchSearch && matchRegion;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="px-6 py-8 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-secondary/20 rounded-lg">
            <Buildings size={26} weight="fill" className="text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-sans text-foreground">
              Global Cities
            </h1>
            <p className="text-muted-foreground text-sm font-sans">
              {citiesData.length} world cities — urban demographics, cost of
              living, safety &amp; economic data
            </p>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Cities Tracked",
              value: `${citiesData.length} Cities`,
              color: "text-secondary",
            },
            {
              label: "Largest Metro",
              value: "Tokyo 37M",
              color: "text-warning",
            },
            {
              label: "Safest City",
              value: "Dubai (83)",
              color: "text-success",
            },
            {
              label: "Highest GDP",
              value: "NYC $1.77T",
              color: "text-secondary",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs text-muted-foreground font-sans">
                {s.label}
              </p>
              <p className={`text-base font-bold font-mono ${s.color}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Unified Search + Filter Bar */}
        <div className="flex flex-col bg-card border border-border/60 rounded-2xl px-4 py-2.5 mb-5 w-full">
          {/* Row 1: Search */}
          <div className="flex items-center gap-2">
            <MagnifyingGlass
              size={16}
              className="text-muted-foreground shrink-0"
            />
            <input
              type="text"
              placeholder="Search cities or countries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
            />
          </div>
          {/* Row 2: Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-border/60">
            {allRegions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium font-sans border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  regionFilter === r
                    ? "bg-secondary/20 text-secondary border-secondary/40"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {r}
              </button>
            ))}
            <div className="w-px h-4 bg-border shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-medium text-muted-foreground font-sans focus:outline-none cursor-pointer shrink-0"
            >
              <option value="gdpBillions">Sort: GDP</option>
              <option value="population">Sort: Population</option>
              <option value="safetyIndex">Sort: Safety</option>
              <option value="costOfLivingIndex">Sort: Cost of Living</option>
            </select>
          </div>
        </div>

        {modalCity && (
          <CityModal city={modalCity} onClose={() => setModalCity(null)} />
        )}

        {/* City Cards — 3 per row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 auto-rows-fr">
          {filtered.map((city) => (
            <article
              key={city.id}
              onClick={() => setModalCity(city)}
              className="modal-tile rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-secondary/40 flex flex-col h-full"
            >
              {/* Card header with country flag background */}
              <div className="relative flex items-start justify-between mb-3 -mx-5 -mt-5 px-5 pt-5 pb-4 rounded-t-xl overflow-hidden">
                {/* Flag background */}
                <img
                  src={`https://flagcdn.com/w320/${city.countryCode?.toLowerCase() ?? "un"}.png`}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105 select-none pointer-events-none"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-card/60 via-card/70 to-card pointer-events-none" />
                {/* Content */}
                <div className="relative flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-md">
                    <img
                      src={`https://flagcdn.com/w80/${city.countryCode?.toLowerCase() ?? "un"}.png`}
                      alt={`${city.country} flag`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.onerror = null;
                        t.style.display = "none";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold font-sans text-foreground text-sm">
                      {city.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {city.country}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    City Pop.
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {(city.population / 1e6).toFixed(1)}M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">GDP</p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    ${city.gdpBillions}B
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Cost of Living
                  </p>
                  <p className="text-sm font-bold font-mono text-foreground">
                    {city.costOfLivingIndex}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Safety Index
                  </p>
                  <p
                    className={`text-sm font-bold font-mono ${city.safetyIndex >= 60 ? "text-success" : city.safetyIndex >= 40 ? "text-warning" : "text-destructive"}`}
                  >
                    {city.safetyIndex}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-sans">
                    Safety Score
                  </span>
                  <span className="font-mono text-foreground">
                    {city.safetyIndex}/100
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${city.safetyIndex >= 60 ? "bg-success" : city.safetyIndex >= 40 ? "bg-warning" : "bg-destructive"}`}
                    style={{ width: `${city.safetyIndex}%` }}
                  />
                </div>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground font-sans text-sm">
                No cities match your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
