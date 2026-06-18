import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { MonitoredCatchRow } from "../../api/types";
import { StackedBar } from "../SmChart";
import { ACCENT } from "../colors";
import { Section, Block, GearBars, Source, Notes, Methodology, k } from "./parts";

// Same sector × gear → fleet mapping the observer section uses.
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

export default function DiscardSection() {
  const { data: mc } = useDataset<MonitoredCatchRow>("monitored_catch");

  // Use only the "Total" catch-accounting rows (estimated total catch, not the
  // monitored subset) so retained + discarded is the whole catch.
  const totalRows = useMemo(() => (mc ? mc.filter((r) => r.monitored_or_total === "Total") : []), [mc]);
  const year = useMemo(() => (totalRows.length ? Math.max(...totalRows.map((r) => r.year)) : null), [totalRows]);

  // Discard rate (discarded ÷ all catch) by year.
  const rateSeries = useMemo(() => {
    const years = [...new Set(totalRows.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((y) => {
      let ret = 0, dis = 0;
      for (const r of totalRows) {
        if (r.year !== y) continue;
        if (r.disposition === "Discarded") dis += r.metric_tons;
        else if (r.disposition === "Retained") ret += r.metric_tons;
      }
      const t = ret + dis;
      return { year: y, "Discard rate": t > 0 ? +((dis / t) * 100).toFixed(2) : 0 };
    });
  }, [totalRows]);

  const latest = useMemo(() => {
    if (year == null) return null;
    let ret = 0, dis = 0;
    for (const r of totalRows) {
      if (r.year !== year) continue;
      if (r.disposition === "Discarded") dis += r.metric_tons;
      else if (r.disposition === "Retained") ret += r.metric_tons;
    }
    const total = ret + dis;
    return { discard: dis, total, rate: total > 0 ? (dis / total) * 100 : 0 };
  }, [totalRows, year]);
  const firstRate = rateSeries[0] ?? null;

  // By species — discard volume + rate. Sorted by rate so the "why" reads as a
  // gradient: prohibited / no-market species at the top, target species below.
  const bySpecies = useMemo(() => {
    if (year == null) return [];
    const m = new Map<string, { dis: number; all: number }>();
    for (const r of totalRows) {
      if (r.year !== year) continue;
      const cur = m.get(r.species_group) ?? { dis: 0, all: 0 };
      cur.all += r.metric_tons;
      if (r.disposition === "Discarded") cur.dis += r.metric_tons;
      m.set(r.species_group, cur);
    }
    return [...m.entries()]
      .map(([name, v]) => ({ name, dis: v.dis, rate: v.all > 0 ? (v.dis / v.all) * 100 : 0 }))
      .sort((a, b) => b.dis - a.dis)
      .slice(0, 10)
      .sort((a, b) => b.rate - a.rate);
  }, [totalRows, year]);

  // By fleet — discard volume + rate, sorted by volume.
  const byFleet = useMemo(() => {
    if (year == null) return [];
    const m = new Map<string, { dis: number; all: number }>();
    for (const r of totalRows) {
      if (r.year !== year) continue;
      const fleet = fleetOf(r.sector, r.gear);
      const cur = m.get(fleet) ?? { dis: 0, all: 0 };
      cur.all += r.metric_tons;
      if (r.disposition === "Discarded") cur.dis += r.metric_tons;
      m.set(fleet, cur);
    }
    return [...m.entries()]
      .map(([fleet, v]) => ({ fleet, dis: v.dis, rate: v.all > 0 ? (v.dis / v.all) * 100 : 0 }))
      .filter((f) => f.dis > 0)
      .sort((a, b) => b.dis - a.dis);
  }, [totalRows, year]);
  const fleetMax = Math.max(...byFleet.map((f) => f.dis), 1);

  return (
    <Section
      id="discards"
      num="04"
      cat="Groundfish"
      title="Discards"
      dek="Not everything a net or a longline brings up is kept. Some of the catch goes back over the side — because regulation forbids landing it, or because it has no buyer. In Alaska's federal groundfish fisheries that share has declined over the past decade, and it is far from evenly spread across the fleet."
    >
      {/* BLOCK 1 — what it is, and the scale */}
      <Block
        label={`The long view${firstRate && year ? ` · ${firstRate.year}–${year}` : ""}`}
        title="Discards as a share of the catch, by year."
        caption={latest && firstRate ? <>A discard is catch returned to the sea, dead or alive. In {year}, about <b>{k(latest.discard)} MT</b> went back — roughly <b>{latest.rate.toFixed(1)}%</b> of the {k(latest.total)} MT of groundfish caught, down from about {firstRate["Discard rate"].toFixed(1)}% in {firstRate.year}. Full-retention rules on the largest fisheries hold the rate down.</> : undefined}
      >
        <div className="br-chart">
          {rateSeries.length > 0 ? (
            <StackedBar data={rateSeries} xKey="year" keys={["Discard rate"]} colors={[ACCENT]} height={240} yFormatter={(v) => `${v.toFixed(0)}%`} />
          ) : null}
          <Source>Source · NMFS Alaska catch accounting (BSAI + GOA) · discarded ÷ total catch</Source>
        </div>
      </Block>

      {/* BLOCK 2 — how discards work, by species */}
      <Block
        variant="alt"
        label={`Why fish go back · by species${year ? ` · ${year}` : ""}`}
        title="The rate depends entirely on what's caught."
        caption={bySpecies.length ? <>Each bar is a species group's discard rate; the label adds the tonnage. Prohibited species the fleet may not keep — Pacific halibut above all — and low-value fish with no market, like sharks and skates, are discarded at high rates. The valuable target species are kept almost whole: pollock and Pacific cod must be fully retained by law.</> : undefined}
        note={<>Rate and volume tell different stories. Pollock is discarded at about 1% yet is one of the larger tonnages by sheer scale; sharks are discarded at nearly 100% but amount to little. A single headline rate hides both.</>}
      >
        {bySpecies.length > 0 && (
          <GearBars rows={bySpecies.map((s) => ({ gear: s.name, val: `${k(s.dis)} MT · ${s.rate.toFixed(0)}%`, w: s.rate }))} max={100} />
        )}
      </Block>

      {/* BLOCK 3 — volumes by fleet */}
      <Block
        variant="div"
        label={`Volumes by fleet${year ? ` · ${year}` : ""}`}
        title="The discards sit with the bottom-contact fleets."
        caption={byFleet.length ? <>Most of the {year} discards come from the gear that works on or near the seafloor and sorts a mixed catch: the Amendment&nbsp;80 flatfish fleet, freezer longliners, and the smaller hook-and-line catcher vessels. The pollock fleets, under full retention, throw back almost nothing.</> : undefined}
      >
        {byFleet.length > 0 && (
          <GearBars rows={byFleet.map((f) => ({ gear: f.fleet, val: `${k(f.dis)} MT · ${f.rate.toFixed(0)}% of its catch`, w: f.dis }))} max={fleetMax} />
        )}
      </Block>

      <Notes
        items={[
          { label: "Prohibited species", body: <>Halibut, salmon, crab, herring, and steelhead cannot be retained or sold in the groundfish fisheries — by law they must be returned to the sea, and they are counted as discards. Pacific halibut is the largest single prohibited-species discard.</> },
          { label: "Full retention", body: <>Under the Improved Retention / Improved Utilization rules, pollock and Pacific cod must be retained in full rather than discarded. That is why the two largest groundfish fisheries post discard rates near zero, and why Alaska's overall rate stays low.</> },
          { label: "No market", body: <>Sharks, skates, and some “other groundfish” are often discarded simply because there is no buyer for them. Their discard rates run high, but their tonnage is small next to the target fisheries.</> },
        ]}
      />

      <Methodology
        items={[
          { strong: "Discards.", body: "NMFS Alaska Region catch accounting (BSAI + GOA), 2013–present. Uses the estimated total-catch rows; a discard is the portion of catch with disposition “Discarded.” The rate is discarded ÷ (retained + discarded)." },
          { strong: "By species.", body: "Discard tonnage and rate by species group, most recent year. Bars show the rate; labels add the discarded tonnage. The ten largest discard tonnages are shown, ordered by rate." },
          { strong: "By fleet.", body: "Discard tonnage by sector × gear, most recent year, mapped to recognizable fleets (AFA catcher vessels, pollock and Amendment 80 catcher-processors, freezer longliners, smaller catcher-vessel fleets); minor programs grouped as “Other.”" },
        ]}
      />

    </Section>
  );
}
