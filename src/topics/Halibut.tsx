import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  IphcSourceMortalityRow,
  IphcSpawningBiomassRow,
  IphcTceyDataRow,
  IfqLandingsRow,
} from "../api/types";
import {
  Card,
  Crumb,
  Legend,
  Note,
  ProportionBar,
  StatGrid,
  Table,
} from "../components/primitives";
import type { ProportionPart } from "../components/primitives";
import TimeSeriesLine from "../components/charts/TimeSeriesLine";
import StackedTrend from "../components/charts/StackedTrend";

const SOURCE_META: Record<
  string,
  { label: string; color: string }
> = {
  commercial_landings: { label: "Directed commercial", color: "#1a2332" },
  directed_discard:    { label: "Directed discard",    color: "#2f5d8a" },
  nondirected_discard: { label: "Bycatch (non-directed)", color: "#b45309" },
  recreational:        { label: "Recreational",        color: "#7b6a4f" },
  subsistence:         { label: "Subsistence",          color: "#a8a29e" },
};

const fmt = (n: number | null | undefined, digits = 2) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: digits });

export default function Halibut() {
  const { data: mortData, isLoading: mortLoading } =
    useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: biomassData, isLoading: biLoading } =
    useDataset<IphcSpawningBiomassRow>("iphc_spawning_biomass");
  const { data: tceyData, isLoading: tceyLoading } =
    useDataset<IphcTceyDataRow>("iphc_tcey");
  const { data: ifqData, isLoading: ifqLoading } =
    useDataset<IfqLandingsRow>("ifq_landings");

  const isLoading = mortLoading || biLoading || tceyLoading || ifqLoading;

  // Most recent non-preliminary year for source breakdown
  const latestFinalYear = useMemo(() => {
    if (!mortData) return null;
    const finals = mortData.filter((r) => r.is_preliminary === 0);
    return finals.length ? Math.max(...finals.map((r) => r.year)) : null;
  }, [mortData]);

  // Proportion bar parts for latest final year
  const proportionParts = useMemo<ProportionPart[]>(() => {
    if (!mortData || latestFinalYear == null) return [];
    return mortData
      .filter(
        (r) => r.year === latestFinalYear && r.source !== "total" && (r.mortality_mlb ?? 0) > 0
      )
      .map((r) => ({
        label: SOURCE_META[r.source]?.label ?? r.source,
        value: r.mortality_mlb ?? 0,
        color: SOURCE_META[r.source]?.color ?? "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [mortData, latestFinalYear]);

  // Source table (last 5 years)
  const sourceTableRows = useMemo(() => {
    if (!mortData || latestFinalYear == null) return [];
    const sources = Object.keys(SOURCE_META);
    const years = Array.from(
      { length: 5 },
      (_, i) => latestFinalYear - 4 + i
    );
    return sources.map((src) => {
      const cells: (string | number)[] = [
        SOURCE_META[src]?.label ?? src,
      ];
      for (const yr of years) {
        const row = mortData.find((r) => r.year === yr && r.source === src);
        cells.push(row?.mortality_mlb != null ? fmt(row.mortality_mlb) : "—");
      }
      return cells;
    });
  }, [mortData, latestFinalYear]);

  // Stacked mortality by source over time — pivot (year, source) → wide row
  const mortalityStack = useMemo(() => {
    if (!mortData) return { chartData: [], sourceKeys: [] };
    const sources = Object.keys(SOURCE_META);
    const maxYear = Math.max(...mortData.map((r) => r.year));
    const years = [...new Set(mortData.map((r) => r.year))].filter((y) => y >= maxYear - 19).sort((a, b) => a - b);
    const chartData = years.map((yr) => {
      const row: Record<string, number | string> = { year: yr };
      for (const src of sources) {
        const label = SOURCE_META[src].label;
        const found = mortData.find((r) => r.year === yr && r.source === src);
        row[label] = found?.mortality_mlb ?? 0;
      }
      return row;
    });
    return { chartData, sourceKeys: sources.map((s) => SOURCE_META[s].label) };
  }, [mortData]);

  // Coastwide spawning biomass (coastwide_long model, with CI band)
  const biomassTrend = useMemo(() => {
    if (!biomassData) return [];
    return biomassData
      .filter((r) => r.model === "coastwide_long")
      .sort((a, b) => a.year - b.year)
      .map((r) => ({
        year: r.year,
        value: r.sb_mlb,
        goalLower: r.sb_low_ci_mlb,
        goalUpper: r.sb_high_ci_mlb,
      }));
  }, [biomassData]);

  // 2026 adopted TCEY by area
  const tcey2026 = useMemo(() => {
    if (!tceyData) return [];
    const maxYear = Math.max(...tceyData.map((r) => r.year));
    return tceyData
      .filter((r) => r.year === maxYear && r.tcey_type === "adopted")
      .sort((a, b) => {
        if (a.area === "Total") return 1;
        if (b.area === "Total") return -1;
        return a.area.localeCompare(b.area);
      });
  }, [tceyData]);

  const tceyMaxYear = tcey2026[0]?.year ?? null;

  // IFQ landings by year and area (halibut only)
  const ifqHalibut = useMemo(() => {
    if (!ifqData) return [];
    return ifqData
      .filter((r) => r.species === "halibut" && r.is_confidential === 0)
      .sort((a, b) => a.year - b.year || a.area.localeCompare(b.area));
  }, [ifqData]);

  const totalMort2024 = useMemo(() => {
    if (!mortData) return null;
    const row = mortData.find(
      (r) => r.year === (latestFinalYear ?? 0) && r.source === "total"
    );
    return row?.mortality_mlb ?? null;
  }, [mortData, latestFinalYear]);

  const totalTcey = tcey2026.find((r) => r.area === "Total");

  return (
    <>
      <Crumb topic="Halibut Mortality by Source" />
      <h1 className="page-title">Halibut Mortality by Source</h1>
      <p className="page-lede first-sentence">
        Pacific halibut is the only Alaska fishery with a single, coastwide
        ledger that reconciles every pound of mortality — directed commercial,
        bycatch, recreational, subsistence, research, wastage — into one annual
        total. That reconciliation is done by the International Pacific Halibut
        Commission, established by a 1923 U.S.–Canada treaty that predates
        every other agency involved.
      </p>
      <p className="page-lede">
        The logic runs from a coastwide biological estimate down to the share
        available to the directed commercial fleet. IPHC sets the{" "}
        <b>Total Constant Exploitation Yield (TCEY)</b> — the all-source
        mortality limit — each January. From TCEY it deducts the projected
        mortality from bycatch in groundfish fisheries, recreational harvest,
        subsistence, and wastage. What remains is the{" "}
        <b>Fishery Constant Exploitation Yield (FCEY)</b>, the
        directed-commercial allocation divided among eight regulatory areas
        from the Oregon coast to the Aleutians.
      </p>
      <p className="page-lede">
        All figures on this page are in <b>net pounds (million lbs)</b> — head-off,
        gutted — the IPHC reporting unit. Values from NMFS or ADF&amp;G in round
        pounds are converted before IPHC consolidates them.
      </p>

      {isLoading && <p className="section-intro">Loading IPHC data…</p>}

      {mortData && latestFinalYear != null && (
        <>
          <StatGrid
            stats={[
              {
                val: totalMort2024 != null ? `${fmt(totalMort2024)} Mlb` : "—",
                label: `Total mortality ${latestFinalYear} (all sources)`,
                sub: "Net lbs, coastwide",
              },
              {
                val: totalTcey?.tcey_mlb != null
                  ? `${fmt(totalTcey.tcey_mlb)} Mlb`
                  : "—",
                label: `${tceyMaxYear ?? "—"} adopted TCEY (coastwide)`,
                sub: "All-source mortality cap",
              },
              {
                val: proportionParts[0]?.value != null
                  ? `${fmt(proportionParts[0].value)} Mlb`
                  : "—",
                label: `Directed commercial ${latestFinalYear}`,
                sub: proportionParts[0]?.label,
                accent: "accent",
              },
              {
                val: proportionParts
                  .filter((_, i) => i > 0)
                  .reduce((s, p) => s + p.value, 0)
                  .toLocaleString("en-US", { maximumFractionDigits: 2 }) + " Mlb",
                label: `All other mortality sources ${latestFinalYear}`,
                sub: "Bycatch, recreational, subsistence",
              },
            ]}
          />

          <h2 className="h2">
            {latestFinalYear} Mortality by source
          </h2>
          <p className="section-intro">
            Proportion of coastwide halibut mortality by reporting sector.
            "Directed commercial" is the IFQ fleet; "bycatch (non-directed)"
            is halibut caught incidentally in federal groundfish fisheries.
          </p>
          <Card>
            <ProportionBar parts={proportionParts} />
            <Legend
              items={proportionParts.map((p) => ({
                label: `${p.label} — ${fmt(p.value)} Mlb`,
                color: p.color,
              }))}
            />
            <div className="data-caption">Source: IPHC stock assessment</div>
          </Card>

          <h2 className="h2">Mortality by source, last 5 years</h2>
          <p className="section-intro">Net pounds (million lbs), coastwide.</p>
          <Card>
            <Table
              columns={[
                { label: "Source" },
                ...Array.from({ length: 5 }, (_, i) => ({
                  label: String(latestFinalYear - 4 + i),
                  num: true,
                })),
              ]}
              rows={sourceTableRows}
              caption="Source: IPHC annual stock assessment, via Mainsail iphc_mortality_by_source"
            />
          </Card>
        </>
      )}

      {mortData && mortalityStack.chartData.length > 0 && (
        <>
          <h2 className="h2">Mortality by source, last 20 years</h2>
          <p className="section-intro">
            How total coastwide halibut mortality has been distributed across
            sectors over the full IPHC record. Directed commercial dominates;
            bycatch and recreational shares have grown since the 1980s.
            Net pounds (million lbs).
          </p>
          <Card>
            <StackedTrend
              data={mortalityStack.chartData}
              xKey="year"
              stackKeys={mortalityStack.sourceKeys}
              colors={Object.values(SOURCE_META).map((m) => m.color)}
              title="Pacific Halibut — coastwide mortality by source"
              yLabel="million lbs"
              yFormatter={(v) => `${v.toFixed(1)}`}
            />
            <div className="data-caption">
              Source: IPHC stock assessment via Mainsail iphc_mortality_by_source
            </div>
          </Card>
        </>
      )}

      {biomassData && biomassTrend.length > 0 && (
        <>
          <h2 className="h2">Coastwide spawning biomass, 1888–present</h2>
          <p className="section-intro">
            Estimated female spawning biomass (coastwide model). Shaded band
            is the 95% confidence interval from the IPHC stock assessment.
            Biomass is in million lbs (net pounds).
          </p>
          <Card>
            <TimeSeriesLine
              data={biomassTrend}
              xKey="year"
              yKey="value"
              title="Pacific Halibut — Coastwide Female Spawning Biomass"
              yLabel="million lbs"
              lineName="Spawning biomass"
              unitSuffix="Mlb"
            />
          </Card>
        </>
      )}

      {tceyData && tcey2026.length > 0 && (
        <>
          <h2 className="h2">
            {tceyMaxYear} TCEY by regulatory area (adopted)
          </h2>
          <p className="section-intro">
            The adopted TCEY is the all-source mortality ceiling for each
            regulatory area. Areas 2A–2C cover the U.S. West Coast and
            Southeast Alaska. Areas 3A–3B are the Central and Western Gulf.
            Areas 4A–4CDE cover the Bering Sea and Aleutians.
          </p>
          <Card>
            <Table
              columns={[
                { label: "Regulatory area" },
                { label: "TCEY (million lbs)", num: true },
                { label: "TCEY (metric tons)", num: true },
              ]}
              rows={tcey2026.map((r) => [
                r.area === "Total" ? `Total coastwide` : `Area ${r.area}`,
                fmt(r.tcey_mlb),
                fmt(r.tcey_tonnes, 0),
              ])}
              caption="Source: IPHC annual meeting materials, via Mainsail iphc_tcey"
            />
          </Card>
        </>
      )}

      {ifqData && ifqHalibut.length > 0 && (
        <>
          <h2 className="h2">IFQ halibut landings, 2022–present</h2>
          <p className="section-intro">
            Directed commercial halibut through the Individual Fishing Quota
            (IFQ) program. Catch and allocation in metric tons (net head-off,
            gutted). IFQ program began 1995; pre-2022 NMFS URLs currently
            return 404 — additional years pending.
          </p>
          <Note>
            <b>Units differ from IPHC figures above.</b> IPHC mortality
            figures are in net pounds; these IFQ figures are in metric tons.
            Do not combine the two without conversion.
          </Note>
          <Card>
            <Table
              columns={[
                { label: "Year", yr: true },
                { label: "Area" },
                { label: "Vessels" },
                { label: "Catch (mt)", num: true },
                { label: "Allocation (mt)", num: true },
                { label: "% landed", num: true },
              ]}
              rows={ifqHalibut.map((r) => [
                r.year,
                `Area ${r.area}`,
                r.vessel_landings?.toLocaleString() ?? "—",
                fmt(r.catch_mt, 1),
                fmt(r.allocation_mt, 1),
                r.pct_landed != null ? `${r.pct_landed}%` : "—",
              ])}
              caption="Source: NMFS AKRO IFQ reports, via Mainsail ifq_landings"
            />
          </Card>
        </>
      )}
    </>
  );
}
