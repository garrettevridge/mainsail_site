import { k } from "./parts";

// One genetic-origin group: bycatch fish count + matched-year counted
// escapement (summed across the group's index projects), shaped by the section.
export interface OriginBarRow {
  region: string;
  fish: number;
  pct: number;
  escapement?: number | null;
  escapementNote?: string; // e.g. "U.S. + Canada combined"
}

interface OriginBarsProps {
  rows: OriginBarRow[]; // pre-sorted; bycatch first
  year: number;
}

// Horizontal rows: river-system name, its bycatch fish count, and an
// escapement bar scaled to the largest run in the set. Rows with no published
// escapement show a dashed empty track rather than a faked length.
export default function OriginBars({ rows, year }: OriginBarsProps) {
  const maxEsc = Math.max(1, ...rows.map((r) => r.escapement ?? 0));
  return (
    <div className="br-chart br-origin">
      <div className="br-origin-key">
        <span className="item"><span className="dot" /> Bycatch fish · {year}</span>
        <span className="item"><span className="sw" /> Counted escapement · {year} (bar scaled to the largest run)</span>
      </div>

      {rows.map((r) => (
        <div className="row" key={r.region}>
          <div className="head">
            <span className="name">{r.region}</span>
            <span className="vals">
              <span className="by">~{k(r.fish)} bycatch</span>
              {r.escapement != null ? (
                <span className="esc">esc {k(r.escapement)}{r.escapementNote ? "*" : ""}</span>
              ) : (
                <span className="none">no escapement published</span>
              )}
            </span>
          </div>
          {r.escapement != null ? (
            <div className="track">
              <div className="fill" style={{ width: `${Math.max(1.5, (r.escapement / maxEsc) * 100)}%` }} />
            </div>
          ) : (
            <div className="track out" />
          )}
        </div>
      ))}

      <p className="br-origin-foot">
        Bering Sea (BSAI) Chinook bycatch by genetic origin, {year}, paired with that year's
        counted escapement at each group's index projects (summed across projects — counted
        escapement, not a run reconstruction). *Yukon basin combines U.S. and Canadian fish.
        Origins outside Alaska are summarised in the note above, not charted here.
      </p>
    </div>
  );
}
