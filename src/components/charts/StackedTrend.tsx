import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Generic stacked-bar-by-year component for mortality/PSC/etc. trend charts.

interface StackedTrendProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  stackKeys: string[]; // each becomes one stacked series
  colors?: string[];
  title?: string;
  yLabel?: string;
  yFormatter?: (v: number) => string;
}

const DEFAULT_COLORS = ["#2f5d8a", "#6b8fad", "#b45309", "#7b6a4f", "#a8a29e", "#4b5563"];

export default function StackedTrend({
  data,
  xKey,
  stackKeys,
  colors = DEFAULT_COLORS,
  title,
  yLabel,
  yFormatter,
}: StackedTrendProps) {
  const fmt = yFormatter ?? ((v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v.toLocaleString());

  return (
    <div className="chart-frame">
      {title && <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis dataKey={xKey} tick={{ fill: "#1a2332", fontSize: 12 }} />
          <YAxis
            tickFormatter={fmt}
            tick={{ fill: "#6b7280", fontSize: 12 }}
            label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fill: "#6b7280" } : undefined}
          />
          <Tooltip
            formatter={(v) => (typeof v === "number" ? fmt(v) : String(v))}
            labelStyle={{ color: "#1a2332" }}
          />
          <Legend />
          {stackKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={colors[i % colors.length]}
              name={key}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
