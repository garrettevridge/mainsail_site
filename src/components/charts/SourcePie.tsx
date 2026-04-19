import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface SourcePieProps {
  data: { source: string; value: number }[];
  title?: string;
  unit?: string;
}

const SLICE_COLORS = [
  "#2f5d8a",
  "#6b8fad",
  "#7b6a4f",
  "#b45309",
  "#4b5563",
  "#a8a29e",
  "#c2410c",
];

export default function SourcePie({ data, title, unit = "" }: SourcePieProps) {
  return (
    <div className="chart-frame">
      {title && <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={380}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="source"
            cx="50%"
            cy="50%"
            outerRadius={130}
            labelLine={false}
            label={({ percent }) =>
              typeof percent === "number" ? `${(percent * 100).toFixed(0)}%` : ""
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) =>
              typeof v === "number" ? `${v.toLocaleString()} ${unit}`.trim() : String(v)
            }
            labelStyle={{ color: "#1a2332" }}
          />
          <Legend verticalAlign="bottom" height={50} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
