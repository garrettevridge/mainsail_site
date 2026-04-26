import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import { filterCountableEscapement } from "../api/datasetHelpers";
import type {
  PscWeeklyDataRow,
  ChinookGsiRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SalmonEscapementRow,
  FishCountsRow,
} from "../api/types";
import { Card, Crumb, DataContext, Note, StatGrid, Table } from "../components/primitives";
import StackedTrend from "../components/charts/StackedTrend";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : `${(n * 100).toFixed(1)}%`;

function normalizeFishery(tf: string): string {
  if (tf === "Midwater Pollock") return "Pollock (midwater)";
  if (tf === "Bottom Pollock") return "Pollock (bottom)";
  if (tf === "Pacific Cod") return "Pacific Cod";
  return "Other groundfish";
}

export default function Chinook() {
  const { data: pscData, isLoading: pscLoading, error: pscError } =
    useDataset<PscWeeklyDataRow>("psc_weekly");
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

  const FISHERIES = ["Pollock (midwater)", "Pollock (bottom)", "Pacific Cod", "Other groundfish"];

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
          "chinook_gsi — GSI stock composition of Chinook bycatch",
          "salmon_commercial_harvest — ADF&G commercial harvest by region",
          "sport_harvest — ADF&G SWHS sport harvest (Chinook)",
          "salmon_escapement — ADF&G escapement counts (Chinook systems)",
          "fish_counts — weir/sonar daily and cumulative fish passage",
        ]}
        could={[
          "chinook_age_sex_size — biological sampling at weirs",
          "chinook_coded_wire_tag — CWT recovery data by brood year",
          "ADF&G in-season management actions by drainage",
          "Yukon/Kuskokwim subsistence harvest by community",
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
          <h2 className="h2">{pscLatestYear} PSC by target fishery</h2>
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
          <h2 className="h2">{pscLatestYear} PSC by reporting area</h2>
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
          <h2 className="h2">{commercialByRegion.year} commercial harvest by region</h2>
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
          <h2 className="h2">{sportByRegion.year} sport harvest by area</h2>
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

      <h2 className="h2">Genetic stock identification (GSI) — bycatch attribution</h2>
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
            rows={gsiData.map((r) => [r.year, r.region, fmtPct(r.mean_pct), fmt(r.total_catch), fmt(r.n_samples)])}
            caption="Source: AFSC Auke Bay Laboratories GSI report, via Mainsail chinook_gsi (partial — 2023 only)"
          />
        </Card>
      )}

      {chinookEscapement.rows.length > 0 && (
        <>
          <h2 className="h2">Chinook escapement — key systems, {chinookEscapement.year}</h2>
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
          <h2 className="h2">Chinook weir & sonar counts, {chinookCounts.year}</h2>
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

      <Note>
        <b>Subsistence harvest.</b> The ADF&amp;G Division of Subsistence
        surveys dataset (<code>subsistence_harvest</code>) is 111,000 rows
        covering 1960–2022. A pre-aggregated view is needed for efficient display;
        it will be wired here when available.
      </Note>
    </>
  );
}
