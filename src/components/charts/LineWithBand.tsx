import {
  ComposedChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Line chart with an optional shaded goal band.
// Used for escapement-vs-goal charts (V-A3) and similar.

interface LineWithBandProps {
  data: Array<{
    year: number;
    value: number | null;
    goalLower?: number | null;
    goalUpper?: number | null;
  }>;
  title?: string;
  yLabel?: string;
  lineName?: string;
  bandName?: string;
}

export default function LineWithBand({
  data,
  title,
  yLabel = "fish",
  lineName = "Escapement",
  bandName = "Goal range",
}: LineWithBandProps) {
  return (
    <div className="chart-frame">
      {title && <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis dataKey="year" tick={{ fill: "#1a2332", fontSize: 12 }} />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
            }
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#6b7280" }}
          />
          <Tooltip
            formatter={(v) =>
              typeof v === "number" ? v.toLocaleString() : v == null ? "no data" : String(v)
            }
            labelStyle={{ color: "#1a2332" }}
          />
          <Legend />
          {/* Goal band rendered as a translucent area between lower/upper */}
          <Area
            type="monotone"
            dataKey="goalUpper"
            stroke="transparent"
            fill="#6b8fad"
            fillOpacity={0.12}
            name={bandName}
            legendType="rect"
          />
          <Area
            type="monotone"
            dataKey="goalLower"
            stroke="transparent"
            fill="#fafaf7"
            fillOpacity={1}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1a2332"
            strokeWidth={2}
            dot={{ r: 3, fill: "#1a2332" }}
            name={lineName}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
