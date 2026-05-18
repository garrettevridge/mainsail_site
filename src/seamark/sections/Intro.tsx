import { useMemo } from "react";
import { useDataset, useManifest } from "../../api/manifest";
import type { NmfsCommercialLandingsRow } from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedArea, Legend } from "../SmChart";
import { SERIES } from "../colors";

const SPECIES_ORDER = ["Pollock", "Salmon", "Halibut", "Sablefish", "Crab", "Flatfish", "Other"] as const;

export default function Intro() {
  const { data } = useDataset<NmfsCommercialLandingsRow>("nmfs_commercial_landings");
  const { data: manifest } = useManifest();

  const chartData = useMemo(() => {
    if (!data) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of data) {
      if (r.landings_lbs == null) continue;
      if (r.region !== "Statewide") continue;
      const row = byYear.get(r.year) ?? {};
      row[r.species_group] = (row[r.species_group] ?? 0) + (r.landings_lbs ?? 0);
      byYear.set(r.year, row);
    }
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, vals]) => {
        const row: Record<string, number> = { year };
        for (const k of SPECIES_ORDER) row[k] = vals[k] ?? 0;
        return row;
      });
  }, [data]);

  const range =
    chartData.length > 0
      ? `${chartData[0].year}–${chartData.at(-1)!.year}`
      : "";

  const generated = manifest?.generated_at
    ? new Date(manifest.generated_at).toISOString().slice(0, 10)
    : null;

  return (
    <section id="intro" className="sm-section">
      <div className="sm-marker">
        <span className="num">00 / Introduction</span>
        <span className="title">Why this paper exists</span>
      </div>

      <p className="sm-p">
        Alaska's fisheries are large and complex — among the largest in the
        United States, ranking against entire countries by volume. The
        regulatory regime is similarly complex, built over a century, spanning
        federal and state jurisdictions, multiple gear types, hundreds of
        species, and over three hundred product forms. Healthy debate over how
        this shared resource is used is necessary and welcome. But that debate
        must rest on the best available data and a shared understanding of how
        the system actually works. This whitepaper presents the data on the
        topics most contested in 2026.
      </p>

      <p className="sm-p">
        Two kinds of arguments get conflated in fisheries debates: allocation
        (who gets the resource) and conservation (how the resource is engaged
        with). These deserve to be argued separately, with different evidence.
        Seamark's position is that the regime is, in relative terms, the
        best-managed large-scale wild capture system in the world. That does
        not make it perfect, and it does not make the status quo defensible by
        default — but the legitimacy of the management system is distinct from
        the legitimacy of any particular allocation outcome.
      </p>

      <p className="sm-p">
        Seamark is a firm dedicated to the Alaska seafood industry. We build
        data infrastructure for industry, policymakers, and analysts. We are
        publishing this whitepaper because we think the public conversation
        has drifted ahead of the data, and because we have the tools to bring
        the two back into the same room.
      </p>

      <div className="sm-principle">
        <div className="sm-principle-label">A note on method</div>
        <p>
          Where the record allows it, every chart in this paper is a long time
          series. Fisheries operate on decadal scales; climate operates on
          decadal scales; management institutions operate on decadal scales.
          Single-year snapshots, lifted from longer records and presented
          without context, are most of what is wrong with the current public
          debate. We will show the full record we have — sometimes that is
          forty years, sometimes a hundred, sometimes only fifteen, depending
          on what the data permits — and we will say which.
        </p>
      </div>

      <ChartCard
        label={`Hero chart · long record · ${range}`}
        source="NMFS FOSS commercial landings (statewide rollup)"
        title="Alaska commercial harvest by species group, statewide."
        height="tall"
        caption={
          <>
            Stacked area, statewide commercial landings (lbs) by species group.
            Source range starts {chartData[0]?.year ?? "—"}; earlier territorial
            and pre-statehood records require a separate adapter and are not in
            this v1 series. {generated && <>Data published {generated}.</>}
          </>
        }
      >
        {chartData.length > 0 ? (
          <>
            <StackedArea
              data={chartData}
              xKey="year"
              keys={[...SPECIES_ORDER]}
              height={360}
              yLabel="Landings (lbs)"
            />
            <Legend
              items={SPECIES_ORDER.map((s, i) => ({ label: s, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>
    </section>
  );
}
