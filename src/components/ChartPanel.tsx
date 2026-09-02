import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { ChartLine, ChartBar,} from "@phosphor-icons/react";

const generateData = (_metric: string, timeRange: string) => {
  const points: Record<string, number> = {
    "1M": 4,
    "3M": 6,
    "6M": 8,
    "1Y": 12,
    "3Y": 12,
    "5Y": 10,
  };
  const n = points[timeRange] ?? 12;
  const labels = Array.from({ length: n }, (_, i) => {
    const d = new Date(2024, i, 1);
    return d.toLocaleString("default", { month: "short" });
  });
  return labels.map((month, i) => ({
    month,
    primary: Math.round(60 + Math.sin(i * 0.7) * 20 + i * 2),
    secondary: Math.round(45 + Math.cos(i * 0.5) * 15 + i * 1.5),
  }));
};

interface ChartPanelProps {
  entityType: string;
  timeRange: string;
  metric: string;
}

export function ChartPanel({ entityType, timeRange, metric }: ChartPanelProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const data = generateData(metric, timeRange);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 text-sm font-mono">
          <p className="text-foreground font-semibold mb-1">{label}</p>
          {payload.map((entry: any) => (
            <p
              key={entry.name}
              style={{ color: entry.color }}
              className="text-xs"
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section
      aria-labelledby="chart-heading"
      className="bg-card border border-border rounded-lg p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2
            id="chart-heading"
            className="text-lg font-semibold font-sans text-foreground"
          >
            {metric} Trends — {entityType}
          </h2>
          <p className="text-muted-foreground text-xs font-sans mt-0.5">
            Time range: {timeRange}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType("area")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-normal transition-colors duration-150 cursor-pointer ${
              chartType === "area"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            aria-label="Area chart view"
            aria-pressed={chartType === "area"}
          >
            <ChartLine size={18} weight="bold" />
            <span>Area</span>
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-normal transition-colors duration-150 cursor-pointer ${
              chartType === "bar"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            aria-label="Bar chart view"
            aria-pressed={chartType === "bar"}
          >
            <ChartBar size={18} weight="bold" />
            <span>Bar</span>
          </button>
        </div>
      </div>

      <div
        className="w-full h-72 animate-fade-in"
        aria-label={`${metric} chart visualization`}
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(200, 85%, 50%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(200, 85%, 50%)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(190, 75%, 45%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(190, 75%, 45%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(222, 30%, 25%)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{
                  fill: "hsl(0, 0%, 60%)",
                  fontSize: 11,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: "hsl(0, 0%, 60%)",
                  fontSize: 11,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  color: "hsl(0, 0%, 70%)",
                  fontFamily: "IBM Plex Mono",
                }}
              />
              <Area
                type="monotone"
                dataKey="primary"
                name="Primary"
                stroke="hsl(200, 85%, 50%)"
                strokeWidth={2}
                fill="url(#colorPrimary)"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(200, 85%, 50%)" }}
                isAnimationActive
                animationDuration={600}
              />
              <Area
                type="monotone"
                dataKey="secondary"
                name="Secondary"
                stroke="hsl(190, 75%, 45%)"
                strokeWidth={2}
                fill="url(#colorSecondary)"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(190, 75%, 45%)" }}
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(222, 30%, 25%)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{
                  fill: "hsl(0, 0%, 60%)",
                  fontSize: 11,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fill: "hsl(0, 0%, 60%)",
                  fontSize: 11,
                  fontFamily: "IBM Plex Mono",
                }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  color: "hsl(0, 0%, 70%)",
                  fontFamily: "IBM Plex Mono",
                }}
              />
              <Bar
                dataKey="primary"
                name="Primary"
                fill="hsl(200, 85%, 50%)"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={600}
              />
              <Bar
                dataKey="secondary"
                name="Secondary"
                fill="hsl(190, 75%, 45%)"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={800}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
