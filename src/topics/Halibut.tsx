import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  IphcSourceMortalityRow,
  IphcSpawningBiomassRow,
  IphcTceyDataRow,
  IfqLandingsRow,
  IphcAreaMortalityRow,
  MonitoredCatchRow,
  DiscardMortalityRateRow,
  SportHarvestDataRow,
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
  const { data: dmrData } =
    useDataset<DiscardMortalityRateRow>("discard_mortality_rates");
  const { data: sportData } =
    useDataset<SportHarvestDataRow>("sport_harvest");

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

  // Sport catch-and-release mortality. Note: SWHS publishes counts of fish
  // (not weight), so every column here is in fish numbers — including the
  // C&R mortality estimate, which is released fish × the IPHC sport DMR.
  // To convert to lbs, an average-weight assumption would be required,
  // which we do not impose.
  const sportCR = useMemo(() => {
    if (!sportData) return { rows: [], hasDmr: false };
    const hal = sportData.filter((r) => r.species_code === "HA");
    if (!hal.length) return { rows: [], hasDmr: false };

    // Look up the Coastwide sport DMR if it exists in the database yet
    const crDmr = dmrData?.find(
      (d) => d.species === "Pacific halibut" && d.gear_type === "Sport (hook-and-line)"
    )?.dmr_value ?? null;

    const years = [...new Set(hal.map((r) => r.year))].sort((a, b) => b - a);
    const rows = years.map((yr) => {
      const catch_ = hal.filter((r) => r.year === yr && r.record_type === "catch")
        .reduce((s, r) => s + (r.fish_count ?? 0), 0);
      const harvest = hal.filter((r) => r.year === yr && r.record_type === "harvest")
        .reduce((s, r) => s + (r.fish_count ?? 0), 0);
      const released = catch_ - harvest;
      const mortEst = crDmr != null ? Math.round(released * crDmr) : null;
      return [
        yr,
        Math.round(catch_).toLocaleString(),
        Math.round(harvest).toLocaleString(),
        Math.round(released).toLocaleString(),
        mortEst != null ? mortEst.toLocaleString() : "—",
      ];
    });
    return { rows, hasDmr: crDmr != null };
  }, [sportData, dmrData]);

  // Wide-format mortality-by-source table in metric tons, with spawning
  // biomass alongside. Mirrors the Chinook annual-mortality-by-source
  // pattern (one row per year, sources as columns, partial-coverage flag).
  // We deliberately do NOT compute "biomass minus mortality" — biomass
  // (mature spawners only) and mortality (all sizes/ages removed) are
  // not directly subtractable; presenting both lets readers form their
  // own ratio without Mainsail imposing one.
  const mortalityWideTable = useMemo(() => {
    if (!mortData) return { rows: [], anyPreliminary: false };
    const sources = Object.keys(SOURCE_META);
    const years = [...new Set(mortData.map((r) => r.year))].sort((a, b) => b - a);
    const sbByYear = new Map<number, number | null>();
    if (biomassData) {
      for (const r of biomassData.filter((r) => r.model === "coastwide_long")) {
        sbByYear.set(r.year, r.sb_tonnes);
      }
    }
    let anyPreliminary = false;
    const rows = years.map((yr) => {
      const yearRows = mortData.filter((r) => r.year === yr);
      const isPrelim = yearRows.some((r) => r.is_preliminary === 1);
      if (isPrelim) anyPreliminary = true;
      const cells: (string | number)[] = [
        isPrelim ? `${yr} ◊` : String(yr),
      ];
      let total = 0;
      let allPresent = true;
      for (const src of sources) {
        const row = yearRows.find((r) => r.source === src);
        const val = row?.mortality_tonnes;
        if (val == null) {
          allPresent = false;
          cells.push("—");
        } else {
          total += val;
          cells.push(Math.round(val).toLocaleString());
        }
      }
      cells.push(allPresent ? Math.round(total).toLocaleString() : `${Math.round(total).toLocaleString()} ◊`);
      const sb = sbByYear.get(yr);
      cells.push(sb != null ? Math.round(sb).toLocaleString() : "—");
      return cells;
    });
    return { rows, anyPreliminary };
  }, [mortData, biomassData]);

  // Map monitored_catch gear names → DMR gear_type labels
  const GEAR_TO_DMR: Record<string, string> = {
    "Hook and Line":   "Longline (hook-and-line)",
    "Nonpelagic Trawl": "Trawl",
    "Pelagic Trawl":   "Trawl",
    "Pot":             "Pot",
  };

  const discardMortality = useMemo(() => {
    if (!catchData || !dmrData) return { rows: [], year: null as number | null, bsaiTrawlGap: false };
    const hal = catchData.filter(
      (r) => r.species_group === "Pacific Halibut" && r.disposition === "Discarded" && r.monitored_or_total === "Total"
    );
    if (!hal.length) return { rows: [], year: null, bsaiTrawlGap: false };
    const maxYr = Math.max(...hal.map((r) => r.year));
    const halYear = hal.filter((r) => r.year === maxYr);

    // Build (gear, fmp_area) → discarded mt
    const byKey = new Map<string, number>();
    for (const r of halYear) {
      const key = `${r.gear}|${r.fmp_area}`;
      byKey.set(key, (byKey.get(key) ?? 0) + (r.metric_tons ?? 0));
    }

    // Look up best DMR: match species + gear_type + fmp_area, pick highest effective_year_start
    const lookupDmr = (gear: string, fmpArea: string): { dmr: number | null; gap: boolean } => {
      const dmrGear = GEAR_TO_DMR[gear];
      if (!dmrGear) return { dmr: null, gap: false };
      const candidates = dmrData
        .filter((d) => d.species === "Pacific halibut" && d.gear_type === dmrGear && d.fmp_area === fmpArea)
        .sort((a, b) => b.effective_year_start - a.effective_year_start);
      if (!candidates.length) return { dmr: null, gap: false };
      const best = candidates[0];
      // Flag if the most recent entry has expired (effective_year_end < current year)
      const gap = best.effective_year_end != null && best.effective_year_end < maxYr;
      return { dmr: best.dmr_value, gap };
    };

    let bsaiTrawlGap = false;
    const rows: (string | number)[][] = [];
    let totalDiscard = 0, totalMort = 0;

    for (const [key, mt] of [...byKey.entries()].sort(([, a], [, b]) => b - a)) {
      const [gear, area] = key.split("|");
      const { dmr, gap } = lookupDmr(gear, area);
      if (gap && (gear === "Nonpelagic Trawl" || gear === "Pelagic Trawl") && area === "BSAI") {
        bsaiTrawlGap = true;
      }
      const mortEst = dmr != null ? mt * dmr : null;
      totalDiscard += mt;
      if (mortEst != null) totalMort += mortEst;
      rows.push([
        gear,
        area,
        `${Math.round(mt).toLocaleString()} mt`,
        dmr != null ? `${(dmr * 100).toFixed(0)}%${gap ? " †" : ""}` : "—",
        mortEst != null ? `${Math.round(mortEst).toLocaleString()} mt` : "—",
      ]);
    }

    rows.push([
      "Total", "",
      `${Math.round(totalDiscard).toLocaleString()} mt`,
      "",
      `${Math.round(totalMort).toLocaleString()} mt`,
    ]);

    return { rows, year: maxYr, bsaiTrawlGap };
  }, [catchData, dmrData]);

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
          "sport_harvest — ADF&G SWHS halibut catch vs. harvest (releases implied)",
          "discard_mortality_rates — DMR by gear including IPHC sport C&R rate (16%)",
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

          <h2 className="h2">{latestFinalYear} mortality by source — IPHC coastwide</h2>
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

          <h2 className="h2">Mortality by source, last 5 years — IPHC coastwide</h2>
          <Card>
            <Table
              columns={[
                { label: "Source" },
                ...Array.from({ length: 5 }, (_, i) => ({
                  label: `${latestFinalYear - 4 + i} (Mlb)`,
                  num: true,
                })),
              ]}
              rows={sourceTableRows}
              caption="Source: Seamark Analytics, derived from IPHC annual stock assessment, via Mainsail iphc_mortality_by_source. Values in net million pounds (Mlb). Region: IPHC coastwide (Areas 2A–4D)."
            />
          </Card>
        </>
      )}

      {mortData && mortalityWideTable.rows.length > 0 && (
        <>
          <h2 className="h2">Annual mortality by source — IPHC coastwide, with spawning biomass</h2>
          <Note>
            <b>Methodology &amp; coverage.</b> Each mortality column is
            published directly by IPHC's stock assessment in the{" "}
            <code>iphc_mortality_by_source</code> dataset (metric tons of
            net weight); the "Total" column sums those columns for the
            year. Years with any preliminary component are flagged ◊.
            <ul style={{ margin: "0.5em 0 0.5em 1.25em" }}>
              <li><b>Directed commercial:</b> O32 IFQ landings (net weight).</li>
              <li><b>Directed discard:</b> sub-legal (U32) wastage and other
                directed discard mortality applied at the IPHC's published
                rate.</li>
              <li><b>Bycatch (non-directed):</b> halibut PSC mortality from
                non-directed groundfish fisheries (NMFS / DFO, applied at
                the relevant DMR).</li>
              <li><b>Recreational:</b> sport kept + IPHC-modeled release
                mortality across IPHC areas.</li>
              <li><b>Subsistence:</b> reported subsistence and ceremonial
                removals.</li>
            </ul>
            <b>Spawning biomass (SB) and mortality are not directly
            subtractable.</b> Spawning biomass is the IPHC stock
            assessment's modeled estimate of female spawners only;
            total mortality includes removals across all sizes, sexes,
            and ages (including U32 and bycatch of non-mature fish).
            Both columns are shown here so readers can see the two
            published series side by side; Mainsail does not compute a
            "biomass minus mortality" figure because the two series do
            not represent the same population.
          </Note>
          <Card>
            <Table
              columns={[
                { label: "Year", yr: true },
                { label: "Directed commercial (mt)", num: true },
                { label: "Directed discard (mt)", num: true },
                { label: "Bycatch (mt)", num: true },
                { label: "Recreational (mt)", num: true },
                { label: "Subsistence (mt)", num: true },
                { label: "Total mortality (mt)", num: true },
                { label: "Spawning biomass (mt)", num: true },
              ]}
              rows={mortalityWideTable.rows}
              caption={`Source: Seamark Analytics, derived from IPHC annual stock assessment, via Mainsail iphc_mortality_by_source and iphc_spawning_biomass (coastwide_long model). All values in metric tons of net weight; spawning biomass is IPHC-modeled female SB. Region: IPHC coastwide (Areas 2A–4D).${mortalityWideTable.anyPreliminary ? " ◊ = preliminary year (one or more components flagged is_preliminary=1)." : ""}`}
            />
          </Card>
        </>
      )}

      {mortData && mortalityStack.chartData.length > 0 && (
        <>
          <h2 className="h2">Mortality by source, last 20 years — IPHC coastwide</h2>
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
          <h2 className="h2">Mortality by regulatory area, last 5 years — IPHC areas 2A–4D</h2>
          <Card>
            <Table
              columns={[
                { label: "Area" },
                ...areaMortTable.years.map((yr) => ({ label: `${yr} (Mlb)`, num: true })),
              ]}
              rows={areaMortTable.rows}
              caption="Source: Seamark Analytics, derived from IPHC annual stock assessment, via Mainsail iphc_mortality_by_area. Values in net million pounds (Mlb). Region: IPHC regulatory areas 2A, 2B, 2C, 3A, 3B, 4A, 4B, 4CDE. † = preliminary."
            />
          </Card>
        </>
      )}

      {areaData && areaMortTrend.chartData.length > 0 && (
        <>
          <h2 className="h2">Mortality by regulatory area, last 20 years — IPHC areas 2A–4D</h2>
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
          <h2 className="h2">{tceyMaxYear} TCEY by regulatory area (adopted) — IPHC areas 2A–4D</h2>
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
              caption="Source: Seamark Analytics, derived from IPHC Annual Meeting materials, via Mainsail iphc_tcey. Region: IPHC regulatory areas 2A, 2B, 2C, 3A, 3B, 4A, 4B, 4CDE."
            />
          </Card>
        </>
      )}

      {catchData && halinBycatchTrend.chartData.length > 0 && (
        <>
          <h2 className="h2">Halibut bycatch (discarded) by fleet, 2013–present — BSAI + GOA federal groundfish</h2>
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
          <h2 className="h2">{halinBycatchLatest.year} halibut bycatch by gear type — BSAI + GOA federal groundfish</h2>
          <Card>
            <Table
              columns={[
                { label: "Gear" },
                { label: "Discarded (mt)", num: true },
              ]}
              rows={halinBycatchLatest.rows}
              caption={`Source: Seamark Analytics, derived from NMFS AKRO monitored catch reports, via Mainsail monitored_catch (Pacific Halibut, Discarded, Total rows), year ${halinBycatchLatest.year}. Region: BSAI + GOA federal groundfish FMP areas.`}
            />
          </Card>
        </>
      )}

      {catchData && dmrData && discardMortality.rows.length > 0 && (
        <>
          <h2 className="h2">{discardMortality.year} halibut bycatch — DMR-weighted mortality estimate</h2>
          {discardMortality.bsaiTrawlGap && (
            <Note>
              <b>Data gap flagged — BSAI trawl DMR.</b> The{" "}
              <code>discard_mortality_rates</code> dataset has no entry for BSAI
              trawl effective 2023 or later. The value shown (86%) is the last
              published rate (2020–2022 harvest specifications). The actual
              current rate from the 2025–2026 BSAI specs should be ingested.
            </Note>
          )}
          <Card>
            <Table
              columns={[
                { label: "Gear" },
                { label: "FMP area" },
                { label: "Discarded (mt)", num: true },
                { label: "DMR (%)", num: true },
                { label: "Mortality est. (mt)", num: true },
              ]}
              rows={discardMortality.rows}
              caption={`Source: Seamark Analytics, derived from NMFS AKRO monitored catch × NMFS discard mortality rate tables, via Mainsail monitored_catch and discard_mortality_rates, year ${discardMortality.year}. Region: BSAI + GOA federal groundfish FMP areas. † = DMR entry expired; using last known rate.`}
            />
          </Card>
        </>
      )}

      {sportData && sportCR.rows.length > 0 && (
        <>
          <h2 className="h2">Sport halibut — catch, harvest &amp; release mortality (Alaska SWHS, statewide)</h2>
          <Note>
            <b>Units on this table.</b> Every column is in fish numbers
            (counts), not pounds. ADF&amp;G's Statewide Harvest Survey
            publishes sport halibut as a count of fish; the C&amp;R
            mortality estimate is released fish × the IPHC sport DMR
            (16%), so it too is a count of dead released fish. To
            convert to net pounds — the unit IPHC uses for coastwide
            mortality — an average-weight assumption is required,
            which Mainsail does not impose.
          </Note>
          {!sportCR.hasDmr && (
            <Note>
              <b>Sport C&amp;R DMR pending publish.</b> The{" "}
              <code>discard_mortality_rates</code> dataset does not yet contain
              the IPHC sport release mortality rate (16%). The mortality estimate
              column will populate once the updated dataset is published to S3.
            </Note>
          )}
          <Card>
            <Table
              columns={[
                { label: "Year", yr: true },
                { label: "Total catch (fish)", num: true },
                { label: "Kept (fish)", num: true },
                { label: "Released (fish)", num: true },
                { label: "C&R mortality est. (fish)", num: true },
              ]}
              rows={sportCR.rows}
              caption={`Source: Seamark Analytics, derived from ADF&G Statewide Harvest Survey (species HA) via Mainsail sport_harvest. C&R mortality estimate = released fish × 16% (IPHC stock-assessment release-mortality rate). Region: Alaska statewide.`}
            />
          </Card>
        </>
      )}

      {ifqData && ifqHalibut.length > 0 && (
        <>
          <h2 className="h2">IFQ halibut landings, 2022–present — IPHC areas 2C/3A/3B/4A–4D (Alaska)</h2>
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
              caption="Source: Seamark Analytics, derived from NMFS AKRO IFQ landings reports, via Mainsail ifq_landings. Region: IPHC regulatory areas 2C, 3A, 3B, 4A, 4B, 4CDE (Alaska)."
            />
          </Card>
        </>
      )}
    </>
  );
}
