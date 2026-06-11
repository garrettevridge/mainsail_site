import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type {
  IphcSourceMortalityRow,
  MonitoredCatchRow,
} from "../../api/types";
import ChartCard from "../ChartCard";
import { StackedBar, Legend } from "../SmChart";
import SmTable from "../SmTable";
import SmCallout from "../SmCallout";
import { SERIES } from "../colors";

// IPHC publishes mortality_mlb (million lbs) by source.
const SOURCE_ORDER = [
  "commercial_landings",
  "nondirected_discard",
  "recreational",
  "directed_discard",
  "subsistence",
] as const;

const SOURCE_LABELS: Record<(typeof SOURCE_ORDER)[number], string> = {
  commercial_landings: "Directed commercial",
  nondirected_discard: "Non-directed bycatch (groundfish)",
  recreational: "Charter / recreational",
  directed_discard: "Directed discard (longline)",
  subsistence: "Subsistence",
};

// Plain-language gear labels for the by-fleet halibut bycatch table.
const GEAR_LABELS: Record<string, string> = {
  "Hook and Line": "Hook-and-line (longline)",
  "Nonpelagic Trawl": "Bottom trawl",
  "Pelagic Trawl": "Midwater (pelagic) trawl",
  Pot: "Pot",
  Jig: "Jig",
};

const FLEET_AVG_START = 2020; // 5-year window for the by-fleet averages

interface FleetRow {
  gear: string;
  mtPerYear: number;
  sharePct: number;
}

