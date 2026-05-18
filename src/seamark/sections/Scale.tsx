import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { NmfsCommercialLandingsRow } from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedArea, Legend } from "../SmChart";
import { SERIES } from "../colors";

const SPECIES_ORDER = ["Pollock", "Salmon", "Halibut", "Sablefish", "Crab", "Flatfish", "Other"] as const;

export default function Scale() {
  const { data } = useDataset<NmfsCommercialLandingsRow>("nmfs_commercial_landings");

  const chartData = useMemo(() => {
    if (!data) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of data) {
      if (r.landings_lbs == null || r.region !== "Statewide") continue;
      const row = byYear.get(r.year) ?? {};
      row[r.species_group] = (row[r.species_group] ?? 0) + (r.landings_lbs ?? 0);
      byYear.set(r.year, row);
    }
    // Show share (percent) rather than absolute volume — composition.
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, vals]) => {
        const total = Object.values(vals).reduce((a, b) => a + b, 0) || 1;
        const row: Record<string, number> = { year };
        for (const k of SPECIES_ORDER) row[k] = ((vals[k] ?? 0) / total) * 100;
        return row;
      });
  }, [data]);

  return (
    <section id="scale" className="sm-section">
      <div className="sm-marker">
        <span className="num">01 / Scale</span>
        <span className="title">Why the scale of this matters</span>
      </div>

      <h2 className="sm-h2">
        Among the largest <span className="accent">in the world.</span>
      </h2>

      <div className="sm-placeholder">
        <span className="cap">Prose — establish scale</span>
        <span className="body">
          Open with magnitudes: Alaska seafood produces more than 60% of total
          U.S. seafood by volume; the state's fisheries support 42,000 direct
          jobs; over 140 rural and remote communities depend on the industry
          for wages, infrastructure, and tax revenue. Frame the regulatory
          complexity: federal versus state jurisdiction, the North Pacific
          Fishery Management Council process, ADF&amp;G area management, the
          IPHC for halibut, the CDQ program for Western Alaska, IFQ
          allocations, and dozens of fishery-specific plans. Compare to other
          major fisheries globally where helpful — Alaska's harvests rank
          against entire countries.
        </span>
      </div>

      <div className="sm-stat-row">
        <div className="sm-stat">
          <div className="sm-stat-num">60%+</div>
          <div className="sm-stat-lbl">U.S. seafood volume produced in Alaska</div>
        </div>
        <div className="sm-stat">
          <div className="sm-stat-num">42,000</div>
          <div className="sm-stat-lbl">Direct Alaska jobs supported</div>
        </div>
        <div className="sm-stat">
          <div className="sm-stat-num">140+</div>
          <div className="sm-stat-lbl">Communities dependent on the industry</div>
        </div>
        <div className="sm-stat">
          <div className="sm-stat-num">$5.2B</div>
          <div className="sm-stat-lbl">Annual value added to AK economy</div>
        </div>
      </div>

      <ChartCard
        label={`Fig 1.1 · composition · 1985–${chartData.at(-1)?.year ?? ""}`}
        source="NMFS FOSS commercial landings (statewide rollup)"
        title="Composition of Alaska commercial harvest, by species share."
        caption={
          <>
            Stacked area, statewide commercial landings as share of total
            (percent) by species group. Pollock's emergence in the modern
            record reflects the U.S. domestic transition following the
            Magnuson-Stevens Act (1976). Pre-1985 territorial and early-
            statehood records require a separate adapter and are not in this
            v1 series.
          </>
        }
      >
        {chartData.length > 0 ? (
          <>
            <StackedArea
              data={chartData}
              xKey="year"
              keys={[...SPECIES_ORDER]}
              height={320}
              yFormatter={(v: number) => `${v.toFixed(0)}%`}
              yLabel="Share of landings (%)"
            />
            <Legend
              items={SPECIES_ORDER.map((s, i) => ({ label: s, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder">Loading…</div>
        )}
      </ChartCard>

      <div className="sm-placeholder">
        <span className="cap">Prose — the regulatory architecture</span>
        <span className="body">
          Brief plain-English walkthrough of the management stack: NPFMC sets
          federal harvest specs each December based on NOAA stock assessments;
          ADF&amp;G manages state waters and salmon; IPHC manages halibut
          bilaterally with Canada. Annual surveys, stock assessments, public
          comment periods, council motions. Every step is open to public
          participation. This section is meant to ground readers — the rest
          of the whitepaper will assume this baseline.
        </span>
      </div>
    </section>
  );
}
