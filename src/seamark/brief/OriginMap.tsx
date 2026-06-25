import { ACCENT, TEAL, INK, INK_MUTED, RULE_AXIS } from "../colors";
import { k } from "./parts";

// One genetic reporting group, shaped by the section from chinook_gsi (one
// FMP area, one matched year) plus its crosswalked counted escapement.
export interface OriginNode {
  region: string;
  fish: number; // estimated fish of this origin = total_catch × mean_pct
  pct: number;
  ciLow?: number | null;
  ciHigh?: number | null;
  /** Matched-year counted escapement summed across this group's index projects, if any. */
  escapement?: number | null;
  /** Caveat shown with the escapement figure (e.g. combined US/Canada basin). */
  escapementNote?: string;
}

interface OriginMapProps {
  nodes: OriginNode[];
  year: number;
  total: number;
  nSamples: number;
  /** Threshold (fish) at or above which a node is labelled on the map itself. */
  labelMin?: number;
}

// Schematic placement on a stylized North Pacific rim (viewBox 960×560).
// Positions are editorial, not a projection — they read west→east, north→
// south so the geographic spread of origins is legible. Label offset/anchor
// is tuned per node to avoid collisions.
type Place = { x: number; y: number; lx: number; ly: number; anchor: "start" | "middle" | "end" };
const POS: Record<string, Place> = {
  Russia: { x: 70, y: 250, lx: -14, ly: 4, anchor: "end" },
  "Seward Peninsula/Norton Sound": { x: 250, y: 132, lx: 0, ly: -18, anchor: "middle" },
  "Yukon Alaska": { x: 352, y: 100, lx: -8, ly: -16, anchor: "end" },
  "Yukon Canada": { x: 490, y: 92, lx: 12, ly: -12, anchor: "start" },
  "Kuskokwim/Bristol Bay": { x: 300, y: 244, lx: -58, ly: 6, anchor: "end" },
  "North Alaska Peninsula": { x: 220, y: 350, lx: -12, ly: 22, anchor: "end" },
  "Chignik/Kodiak": { x: 362, y: 372, lx: 0, ly: 26, anchor: "middle" },
  "Cook Inlet": { x: 490, y: 286, lx: 14, ly: 4, anchor: "start" },
  Copper: { x: 584, y: 266, lx: 14, ly: 4, anchor: "start" },
  "Alsek/Situk": { x: 668, y: 326, lx: 14, ly: 0, anchor: "start" },
  "Southeast Alaska": { x: 744, y: 372, lx: 16, ly: 4, anchor: "start" },
  "British Columbia": { x: 826, y: 436, lx: 16, ly: 4, anchor: "start" },
  "West Coast US": { x: 888, y: 504, lx: 16, ly: 4, anchor: "start" },
};

// Faint coastline arc through the rim, west → southeast, to ground the dots.
const RIM = [
  "Russia",
  "Seward Peninsula/Norton Sound",
  "Kuskokwim/Bristol Bay",
  "North Alaska Peninsula",
  "Chignik/Kodiak",
  "Cook Inlet",
  "Copper",
  "Alsek/Situk",
  "Southeast Alaska",
  "British Columbia",
  "West Coast US",
];

const FA = "'Archivo', sans-serif";
const FM = "'Space Mono', monospace";

