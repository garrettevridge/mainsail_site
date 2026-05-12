import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// A large, deliberately spare line chart for hero / landing presentation.
// No legend, no dot markers, one heavy ink line on a clean grid.
// Use this when the chart IS the section, not when it sits among many others.

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
  height = 420,
  yLabel,
  yFormatter = fmtCompact,
  unitSuffix = "",
  refYears = [],
  color = "#121212",
}: BigLineProps) {
  return (
    <div style={{ margin: "10px 0 6px" }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={[...data]}
          margin={{ top: 24, right: 32, left: 12, bottom: 12 }}
        >
          <CartesianGrid
            strokeDasharray="0"
            stroke="var(--rule-soft)"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
            tickLine={{ stroke: "var(--rule)" }}
            axisLine={{ stroke: "var(--ink)" }}
            tickFormatter={(v) => String(v)}
          />
          <YAxis
            tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
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
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                    },
                  }
                : undefined
            }
            width={56}
          />
          <Tooltip
            cursor={{ stroke: "var(--rule)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--bg)",
              border: "1px solid var(--rule)",
              borderRadius: 2,
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            labelStyle={{
              color: "var(--ink)",
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              marginBottom: 4,
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
              stroke="var(--rule)"
              strokeDasharray="3 3"
              label={{
                value: ref.label,
                position: "top",
                fill: "var(--muted)",
                fontSize: 10,
                fontFamily: "var(--font-sans)",
              }}
            />
          ))}
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "var(--bg)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
