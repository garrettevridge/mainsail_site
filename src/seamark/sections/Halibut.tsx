import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { IphcSourceMortalityRow } from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedBar, Legend } from "../SmChart";
import { SERIES } from "../colors";

// IPHC publishes mortality_mlb (million lbs) by source.
// Sources: commercial_landings, directed_discard, nondirected_discard,
// recreational, subsistence, total (excluded from chart).

const SOURCE_ORDER = [
  "commercial_landings",
  "nondirected_discard",
  "recreational",
  "directed_discard",
  "subsistence",
] as const;

const SOURCE_LABELS: Record<(typeof SOURCE_ORDER)[number], string> = {
  commercial_landings: "Directed commercial",
  nondirected_discard: "Non-directed bycatch (groundfish)",
  recreational: "Charter / recreational",
  directed_discard: "Directed discard (longline)",
  subsistence: "Subsistence",
};

export default function Halibut() {
  const { data } = useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");

  const chartData = useMemo(() => {
    if (!data) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of data) {
      if (r.mortality_mlb == null) continue;
      if (r.source === "total") continue;
      if (!SOURCE_ORDER.includes(r.source as (typeof SOURCE_ORDER)[number])) continue;
      if (r.year < 1980) continue;
      const row = byYear.get(r.year) ?? { year: r.year };
      const label = SOURCE_LABELS[r.source as (typeof SOURCE_ORDER)[number]];
      row[label] = (row[label] ?? 0) + r.mortality_mlb;
      byYear.set(r.year, row);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [data]);

  return (
    <section id="halibut" className="sm-section">
      <div className="sm-marker">
        <span className="num">03d / Halibut</span>
        <span className="title">Bycatch across all fisheries</span>
      </div>

      <h2 className="sm-h2">
        Halibut bycatch <span className="accent">in scale.</span>
      </h2>

      <div className="sm-placeholder">
        <span className="cap">Prose — halibut data</span>
        <span className="body">
          Halibut bycatch in the pollock fishery averages roughly 100,000
          lbs annually — small in absolute terms and very small relative to
          total halibut fishing mortality across the region. Hook-and-line
          longline fisheries, charter and recreational fisheries, and other
          groundfish fisheries account for the overwhelming majority of
          halibut removals. Present the full mortality budget. The framing
          has to be honest about uncertainty in halibut population
          dynamics, especially given recent IPHC concerns about stock size.
        </span>
      </div>

      <div className="sm-stat-row">
        <div className="sm-stat">
          <div className="sm-stat-num">~100K</div>
          <div className="sm-stat-lbl">lbs avg. halibut bycatch in pollock, recent years</div>
        </div>
        <div className="sm-stat">
          <div className="sm-stat-num">&lt;0.6%</div>
          <div className="sm-stat-lbl">Pollock fishery share of halibut mortality</div>
        </div>
        <div className="sm-stat">
          <div className="sm-stat-num">&gt;99%</div>
          <div className="sm-stat-lbl">Halibut mortality from non-pollock sources</div>
        </div>
      </div>

      <ChartCard
        label={`Fig 3.6 · primary · ${chartData[0]?.year ?? ""}–${chartData.at(-1)?.year ?? ""}`}
        source="IPHC mortality-by-source (coastwide)"
        title="Total halibut fishing mortality, by source, by year."
        height="tall"
        caption={
          <>
            Stacked bars by year, IPHC-published fishing mortality
            (million lbs) by source. Directed commercial longline dominates;
            non-directed bycatch from groundfish trawl and longline is a
            single-digit share of the total. IPHC records date to 1888 —
            the chart starts in 1980 for legibility against modern
            management. Series exclude the IPHC "total" row to avoid
            double-counting.
          </>
        }
      >
        {chartData.length > 0 ? (
          <>
            <StackedBar
              data={chartData}
              xKey="year"
              keys={SOURCE_ORDER.map((s) => SOURCE_LABELS[s])}
              height={360}
              yFormatter={(v) => `${v.toFixed(1)} M lb`}
            />
            <Legend
              items={SOURCE_ORDER.map((s, i) => ({
                label: SOURCE_LABELS[s],
                color: SERIES[i],
              }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>
    </section>
  );
}
