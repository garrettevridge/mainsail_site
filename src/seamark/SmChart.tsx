import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { SERIES, RULE_3, INK_3 } from "./colors";

type Datum = Record<string, number | string | null>;

interface StackedAreaProps {
  data: Datum[];
  xKey: string;
  keys: string[];
  colors?: string[];
  height?: number;
  yFormatter?: (v: number) => string;
  yLabel?: string;
}

const defaultFmt = (v: number) => {
  if (v == null || !Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 1000)}K`;
  if (Math.abs(v) >= 1_000) return `${(v / 1000).toFixed(1)}K`;
  return v.toLocaleString();
};

export function StackedArea({
  data,
  xKey,
  keys,
  colors = SERIES,
  height = 320,
  yFormatter = defaultFmt,
  yLabel,
}: StackedAreaProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={RULE_3} strokeDasharray="2 4" />
        <XAxis dataKey={xKey} stroke={INK_3} tickLine={false} />
        <YAxis
          stroke={INK_3}
          tickLine={false}
          tickFormatter={yFormatter}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", fill: INK_3, fontSize: 11 }
              : undefined
          }
        />
        <Tooltip
          formatter={(v) =>
            typeof v === "number" ? yFormatter(v) : String(v ?? "")
          }
        />
        {keys.map((k, i) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stackId="a"
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.85}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StackedBar({
  data,
  xKey,
  keys,
  colors = SERIES,
  height = 320,
  yFormatter = defaultFmt,
}: StackedAreaProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={RULE_3} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey={xKey} stroke={INK_3} tickLine={false} />
        <YAxis stroke={INK_3} tickLine={false} tickFormatter={yFormatter} />
        <Tooltip
          formatter={(v) =>
            typeof v === "number" ? yFormatter(v) : String(v ?? "")
          }
        />
        {keys.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            stackId="a"
            fill={colors[i % colors.length]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface RefLine {
  y: number;
  label: string;
  color?: string;
  dash?: string;
}

interface MultiLineProps {
  data: Datum[];
  xKey: string;
  keys: string[];
  colors?: string[];
  height?: number;
  yFormatter?: (v: number) => string;
  refLines?: RefLine[];
  yLabel?: string;
}

export function MultiLine({
  data,
  xKey,
  keys,
  colors = SERIES,
  height = 320,
  yFormatter = defaultFmt,
  refLines = [],
  yLabel,
}: MultiLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={RULE_3} strokeDasharray="2 4" />
        <XAxis dataKey={xKey} stroke={INK_3} tickLine={false} />
        <YAxis
          stroke={INK_3}
          tickLine={false}
          tickFormatter={yFormatter}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", fill: INK_3, fontSize: 11 }
              : undefined
          }
        />
        <Tooltip
          formatter={(v) =>
            typeof v === "number" ? yFormatter(v) : String(v ?? "")
          }
        />
        {refLines.map((r) => (
          <ReferenceLine
            key={r.label}
            y={r.y}
            stroke={r.color ?? INK_3}
            strokeDasharray={r.dash ?? "4 4"}
            label={{ value: r.label, fill: r.color ?? INK_3, fontSize: 10, position: "right" }}
          />
        ))}
        {keys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface LegendProps {
  items: { label: string; color: string }[];
}

export function Legend({ items }: LegendProps) {
  return (
    <div className="sm-legend">
      {items.map((it) => (
        <span key={it.label}>
          <span className="sw" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export { defaultFmt };
