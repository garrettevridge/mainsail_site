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
import SmCallout from "../SmCallout";
import { SERIES } from "../colors";

// Catch & bycatch overview. Follows a simple logic: what bycatch is → how much
// → its composition → who harvests it → what survives (DMRs) → the long trend.

const GEAR_ORDER = ["Pelagic Trawl", "Nonpelagic Trawl", "Hook and Line", "Pot", "Jig"] as const;
const GEAR_LABELS: Record<string, string> = {
  "Nonpelagic Trawl": "Bottom trawl",
  "Hook and Line": "Hook-and-line (longline)",
  "Pelagic Trawl": "Midwater (pollock) trawl",
  Pot: "Pot",
  Jig: "Jig",
};

interface GearRow {
  gear: string;
  mt: number;
  pct: number;
}

const LB = 2204.62;

export default function BycatchOverview() {
  const { data } = useDataset<MonitoredCatchRow>("monitored_catch");
  const { data: psc } = useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: iphc } = useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");

  // Discard rate by gear, over time.
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
    return [...byYearGear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, gears]) => {
        const row: Record<string, number> = { year };
        for (const g of GEAR_ORDER) {
          const a = gears.get(g);
          if (!a) continue;
          const total = a.retained + a.discarded;
          if (total > 0) row[g] = +((a.discarded / total) * 100).toFixed(2);
        }
        return row;
      });
  }, [data]);

  // Total federal groundfish discards in the latest year.
  const totals = useMemo(() => {
    if (!data) return null;
    const latest = Math.max(...data.map((r) => r.year));
    let disc = 0;
    let total = 0;
    for (const r of data) {
      if (r.monitored_or_total !== "Total" || r.year !== latest) continue;
      if (r.disposition === "Discarded") disc += r.metric_tons;
      total += r.metric_tons;
    }
    if (total <= 0) return null;
    return { year: latest, mt: disc, mlb: Math.round((disc * LB) / 1e6), ratePct: (disc / total) * 100 };
  }, [data]);

  // Who harvests the bycatch — discards by gear, latest year.
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

  // Long-record side trends: Chinook & chum PSC (count), halibut bycatch (M lb).
  const salmonTrends = useMemo(() => {
    const build = (species: "chinook" | "chum") => {
      if (!psc) return [];
      const m = new Map<number, number>();
      for (const r of psc) {
        if (r.species !== species || r.mortality_count == null) continue;
        if (r.year < 1991 || r.year > 2024) continue;
        m.set(r.year, (m.get(r.year) ?? 0) + r.mortality_count);
      }
      return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({ year, v }));
    };
    return { chinook: build("chinook"), chum: build("chum") };
  }, [psc]);
  const chinookTrend = salmonTrends.chinook;
  const chumTrend = salmonTrends.chum;
  const halibutTrend = useMemo(() => {
    if (!iphc) return [];
    const m = new Map<number, number>();
    for (const r of iphc) {
      if (r.source !== "nondirected_discard" || r.mortality_mlb == null) continue;
      if (r.year < 1991 || r.year > 2024) continue;
      m.set(r.year, (m.get(r.year) ?? 0) + r.mortality_mlb);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({ year, v }));
  }, [iphc]);

  const yr = totals?.year ?? "";

  return (
    <section id="bycatch-overview" className="sm-section">
      <div className="sm-marker">
        <span className="num">Bycatch, by gear</span>
        <span className="title">What's caught, and what gets thrown back</span>
      </div>

      <h2 className="sm-h2">
        What's caught, <span className="accent">and what gets thrown back.</span>
      </h2>

      {/* 1 — what it is */}
      <p className="sm-p">
        The commercial harvest of seafood produces bycatch: animals caught while
        targeting something else, and not kept. In Alaska's federal groundfish
        fisheries that means discarded pollock and flatfish, skates, sharks, and
        Pacific halibut — and, counted separately in numbers rather than pounds,
        Chinook and chum salmon and crab.
      </p>

      {/* 2 — how much */}
      <p className="sm-p">
        By the best available data, the federal groundfish fisheries discard
        about{" "}
        {totals ? `${totals.mlb} million pounds` : "150 million pounds"} of
        managed groundfish a year ({yr}), roughly{" "}
        {totals ? `${totals.ratePct.toFixed(0)} percent` : "a few percent"} of
        total catch by weight. That figure is almost certainly an underestimate:
        it excludes the state fisheries, which are not federally observed, and it
        counts only managed groundfish — non-target invertebrates such as
        jellyfish are accounted separately, and salmon and crab are counted in
        numbers, not pounds.
      </p>

      {/* 3 — composition (the data gap) */}
      <PlaceholderChart
        label={`Fig 2.1 · composition · single year`}
        source="NMFS non-target catch tables (pending ingest)"
        title="What the bycatch is made of, by species."
        caption={
          <>
            <strong>Pending data.</strong> A full species composition of bycatch
            — jellyfish, herring, forage fish, and the non-target invertebrates
            that dominate by weight, alongside groundfish, salmon, and crab —
            requires the NMFS non-target / &quot;other species&quot; catch tables,
            which are not yet in the data pipeline. The managed-groundfish
            discards we can see today (discarded pollock, skates, halibut,
            flatfish) are only part of the picture.
          </>
        }
        note="Awaiting NMFS non-target catch ingest"
      >
        {null}
      </PlaceholderChart>

      {/* 4 — who harvests it */}
      <p className="sm-p">
        The discards come from a handful of gear types, in very different
        amounts. The table below shows who accounts for the groundfish bycatch by
        weight; the chart after it shows how much of each gear's own catch ends up
        discarded — a different question, and a sharper contrast.
      </p>

      {gearRows.length > 0 && (
        <SmTable<GearRow>
          label={`Fig 2.2 · who harvests it · ${yr}`}
          headNote="Federal groundfish, discards by weight"
          title="Who accounts for the bycatch."
          columns={[
            { key: "gear", header: "Gear / fleet" },
            {
              key: "mt",
              header: "Discarded",
              numeric: true,
              render: (r) => `${r.mt.toLocaleString(undefined, { maximumFractionDigits: 0 })} mt`,
            },
            { key: "pct", header: "Share", numeric: true, render: (r) => `${r.pct.toFixed(0)}%` },
          ]}
          rows={gearRows}
          foot={`Discarded managed groundfish by gear, ${yr}. Source: NOAA AKR catch accounting (monitored_catch, Total).`}
        />
      )}

      <ChartCard
        label={`Fig 2.3 · discard rate by gear · 2013–${rateData.at(-1)?.year ?? ""}`}
        source="NOAA AKR Catch Accounting (monitored_catch, Total)"
        title="Discard rate by gear — discarded share of each gear's own catch."
        caption={
          <>
            Lines, percent of each gear's total federal catch by weight that was
            discarded. Bottom trawl and longline carry the most bycatch by weight
            (above), but the midwater pollock fleet discards the smallest share of
            what it catches.
          </>
        }
      >
        {rateData.length > 0 ? (
          <>
            <MultiLine
              data={rateData}
              xKey="year"
              keys={[...GEAR_ORDER]}
              height={300}
              yFormatter={(v) => `${v.toFixed(1)}%`}
              yLabel="Discarded share (%)"
            />
            <Legend items={GEAR_ORDER.map((g, i) => ({ label: GEAR_LABELS[g] ?? g, color: SERIES[i] }))} />
          </>
        ) : (
          <div className="sm-chart-body placeholder">Loading…</div>
        )}
      </ChartCard>

      {/* 5 — what survives (DMRs) */}
      <SmCallout label="Supporting · discard mortality" title="Not everything discarded dies.">
        Some discarded fish survive. How many depends on the gear: fish brought up
        in a trawl are assumed dead at rates above 80 percent, while fish released
        from longline gear survive far more often, with assumed mortality in the
        low teens; pot gear sits between. These gear-specific Discard Mortality
        Rates (DMRs) are what convert discarded tonnage into actual fishing
        mortality. The full DMR table by species, area, and gear is in the
        Discards &amp; mortality rates topic. <strong>Pending data:</strong> a
        single DMR-adjusted bycatch total requires applying every per-species,
        per-gear rate across the catch — not yet wired.
      </SmCallout>

      {/* 6 — the long trend */}
      <p className="sm-p">
        Finally, the long view. The three species that drive the public debate
        each have a multi-decade record — useful context before the detailed
        topics, where each is taken up on its own.
      </p>

      <div className="sm-grid-3">
        <ChartCard label="Chinook · 1991–2024" source="NMFS PSC" title="Chinook bycatch (fish/yr)." height="short"
          caption="Groundfish-fishery Chinook PSC, BSAI + GOA.">
          {chinookTrend.length > 0 ? (
            <MultiLine data={chinookTrend} xKey="year" keys={["v"]} height={160} yFormatter={(v) => `${Math.round(v / 1000)}k`} />
          ) : <div className="sm-chart-body placeholder short">Loading…</div>}
        </ChartCard>
        <ChartCard label="Chum · 1991–2024" source="NMFS PSC" title="Chum bycatch (fish/yr)." height="short"
          caption="Groundfish-fishery chum PSC, BSAI + GOA.">
          {chumTrend.length > 0 ? (
            <MultiLine data={chumTrend} xKey="year" keys={["v"]} height={160} yFormatter={(v) => `${Math.round(v / 1000)}k`} />
          ) : <div className="sm-chart-body placeholder short">Loading…</div>}
        </ChartCard>
        <ChartCard label="Halibut · 1991–2024" source="IPHC" title="Halibut bycatch (M lb/yr)." height="short"
          caption="Non-directed halibut mortality, coastwide.">
          {halibutTrend.length > 0 ? (
            <MultiLine data={halibutTrend} xKey="year" keys={["v"]} height={160} yFormatter={(v) => `${v.toFixed(0)}`} />
          ) : <div className="sm-chart-body placeholder short">Loading…</div>}
        </ChartCard>
      </div>

      <SmCallout label="Supporting · observer coverage" title="How these numbers are collected.">
        The federal catch figures here come from one of the most intensively
        monitored fisheries in the world: the Bering Sea pollock fleet carries an
        observer or camera on essentially every trip, and shoreside plants run two
        observers per offload. The Gulf of Alaska and smaller vessels fall under
        partial coverage. State fisheries, by and large, carry close to none —
        which is why every federal-to-state comparison in this paper comes with a
        caveat.
      </SmCallout>
    </section>
  );
}
