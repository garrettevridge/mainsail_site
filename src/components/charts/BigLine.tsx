import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// A large, deliberately spare time-series chart for hero / landing
// presentation. Single heavy line, soft area fill underneath, clean grid,
// optional vertical reference markers for regulatory context. Use this when
// the chart IS the section, not when it sits among many others.

type Datum = { [key: string]: string | number | null | undefined };

interface BigLineProps {
  data: ReadonlyArray<Datum>;
  xKey: string;
  yKey: string;
  height?: number;
  yLabel?: string;
  yFormatter?: (v: number) => string;
  unitSuffix?: string;
  /** Optional vertical reference lines for context (e.g., regulatory events). */
  refYears?: Array<{ year: number; label: string }>;
  color?: string;
}

const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000_000)
    return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toLocaleString();
};

export default function BigLine({
  data,
  xKey,
  yKey,
  height = 440,
  yLabel,
  yFormatter = fmtCompact,
  unitSuffix = "",
  refYears = [],
  color = "#1f5573",
}: BigLineProps) {
  const gradId = `bigline-grad-${yKey}`;
  return (
    <div style={{ margin: "12px 0 8px" }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={[...data]}
          margin={{ top: 28, right: 36, left: 14, bottom: 14 }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="0"
            stroke="var(--rule-soft)"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "var(--ink-soft)", fontSize: 11.5 }}
            tickLine={{ stroke: "var(--rule)" }}
            axisLine={{ stroke: "var(--ink)", strokeWidth: 1.5 }}
            tickFormatter={(v) => String(v)}
          />
          <YAxis
            tick={{ fill: "var(--ink-soft)", fontSize: 11.5 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={yFormatter}
            domain={[0, "auto"]}
            label={
              yLabel
                ? {
                    value: yLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: "var(--muted)",
                      fontSize: 10.5,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                    },
                  }
                : undefined
            }
            width={60}
          />
          <Tooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{
              background: "var(--bg)",
              border: "1px solid var(--ink)",
              borderRadius: 0,
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              padding: "10px 14px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}
            labelStyle={{
              color: "var(--ink)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              marginBottom: 4,
              fontWeight: 600,
            }}
            formatter={(v) =>
              typeof v === "number"
                ? [
                    `${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}${unitSuffix ? " " + unitSuffix : ""}`,
                    "",
                  ]
                : ["no data", ""]
            }
          />
          {refYears.map((ref) => (
            <ReferenceLine
              key={ref.year}
              x={ref.year}
              stroke="var(--muted)"
              strokeDasharray="2 4"
              label={{
                value: ref.label,
                position: "top",
                fill: "var(--ink-soft)",
                fontSize: 10.5,
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
              }}
            />
          ))}
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{
              r: 5,
              fill: color,
              stroke: "var(--bg)",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
