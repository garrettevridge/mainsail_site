import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { ObserverCoverageRow, MonitoredCatchRow } from "../../api/types";
import { TEAL, LANDSCAPE_PARTIAL, LANDSCAPE_ZERO } from "../colors";
import { Section, Block, Magbar, CoverageBars, Source, WideNote, Methodology, UpNext, k, type Seg, type CoverageRow } from "./parts";

type Cat = "full" | "partial" | "zero";

// Editorial mapping from catch-accounting (sector × gear) to recognizable fleets.
const fleetOf = (sector: string, gear: string): string => {
  if (sector.startsWith("Catcher Vessel: AFA")) return "Pollock catcher vessels (AFA)";
  if (sector === "Catcher/Processor" && gear === "Pelagic Trawl") return "Pollock catcher-processors";
  if (sector === "Catcher/Processor" && gear === "Nonpelagic Trawl") return "Amendment 80 (flatfish)";
  if (sector === "Catcher/Processor" && gear === "Hook and Line") return "Freezer longliners";
  if (sector === "Mothership") return "Motherships";
  if (sector === "Catcher Vessel" && /Trawl/.test(gear)) return "Trawl catcher vessels";
  if (sector === "Catcher Vessel" && gear === "Pot") return "Pot catcher vessels";
  if (sector === "Catcher Vessel" && gear === "Hook and Line") return "Hook-and-line catcher vessels";
  return "Other programs";
};

export default function ObserverSection({ onTop }: { onTop: () => void }) {
  const { data: obs } = useDataset<ObserverCoverageRow>("observer_coverage");
  const { data: mc } = useDataset<MonitoredCatchRow>("monitored_catch");

  const fleetYear = useMemo(() => (mc && mc.length ? Math.max(...mc.map((r) => r.year)) : null), [mc]);
  const fleets = useMemo<CoverageRow[]>(() => {
    if (!mc || fleetYear == null) return [];
    const m = new Map<string, { total: number; monitored: number }>();
    for (const r of mc) {
      if (r.year !== fleetYear) continue;
      if (r.monitored_or_total !== "Total" && r.monitored_or_total !== "Monitored") continue;
      const fleet = fleetOf(r.sector, r.gear);
      const cur = m.get(fleet) ?? { total: 0, monitored: 0 };
      if (r.monitored_or_total === "Total") cur.total += r.metric_tons;
      else cur.monitored += r.metric_tons;
      m.set(fleet, cur);
    }
    return [...m.entries()]
      .filter(([, v]) => v.total > 0)
      .map(([fleet, v]) => ({ fleet, total: v.total, pct: Math.min(100, Math.round((v.monitored / v.total) * 100)) }))
      .sort((a, b) => b.total - a.total);
  }, [mc, fleetYear]);
  const fleetMax = Math.max(...fleets.map((f) => f.total), 1);
  // The state-managed salmon fleet — the fishery the bycatch debate centers on —
  // sits entirely outside the federal observer program, so it has no catch in
  // this accounting and zero observer coverage. Shown for contrast.
  const fleetRows: CoverageRow[] = fleets.length ? [...fleets, { fleet: "Salmon fishing vessels (state waters)", total: 0, pct: 0 }] : [];
  const fleetOverall = useMemo(() => {
    if (!mc || fleetYear == null) return null;
    let tot = 0, mon = 0;
    for (const r of mc) {
      if (r.year !== fleetYear) continue;
      if (r.monitored_or_total === "Total") tot += r.metric_tons;
      else if (r.monitored_or_total === "Monitored") mon += r.metric_tons;
    }
    return tot > 0 ? Math.round((mon / tot) * 100) : null;
  }, [mc, fleetYear]);

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
        label={`Coverage by fleet${fleetYear ? ` · ${fleetYear}` : ""}`}
        title="The fleets that take the most are watched the most."
        caption={fleets.length ? <>Each bar is a fleet's federally managed groundfish catch; the shaded part is the share under monitoring. The pollock catcher-processors, AFA catcher vessels, Amendment&nbsp;80 fleet, and freezer longliners — which land most of the catch and take most of the salmon and halibut bycatch — run at essentially <b>100%</b>. Coverage thins only on the smaller catcher-vessel fleets.{fleetOverall != null ? <> Across all sectors, about <b>{fleetOverall}%</b> of {fleetYear} groundfish tonnage was monitored.</> : null} The state-managed salmon fleet at the center of the debate sits outside this program entirely — no federal observer coverage at all.</> : undefined}
      >
        <div className="br-chart">
          {fleetRows.length > 0 && <CoverageBars rows={fleetRows} max={fleetMax} fmt={k} />}
          <Source>Source · NMFS catch accounting · monitored vs. total catch (MT){fleetYear ? ` · ${fleetYear}` : ""}</Source>
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
          { strong: "Coverage by fleet.", body: "NMFS catch accounting (BSAI + GOA), most recent year. Each bar sums total groundfish catch (all species, retained and discarded) for a sector × gear grouping; the shaded share is the catch under monitoring. Sector × gear combinations are mapped to recognizable fleets — e.g. AFA catcher vessels, pollock and Amendment 80 catcher-processors, freezer longliners — with minor programs grouped as “Other.”" },
          { strong: "The landscape bar.", body: "North Pacific Observer Program strata (NOAA Fisheries Monitoring & Analysis annual reports), most recent year, summed by coverage category and weighted by total trips. Trip counts describe fleet structure, not catch volume — one catcher-processor trip lands far more than a small fixed-gear trip." },
        ]}
      />

      <UpNext label="End of brief" title="Back to the overview" arrow="↑" onClick={onTop} />
    </Section>
  );
}
