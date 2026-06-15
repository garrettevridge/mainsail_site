import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  MonitoredCatchRow,
  PscAnnualHistoricalRow,
  IphcSourceMortalityRow,
} from "../../api/types";
import ChartCard, { PlaceholderChart } from "../ChartCard";
import { MultiLine, Legend } from "../SmChart";
import SmTable from "../SmTable";
import { SERIES } from "../colors";

const GEAR_ORDER = ["Pelagic Trawl", "Nonpelagic Trawl", "Hook and Line", "Pot", "Jig"] as const;
const GEAR_LABELS: Record<string, string> = {
  "Nonpelagic Trawl": "Bottom trawl",
  "Hook and Line": "Hook-and-line (longline)",
  "Pelagic Trawl": "Midwater (pollock) trawl",
  Pot: "Pot",
  Jig: "Jig",
};

interface GearRow { gear: string; mt: number; pct: number }

export default function BycatchOverview() {
  const { data } = useDataset<MonitoredCatchRow>("monitored_catch");
  const { data: psc } = useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: iphc } = useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");

  const rateData = useMemo(() => {
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
    return [...byYearGear.entries()].sort((a, b) => a[0] - b[0]).map(([year, gears]) => {
      const row: Record<string, number> = { year };
      for (const g of GEAR_ORDER) {
        const a = gears.get(g);
        if (a && a.retained + a.discarded > 0) row[g] = +((a.discarded / (a.retained + a.discarded)) * 100).toFixed(2);
      }
      return row;
    });
  }, [data]);

  const gearRows = useMemo<GearRow[]>(() => {
    if (!data) return [];
    const latest = Math.max(...data.map((r) => r.year));
    const g = new Map<string, number>();
    for (const r of data) {
      if (r.monitored_or_total !== "Total" || r.disposition !== "Discarded" || r.year !== latest) continue;
      g.set(r.gear, (g.get(r.gear) ?? 0) + r.metric_tons);
    }
    const tot = [...g.values()].reduce((a, b) => a + b, 0);
    if (tot <= 0) return [];
    return [...g.entries()]
      .map(([gear, mt]) => ({ gear: GEAR_LABELS[gear] ?? gear, mt, pct: (mt / tot) * 100 }))
      .sort((a, b) => b.mt - a.mt);
  }, [data]);

  const salmonTrends = useMemo(() => {
    const build = (species: "chinook" | "chum") => {
      if (!psc) return [];
      const m = new Map<number, number>();
      for (const r of psc) {
        if (r.species !== species || r.mortality_count == null || r.year < 1991 || r.year > 2024) continue;
        m.set(r.year, (m.get(r.year) ?? 0) + r.mortality_count);
      }
      return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({ year, v }));
    };
    return { chinook: build("chinook"), chum: build("chum") };
  }, [psc]);

  const halibutTrend = useMemo(() => {
    if (!iphc) return [];
    const m = new Map<number, number>();
    for (const r of iphc) {
      if (r.source !== "nondirected_discard" || r.mortality_mlb == null || r.year < 1991 || r.year > 2024) continue;
      m.set(r.year, (m.get(r.year) ?? 0) + r.mortality_mlb);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({ year, v }));
  }, [iphc]);

  const yr = rateData.at(-1)?.year ?? "";

  return (
    <section id="bycatch-overview" className="sm-section">
      <div className="sm-marker">
        <span className="num">Bycatch, by gear</span>
        <span className="title">Total, by source, and by species</span>
      </div>

      <PlaceholderChart
        label="Fig · composition · single year"
        source="NMFS non-target catch tables (pending ingest)"
        title="What the bycatch is made of, by species."
        caption="Pending data: full species composition (jellyfish, herring, forage fish, groundfish, salmon, crab) requires the NMFS non-target / 'other species' catch tables, not yet ingested."
        note="Awaiting NMFS non-target catch ingest"
      >
        {null}
      </PlaceholderChart>

      {gearRows.length > 0 && (
        <SmTable<GearRow>
          label={`Fig · who harvests it · ${yr}`}
          headNote="Federal groundfish, discards by weight"
          title="Bycatch by source — discards by gear."
          columns={[
            { key: "gear", header: "Gear / fleet" },
            { key: "mt", header: "Discarded", numeric: true, render: (r) => `${r.mt.toLocaleString(undefined, { maximumFractionDigits: 0 })} mt` },
            { key: "pct", header: "Share", numeric: true, render: (r) => `${r.pct.toFixed(0)}%` },
          ]}
          rows={gearRows}
          foot={`Discarded managed groundfish by gear, ${yr}. Source: NOAA AKR catch accounting (monitored_catch, Total).`}
        />
      )}

      <ChartCard
        label={`Fig · discard rate by gear · 2013–${yr}`}
        source="NOAA AKR Catch Accounting"
        title="Discard rate by gear — discarded share of each gear's catch."
        caption="Percent of each gear's total federal catch by weight that was discarded."
      >
        {rateData.length > 0 ? (
          <>
            <MultiLine data={rateData} xKey="year" keys={[...GEAR_ORDER]} height={300} yFormatter={(v) => `${v.toFixed(1)}%`} yLabel="Discarded share (%)" />
            <Legend items={GEAR_ORDER.map((g, i) => ({ label: GEAR_LABELS[g] ?? g, color: SERIES[i] }))} />
          </>
        ) : <div className="sm-chart-body placeholder">Loading…</div>}
      </ChartCard>

      <div className="sm-grid-3">
        <ChartCard label="Chinook · 1991–2024" source="NMFS PSC" title="Chinook bycatch (fish/yr)." height="short" caption="Groundfish-fishery Chinook PSC, BSAI + GOA.">
          {salmonTrends.chinook.length > 0 ? <MultiLine data={salmonTrends.chinook} xKey="year" keys={["v"]} height={160} yFormatter={(v) => `${Math.round(v / 1000)}k`} /> : <div className="sm-chart-body placeholder short">Loading…</div>}
        </ChartCard>
        <ChartCard label="Chum · 1991–2024" source="NMFS PSC" title="Chum bycatch (fish/yr)." height="short" caption="Groundfish-fishery chum PSC, BSAI + GOA.">
          {salmonTrends.chum.length > 0 ? <MultiLine data={salmonTrends.chum} xKey="year" keys={["v"]} height={160} yFormatter={(v) => `${Math.round(v / 1000)}k`} /> : <div className="sm-chart-body placeholder short">Loading…</div>}
        </ChartCard>
        <ChartCard label="Halibut · 1991–2024" source="IPHC" title="Halibut bycatch (M lb/yr)." height="short" caption="Non-directed halibut mortality, coastwide.">
          {halibutTrend.length > 0 ? <MultiLine data={halibutTrend} xKey="year" keys={["v"]} height={160} yFormatter={(v) => `${v.toFixed(0)}`} /> : <div className="sm-chart-body placeholder short">Loading…</div>}
        </ChartCard>
      </div>
    </section>
  );
}
