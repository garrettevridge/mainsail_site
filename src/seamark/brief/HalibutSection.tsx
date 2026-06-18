import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { IphcSourceMortalityRow, MonitoredCatchRow, DiscardMortalityRateRow, IphcSpawningBiomassRow } from "../../api/types";
import { BarLine } from "../SmChart";
import { ACCENT, TEAL, NEUTRAL } from "../colors";
import { Section, Block, Magbar, GearBars, Source, LegendLines, Notes, Methodology, k, type Seg } from "./parts";

const BIOMASS_MODEL = "coastwide_long";

const SOURCE_LABEL: Record<string, string> = {
  commercial_landings: "Directed commercial",
  recreational: "Sport",
  nondirected_discard: "Bycatch (other fisheries)",
  directed_discard: "Directed discard",
  subsistence: "Subsistence",
};

export default function HalibutSection() {
  const { data: iphc } = useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: mc } = useDataset<MonitoredCatchRow>("monitored_catch");
  const { data: dmr } = useDataset<DiscardMortalityRateRow>("discard_mortality_rates");
  const { data: sb } = useDataset<IphcSpawningBiomassRow>("iphc_spawning_biomass");

  const series = useMemo(() => {
    if (!iphc) return [];
    const biomass = new Map<number, number>();
    for (const r of sb ?? []) {
      if (r.model === BIOMASS_MODEL && r.sb_tonnes != null) biomass.set(r.year, r.sb_tonnes);
    }
    return iphc
      .filter((r) => r.source === "nondirected_discard" && r.mortality_tonnes != null && r.mortality_tonnes > 0)
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ year: r.year, Bycatch: r.mortality_tonnes!, "Spawning biomass": biomass.get(r.year) ?? null }));
  }, [iphc, sb]);

  const removals = useMemo(() => {
    if (!iphc) return null;
    const complete = iphc.filter((r) => r.source !== "total" && r.mortality_tonnes != null && r.is_preliminary === 0);
    if (complete.length === 0) return null;
    const year = Math.max(...complete.map((r) => r.year));
    const parts = Object.keys(SOURCE_LABEL)
      .map((src) => ({ src, label: SOURCE_LABEL[src], t: iphc.find((r) => r.year === year && r.source === src)?.mortality_tonnes ?? 0 }))
      .filter((p) => p.t > 0);
    const total = parts.reduce((a, p) => a + p.t, 0);
    const bycatch = parts.find((p) => p.src === "nondirected_discard")?.t ?? 0;
    const commercial = parts.find((p) => p.src === "commercial_landings")?.t ?? 0;
    return { year, parts, total, bycatch, commercial, pct: (bycatch / total) * 100 };
  }, [iphc]);

  const byGear = useMemo(() => {
    if (!mc) return [];
    const hal = mc.filter((r) => r.species_group === "Pacific Halibut" && r.disposition === "Discarded" && r.monitored_or_total === "Total");
    if (hal.length === 0) return [];
    const year = Math.max(...hal.map((r) => r.year));
    const m = new Map<string, number>();
    for (const r of hal) {
      if (r.year !== year) continue;
      const key = /Trawl/.test(r.gear) ? (/Nonpelagic/.test(r.gear) ? "Bottom trawl" : "Pelagic trawl") : r.gear === "Pot" ? "Pot" : "Hook-and-line";
      m.set(key, (m.get(key) ?? 0) + r.metric_tons);
    }
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([gear, t]) => ({ gear, t, pct: (t / total) * 100 }));
  }, [mc]);
  const gearMax = Math.max(...byGear.map((g) => g.t), 1);

  const dmrLabel = (g: string) =>
    /Sport/.test(g) ? "sport (surface release)" : /Longline|hook/.test(g) ? "longline" : /Trawl/.test(g) ? "trawl" : /Pot/.test(g) ? "pot" : g.toLowerCase();
  const dmrRows = useMemo(() => {
    if (!dmr) return [];
    const hal = dmr.filter((r) => r.species === "Pacific halibut" && (r.effective_year_end == null || r.effective_year_end >= 2025));
    const best = new Map<string, number>();
    for (const r of hal) {
      const g = dmrLabel(r.gear_type);
      best.set(g, Math.max(best.get(g) ?? 0, r.dmr_value));
    }
    return [...best.entries()].sort((a, b) => b[1] - a[1]).map(([gear, v]) => ({ gear, pct: v * 100 }));
  }, [dmr]);

  const removalSegs: Seg[] = removals
    ? removals.parts.map((p, i) => ({
        name: p.label,
        w: (p.t / removals.total) * 100,
        color: p.src === "nondirected_discard" ? ACCENT : NEUTRAL[i % NEUTRAL.length],
        val: `${k(p.t)} MT · ${Math.round((p.t / removals.total) * 100)}%`,
      }))
    : [];

  return (
    <Section
      id="halibut"
      num="03"
      cat="Groundfish Bycatch"
      title="Pacific halibut"
      dek="Halibut bycatch comes mostly from the Amendment 80 bottom-trawl fleet and the longline groundfish vessels. It has fallen by more than half since the 1990s, but remains the second-largest source of halibut mortality after the directed fishery."
    >
      <Block
        label="The long view"
        title="Halibut bycatch, by year."
        caption="Net bycatch mortality (bars, left axis) against coastwide spawning biomass (line, right axis). Bycatch has fallen by more than half since the 1990s as limits tightened; the spawning stock has trended down over the same period."
      >
        <div className="br-chart">
          {series.length > 0 ? (
            <BarLine
              data={series}
              xKey="year"
              barKey="Bycatch"
              lineKey="Spawning biomass"
              barColor={ACCENT}
              lineColor={TEAL}
              height={240}
              yFormatter={(v) => `${Math.round(v / 1000)}k`}
              y2Formatter={(v) => `${Math.round(v / 1000)}k`}
            />
          ) : null}
          <LegendLines items={[{ color: ACCENT, name: "Bycatch mortality — MT (left)" }, { color: TEAL, name: "Coastwide spawning biomass — MT (right)" }]} />
          <Source>Source · IPHC · non-directed discard mortality + coastwide spawning biomass (MT)</Source>
        </div>
      </Block>

      <Block
        variant="alt"
        label={`Where the ${removals ? `${removals.pct.toFixed(0)}%` : "13%"} comes from`}
        title={`Halibut mortality coastwide, ${removals ? removals.year : "2024"}.`}
        caption={removals ? <>Of <b>{k(removals.total)} MT</b> of halibut killed in {removals.year}, bycatch in other fisheries accounted for about a tenth — the directed commercial and sport fisheries take most of the rest.</> : undefined}
      >
        {removalSegs.length > 0 && <Magbar segs={removalSegs} />}
      </Block>

      <Block
        variant="div"
        label="Mortality by gear type"
        title="Halibut bycatch by gear type."
        caption={<>The majority is split between the bottom-trawl flatfish fleet (Amendment 80) and the hook-and-line groundfish fleets. Not every discarded halibut dies: managers apply gear-specific discard mortality rates to convert catch to mortality tonnes — {dmrRows.length ? dmrRows.map((d, i) => <span key={d.gear}>{i > 0 ? ", " : ""}<b>{Math.round(d.pct)}%</b> for {d.gear}</span>) : "—"}.</>}
      >
        {byGear.length > 0 && <GearBars rows={byGear.map((g) => ({ gear: g.gear, val: `${k(g.t)} MT · ${g.pct.toFixed(0)}%`, w: g.t }))} max={gearMax} />}
      </Block>

      <Notes
        items={[
          { label: "Deck handling", body: <>When halibut come up as bycatch they must be returned to the water — landing them in a groundfish fishery is prohibited. Survival depends on how quickly they are returned and how they were caught. Fish from deep trawl hauls suffer barotrauma and physical injury during the haul; fish taken near the surface on hooks often survive release. The discard mortality rates reflect these differences.</> },
          { label: "Avoidance measures", body: <>Each groundfish sector operates under a hard halibut PSC limit. When a sector reaches its limit that portion of the fishery closes for the remainder of the season, independent of remaining target-species quota. Vessels also use hook-spacing restrictions, modified trawl designs, and real-time data sharing to reduce encounters in high-density areas.</> },
          { label: "IPHC coordination", body: <>Pacific halibut is managed coast-wide by the International Pacific Halibut Commission under a U.S.–Canada convention. The IPHC's annual stock assessment sets the total allowable mortality; the groundfish PSC is carved out of that total alongside directed commercial and sport harvests. The bycatch figures here feed directly into IPHC catch accounting.</> },
        ]}
      />

      <Methodology
        items={[
          { strong: "Mortality by source.", body: "IPHC coastwide total mortality in metric tons (MT, net weight), by source: directed commercial, sport, subsistence, directed-fishery discard, and non-directed discard — the groundfish bycatch. Breakdown is the most recent non-preliminary year." },
          { strong: "Spawning biomass.", body: "IPHC coastwide female spawning biomass (MT) from the stock assessment, shown as the context line on the bycatch chart. The bycatch and biomass axes are separate scales; both start at zero." },
          { strong: "Bycatch by gear.", body: "Halibut discard mortality by sector and gear, from NMFS catch accounting, most recent year. Grouped as bottom (non-pelagic) trawl, pelagic trawl, hook-and-line, and pot." },
          { strong: "Discard mortality rates.", body: "Gear-specific rates set by the Council and IPHC and applied to discarded halibut to estimate deaths. Rates shown are the current effective values." },
        ]}
      />

    </Section>
  );
}
