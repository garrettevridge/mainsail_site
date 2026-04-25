import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  IphcSourceMortalityRow,
  IphcSpawningBiomassRow,
  IphcTceyDataRow,
  IfqLandingsRow,
  IphcAreaMortalityRow,
  MonitoredCatchRow,
} from "../api/types";
import {
  Card,
  Crumb,
  DataContext,
  Legend,
  Note,
  ProportionBar,
  StatGrid,
  Table,
} from "../components/primitives";
import type { ProportionPart } from "../components/primitives";
import TimeSeriesLine from "../components/charts/TimeSeriesLine";
import StackedTrend from "../components/charts/StackedTrend";

const SOURCE_META: Record<string, { label: string; color: string }> = {
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
  const { data: areaData, isLoading: areaLoading } =
    useDataset<IphcAreaMortalityRow>("iphc_mortality_by_area");
  const { data: catchData, isLoading: catchLoading } =
    useDataset<MonitoredCatchRow>("monitored_catch");

  const isLoading = mortLoading || biLoading || tceyLoading || ifqLoading || areaLoading || catchLoading;

  const latestFinalYear = useMemo(() => {
    if (!mortData) return null;
    const finals = mortData.filter((r) => r.is_preliminary === 0);
    return finals.length ? Math.max(...finals.map((r) => r.year)) : null;
  }, [mortData]);

  const proportionParts = useMemo<ProportionPart[]>(() => {
    if (!mortData || latestFinalYear == null) return [];
    return mortData
      .filter((r) => r.year === latestFinalYear && r.source !== "total" && (r.mortality_mlb ?? 0) > 0)
      .map((r) => ({
        label: SOURCE_META[r.source]?.label ?? r.source,
        value: r.mortality_mlb ?? 0,
        color: SOURCE_META[r.source]?.color ?? "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [mortData, latestFinalYear]);

  const sourceTableRows = useMemo(() => {
    if (!mortData || latestFinalYear == null) return [];
    const sources = Object.keys(SOURCE_META);
    const years = Array.from({ length: 5 }, (_, i) => latestFinalYear - 4 + i);
    return sources.map((src) => {
      const cells: (string | number)[] = [SOURCE_META[src]?.label ?? src];
      for (const yr of years) {
        const row = mortData.find((r) => r.year === yr && r.source === src);
        cells.push(row?.mortality_mlb != null ? fmt(row.mortality_mlb) : "—");
      }
      return cells;
    });
  }, [mortData, latestFinalYear]);

  const mortalityStack = useMemo(() => {
    if (!mortData) return { chartData: [], sourceKeys: [] };
    const sources = Object.keys(SOURCE_META);
    const maxYear = Math.max(...mortData.map((r) => r.year));
    const years = [...new Set(mortData.map((r) => r.year))].filter((y) => y >= maxYear - 9).sort((a, b) => a - b);
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

  const biomassTrend = useMemo(() => {
    if (!biomassData) return [];
    return biomassData
      .filter((r) => r.model === "coastwide_long")
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ year: r.year, value: r.sb_mlb, goalLower: r.sb_low_ci_mlb, goalUpper: r.sb_high_ci_mlb }));
  }, [biomassData]);

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

  const ifqHalibut = useMemo(() => {
    if (!ifqData) return [];
    return ifqData
      .filter((r) => r.species === "halibut" && r.is_confidential === 0)
      .sort((a, b) => a.year - b.year || a.area.localeCompare(b.area));
  }, [ifqData]);

  // Area mortality — most recent 5 years, pivot year as columns
  const areaMortTable = useMemo(() => {
    if (!areaData) return { rows: [], years: [] };
    const maxYear = Math.max(...areaData.map((r) => r.year));
    const years = Array.from({ length: 5 }, (_, i) => maxYear - 4 + i);
    const areas = [...new Set(areaData.map((r) => r.area))]
      .filter((a) => a !== "Total")
      .sort((a, b) => a.localeCompare(b));
    const rows = areas.map((area) => {
      const cells: (string | number)[] = [`Area ${area}`];
      for (const yr of years) {
        const row = areaData.find((r) => r.year === yr && r.area === area);
        cells.push(row?.mortality_mlb != null ? fmt(row.mortality_mlb) + (row.is_preliminary === 1 ? " †" : "") : "—");
      }
      return cells;
    });
    const totalRows = years.map((yr) => {
      const row = areaData.find((r) => r.year === yr && r.area === "Total");
      return row?.mortality_mlb != null ? fmt(row.mortality_mlb) + (row.is_preliminary === 1 ? " †" : "") : "—";
    });
    rows.push(["Total coastwide", ...totalRows]);
    return { rows, years };
  }, [areaData]);

  // Area mortality trend (last 20 years, non-Total areas)
  const areaMortTrend = useMemo(() => {
    if (!areaData) return { chartData: [], areas: [] };
    const maxYear = Math.max(...areaData.map((r) => r.year));
    const areas = [...new Set(areaData.map((r) => r.area))]
      .filter((a) => a !== "Total")
      .sort((a, b) => a.localeCompare(b));
    const years = [...new Set(areaData.map((r) => r.year))].filter((y) => y >= maxYear - 19).sort((a, b) => a - b);
    const chartData = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const area of areas) {
        const row = areaData.find((r) => r.year === yr && r.area === area);
        point[`Area ${area}`] = row?.mortality_mlb ?? 0;
      }
      return point;
    });
    return { chartData, areas: areas.map((a) => `Area ${a}`) };
  }, [areaData]);

  const AREA_COLORS = ["#1a2332","#2f5d8a","#6b8fad","#b45309","#7b6a4f","#a8a29e","#d4c5b0","#4a7c6f"];

  const totalMort2024 = useMemo(() => {
    if (!mortData) return null;
    const row = mortData.find((r) => r.year === (latestFinalYear ?? 0) && r.source === "total");
    return row?.mortality_mlb ?? null;
  }, [mortData, latestFinalYear]);

  const totalTcey = tcey2026.find((r) => r.area === "Total");

  const SECTOR_SHORT: Record<string, string> = {
    "Catcher/Processor":                "C/P",
    "Catcher Vessel":                   "CV",
    "Catcher Vessel: AFA":              "CV (AFA)",
    "Catcher Vessel: PCTC":             "CV (PCTC)",
    "Catcher Vessel: Rockfish Program": "CV (Rockfish)",
    "Mothership":                       "Mothership",
  };

  const SECTOR_COLORS = ["#1a2332","#2f5d8a","#6b8fad","#b45309","#7b6a4f","#a8a29e"];

  const halinBycatchTrend = useMemo(() => {
    if (!catchData) return { chartData: [], sectors: [] };
    const hal = catchData.filter(
      (r) => r.species_group === "Pacific Halibut" && r.disposition === "Discarded" && r.monitored_or_total === "Total"
    );
    const sectors = [...new Set(hal.map((r) => r.sector))].sort();
    const years = [...new Set(hal.map((r) => r.year))].sort((a, b) => a - b);
    const chartData = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const s of sectors) {
        const label = SECTOR_SHORT[s] ?? s;
        point[label] = hal
          .filter((r) => r.year === yr && r.sector === s)
          .reduce((sum, r) => sum + (r.metric_tons ?? 0), 0);
      }
      return point;
    });
    return { chartData, sectors: sectors.map((s) => SECTOR_SHORT[s] ?? s) };
  }, [catchData]);

  const halinBycatchLatest = useMemo(() => {
    if (!catchData) return { rows: [], year: null as number | null };
    const hal = catchData.filter(
      (r) => r.species_group === "Pacific Halibut" && r.disposition === "Discarded" && r.monitored_or_total === "Total"
    );
    if (!hal.length) return { rows: [], year: null };
    const maxYr = Math.max(...hal.map((r) => r.year));
    const byGear = new Map<string, number>();
    for (const r of hal.filter((r) => r.year === maxYr)) {
      byGear.set(r.gear, (byGear.get(r.gear) ?? 0) + (r.metric_tons ?? 0));
    }
    const rows = [...byGear.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([gear, mt]) => [gear, `${Math.round(mt).toLocaleString()} mt`]);
    return { rows, year: maxYr };
  }, [catchData]);

  return (
    <>
      <Crumb topic="Halibut Mortality by Source" />
      <h1 className="page-title">Halibut Mortality by Source</h1>

      <DataContext
        use={[
          "iphc_mortality_by_source — coastwide mortality by source (commercial, bycatch, recreational, subsistence)",
          "iphc_mortality_by_area — mortality by regulatory area (2A–4D)",
          "iphc_spawning_biomass — female spawning biomass 1888–present",
          "iphc_tcey — adopted total constant exploitation yield by area",
          "ifq_landings — IFQ halibut landings by year and area",
          "monitored_catch — halibut bycatch (discarded) by fleet and gear",
        ]}
        could={[
          "iphc_setline_survey — annual setline survey CPUE indices",
          "iphc_age_composition — age/sex sampling from commercial landings",
          "cdq_halibut_allocations — CDQ group halibut allocations",
          "sport_halibut_creel — ADF&G creel survey charter catch estimates",
        ]}
        ideas={[
          "Bycatch share of total mortality trend (% non-directed)",
          "TCEY vs. actual mortality by area over time",
          "Biomass vs. mortality ratio (exploitation rate)",
          "IFQ utilization rate by area (% allocation landed)",
        ]}
      />

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
                val: totalTcey?.tcey_mlb != null ? `${fmt(totalTcey.tcey_mlb)} Mlb` : "—",
                label: `${tceyMaxYear ?? "—"} adopted TCEY (coastwide)`,
                sub: "All-source mortality cap",
              },
              {
                val: proportionParts[0]?.value != null ? `${fmt(proportionParts[0].value)} Mlb` : "—",
                label: `Directed commercial ${latestFinalYear}`,
                sub: proportionParts[0]?.label,
                accent: "accent",
              },
              {
                val: proportionParts.filter((_, i) => i > 0).reduce((s, p) => s + p.value, 0).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " Mlb",
                label: `All other mortality sources ${latestFinalYear}`,
                sub: "Bycatch, recreational, subsistence",
              },
            ]}
          />

          <h2 className="h2">{latestFinalYear} mortality by source</h2>
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
              caption="Source: IPHC annual stock assessment, via Mainsail iphc_mortality_by_source. Net lbs (million lbs)."
            />
          </Card>
        </>
      )}

      {mortData && mortalityStack.chartData.length > 0 && (
        <>
          <h2 className="h2">Mortality by source, last 10 years</h2>
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

      {areaData && areaMortTable.rows.length > 0 && (
        <>
          <h2 className="h2">Mortality by regulatory area, last 5 years</h2>
          <Card>
            <Table
              columns={[
                { label: "Area" },
                ...areaMortTable.years.map((yr) => ({ label: String(yr), num: true })),
              ]}
              rows={areaMortTable.rows}
              caption="Source: IPHC stock assessment via Mainsail iphc_mortality_by_area. Net lbs (million lbs). † = preliminary."
            />
          </Card>
        </>
      )}

      {areaData && areaMortTrend.chartData.length > 0 && (
        <>
          <h2 className="h2">Mortality by regulatory area, last 20 years</h2>
          <Card>
            <StackedTrend
              data={areaMortTrend.chartData}
              xKey="year"
              stackKeys={areaMortTrend.areas}
              colors={AREA_COLORS}
              title="Pacific Halibut — mortality by regulatory area"
              yLabel="million lbs"
              yFormatter={(v) => `${v.toFixed(1)}`}
            />
            <div className="data-caption">
              Source: IPHC stock assessment via Mainsail iphc_mortality_by_area
            </div>
          </Card>
        </>
      )}

      {biomassData && biomassTrend.length > 0 && (
        <>
          <h2 className="h2">Coastwide spawning biomass, 1888–present</h2>
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
          <h2 className="h2">{tceyMaxYear} TCEY by regulatory area (adopted)</h2>
          <Card>
            <Table
              columns={[
                { label: "Regulatory area" },
                { label: "TCEY (million lbs)", num: true },
                { label: "TCEY (metric tons)", num: true },
              ]}
              rows={tcey2026.map((r) => [
                r.area === "Total" ? "Total coastwide" : `Area ${r.area}`,
                fmt(r.tcey_mlb),
                fmt(r.tcey_tonnes, 0),
              ])}
              caption="Source: IPHC annual meeting materials, via Mainsail iphc_tcey"
            />
          </Card>
        </>
      )}

      {catchData && halinBycatchTrend.chartData.length > 0 && (
        <>
          <h2 className="h2">Halibut bycatch (discarded) by fleet, 2013–present</h2>
          <Card>
            <StackedTrend
              data={halinBycatchTrend.chartData}
              xKey="year"
              stackKeys={halinBycatchTrend.sectors}
              colors={SECTOR_COLORS}
              title="Pacific Halibut discards by fleet — federal groundfish fisheries"
              yLabel="metric tons"
              yFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v))}
            />
            <div className="data-caption">
              Source: NMFS AKRO monitored catch via Mainsail monitored_catch (disposition = Discarded, Total rows)
            </div>
          </Card>
        </>
      )}

      {catchData && halinBycatchLatest.rows.length > 0 && (
        <>
          <h2 className="h2">{halinBycatchLatest.year} halibut bycatch by gear type</h2>
          <Card>
            <Table
              columns={[
                { label: "Gear" },
                { label: "Discarded (mt)", num: true },
              ]}
              rows={halinBycatchLatest.rows}
              caption={`Source: NMFS AKRO monitored catch via Mainsail monitored_catch, year ${halinBycatchLatest.year}`}
            />
          </Card>
        </>
      )}

      {ifqData && ifqHalibut.length > 0 && (
        <>
          <h2 className="h2">IFQ halibut landings, 2022–present</h2>
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
