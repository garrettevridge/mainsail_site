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

      <h2 className="sm-h2">
        Western Alaska salmon, <span className="accent">in the data.</span>
      </h2>

      <p className="sm-p">
        Across Western Alaska — the Yukon and Kuskokwim systems and the broader
        Arctic-Yukon-Kuskokwim region — Chinook and chum returns have collapsed
        over the past decade, and subsistence fisheries have been closed for
        several consecutive years. The chart below shows counted in-river
        escapement for the major Chinook drainages: historical runs measured in
        the hundreds of thousands, recent counts a fraction of that.
      </p>

      <ChartCard
        label="Fig 3.4 · primary · the comparison that matters"
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

      <p className="sm-p">
        Three data points bear on the relationship between bycatch and the
        collapse. First, Chinook bycatch attributable to Coastal Western Alaska
        averages roughly 5,000–7,000 fish per year in recent BSAI seasons,
        against historical Yukon and Kuskokwim runs measured in the hundreds of
        thousands. Second, Western Alaska accounts for roughly 8 percent of
        identified-origin BSAI chum bycatch, with the majority Asian and Pacific
        Northwest hatchery stock. Third, the decline has affected stocks across
        the region that share little except their marine phase — including
        populations with minimal interaction with the BSAI pollock fishery.
      </p>

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

      <p className="sm-p">
        Over the same period — since roughly 2014 — the Bering Sea warmed to the
        highest temperatures in the instrumental record, the cold pool retreated,
        the snow crab stock collapsed, and Gulf of Alaska Pacific cod recruitment
        failed. AFSC and ADF&amp;G research has centered on marine survival as a
        leading factor in the salmon declines; the survival indices that would
        quantify it are not yet wired (Fig 3.5 above). What Seamark makes of these
        data is set out in the conclusion.
      </p>
    </section>
  );
}