export default function Halibut() {
  const { data } = useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: monitored } = useDataset<MonitoredCatchRow>("monitored_catch");

  const chartData = useMemo(() => {
    if (!data) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of data) {
      if (r.mortality_mlb == null) continue;
      if (r.source === "total") continue;
      if (!SOURCE_ORDER.includes(r.source as (typeof SOURCE_ORDER)[number])) continue;
      if (r.year < 1980) continue;
      const row = byYear.get(r.year) ?? { year: r.year };
      const label = SOURCE_LABELS[r.source as (typeof SOURCE_ORDER)[number]];
      row[label] = (row[label] ?? 0) + r.mortality_mlb;
      byYear.set(r.year, row);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [data]);

  // Shares of total coastwide halibut fishing mortality, latest IPHC year:
  // non-directed groundfish bycatch vs. directed charter/recreational sport.
  const bycatchShare = useMemo(() => {
    if (!data) return null;
    const latest = Math.max(
      ...data.filter((r) => r.mortality_mlb != null).map((r) => r.year)
    );
    const rows = data.filter((r) => r.year === latest && r.source !== "total" && r.mortality_mlb != null);
    const total = rows.reduce((a, r) => a + (r.mortality_mlb ?? 0), 0);
    const share = (src: string) =>
      rows.filter((r) => r.source === src).reduce((a, r) => a + (r.mortality_mlb ?? 0), 0);
    if (total <= 0) return null;
    return {
      year: latest,
      pct: Math.round((share("nondirected_discard") / total) * 100),
      recPct: Math.round((share("recreational") / total) * 100),
    };
  }, [data]);

  // Midwater pollock trawl's halibut bycatch trend — first vs. latest year —
  // for the "barely registers, and shrinking" point.
  const pelagicTrend = useMemo(() => {
    if (!monitored) return null;
    const byYear = new Map<number, number>();
    for (const r of monitored) {
      if (r.species_group !== "Pacific Halibut") continue;
      if (r.disposition !== "Discarded" || r.monitored_or_total !== "Total") continue;
      if (r.gear !== "Pelagic Trawl") continue;
      byYear.set(r.year, (byYear.get(r.year) ?? 0) + r.metric_tons);
    }
    if (byYear.size < 2) return null;
    const yrs = [...byYear.keys()].sort((a, b) => a - b);
    const first = byYear.get(yrs[0])!;
    const last = byYear.get(yrs[yrs.length - 1])!;
    return { firstYear: yrs[0], lastYear: yrs[yrs.length - 1], declinePct: Math.round((1 - last / first) * 100) };
  }, [monitored]);

  // Halibut bycatch (PSC discards in the groundfish fisheries) by gear, recent
  // 5-year average — "who catches the bycatch, by fleet."
  const fleetRows = useMemo<FleetRow[]>(() => {
    if (!monitored) return [];
    const byGear = new Map<string, number>();
    const years = new Set<number>();
    for (const r of monitored) {
      if (r.species_group !== "Pacific Halibut") continue;
      if (r.disposition !== "Discarded") continue;
      if (r.monitored_or_total !== "Total") continue;
      if (r.year < FLEET_AVG_START) continue;
      byGear.set(r.gear, (byGear.get(r.gear) ?? 0) + r.metric_tons);
      years.add(r.year);
    }
    const n = years.size || 1;
    const total = [...byGear.values()].reduce((a, b) => a + b, 0);
    if (total <= 0) return [];
    return [...byGear.entries()]
      .map(([gear, mt]) => ({
        gear: GEAR_LABELS[gear] ?? gear,
        mtPerYear: mt / n,
        sharePct: (mt / total) * 100,
      }))
      .sort((a, b) => b.mtPerYear - a.mtPerYear);
  }, [monitored]);

  const fleetYears = useMemo(() => {
    if (!monitored) return "";
    const ys = monitored
      .filter((r) => r.species_group === "Pacific Halibut" && r.year >= FLEET_AVG_START)
      .map((r) => r.year);
    return ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : "";
  }, [monitored]);

  return (
    <section id="halibut" className="sm-section">
      <div className="sm-marker">
        <span className="num">Halibut</span>
        <span className="title">The mortality budget</span>
      </div>

      <h2 className="sm-h2">
        Halibut <span className="accent">mortality, by source.</span>
      </h2>

      <p className="sm-p">
        Halibut is taken by nearly every Alaska fishery — directly by a
        commercial longline fleet and by charter and sport anglers, and
        incidentally by the groundfish fleets fishing for other species. The
        chart below shows the full coastwide mortality budget by source.
      </p>

      <p className="sm-p">
        In {bycatchShare ? bycatchShare.year : "the latest year"}, non-directed
        bycatch across all the groundfish fleets accounted for about{" "}
        {bycatchShare ? `${bycatchShare.pct} percent` : "one-sixth"} of coastwide
        halibut mortality. Charter and recreational fishing accounted for about{" "}
        {bycatchShare ? `${bycatchShare.recPct} percent` : "a fifth"}, much of it
        from released fish that do not survive — a larger share than all
        groundfish bycatch combined. The directed commercial longline fishery is
        the remainder. The series runs back to 1980.
      </p>

      <ChartCard
        label={`Fig 3.6 · primary · ${chartData[0]?.year ?? ""}–${chartData.at(-1)?.year ?? ""}`}
        source="IPHC mortality-by-source (coastwide)"
        title="Total halibut fishing mortality, by source, by year."
        height="tall"
        caption={
          <>
            Stacked bars by year, IPHC-published fishing mortality (million lbs)
            by source. Directed commercial longline dominates; non-directed
            bycatch from groundfish trawl and longline is a single-digit-to-low
            share of the total. IPHC records date to 1888 — the chart starts in
            1980 for legibility. Series exclude the IPHC &quot;total&quot; row to
            avoid double-counting.
          </>
        }
      >
        {chartData.length > 0 ? (
          <>
            <StackedBar
              data={chartData}
              xKey="year"
              keys={SOURCE_ORDER.map((s) => SOURCE_LABELS[s])}
              height={360}
              yFormatter={(v) => `${v.toFixed(1)} M lb`}
            />
            <Legend
              items={SOURCE_ORDER.map((s, i) => ({
                label: SOURCE_LABELS[s],
                color: SERIES[i],
              }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <p className="sm-p">
        Within the groundfish-fishery bycatch, the table below breaks the
        halibut down by gear. The hook-and-line longline fleet accounts for about
        two-thirds, and the bottom-trawl catcher-processor fleet — the Amendment
        80 sector — for most of the rest. The midwater pollock fleet accounts for
        roughly one percent
        {pelagicTrend ? `, down about ${pelagicTrend.declinePct} percent since ${pelagicTrend.firstYear}` : ""}.
      </p>

      {fleetRows.length > 0 && (
        <SmTable<FleetRow>
          label={`Fig 3.7 · bycatch by fleet · ${fleetYears} average`}
          headNote="Federal groundfish fisheries"
          title="Who catches the halibut bycatch."
          columns={[
            { key: "gear", header: "Gear / fleet" },
            {
              key: "mt",
              header: "Halibut discarded",
              numeric: true,
              render: (r) =>
                `${r.mtPerYear.toLocaleString(undefined, { maximumFractionDigits: 0 })} mt/yr`,
            },
            {
              key: "share",
              header: "Share of bycatch",
              numeric: true,
              render: (r) => `${r.sharePct.toFixed(0)}%`,
            },
          ]}
          rows={fleetRows}
          foot={
            <>
              Pacific halibut discarded (bycatch) in the federal groundfish
              fisheries, average annual metric tons over {fleetYears}. Source:
              NOAA AKR catch accounting (monitored_catch, Total). This is the
              groundfish-fishery incidental catch only — it does not include the
              directed halibut longline fishery, which lands halibut on purpose.
            </>
          }
        />
      )}

      <SmCallout label="Supporting · discard mortality" title="Not everything thrown back dies.">
        How much discarded halibut dies depends on the gear. Fish brought up in a
        trawl are assumed dead at rates above 80 percent; fish released from
        longline gear survive far more often, with assumed mortality in the low
        teens; pot gear sits in between. These gear-specific Discard Mortality
        Rates (DMRs) convert the discarded tonnage into the mortality budget
        above. The full table of current DMRs by species, area, and gear is in
        the Discards &amp; DMRs section.
      </SmCallout>
    </section>
  );
}
