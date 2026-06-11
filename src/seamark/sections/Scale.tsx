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
        // Normalize over the charted species only, so the bands sum to exactly
        // 100% and the area reads as a clean composition.
        const total = SPECIES_ORDER.reduce((a, k) => a + (vals[k] ?? 0), 0) || 1;
        const row: Record<string, number> = { year };
        for (const k of SPECIES_ORDER) row[k] = ((vals[k] ?? 0) / total) * 100;
        return row;
      });
  }, [data]);

  return (
    <section id="scale" className="sm-section">
      <div className="sm-marker">
        <span className="num">The scale</span>
        <span className="title">Why the scale matters</span>
      </div>

      <h2 className="sm-h2">
        Among the largest <span className="accent">in the world.</span>
      </h2>

      <p className="sm-p">
        The numbers are easy to underestimate from the Lower 48. Alaska produces
        more than 60 percent of all U.S. seafood by volume — more than every
        other state combined. The industry supports on the order of 42,000
        direct jobs and underwrites the wages, infrastructure, and tax base of
        well over 140 rural and remote communities, many of which have no other
        economic engine and no road to one. Measured against the rest of the
        world rather than the rest of the country, a single Alaska fishery can
        out-land an entire national catch: the Bering Sea pollock harvest alone
        rivals the total wild capture of most fishing nations on earth. (Figures
        from standard industry economic analyses; see ASMI / McKinley Research.)
      </p>

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
              yDomain={[0, 100]}
            />
            <Legend
              items={SPECIES_ORDER.map((s, i) => ({ label: s, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder">Loading…</div>
        )}
      </ChartCard>

      <p className="sm-p">
        Managing something this large takes a deep stack of institutions, and a
        reader does not need all of it — only the shape. Each December, the North
        Pacific Fishery Management Council sets the coming year's federal harvest
        specifications, building on stock assessments from NOAA's Alaska
        Fisheries Science Center. The Alaska Department of Fish and Game manages
        state waters and nearly all of the salmon. The International Pacific
        Halibut Commission manages halibut jointly with Canada. Layered on top
        are programs that shape who fishes and where — the Community Development
        Quota program for Western Alaska, individual fishing quota (IFQ)
        allocations, and dozens of fishery-specific plans. Every layer runs on
        the same public rhythm of surveys, assessments, comment periods, and
        votes. The rest of this paper assumes that baseline.
      </p>
    </section>
  );
}