export default function OriginMap({ nodes, year, total, nSamples, labelMin = 300 }: OriginMapProps) {
  const placed = nodes.filter((n) => POS[n.region]);
  const maxFish = Math.max(1, ...placed.map((n) => n.fish));
  const r = (f: number) => Math.max(3, 48 * Math.sqrt(f / maxFish));

  const rimPath = RIM.filter((id) => POS[id])
    .map((id, i) => `${i === 0 ? "M" : "L"} ${POS[id].x} ${POS[id].y}`)
    .join(" ");

  // Only the major origins get a direct on-map label; smaller groups (and their
  // matched escapement) are listed below so the Gulf-of-Alaska cluster stays
  // legible. Every escapement-bearing node still shows its teal ring.
  const labelled = placed.filter((n) => n.fish >= labelMin);
  const minor = nodes
    .filter((n) => !labelled.includes(n))
    .sort((a, b) => b.fish - a.fish);

  return (
    <div className="br-chart br-originmap">
      <svg viewBox="0 0 1040 560" width="100%" role="img"
        aria-label={`Genetic origin of ${year} Bering Sea Chinook bycatch, by river system`}>
        {/* zone labels — neutral geographic grounding */}
        <text x="196" y="214" fontFamily={FM} fontSize="11" letterSpacing="0.16em"
          fill={INK_MUTED} textAnchor="middle">BERING SEA</text>
        <text x="560" y="430" fontFamily={FM} fontSize="11" letterSpacing="0.16em"
          fill={INK_MUTED} textAnchor="middle">GULF OF ALASKA</text>

        {/* rim arc */}
        <path d={rimPath} fill="none" stroke={RULE_AXIS} strokeWidth="1.5"
          strokeDasharray="2 6" strokeLinecap="round" opacity={0.9} />

        {/* escapement markers (teal) — drawn under the bycatch circles */}
        {placed.map((n) =>
          n.escapement != null ? (
            <circle key={`e-${n.region}`} cx={POS[n.region].x} cy={POS[n.region].y}
              r={r(n.fish) + 5} fill="none" stroke={TEAL} strokeWidth="1.25" opacity={0.7} />
          ) : null,
        )}

        {/* bycatch-origin circles (terracotta), area ∝ fish */}
        {placed.map((n) => (
          <circle key={n.region} cx={POS[n.region].x} cy={POS[n.region].y} r={r(n.fish)}
            fill={ACCENT} fillOpacity={0.82} stroke="#fff" strokeWidth="1" />
        ))}

        {/* labels for the larger / escapement-bearing nodes */}
        {labelled.map((n) => {
          const p = POS[n.region];
          const ox = p.x + p.lx + (p.anchor === "start" ? r(n.fish) : p.anchor === "end" ? -r(n.fish) : 0);
          return (
            <text key={`l-${n.region}`} x={ox} y={p.y + p.ly} textAnchor={p.anchor}>
              <tspan fontFamily={FA} fontWeight="700" fontSize="13" fill={INK}>{n.region}</tspan>
              <tspan x={ox} dy="16" fontFamily={FA} fontSize="12" fill={ACCENT}>
                {n.pct.toFixed(1)}% · ~{k(n.fish)} fish
              </tspan>
              {n.escapement != null ? (
                <tspan x={ox} dy="15" fontFamily={FM} fontSize="10" fill={TEAL}>
                  esc {year} · {k(n.escapement)}
                </tspan>
              ) : null}
            </text>
          );
        })}
      </svg>

      <div className="br-legend" style={{ marginTop: 12 }}>
        <span className="item"><span className="sw" style={{ background: ACCENT }} />
          <span className="name">{year} bycatch origin</span>
          <span className="val">circle area = fish</span></span>
        <span className="item"><span className="sw" style={{ background: "#fff", boxShadow: `inset 0 0 0 1.25px ${TEAL}` }} />
          <span className="name">Counted escapement, {year}</span>
          <span className="val">teal ring · index projects</span></span>
      </div>

      {minor.length > 0 && (
        <p className="br-originmap-minor">
          <b>Also in the bycatch:</b>{" "}
          {minor.map((n, i) => (
            <span key={n.region}>
              {i > 0 ? " · " : ""}{n.region} {n.pct.toFixed(1)}% (~{k(n.fish)}{n.escapement != null ? `, esc ${k(n.escapement)}` : ""})
            </span>
          ))}
        </p>
      )}

      <p className="br-originmap-foot">
        Bering Sea (BSAI) Chinook bycatch, {year} · {k(total)} fish · genetic stock
        identification from {nSamples.toLocaleString()} sampled fish (Barclay 2024 groups).
        Circle area is the estimated number of bycatch fish of each origin; the teal ring
        marks groups for which a matched-year counted escapement is published.
      </p>
    </div>
  );
}
