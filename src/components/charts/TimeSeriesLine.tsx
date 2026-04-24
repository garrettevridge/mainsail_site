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

// Single-line time series with numeric x-axis.
// Use for long-horizon trend charts (e.g., halibut spawning biomass).

type ChartDatum = { [key: string]: string | number | null | undefined };

interface TimeSeriesLineProps {
  data: ReadonlyArray<ChartDatum>;
  xKey: string;
  yKey: string;
  title?: string;
  yLabel?: string;
  lineName?: string;
  unitSuffix?: string;
}

export default function TimeSeriesLine({
  data,
  xKey,
  yKey,
  title,
  yLabel,
  lineName = "value",
  unitSuffix = "",
}: TimeSeriesLineProps) {
  return (
    <div className="chart-frame">
      {title && <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={[...data]} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis dataKey={xKey} tick={{ fill: "#1a2332", fontSize: 12 }} />
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
          <Line
            type="monotone"
            dataKey={yKey}
            stroke="#1a2332"
            strokeWidth={2}
            dot={{ r: 2, fill: "#1a2332" }}
            name={lineName}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
