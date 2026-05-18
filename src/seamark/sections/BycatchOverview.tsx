import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { MonitoredCatchRow } from "../../api/types";
import ChartCard from "../ChartCard";
import { MultiLine, Legend } from "../SmChart";
import { SERIES } from "../colors";

// Bycatch rate by gear: discarded / (retained + discarded), by gear and year.
// Use monitored_or_total === "Total" so we get the full catch picture.

const GEAR_ORDER = ["Pelagic Trawl", "Nonpelagic Trawl", "Hook and Line", "Pot", "Jig"] as const;

export default function BycatchOverview() {
  const { data } = useDataset<MonitoredCatchRow>("monitored_catch");

  const chartData = useMemo(() => {
    if (!data) return [];
    type Acc = { retained: number; discarded: number };
    const byYearGear = new Map<number, Map<string, Acc>>();
    for (const r of data) {
      if (r.monitored_or_total !== "Total") continue;
      const yr = byYearGear.get(r.year) ?? new Map<string, Acc>();
      const slot = yr.get(r.gear) ?? { retained: 0, discarded: 0 };
      if (r.disposition === "Retained") slot.retained += r.metric_tons;
      else if (r.disposition === "Discarded") slot.discarded += r.metric_tons;
      yr.set(r.gear, slot);
      byYearGear.set(r.year, yr);
    }
    return [...byYearGear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, gears]) => {
        const row: Record<string, number> = { year };
        for (const g of GEAR_ORDER) {
          const a = gears.get(g);
          if (!a) continue;
          const total = a.retained + a.discarded;
          if (total <= 0) continue;
          row[g] = +((a.discarded / total) * 100).toFixed(2);
        }
        return row;
      });
  }, [data]);

  return (
    <section id="bycatch-overview" className="sm-section">
      <div className="sm-marker">
        <span className="num">03 / Bycatch</span>
        <span className="title">Framing the section</span>
      </div>

      <h2 className="sm-h2">
        The data we have, <span className="accent">and the data we don't.</span>
      </h2>

      <div className="sm-placeholder">
        <span className="cap">Prose — framing bycatch</span>
        <span className="body">
          Bycatch — the incidental capture of non-target species — occurs in
          every commercial fishery in the world. The ethical and management
          obligation is to reduce it. The honest empirical situation is that
          we have far better bycatch data in some fisheries than others:
          federally observed offshore trawl fisheries have the most complete
          accounting on the planet; state fisheries (including most salmon
          fisheries) have substantially weaker bycatch documentation. Where
          data is thin, we say so. The next four subsections present what we
          have on Chinook, chum, halibut, and a final look at bycatch in
          other fisheries.
        </span>
      </div>

      <ChartCard
        label={`Fig 3.0 · gear comparison · 2013–${chartData.at(-1)?.year ?? ""}`}
        source="NOAA AKR Catch Accounting (monitored_catch, Total)"
        title="Federal Alaska bycatch rate by major gear — discarded share of total catch."
        caption={
          <>
            Lines, percent of total federal catch by weight that was
            discarded, by gear. State fisheries (salmon set/drift gillnet,
            seine) are not in this federal accounting system — see the
            section on state coverage gaps below.
          </>
        }
      >
        {chartData.length > 0 ? (
          <>
            <MultiLine
              data={chartData}
              xKey="year"
              keys={[...GEAR_ORDER]}
              height={320}
              yFormatter={(v) => `${v.toFixed(1)}%`}
              yLabel="Discarded share (%)"
            />
            <Legend
              items={GEAR_ORDER.map((g, i) => ({ label: g, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder">Loading…</div>
        )}
      </ChartCard>
    </section>
  );
}
