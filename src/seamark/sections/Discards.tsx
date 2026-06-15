import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  MonitoredCatchRow,
  DiscardMortalityRateRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedBar, Legend } from "../SmChart";
import { SERIES } from "../colors";

const GEAR_ORDER = ["Pelagic Trawl", "Nonpelagic Trawl", "Hook and Line", "Pot", "Jig"] as const;

export default function Discards() {
  const { data: catchData } = useDataset<MonitoredCatchRow>("monitored_catch");
  const { data: dmr } = useDataset<DiscardMortalityRateRow>("discard_mortality_rates");

  const discardData = useMemo(() => {
    if (!catchData) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of catchData) {
      if (r.disposition !== "Discarded") continue;
      if (r.monitored_or_total !== "Total") continue;
      const row = byYear.get(r.year) ?? { year: r.year };
      row[r.gear] = (row[r.gear] ?? 0) + r.metric_tons;
      byYear.set(r.year, row);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [catchData]);

  return (
    <section id="discards" className="sm-section">
      <div className="sm-marker">
        <span className="num">Discards &amp; mortality rates</span>
        <span className="title">What's thrown back, and what survives</span>
      </div>

      <ChartCard
        label={`Fig · discards by gear · ${discardData[0]?.year ?? ""}–${discardData.at(-1)?.year ?? ""}`}
        source="NOAA AKR Catch Accounting (monitored_catch, Discarded, Total)"
        title="Federal Alaska discards by gear, by year."
        height="tall"
        caption={
          <>
            Stacked bars by year and gear (metric tons), federal fisheries
            only. Pre-mortality-adjustment — total weight returned to the
            sea regardless of survival. Compare with the DMR table below to
            translate discards into fishing mortality.
          </>
        }
      >
        {discardData.length > 0 ? (
          <>
            <StackedBar
              data={discardData}
              xKey="year"
              keys={[...GEAR_ORDER]}
              height={360}
              yFormatter={(v) => `${(v / 1000).toFixed(1)}k mt`}
            />
            <Legend
              items={GEAR_ORDER.map((g, i) => ({ label: g, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <div className="sm-ref">
        <div className="sm-ref-head">
          <span className="label">Reference table · exception to time-series default</span>
          <span className="label" style={{ color: "var(--ink-3)" }}>Current parameters</span>
        </div>
        <div className="sm-ref-title">DMR lookup — by species, area, and gear.</div>
        {dmr && dmr.length > 0 ? (
          <table className="sm-ref-table">
            <thead>
              <tr>
                <th>FMP area</th>
                <th>Gear</th>
                <th>Species</th>
                <th className="num">DMR</th>
                <th>Effective</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {dmr
                .slice()
                .sort((a, b) =>
                  a.fmp_area.localeCompare(b.fmp_area) ||
                  a.gear_type.localeCompare(b.gear_type) ||
                  a.species.localeCompare(b.species)
                )
                .map((r) => (
                  <tr key={r.dmr_id}>
                    <td>{r.fmp_area}</td>
                    <td>{r.gear_type}</td>
                    <td>{r.species}</td>
                    <td className="num">{(r.dmr_value * 100).toFixed(0)}%</td>
                    <td>
                      {r.effective_year_start}
                      {r.effective_year_end ? `–${r.effective_year_end}` : "–present"}
                    </td>
                    <td>{r.source}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
        <div className="sm-ref-foot">
          DMRs are revised periodically — the question is "what is the
          current parameter," not "how has it trended." Source: NPFMC SAFE /
          BSAI &amp; GOA Groundfish Harvest Specifications.
        </div>
      </div>

    </section>
  );
}
