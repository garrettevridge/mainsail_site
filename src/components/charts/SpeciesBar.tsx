import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Horizontal bar chart for species × metric tons (or similar scalar).
// One chart type per component — use for ecosystem/TAC breakdowns.

interface SpeciesBarProps {
  data: { species: string; value: number }[];
  title?: string;
  unitLabel?: string;
  color?: string;
}

export default function SpeciesBar({
  data,
  title,
  unitLabel = "mt",
  color = "#2f5d8a",
}: SpeciesBarProps) {
  const height = Math.max(300, data.length * 28);

  return (
    <div className="chart-frame">
      {title && (
        <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 160, right: 50, top: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1_000
                ? `${(v / 1_000).toFixed(0)}k`
                : String(v)
            }
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="species"
            width={150}
            tick={{ fill: "#1a2332", fontSize: 12 }}
          />
          <Tooltip
            formatter={(v) =>
              typeof v === "number"
                ? `${v.toLocaleString("en-US")} ${unitLabel}`
                : String(v)
            }
            labelStyle={{ color: "#1a2332" }}
          />
          <Bar dataKey="value" fill={color} name={unitLabel} radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
