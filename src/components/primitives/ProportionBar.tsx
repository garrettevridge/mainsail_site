export interface ProportionPart {
  label: string;
  value: number;
  color: string;
}

interface ProportionBarProps {
  parts: ProportionPart[];
  height?: number;
}

export default function ProportionBar({ parts, height = 42 }: ProportionBarProps) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const W = 680;
  let x = 0;
  const bands: { part: ProportionPart; x: number; w: number; pct: number }[] = parts.map((p) => {
    const w = (p.value / total) * W;
    const band = { part: p, x, w, pct: p.value / total };
    x += w;
    return band;
  });
  return (
    <svg
      role="img"
      aria-label="Proportion bar"
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {bands.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={8} width={b.w} height={height - 16} fill={b.part.color} />
          {b.w > 60 && (
            <text
              x={b.x + b.w / 2}
              y={height / 2 + 4}
              textAnchor="middle"
              fontSize={11}
              fill="#ffffff"
              fontFamily="Inter"
              fontWeight={600}
            >
              {(b.pct * 100).toFixed(b.pct < 0.05 ? 1 : 0) + "%"}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
