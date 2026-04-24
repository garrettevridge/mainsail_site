import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Multi-series line chart. Each series is a named key on the data rows.
// Series with null values render a gap (connectNulls disabled).

type ChartDatum = { [key: string]: string | number | null | undefined };

interface MultiLineTrendProps {
  data: ReadonlyArray<ChartDatum>;
  xKey: string;
  seriesKeys: string[];
  colors?: string[];
  dashed?: string[]; // series names that should render as dashed
  title?: string;
  yLabel?: string;
  xLabel?: string;
  unitSuffix?: string;
}

const DEFAULT_COLORS = ["#1a2332", "#6b8fad", "#b45309", "#2f5d8a", "#7b6a4f"];

export default function MultiLineTrend({
  data,
  xKey,
  seriesKeys,
  colors = DEFAULT_COLORS,
  dashed = [],
  title,
  yLabel,
  xLabel,
  unitSuffix = "",
}: MultiLineTrendProps) {
  return (
    <div className="chart-frame">
      {title && <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={[...data]} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "#1a2332", fontSize: 12 }}
            label={
              xLabel
                ? { value: xLabel, position: "insideBottom", fill: "#6b7280", offset: -2 }
                : undefined
            }
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
            }
            label={
              yLabel
                ? { value: yLabel, angle: -90, position: "insideLeft", fill: "#6b7280" }
                : undefined
            }
          />
          <Tooltip
            formatter={(v) =>
              typeof v === "number"
                ? `${v.toLocaleString()}${unitSuffix ? " " + unitSuffix : ""}`
                : v == null
                ? "no data"
                : String(v)
            }
            labelStyle={{ color: "#1a2332" }}
          />
          <Legend />
          {seriesKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              strokeDasharray={dashed.includes(key) ? "5 4" : undefined}
              dot={{ r: 2 }}
              name={key}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
