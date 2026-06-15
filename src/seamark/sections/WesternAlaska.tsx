import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { ChinookDrainageTotalsRow } from "../../api/types";
import ChartCard, { PlaceholderChart } from "../ChartCard";
import { MultiLine, Legend } from "../SmChart";
import { SERIES } from "../colors";

// Counted in-river escapement for Western AK Chinook drainages.
// Yukon basin + Kuskokwim basin + Nushagak River (Bristol Bay) cover the
// "Western Alaska" framing in this section.

const W_AK_DRAINAGES = ["Yukon basin", "Kuskokwim basin", "Nushagak River"];

export default function WesternAlaska() {
  const { data: drainage } = useDataset<ChinookDrainageTotalsRow>("chinook_drainage_totals");

  const escData = useMemo(() => {
    if (!drainage) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of drainage) {
      if (!W_AK_DRAINAGES.includes(r.drainage)) continue;
      if (r.actual_count == null) continue;
      const row = byYear.get(r.year) ?? { year: r.year };
      row[r.drainage] = (row[r.drainage] ?? 0) + r.actual_count;
      byYear.set(r.year, row);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [drainage]);

  return (
    <section id="western-alaska" className="sm-section">
      <div className="sm-marker">
        <span className="num">Western Alaska salmon</span>
        <span className="title">The collapse, and the data on cause</span>
      </div>

      <ChartCard
        label="Fig · Chinook escapement by drainage"
        source="ADF&G drainage rollup (chinook_drainage_totals)"
        title="Western Alaska Chinook — counted in-river escapement, by drainage."
        height="tall"
        caption={
          <>
            Lines, counted in-river escapement (sum across canonical drainage
            rows from chinook_drainage_totals, which selects one authoritative
            count per drainage-year to avoid double-counting drainagewide
            reconstructions against component tributaries). Yukon, Kuskokwim, and
            Nushagak basins shown.
          </>
        }
      >
        {escData.length > 0 ? (
          <>
            <MultiLine
              data={escData}
              xKey="year"
              keys={W_AK_DRAINAGES}
              height={360}
              yFormatter={(v) => v.toLocaleString()}
              yLabel="Counted escapement (fish)"
            />
            <Legend
              items={W_AK_DRAINAGES.map((d, i) => ({ label: d, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <PlaceholderChart
        label="Fig 3.5 · marine survival"
        source="ADF&G research · AFSC ESR"
        title="Marine survival indices for Western Alaska salmon stocks."
        caption={
          <>
            Time series of marine survival or return-per-spawner for major
            Western AK Chinook and chum stocks, alongside Bering Sea ocean
            temperature anomalies. Data not yet gathered.
          </>
        }
        note="Awaiting AFSC ESR / ADF&G survival index ingest"
      >
        {null}
      </PlaceholderChart>

    </section>
  );
}
