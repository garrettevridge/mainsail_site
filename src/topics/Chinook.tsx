import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import { filterCountableEscapement } from "../api/datasetHelpers";
import type {
  PscWeeklyDataRow,
  PscAnnualHistoricalRow,
  ChinookGsiRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SalmonEscapementRow,
  FishCountsRow,
  SubsistenceHarvestStatewideRow,
} from "../api/types";
import { Card, Crumb, DataContext, Note, StatGrid, Table } from "../components/primitives";
import StackedTrend from "../components/charts/StackedTrend";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

// chinook_gsi.mean_pct is published as a percentage value already
// (e.g. 47.2 = 47.2%), so we format the value directly. The earlier
// implementation re-multiplied by 100, producing values like 4720%.
const fmtPctValue = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toFixed(1)}%`;

function normalizeFishery(tf: string): string {
  if (tf === "Midwater Pollock") return "Pollock (midwater)";
  if (tf === "Bottom Pollock") return "Pollock (bottom)";
  if (tf === "Pacific Cod") return "Pacific Cod";
  return "Other groundfish";
}

export default function Chinook() {
  const { data: pscData, isLoading: pscLoading, error: pscError } =
    useDataset<PscWeeklyDataRow>("psc_weekly");
  const { data: pscHistorical } =
    useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: gsiData, isLoading: gsiLoading } =
    useDataset<ChinookGsiRow>("chinook_gsi");
  const { data: commercialData, isLoading: commLoading } =
    useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: sportData, isLoading: sportLoading } =
    useDataset<SportHarvestDataRow>("sport_harvest");
  const { data: escapementData } =
    useDataset<SalmonEscapementRow>("salmon_escapement");
  const { data: fishCountsData } =
    useDataset<FishCountsRow>("fish_counts");
  const { data: subsistenceStatewide } =
    useDataset<SubsistenceHarvestStatewideRow>("subsistence_harvest_statewide");

  const FISHERIES = ["Pollock (midwater)", "Pollock (bottom)", "Pacific Cod", "Other groundfish"];

  // ── Mortality-by-source stack ─────────────────────────────────────────────
  // Four buckets, all in fish counts (no unit conversion needed). Each bucket
  // is sourced from the longest-window dataset published for that component:
  //   • Commercial (directed) — salmon_commercial_harvest, statewide chinook.
  //     NPAFC backfill provides 1985-2018; ADF&G press releases provide 2019+.
  //   • Bycatch (PSC)         — psc_annual_historical, BSAI+GOA chinook
  //     mortality 1991-present (NMFS PDF 1991-2010 + NMFS HTML rollups
  //     2011+). psc_weekly remains the source for the by-fishery and
  //     by-area sub-charts below.
  //   • Subsistence           — subsistence_harvest_statewide (NPAFC),
  //     chinook 1985-2023.
  //   • Sport (kept)          — sport_harvest species_code=KS, record_type=harvest.
  //
  // PSC fish are treated as 100% mortality (standard practice — non-directed
  // catch arrives dead in the codend and is discarded). Sport "harvest" is
  // kept fish only; release mortality is NOT included here. ADF&G has
  // site-specific hooking-mortality studies (e.g. Kenai River, Bendock &
  // Alexandersdottir, FDS 91-39) but does not publish a single fleetwide
  // sport release-mortality rate the way IPHC does for halibut, so we omit
  // it rather than impose one. Years where any component is missing render
  // as a gap (zero) for that bucket — see the "Reported total" column in the
  // table below for partial-coverage flags.
  const MORTALITY_BUCKETS = [
    "Commercial (directed)",
    "Bycatch (PSC)",
    "Subsistence",
    "Sport (kept)",
  ];

  // Editorial window: trim pre-2004 from the mortality-by-source presentation.
  // Pre-2004 rows are dropped at the source memo so the chart and table stay
  // consistent. The four underlying datasets still publish further back —
  // this is a presentation choice, not a data-quality claim.
  const MORTALITY_START_YEAR = 2004;

  const chinookMortalityStack = useMemo(() => {
    if (!commercialData && !pscHistorical && !subsistenceStatewide && !sportData) return [];
    const byYear = new Map<number, Record<string, number | null>>();
    const ensure = (yr: number) => {
      if (!byYear.has(yr)) byYear.set(yr, { year: yr });
      return byYear.get(yr)!;
    };

    if (commercialData) {
      for (const r of commercialData) {
        if (r.species !== "chinook" || r.region !== "statewide") continue;
        if (r.harvest_fish == null) continue;
        if (r.year < MORTALITY_START_YEAR) continue;
        const e = ensure(r.year);
        e["Commercial (directed)"] = (e["Commercial (directed)"] as number ?? 0) + r.harvest_fish;
      }
    }
    if (pscHistorical) {
      for (const r of pscHistorical) {
        if (r.species !== "chinook" || r.mortality_count == null) continue;
        if (r.year < MORTALITY_START_YEAR) continue;
        const e = ensure(r.year);
        e["Bycatch (PSC)"] = (e["Bycatch (PSC)"] as number ?? 0) + r.mortality_count;
      }
    }
    if (subsistenceStatewide) {
      for (const r of subsistenceStatewide) {
        if (r.species !== "chinook" || r.harvest_count == null) continue;
        if (r.year < MORTALITY_START_YEAR) continue;
        const e = ensure(r.year);
        e["Subsistence"] = (e["Subsistence"] as number ?? 0) + r.harvest_count;
      }
    }
    if (sportData) {
      for (const r of sportData) {
        if (r.species_code !== "KS" || r.record_type !== "harvest") continue;
        if (r.fish_count == null) continue;
        if (r.year < MORTALITY_START_YEAR) continue;
        const e = ensure(r.year);
        e["Sport (kept)"] = (e["Sport (kept)"] as number ?? 0) + r.fish_count;
      }
    }

    if (!byYear.size) return [];
    return [...byYear.values()]
      .map((r): Record<string, string | number> => ({
        year: r.year as number,
        // Render each bucket as a number (0 when missing) so Recharts stacks
        // rather than dropping the segment.
        "Commercial (directed)": (r["Commercial (directed)"] as number) ?? 0,
        "Bycatch (PSC)":         (r["Bycatch (PSC)"]         as number) ?? 0,
        "Subsistence":           (r["Subsistence"]           as number) ?? 0,
        "Sport (kept)":          (r["Sport (kept)"]          as number) ?? 0,
      }))
      .sort((a, b) => (a.year as number) - (b.year as number));
  }, [commercialData, pscHistorical, subsistenceStatewide, sportData]);

  // ── Annual totals table — mortality buckets + escapement column ──────────
  // Adds a sum-of-counted-escapement column for context. Escapement here is
  // a partial total (only river systems present in the salmon_escapement
  // dataset for that year) and should not be read as a complete return count.
  const chinookEscapementByYear = useMemo(() => {
    const map = new Map<number, number>();
    const countable = filterCountableEscapement(escapementData);
    for (const r of countable) {
      const sp = r.species.toLowerCase();
      if (!sp.includes("chinook") && !sp.includes("king")) continue;
      if (r.actual_count == null) continue;
      map.set(r.year, (map.get(r.year) ?? 0) + r.actual_count);
    }
    return map;
  }, [escapementData]);

  // Each component has its own publication window. Summing across all four
  // is only defensible when all four are reported for that year — otherwise
  // the "Total" understates true mortality. We mark partial-coverage rows
  // with ◊ on the reported total so readers can see at a glance which years
  // have a defensible all-source figure (2019–2022 in the current snapshot).
  const chinookMortalityTable = useMemo(() => {
    return [...chinookMortalityStack]
      .sort((a, b) => (b.year as number) - (a.year as number))
      .map((r) => {
        const yr = r.year as number;
        const com = r["Commercial (directed)"] as number;
        const byc = r["Bycatch (PSC)"] as number;
        const sub = r["Subsistence"] as number;
        const spo = r["Sport (kept)"] as number;
        const esc = chinookEscapementByYear.get(yr);
        const presentCount = [com, byc, sub, spo].filter((v) => v > 0).length;
        const partial = presentCount < 4;
        const reported = com + byc + sub + spo;
        return [
          yr,
          com > 0 ? fmt(com) : "—",
          byc > 0 ? fmt(byc) : "—",
          sub > 0 ? fmt(sub) : "—",
          spo > 0 ? fmt(spo) : "—",
          partial ? `${fmt(reported)} ◊` : fmt(reported),
          esc != null ? fmt(esc) + " ‡" : "—",
        ];
      });
  }, [chinookMortalityStack, chinookEscapementByYear]);

  const pscTrend = useMemo(() => {
    if (!pscData) return [];
    const map = new Map<number, Record<string, number>>();
    for (const r of pscData) {
      if (r.species_code !== "CHNK" || r.is_confidential === 1) continue;
      const yr = r.year;
      if (!map.has(yr)) {
        const entry: Record<string, number> = { year: yr };
        for (const f of FISHERIES) entry[f] = 0;
        map.set(yr, entry);
      }
      const entry = map.get(yr)!;
      const bucket = normalizeFishery(r.target_fishery);
      entry[bucket] = (entry[bucket] ?? 0) + (r.psc_count ?? 0);
    }
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [pscData]);

  const pscLatestYear = useMemo(() => {
    if (!pscData) return null;
    const chnk = pscData.filter((r) => r.species_code === "CHNK");
    return chnk.length ? Math.max(...chnk.map((r) => r.year)) : null;
  }, [pscData]);

  const pscByFishery = useMemo(() => {
    if (!pscData || pscLatestYear == null) return [];
    const map = new Map<string, number>();
    for (const r of pscData) {
      if (r.species_code === "CHNK" && r.year === pscLatestYear && r.is_confidential === 0) {
        map.set(r.target_fishery, (map.get(r.target_fishery) ?? 0) + (r.psc_count ?? 0));
      }
    }
    return [...map.entries()]
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([fishery, count]) => [fishery, fmt(count)]);
  }, [pscData, pscLatestYear]);

  // PSC by reporting area (latest year)
  const pscByArea = useMemo(() => {
    if (!pscData || pscLatestYear == null) return [];
    const map = new Map<string, number>();
    for (const r of pscData) {
      if (r.species_code === "CHNK" && r.year === pscLatestYear && r.is_confidential === 0) {
        map.set(r.reporting_area, (map.get(r.reporting_area) ?? 0) + (r.psc_count ?? 0));
      }
    }
    return [...map.entries()]
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([area, count]) => [area, fmt(count)]);
  }, [pscData, pscLatestYear]);

  const pscAnnualTotal = useMemo(() => {
    if (!pscTrend.length) return null;
    const last = pscTrend[pscTrend.length - 1];
    return Object.entries(last).filter(([k]) => k !== "year").reduce((s, [, v]) => s + (v as number), 0);
  }, [pscTrend]);

  // Commercial by region (latest year)
  const commercialByRegion = useMemo(() => {
    if (!commercialData) return { rows: [], year: null as number | null };
    const maxYear = Math.max(...commercialData.filter((r) => r.species === "chinook").map((r) => r.year));
    const rows = commercialData
      .filter((r) => r.species === "chinook" && r.year === maxYear && r.region !== "statewide")
      .sort((a, b) => (b.harvest_fish ?? 0) - (a.harvest_fish ?? 0))
      .map((r) => [
        r.region,
        fmt(r.harvest_fish) + (r.is_preliminary === 1 ? " †" : ""),
        r.harvest_pounds != null ? fmt(r.harvest_pounds) : "—",
      ]);
    return { rows, year: maxYear };
  }, [commercialData]);

  // Sport by region (latest year)
  const sportByRegion = useMemo(() => {
    if (!sportData) return { rows: [], year: null as number | null };
    const ks = sportData.filter((r) => r.species_code === "KS" && r.record_type === "harvest" && r.fish_count != null);
    if (!ks.length) return { rows: [], year: null };
    const maxYear = Math.max(...ks.map((r) => r.year));
    const rows = ks
      .filter((r) => r.year === maxYear)
      .sort((a, b) => (b.fish_count ?? 0) - (a.fish_count ?? 0))
      .map((r) => [r.region, r.area_name, fmt(r.fish_count)]);
    return { rows, year: maxYear };
  }, [sportData]);

  // Chinook escapement — most recent year
  const chinookEscapement = useMemo(() => {
    const empty = {
      rows: [] as Array<Array<string | number | null>>,
      year: null as number | null,
      systemCount: 0,
      regionCounts: [] as Array<[string, number]>,
      systemsByRegion: [] as Array<[string, Array<{ name: string; lastYear: number }>]>,
      methods: [] as string[],
    };
    const countable = filterCountableEscapement(escapementData);
    if (!countable.length) return empty;
    const chnk = countable.filter(
      (r) =>
        r.species.toLowerCase().includes("chinook") ||
        r.species.toLowerCase().includes("king")
    );
    if (!chnk.length) return empty;
    const maxYear = Math.max(...chnk.map((r) => r.year));
    const yearRows = chnk.filter((r) => r.year === maxYear && r.actual_count != null);

    // Build the union of every system that has reported a chinook
    // actual_count anywhere in the dataset, alongside the last year it
    // reported. This is broader than the latest-year intersection used by
    // the table above: a system that ran through 2022 but hasn't yet
    // posted a 2023+ count still appears here, so the "river systems
    // represented" panel reflects the full ADF&G monitoring footprint
    // present in salmon_escapement, not just the most recent year.
    const lastYearBySystem = new Map<string, number>();
    const regionBySystem = new Map<string, string>();
    for (const r of chnk) {
      if (r.actual_count == null) continue;
      const prev = lastYearBySystem.get(r.system_name) ?? -Infinity;
      if (r.year > prev) {
        lastYearBySystem.set(r.system_name, r.year);
        regionBySystem.set(r.system_name, r.region ?? "Unspecified");
      } else if (!regionBySystem.has(r.system_name)) {
        regionBySystem.set(r.system_name, r.region ?? "Unspecified");
      }
    }
    const systemCount = lastYearBySystem.size;

    // Group systems by region with their last-reported year.
    const regionMap = new Map<string, Array<{ name: string; lastYear: number }>>();
    for (const [name, lastYear] of lastYearBySystem) {
      const reg = regionBySystem.get(name) ?? "Unspecified";
      if (!regionMap.has(reg)) regionMap.set(reg, []);
      regionMap.get(reg)!.push({ name, lastYear });
    }
    const regionCounts: Array<[string, number]> = [...regionMap.entries()]
      .map(([reg, arr]): [string, number] => [reg, arr.length])
      .sort((a, b) => b[1] - a[1]);

    const systemsByRegion: Array<[string, Array<{ name: string; lastYear: number }>]> = [
      ...regionMap.entries(),
    ]
      .map(([reg, arr]): [string, Array<{ name: string; lastYear: number }>] => [
        reg,
        [...arr].sort((a, b) => a.name.localeCompare(b.name)),
      ])
      .sort((a, b) => b[1].length - a[1].length);

    // Distinct count_method values present in the chinook subset (all years)
    const methods = [...new Set(chnk.map((r) => r.count_method).filter((m): m is string => m != null))].sort();

    const rows = yearRows
      .sort((a, b) => (b.actual_count ?? 0) - (a.actual_count ?? 0))
      .slice(0, 20)
      .map((r) => [
        r.system_name,
        r.region ?? "—",
        r.count_method ?? "—",
        fmt(r.actual_count),
        r.goal_lower != null && r.goal_upper != null ? `${fmt(r.goal_lower)}–${fmt(r.goal_upper)}` : "—",
        r.goal_met === 1 ? "Yes" : r.goal_met === 0 ? "No" : "—",
      ]);
    return { rows, year: maxYear, systemCount, regionCounts, systemsByRegion, methods };
  }, [escapementData]);

  // Fish counts — chinook at weirs/sonar (most recent year)
  const chinookCounts = useMemo(() => {
    if (!fishCountsData) return { rows: [], year: null as number | null };
    const chnk = fishCountsData.filter((r) =>
      r.species.toLowerCase().includes("chinook") || r.species.toLowerCase().includes("king")
    );
    if (!chnk.length) return { rows: [], year: null };
    const maxDate = chnk.reduce((a, b) => (a.count_date > b.count_date ? a : b)).count_date;
    const maxYear = new Date(maxDate).getFullYear();
    const byLocation = new Map<string, { max_cum: number; last_date: string }>();
    for (const r of chnk) {
      if (new Date(r.count_date).getFullYear() === maxYear) {
        const prev = byLocation.get(r.location);
        if (!prev || (r.cumulative_count ?? 0) > prev.max_cum) {
          byLocation.set(r.location, { max_cum: r.cumulative_count ?? 0, last_date: r.count_date });
        }
      }
    }
    const rows = [...byLocation.entries()]
      .sort(([, a], [, b]) => b.max_cum - a.max_cum)
      .map(([loc, v]) => [loc, fmt(v.max_cum), v.last_date.slice(0, 10)]);
    return { rows, year: maxYear };
  }, [fishCountsData]);

  return (
    <>
      <Crumb topic="Chinook Mortality & Genetics" />
      <h1 className="page-title">Chinook Mortality &amp; Genetics</h1>

      <DataContext
        use={[
          "psc_weekly — NMFS weekly PSC reports (Chinook bycatch by fishery)",
          "psc_annual_historical — NMFS annual Chinook PSC mortality, BSAI+GOA, 1991-present",
          "chinook_gsi — GSI stock composition of Chinook bycatch",
          "salmon_commercial_harvest — ADF&G/NPAFC statewide commercial harvest, 1985-present",
          "sport_harvest — ADF&G SWHS sport harvest (Chinook)",
          "subsistence_harvest_statewide — NPAFC-sourced statewide subsistence harvest, 1985-2023",
          "salmon_escapement — ADF&G escapement counts (Chinook systems)",
          "fish_counts — weir/sonar daily and cumulative fish passage",
        ]}
        could={[
          "chinook_age_sex_size — biological sampling at weirs",
          "chinook_coded_wire_tag — CWT recovery data by brood year",
          "sport_release_mortality — fleetwide hooking-mortality rate (none currently published by ADF&G)",
          "ADF&G in-season management actions by drainage",
        ]}
        ideas={[
          "GSI stock composition trend over time (which rivers' fish?)",
          "PSC as % of river-specific escapement goal",
          "Weir passage date distribution (run timing shift)",
          "PSC cap utilization by fishery, year-to-date",
        ]}
      />

      {pscData && (
        <StatGrid
          stats={[
            {
              val: pscAnnualTotal != null ? fmt(Math.round(pscAnnualTotal)) : "—",
              label: `Total BSAI Chinook PSC ${pscLatestYear ?? ""}`,
              sub: "Fish count (non-confidential rows)",
            },
            {
              val: "47,591",
              label: "Amendment 91 BSAI pollock cap",
              sub: "Applies to Bering Sea pollock trawl sector only",
              accent: "accent",
            },
          ]}
        />
      )}

      {chinookMortalityStack.length > 0 && (
        <>
          <h2 className="h2">Chinook mortality by source — 2004–present</h2>
          <Card>
            <StackedTrend
              data={chinookMortalityStack}
              xKey="year"
              stackKeys={MORTALITY_BUCKETS}
              colors={["#1a2332", "#b45309", "#7b6a4f", "#2f5d8a"]}
              title="Alaska Chinook — annual mortality by source, 2004–present (fish count)"
              yLabel="fish"
              yFormatter={(v) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v.toLocaleString()
              }
            />
            <div className="data-caption">
              Sources: salmon_commercial_harvest (statewide chinook;
              ADF&amp;G press releases 2019+, NPAFC post-COAR finals 1985-2018),
              psc_annual_historical (NMFS BSAI+GOA chinook PSC mortality
              1991-present), subsistence_harvest_statewide (NPAFC
              statewide chinook 1985-2023), ADF&amp;G SWHS sport_harvest
              (KS, harvested fish). All buckets in fish counts. PSC and
              commercial figures are treated as 100% mortality. Sport
              reflects kept fish only — release mortality is not included;
              ADF&amp;G has site-specific hooking-mortality studies (e.g.
              Kenai River, Bendock &amp; Alexandersdottir, FDS 91-39) but
              does not publish a fleetwide rate. Components with different
              start/end years render as zero outside their published window;
              see the table below for partial-coverage flags.
            </div>
          </Card>

          <h2 className="h2">Annual mortality by source — with counted escapement</h2>
          <Note>
            <b>Methodology &amp; coverage.</b> Each column is taken directly
            from a published source dataset; no values are imputed, smoothed,
            or backfilled. Counts are fish, not pounds.
            <ul style={{ margin: "0.5em 0 0.5em 1.25em" }}>
              <li>
                <b>Commercial (directed):</b> statewide chinook
                (<code>salmon_commercial_harvest</code>,
                <code> region = "statewide"</code>). Two sources stitched
                together: NPAFC <i>Pacific Salmonid Catch Statistics</i>
                yearbook for 1985-2018 (post-COAR ADF&amp;G finals as
                reported to NPAFC) and ADF&amp;G annual <i>Salmon Harvest
                Summary</i> press releases for 2019+. The two are sourced
                from the same underlying ADF&amp;G commercial fish ticket
                data, one publication hop apart. Counted as 100% mortality
                (landed fish).
              </li>
              <li>
                <b>Bycatch (PSC):</b> NMFS annual chinook PSC mortality
                (<code>psc_annual_historical</code>, BSAI+GOA, 1991-present).
                BSAI 1991-2010 is the NMFS AKRO PDF series; BSAI 2011+ and
                GOA 1991+ are NMFS HTML rollups. Counted as 100% mortality
                (standard NPFMC practice — non-directed catch arrives dead
                in the codend and is discarded). The "by target fishery"
                and "by reporting area" tables further down use
                <code> psc_weekly</code> instead, since the historical
                series doesn't carry sub-annual breakdown.
              </li>
              <li>
                <b>Subsistence:</b> NPAFC statewide subsistence harvest
                (<code>subsistence_harvest_statewide</code>), chinook
                1985-2023. NPAFC publishes the year × species statewide
                aggregate one year ahead of the granular ADF&amp;G
                Division of Subsistence community-survey dataset
                (<code>subsistence_harvest</code>). Counted as 100%
                mortality (kept fish).
              </li>
              <li>
                <b>Sport (kept):</b> ADF&amp;G Statewide Harvest Survey
                (<code>sport_harvest</code>, species <code>KS</code>,
                <code>record_type = "harvest"</code>). Reflects kept fish only.
                Catch-and-release mortality is <i>not</i> included — ADF&amp;G
                publishes site-specific hooking-mortality studies (e.g. Kenai
                River) but no fleetwide rate, so we do not impose one. SWHS
                runs ~1 year behind, so the latest year may be missing.
              </li>
            </ul>
            <b>Reading the row totals.</b> The "Reported total" column sums
            only the components that exist for that year; rows where any
            component is missing are flagged with ◊. <b>True total mortality
            is higher than the ◊ figure</b> by whatever the missing component
            would have contributed. The all-source defensible window is the
            intersection of the four publication windows — years where
            commercial, PSC (1991+), subsistence (1985-2023), and sport are
            all reported.
          </Note>
          <Card>
            <Table
              columns={[
                { label: "Year", yr: true },
                { label: "Commercial", num: true },
                { label: "Bycatch (PSC)", num: true },
                { label: "Subsistence", num: true },
                { label: "Sport (kept)", num: true },
                { label: "Reported total", num: true },
                { label: "Counted escapement", num: true },
              ]}
              rows={chinookMortalityTable}
              caption={
                "Region: Alaska statewide. All columns in fish counts. ◊ = partial coverage; the row total sums only the columns reported for that year and understates true mortality. ‡ = counted escapement is the sum of actual_count across river systems present in the salmon_escapement dataset for that year — partial coverage; not a complete return total. Source: Seamark Analytics, derived from ADF&G annual Salmon Harvest Summary (commercial), NMFS BSAI/GOA chinook PSC reports (bycatch), NPAFC Pacific Salmonid Catch Statistics (subsistence), and ADF&G SWHS (sport)."
              }
            />
          </Card>
        </>
      )}

      <h2 className="h2">BSAI pollock Chinook bycatch (PSC) by target fishery</h2>
      {pscLoading && <p className="section-intro">Loading PSC data (~48 MB)…</p>}
      {pscError && <Note>Could not load PSC data.</Note>}

      {pscData && pscTrend.length > 0 && (
        <Card>
          <StackedTrend
            data={pscTrend}
            xKey="year"
            stackKeys={FISHERIES}
            colors={["#1a2332", "#2f5d8a", "#b45309", "#d4c5b0"]}
            title="BSAI Chinook PSC by target fishery, 2013–present"
            yLabel="fish"
            yFormatter={(v) => v.toLocaleString()}
          />
        </Card>
      )}

      {pscData && pscByFishery.length > 0 && (
        <>
          <h2 className="h2">{pscLatestYear} PSC by target fishery — BSAI groundfish</h2>
          <Card>
            <Table
              columns={[
                { label: "Target fishery" },
                { label: "Chinook PSC (fish)", num: true },
              ]}
              rows={pscByFishery}
              caption={`Source: Seamark Analytics, derived from NMFS weekly PSC reports (via Mainsail psc_weekly), year ${pscLatestYear}.`}
            />
          </Card>
        </>
      )}

      {pscData && pscByArea.length > 0 && (
        <>
          <h2 className="h2">{pscLatestYear} PSC by reporting area — BSAI groundfish</h2>
          <Card>
            <Table
              columns={[
                { label: "Reporting area" },
                { label: "Chinook PSC (fish)", num: true },
              ]}
              rows={pscByArea}
              caption={`Source: Seamark Analytics, derived from NMFS weekly PSC reports (via Mainsail psc_weekly), year ${pscLatestYear}.`}
            />
          </Card>
        </>
      )}

      {commLoading && <p className="section-intro">Loading commercial harvest data…</p>}

      {commercialByRegion.rows.length > 0 && (
        <>
          <h2 className="h2">{commercialByRegion.year} commercial harvest by region — Alaska statewide</h2>
          <Card>
            <Table
              columns={[
                { label: "Region" },
                { label: "Harvest (fish)", num: true },
                { label: "Harvest (lbs)", num: true },
              ]}
              rows={commercialByRegion.rows}
              caption={`Source: Seamark Analytics, derived from ADF&G annual Salmon Harvest Summary (via Mainsail salmon_commercial_harvest). † = preliminary.`}
            />
          </Card>
        </>
      )}

      {sportLoading && <p className="section-intro">Loading sport harvest data…</p>}

      {sportByRegion.rows.length > 0 && (
        <>
          <h2 className="h2">{sportByRegion.year} sport harvest by area — Alaska statewide</h2>
          <Card>
            <Table
              columns={[
                { label: "Region" },
                { label: "Area" },
                { label: "Harvest (fish)", num: true },
              ]}
              rows={sportByRegion.rows}
              caption={`Source: Seamark Analytics, derived from ADF&G Statewide Harvest Survey (via Mainsail sport_harvest), year ${sportByRegion.year}.`}
            />
          </Card>
        </>
      )}

      <h2 className="h2">Genetic stock identification (GSI) — BSAI pollock bycatch attribution</h2>
      {gsiLoading && <p className="section-intro">Loading GSI data…</p>}
      {gsiData && gsiData.length > 0 && (
        <Card>
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Stock reporting group" },
              { label: "Mean attribution (%)", num: true },
              { label: "Total catch (fish)", num: true },
              { label: "Samples (n)", num: true },
            ]}
            rows={gsiData.map((r) => [r.year, r.region, fmtPctValue(r.mean_pct), fmt(r.total_catch), fmt(r.n_samples)])}
            caption="Region: BSAI pollock fishery (Alaska). Source: Seamark Analytics, derived from AFSC Auke Bay Laboratories GSI report (via Mainsail chinook_gsi). Partial coverage — 2023 only."
          />
        </Card>
      )}

      {chinookEscapement.rows.length > 0 && (
        <>
          <h2 className="h2">Chinook escapement — key systems, {chinookEscapement.year} (Alaska statewide)</h2>
          <Note>
            <b>Methodology &amp; coverage.</b> Source dataset is
            <code> salmon_escapement</code> (ADF&amp;G escapement database),
            filtered with <code>filterCountableEscapement</code> to drop rows
            whose <code>count_method</code> begins with
            <code> not_operated_</code> or <code>partial_season_</code> —
            i.e., projects that were not run, or that ran for only part of the
            run timing window and therefore do not represent a complete
            census. Those rows cannot be compared to annual goals.
            <ul style={{ margin: "0.5em 0 0.5em 1.25em" }}>
              <li>
                <b>Count methods present in the chinook subset:</b>{" "}
                {chinookEscapement.methods.length > 0
                  ? chinookEscapement.methods.join(", ")
                  : "—"}
                . These cover weir, sonar, aerial-survey, and tower-count
                projects (specific values reflect ADF&amp;G's project-level
                method labels in the published data).
              </li>
              <li>
                <b>Goal types</b> in <code>goal_type</code> are BEG
                (Biological Escapement Goal), SEG (Sustainable Escapement
                Goal), OEG (Optimal Escapement Goal), and IM (Inriver/Inseason
                Management) ranges, set or adopted by the Alaska Board of
                Fisheries.
              </li>
              <li>
                <b>Partial coverage.</b> The table represents the river
                systems that ADF&amp;G monitors and reports through the
                public escapement database. Many smaller systems are not
                enumerated, and some monitored systems do not appear every
                year. Counts are not a complete return total for Alaska
                chinook.
              </li>
              <li>
                <b>Systems by region in {chinookEscapement.year}:</b>{" "}
                {chinookEscapement.regionCounts
                  .map(([reg, n]) => `${reg}: ${n}`)
                  .join("; ")}
                .
              </li>
            </ul>
          </Note>
          <Card>
            <div className="data-caption" style={{ marginBottom: "0.5em" }}>
              <b>River systems represented in salmon_escapement (chinook)</b>
              {" — "}
              <span>
                n = {chinookEscapement.systemCount} distinct systems with at
                least one reported chinook escapement count anywhere in the
                dataset (window: 1976–{chinookEscapement.year}). Systems that
                have not yet reported in the most recent year remain in the
                list with their last-reported year shown.
              </span>
            </div>
            <Table
              columns={[
                { label: "Region" },
                { label: "Systems (n)", num: true },
                { label: "River systems (last reported year)" },
              ]}
              rows={chinookEscapement.systemsByRegion.map(([reg, items]) => [
                reg,
                items.length,
                items.map((s) => `${s.name} (${s.lastYear})`).join("; "),
              ])}
              caption={`Source: Seamark Analytics, derived from ADF&G escapement database (via Mainsail salmon_escapement). Each system_name appears once with its most recent reporting year.`}
            />
          </Card>

          <Note>
            <b>Known coverage gaps in the chinook escapement dataset.</b>{" "}
            The dataset currently captures {chinookEscapement.systemCount}{" "}
            chinook systems, weighted toward AYK (Yukon, Kuskokwim,
            Norton Sound) and Interior Alaska reconstructions. Several
            major chinook-producing systems are <i>not</i> currently
            ingested by Mainsail's publish pipeline and therefore do not
            appear above:
            <ul style={{ margin: "0.5em 0 0.5em 1.25em" }}>
              <li>
                <b>Cook Inlet:</b> Kenai River (early and late runs),
                Susitna (Deshka, Yentna mainstem and tributaries), Kasilof.
              </li>
              <li>
                <b>Copper River and Prince William Sound:</b> Copper River
                mainstem and tributaries.
              </li>
              <li>
                <b>Southeast Alaska / transboundary:</b> Taku, Stikine,
                Unuk, Chilkat, Situk-Ahrnklin, Chickamin.
              </li>
              <li>
                <b>Kodiak:</b> Karluk, Ayakulik.
              </li>
              <li>
                <b>Kuskokwim and AYK tributaries:</b> Goodnews, Aniak,
                Kogrukluk weir, individual Kuskokwim tributaries beyond
                the drainagewide reconstruction.
              </li>
            </ul>
            ADF&amp;G publishes counts or run-reconstruction estimates for
            most of these systems through Division of Sport Fish, Division
            of Commercial Fisheries, and the joint U.S.–Canada panels
            (Yukon River Panel, Pacific Salmon Commission Transboundary
            Panel). Adding them to the public manifest is a Mainsail
            backend ingest task; this list is the working punch list.
          </Note>
          <Card>
            <Table
              columns={[
                { label: "System" },
                { label: "Region" },
                { label: "Method" },
                { label: "Count (fish)", num: true },
                { label: "Goal range (fish)" },
                { label: "Goal met" },
              ]}
              rows={chinookEscapement.rows}
              caption={`Source: Seamark Analytics, derived from ADF&G escapement database (via Mainsail salmon_escapement), year ${chinookEscapement.year}. n = ${chinookEscapement.systemCount} river systems represented in the ${chinookEscapement.year} reporting (Alaska statewide); table shows up to the top 20 by count.`}
            />
          </Card>
        </>
      )}

      {chinookCounts.rows.length > 0 && (
        <>
          <h2 className="h2">Chinook weir & sonar counts, {chinookCounts.year} (Alaska statewide)</h2>
          <Card>
            <Table
              columns={[
                { label: "Location" },
                { label: "Cumulative count (fish)", num: true },
                { label: "As of" },
              ]}
              rows={chinookCounts.rows}
              caption={`Source: Seamark Analytics, derived from ADF&G weir/sonar database (via Mainsail fish_counts), year ${chinookCounts.year}.`}
            />
          </Card>
        </>
      )}

    </>
  );
}
