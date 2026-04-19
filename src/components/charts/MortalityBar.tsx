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

interface MortalityBarProps {
  data: { source: string; fish: number }[];
  title?: string;
}

const CHART_COLOR = "#2f5d8a";

export default function MortalityBar({ data, title }: MortalityBarProps) {
  return (
    <div className="chart-frame">
      {title && <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} layout="vertical" margin={{ left: 80, right: 30, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis
            type="number"
            tickFormatter={(v) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v.toLocaleString()
            }
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis type="category" dataKey="source" tick={{ fill: "#1a2332", fontSize: 13 }} width={70} />
          <Tooltip
            formatter={(v) => (typeof v === "number" ? v.toLocaleString() + " fish" : String(v))}
            labelStyle={{ color: "#1a2332" }}
          />
          <Legend />
          <Bar dataKey="fish" fill={CHART_COLOR} name="Fish count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
