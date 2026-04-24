import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Horizontal bar chart of per-fishery utilization (catch as % of TAC).
// X-axis fixed 0-100% so every bar is directly comparable.

interface UtilizationBarProps {
  data: Array<{
    target_fishery: string;
    utilization_pct: number;
    catch_mt?: number | null;
    tac_mt?: number | null;
  }>;
  title?: string;
}

const BAR_COLOR = "#2f5d8a";

export default function UtilizationBar({ data, title }: UtilizationBarProps) {
  const height = Math.max(280, data.length * 34);
  return (
    <div className="chart-frame">
      {title && <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 120, right: 30, top: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="target_fishery"
            tick={{ fill: "#1a2332", fontSize: 12 }}
            width={110}
          />
          <Tooltip
            formatter={(v, _name, p) => {
              if (typeof v !== "number") return String(v);
              const row = p.payload as UtilizationBarProps["data"][number];
              const catchMt = row.catch_mt;
              const tacMt = row.tac_mt;
              if (catchMt != null && tacMt != null) {
                return `${v.toFixed(1)}%  (${Math.round(catchMt).toLocaleString()} / ${Math.round(tacMt).toLocaleString()} mt)`;
              }
              return `${v.toFixed(1)}%`;
            }}
            labelStyle={{ color: "#1a2332" }}
          />
          <Legend />
          <ReferenceLine x={100} stroke="#6b7280" strokeDasharray="3 3" />
          <Bar
            dataKey="utilization_pct"
            fill={BAR_COLOR}
            name="Catch as % of TAC"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
