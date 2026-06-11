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
        <span className="title">The questions, and the data</span>
      </div>

      <p className="sm-p">
        The timing is not incidental. Western Alaska's salmon runs are failing,
        coastal communities and processing plants are under real strain, and
        fisheries are drawing more political attention than they have in a
        generation. The conversation is loud and high-stakes — and too often
        unmoored from the data the agencies actually publish.
      </p>

      <p className="sm-p">
        Few public resources are argued over as hard as Alaska's fisheries, and
        few arguments turn on facts this hard to pin down. Is the offshore fleet
        catching the salmon that Western Alaska's rivers are missing? How much of
        what it catches gets thrown away? Is the system that manages it working?
        The questions are real, and the answers exist — they are just buried in
        stock assessments, catch-accounting tables, and genetics reports that
        almost no one outside the field ever reads.
      </p>

      <p className="sm-p">
        This paper pulls the best available data on those questions into one
        place and presents it plainly. Every chart is drawn from public sources —
        NOAA catch accounting, the federal stock assessments, the genetics, the
        International Pacific Halibut Commission, the Alaska Department of Fish
        and Game — and wherever the record allows, it is shown as a long time
        series rather than a single year. Where the data is thin, or a fishery is
        barely measured at all, we say so.
      </p>

      <p className="sm-p">
        One distinction runs through everything that follows. The federal
        fisheries offshore are among the most closely observed in the world; the
        state fisheries, including most salmon fisheries, are not. The numbers
        are not evenly trustworthy, and the comparisons have to be read with that
        in mind. We flag it where it matters.
      </p>

      <p className="sm-p">
        Seamark advises clients in Alaska's seafood industry, and we are
        concerned with the state of this conversation. This paper does two
        things: it presents the best available data on the contested questions,
        and — at the end, in its own section — it offers our perspective on how
        to read it. The body is the data. What we make of it comes last, and you
        are free to make something else of it.
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
            Source range starts {chartData[0]?.year ?? "—"}.{" "}
            <strong>Pending data:</strong> extending this series back to 1950
            (and the salmon record to the 1870s) requires ingesting the older
            NMFS FOSS and historical-landings tables — a planned addition, not
            yet wired. {generated && <>Data published {generated}.</>}
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
