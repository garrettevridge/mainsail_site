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
        const e = ensure(r.year);
        e["Commercial (directed)"] = (e["Commercial (directed)"] as number ?? 0) + r.harvest_fish;
      }
    }
    if (pscHistorical) {
      for (const r of pscHistorical) {
        if (r.species !== "chinook" || r.mortality_count == null) continue;
        const e = ensure(r.year);
        e["Bycatch (PSC)"] = (e["Bycatch (PSC)"] as number ?? 0) + r.mortality_count;
      }
    }
    if (subsistenceStatewide) {
      for (const r of subsistenceStatewide) {
        if (r.species !== "chinook" || r.harvest_count == null) continue;
        const e = ensure(r.year);
        e["Subsistence"] = (e["Subsistence"] as number ?? 0) + r.harvest_count;
      }
    }
    if (sportData) {
      for (const r of sportData) {
        if (r.species_code !== "KS" || r.record_type !== "harvest") continue;
        if (r.fish_count == null) continue;
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

  const commercialChinook = useMemo(() => {
    if (!commercialData) return [];
    return commercialData.filter((r) => r.species === "chinook" && r.region === "statewide").sort((a, b) => b.year - a.year);
  }, [commercialData]);

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

  const sportChinook = useMemo(() => {
    if (!sportData) return [];
    const map = new Map<number, number>();
    for (const r of sportData) {
      if (r.species_code === "KS" && r.record_type === "harvest") {
        map.set(r.year, (map.get(r.year) ?? 0) + (r.fish_count ?? 0));
      }
    }
    return [...map.entries()].sort(([a], [b]) => b - a).map(([year, fish]) => ({ year, fish }));
  }, [sportData]);

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
    const countable = filterCountableEscapement(escapementData);
    if (!countable.length) return { rows: [], year: null as number | null };
    const chnk = countable.filter((r) => r.species.toLowerCase().includes("chinook") || r.species.toLowerCase().includes("king"));
    if (!chnk.length) return { rows: [], year: null };
    const maxYear = Math.max(...chnk.map((r) => r.year));
    const rows = chnk
      .filter((r) => r.year === maxYear && r.actual_count != null)
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
    return { rows, year: maxYear };
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
          <h2 className="h2">Chinook mortality by source — full available time series</h2>
          <Card>
            <StackedTrend
              data={chinookMortalityStack}
              xKey="year"
              stackKeys={MORTALITY_BUCKETS}
              colors={["#1a2332", "#b45309", "#7b6a4f", "#2f5d8a"]}
              title="Alaska Chinook — annual mortality by source (fish count)"
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
                "◊ = partial coverage; the row total sums only the columns reported for that year and understates true mortality. ‡ = counted escapement is the sum of actual_count across river systems present in the salmon_escapement dataset for that year — partial coverage; not a complete return total."
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
              caption={`Source: NMFS weekly PSC reports via Mainsail psc_weekly, year ${pscLatestYear}`}
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
              caption={`Source: NMFS weekly PSC reports via Mainsail psc_weekly, year ${pscLatestYear}`}
            />
          </Card>
        </>
      )}

      <h2 className="h2">Commercial harvest — statewide Chinook</h2>
      {commLoading && <p className="section-intro">Loading commercial harvest data…</p>}
      {commercialData && (
        <Card>
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Harvest (fish)", num: true },
            ]}
            rows={commercialChinook.map((r) => [
              r.year,
              fmt(r.harvest_fish) + (r.is_preliminary === 1 ? " †" : ""),
            ])}
            caption="Source: ADF&G annual Salmon Harvest Summary, via Mainsail salmon_commercial_harvest. † = preliminary."
          />
        </Card>
      )}

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
              caption={`Source: ADF&G annual Salmon Harvest Summary, via Mainsail salmon_commercial_harvest. † = preliminary.`}
            />
          </Card>
        </>
      )}

      <h2 className="h2">Sport harvest — King salmon (statewide)</h2>
      {sportLoading && <p className="section-intro">Loading sport harvest data…</p>}
      {sportData && sportChinook.length > 0 && (
        <Card>
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Harvest (fish)", num: true },
            ]}
            rows={sportChinook.slice(0, 10).map((r) => [r.year, fmt(r.fish)])}
            caption="Source: ADF&G SWHS via Mainsail sport_harvest (species_code KS = King salmon)"
          />
        </Card>
      )}

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
              caption={`Source: ADF&G SWHS via Mainsail sport_harvest, year ${sportByRegion.year}`}
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
              { label: "Mean attribution", num: true },
              { label: "Total catch", num: true },
              { label: "Samples", num: true },
            ]}
            rows={gsiData.map((r) => [r.year, r.region, fmtPctValue(r.mean_pct), fmt(r.total_catch), fmt(r.n_samples)])}
            caption="Source: AFSC Auke Bay Laboratories GSI report, via Mainsail chinook_gsi (partial — 2023 only)"
          />
        </Card>
      )}

      {chinookEscapement.rows.length > 0 && (
        <>
          <h2 className="h2">Chinook escapement — key systems, {chinookEscapement.year} (Alaska statewide)</h2>
          <Card>
            <Table
              columns={[
                { label: "System" },
                { label: "Region" },
                { label: "Method" },
                { label: "Count", num: true },
                { label: "Goal range" },
                { label: "Goal met" },
              ]}
              rows={chinookEscapement.rows}
              caption={`Source: ADF&G escapement database via Mainsail salmon_escapement, year ${chinookEscapement.year}`}
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
                { label: "Cumulative count", num: true },
                { label: "As of" },
              ]}
              rows={chinookCounts.rows}
              caption={`Source: ADF&G weir/sonar database via Mainsail fish_counts, year ${chinookCounts.year}`}
            />
          </Card>
        </>
      )}

    </>
  );
}
