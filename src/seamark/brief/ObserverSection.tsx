import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { ObserverCoverageRow } from "../../api/types";
import { MultiLine } from "../SmChart";
import { ACCENT, TEAL, CLAY, LANDSCAPE_PARTIAL, LANDSCAPE_ZERO } from "../colors";
import { Section, Block, Magbar, Source, LegendLines, WideNote, Methodology, UpNext, k, type Seg } from "./parts";

type Cat = "full" | "partial" | "zero";

export default function ObserverSection({ onTop }: { onTop: () => void }) {
  const { data: obs } = useDataset<ObserverCoverageRow>("observer_coverage");

  const series = useMemo(() => {
    if (!obs) return [];
    const years = [...new Set(obs.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((year) => {
      const agg = (method: string) => {
        let s = 0, t = 0;
        for (const r of obs) {
          if (r.year === year && r.coverage_category === "partial" && r.monitoring_method === method && r.total_trips) {
            s += r.sampled_trips ?? 0;
            t += r.total_trips;
          }
        }
        return t > 0 ? (s / t) * 100 : null;
      };
      return { year, "Partial · observer": agg("observer"), "Partial · EM": agg("em") };
    });
  }, [obs]);

  const landscape = useMemo(() => {
    if (!obs) return null;
    const year = Math.max(...obs.map((r) => r.year));
    const cats: Record<Cat, { trips: number; sampled: number }> = {
      full: { trips: 0, sampled: 0 },
      partial: { trips: 0, sampled: 0 },
      zero: { trips: 0, sampled: 0 },
    };
    let emTrips = 0;
    for (const r of obs) {
      if (r.year !== year || r.total_trips == null) continue;
      cats[r.coverage_category].trips += r.total_trips;
      cats[r.coverage_category].sampled += r.sampled_trips ?? 0;
      if (r.monitoring_method === "em") emTrips += r.total_trips;
    }
    const total = cats.full.trips + cats.partial.trips + cats.zero.trips;
    return { year, total, cats, emTrips };
  }, [obs]);

  const landSegs: Seg[] = landscape
    ? (["full", "partial", "zero"] as Cat[]).map((key) => {
        const c = landscape.cats[key];
        const pct = Math.round((c.trips / landscape.total) * 100);
        const obsPct = c.trips > 0 ? Math.round((c.sampled / c.trips) * 100) : 0;
        const color = key === "full" ? TEAL : key === "partial" ? LANDSCAPE_PARTIAL : LANDSCAPE_ZERO;
        const label = key === "full" ? "Full coverage" : key === "partial" ? "Partial coverage" : "Zero coverage";
        return { name: label, w: pct, color, val: `${pct}% · ${key === "zero" ? "0% monitored" : `${obsPct}% monitored`}` };
      })
    : [];

  return (
    <Section
      id="observer"
      num="04"
      cat="Monitoring"
      title="Observer coverage"
      dek="Every number in this brief rests on this one. The fleets that take most of the bycatch are watched at essentially 100% — so those counts are a census, not a guess. The smaller boats are a different story."
    >
      <Block
        label="The long view"
        title="How much of the fleet is monitored, by method."
        caption="The largest vessels carry full coverage at essentially 100% every year (top line). The smaller, partial-coverage fleet is sampled far more lightly — human observers ride 15–22% of trips, while electronic monitoring is closing the gap. The space between the lines is the gap between a census and a sample."
      >
        <div className="br-chart">
          {series.length > 0 ? (
            <MultiLine
              data={series}
              xKey="year"
              keys={["Partial · observer", "Partial · EM"]}
              colors={[TEAL, CLAY]}
              height={240}
              yFormatter={(v) => `${Math.round(v)}%`}
              yDomain={[0, 100]}
              refLines={[{ y: 100, label: "Full-coverage fleet", color: ACCENT, dash: "6 5" }]}
            />
          ) : null}
          <LegendLines
            items={[
              { color: ACCENT, name: "Full-coverage fleet (≈100%)" },
              { color: TEAL, name: "Partial — human observer" },
              { color: CLAY, name: "Partial — electronic monitoring" },
            ]}
          />
          <Source>Source · NOAA FMA / North Pacific Observer Program</Source>
        </div>
      </Block>

      <Block
        variant="alt"
        label={`The monitoring landscape${landscape ? ` · ${landscape.year}` : ""}`}
        title="Trips are not catch."
        caption={landscape ? <>By trip count the fleet runs roughly a third full coverage, half partial, a sixth zero. But the catcher-processors that take most of the salmon and halibut bycatch sit in the <b>full-coverage</b> group — so those numbers are a near-census. Electronic monitoring covered <b>{k(landscape.emTrips)}</b> trips in {landscape.year}.</> : undefined}
      >
        {landSegs.length > 0 && <Magbar segs={landSegs} />}
      </Block>

      <WideNote
        label="Why this comes last"
        body={<>Every number on the other pages rests on this one. The BSAI pollock and Amendment 80 fleets — the largest sources of Chinook, chum, and halibut bycatch — are monitored at essentially 100%, so their Prohibited Species Catch counts are an actual tally, not an estimate. The partial-coverage fixed-gear fleets are sampled at 14–32% and statistically expanded, which carries real uncertainty.</>}
      />

      <Methodology
        items={[
          { strong: "Coverage.", body: "North Pacific Observer Program coverage by monitoring stratum, 2016–present, from NOAA Fisheries Monitoring & Analysis annual reports. Each stratum is classified full, partial, or zero, and monitored by observer, electronic monitoring, or none." },
          { strong: "The long view.", body: "Realized coverage of the partial-coverage fleet, trip-weighted across that year's partial strata, by method. The full-coverage fleet sits at ≈100% throughout and is drawn as a reference line." },
          { strong: "The landscape bar.", body: "Each year's strata summed by coverage category, weighted by total trips, most recent year. Trip counts describe fleet structure, not catch volume — one catcher-processor trip lands far more than a small fixed-gear trip." },
        ]}
      />

      <UpNext label="End of brief" title="Back to the overview" arrow="↑" onClick={onTop} />
    </Section>
  );
}
