import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { MonitoredCatchRow } from "../../api/types";
import { Section, Block, WideNote, Methodology, type CoverageRow } from "./parts";

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

export default function ObserverSection() {
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


  return (
    <Section
      id="observer"
      num="05"
      cat="Monitoring"
      title="Observer coverage"
      dek="Every number in this brief rests on this one. The fleets that take most of the bycatch are watched at essentially 100% — so those counts are a census, not a guess. The smaller boats are a different story."
    >
      <Block
        label={`Coverage by fleet${fleetYear ? ` · ${fleetYear}` : ""}`}
        title="Coverage varies by the fleet."
        caption={fleets.length ? <>The pollock catcher-processors, AFA catcher vessels, Amendment&nbsp;80 fleet, and freezer longliners — which land most of the catch and take most of the bycatch — run at essentially <b>100%</b>. Coverage thins on the smaller catcher-vessel fleets.{fleetOverall != null ? <> Across all sectors, about <b>{fleetOverall}%</b> of {fleetYear} groundfish tonnage was monitored.</> : null}</> : undefined}
      >
        {fleetRows.length > 0 && (
          <div className="br-fleet-grid">
            {fleetRows.filter((f) => f.fleet !== "Other programs").map((f) => (
              <div className="br-fleet-item" key={f.fleet}>
                <div className="rate">{f.total === 0 ? "—" : `${f.pct}%`}</div>
                <div className="name">{f.fleet}</div>
              </div>
            ))}
          </div>
        )}
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

    </Section>
  );
}
