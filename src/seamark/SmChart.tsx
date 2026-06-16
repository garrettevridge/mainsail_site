import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { SERIES, RULE_GRID, AXIS, INK_BODY, CHART_TICK, BAND_STROKE } from "./colors";

const TICK = { fill: CHART_TICK, fontSize: 11, fontFamily: "'Space Mono', monospace" };
const RULE_3 = RULE_GRID;
const INK = INK_BODY;

type Datum = Record<string, number | string | null>;

interface StackedAreaProps {
  data: Datum[];
  xKey: string;
  keys: string[];
  colors?: string[];
  height?: number;
  yFormatter?: (v: number) => string;
  yLabel?: string;
  /** Fixed y-axis domain, e.g. [0, 100] for a share chart. */
  yDomain?: [number, number];
  /** Horizontal reference lines, e.g. the Chinook 60k hard cap. */
  refLines?: RefLine[];
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
  yDomain,
}: StackedAreaProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={RULE_3} strokeDasharray="2 4" />
        <XAxis dataKey={xKey} stroke={AXIS} tickLine={false} tick={TICK} />
        <YAxis
          stroke={AXIS}
          tickLine={false}
          tick={TICK}
          tickFormatter={yFormatter}
          domain={yDomain}
          allowDataOverflow={!!yDomain}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", fill: INK, fontSize: 11 }
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
            stroke={BAND_STROKE}
            strokeWidth={0.75}
            fill={colors[i % colors.length]}
            fillOpacity={0.92}
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
  refLines = [],
}: StackedAreaProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={RULE_3} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey={xKey} stroke={AXIS} tickLine={false} tick={TICK} />
        <YAxis stroke={AXIS} tickLine={false} tick={TICK} tickFormatter={yFormatter} />
        <Tooltip
          formatter={(v) =>
            typeof v === "number" ? yFormatter(v) : String(v ?? "")
          }
        />
        {refLines.map((r) => (
          <ReferenceLine
            key={r.label}
            y={r.y}
            stroke={r.color ?? INK_BODY}
            strokeDasharray={r.dash ?? "5 4"}
            label={{ value: r.label, fill: r.color ?? INK_BODY, fontSize: 10, position: "insideTopRight", fontFamily: "'Space Mono', monospace" }}
          />
        ))}
        {keys.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            stackId="a"
            fill={colors[i % colors.length]}
            stroke={BAND_STROKE}
            strokeWidth={0.5}
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
  /** Fixed y-axis domain, e.g. [0, 100] so a 100% reference line stays on-chart. */
  yDomain?: [number, number];
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
  yDomain,
}: MultiLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={RULE_3} strokeDasharray="2 4" />
        <XAxis dataKey={xKey} stroke={AXIS} tickLine={false} tick={TICK} />
        <YAxis
          stroke={AXIS}
          tickLine={false}
          tick={TICK}
          tickFormatter={yFormatter}
          domain={yDomain}
          allowDataOverflow={!!yDomain}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", fill: INK, fontSize: 11 }
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
            stroke={r.color ?? INK}
            strokeDasharray={r.dash ?? "4 4"}
            label={{ value: r.label, fill: r.color ?? INK, fontSize: 10, position: "insideTopRight", fontFamily: "'Space Mono', monospace" }}
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

interface BarColumnsProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  yFormatter?: (v: number) => string;
}

/**
 * Discrete columns, one per category, each independently colored. Unlike
 * StackedBar these are NOT parts of a whole — used to set magnitudes side by
 * side (e.g. mortality by source) without implying they sum to one total.
 */
export function BarColumns({ data, height = 320, yFormatter = defaultFmt }: BarColumnsProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={RULE_3} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="name" stroke={AXIS} tickLine={false} tick={TICK} interval={0} />
        <YAxis stroke={AXIS} tickLine={false} tick={TICK} tickFormatter={yFormatter} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} formatter={(v) => (typeof v === "number" ? yFormatter(v) : String(v ?? ""))} />
        <Bar dataKey="value" stroke={BAND_STROKE} strokeWidth={0.5} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? SERIES[0]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface BarLineProps {
  data: Datum[];
  xKey: string;
  /** Left-axis bars. */
  barKey: string;
  /** Right-axis line — a context series on a different scale (e.g. stock biomass). */
  lineKey: string;
  barColor?: string;
  lineColor?: string;
  height?: number;
  /** Left-axis (bar) tick formatter. */
  yFormatter?: (v: number) => string;
  /** Right-axis (line) tick formatter. */
  y2Formatter?: (v: number) => string;
}

/**
 * Bars on a left axis with a context line on a separate right axis. Both axes
 * are zero-based; the second axis carries its own label and the legend names
 * each series, so the differing scales are explicit rather than implied.
 */
export function BarLine({
  data,
  xKey,
  barKey,
  lineKey,
  barColor = SERIES[0],
  lineColor = SERIES[1],
  height = 320,
  yFormatter = defaultFmt,
  y2Formatter = defaultFmt,
}: BarLineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke={RULE_3} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey={xKey} stroke={AXIS} tickLine={false} tick={TICK} />
        <YAxis yAxisId="left" stroke={AXIS} tickLine={false} tick={TICK} tickFormatter={yFormatter} />
        <YAxis yAxisId="right" orientation="right" stroke={AXIS} tickLine={false} tick={TICK} tickFormatter={y2Formatter} />
        <Tooltip
          formatter={(v, name) =>
            typeof v === "number" ? (name === lineKey ? y2Formatter : yFormatter)(v) : String(v ?? "")
          }
        />
        <Bar yAxisId="left" dataKey={barKey} fill={barColor} stroke={BAND_STROKE} strokeWidth={0.5} isAnimationActive={false} />
        <Line yAxisId="right" type="monotone" dataKey={lineKey} stroke={lineColor} strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
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
