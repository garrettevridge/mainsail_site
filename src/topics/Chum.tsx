import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import { filterCountableEscapement } from "../api/datasetHelpers";
import type {
  SalmonCommercialHarvestDataRow,
  HatcheryReleasesRow,
  SportHarvestDataRow,
  SalmonEscapementRow,
  PscWeeklyDataRow,
  SubsistenceHarvestDataRow,
  ChumGsiRow,
} from "../api/types";
import { Card, Crumb, DataContext, StatGrid, Table } from "../components/primitives";
import StackedTrend from "../components/charts/StackedTrend";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

// chum_gsi.mean_pct is published as a percentage value already
// (e.g. 16.3 = 16.3%); format the value directly without re-multiplying.
const fmtPctValue = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toFixed(1)}%`;

const COUNTRY_COLORS: Record<string, string> = {
  US:     "#1a2332",
  Japan:  "#2f5d8a",
  Russia: "#b45309",
  Canada: "#7b6a4f",
  Korea:  "#a8a29e",
};

export default function Chum() {
  const { data: commercialData, isLoading: commLoading } =
    useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: hatcheryData, isLoading: hatcheryLoading } =
    useDataset<HatcheryReleasesRow>("hatchery_releases");
  const { data: sportData, isLoading: sportLoading } =
    useDataset<SportHarvestDataRow>("sport_harvest");
  const { data: escapementData } =
    useDataset<SalmonEscapementRow>("salmon_escapement");
  const { data: pscData, isLoading: pscLoading } =
    useDataset<PscWeeklyDataRow>("psc_weekly");
  const { data: subsistenceData } =
    useDataset<SubsistenceHarvestDataRow>("subsistence_harvest");
  const { data: gsiData, isLoading: gsiLoading } =
    useDataset<ChumGsiRow>("chum_gsi");

  // ── Mortality-by-source stack (last 20 years) ─────────────────────────────
  // Same four-bucket structure as the Chinook page. All in fish counts;
  // PSC and commercial counted as 100% mortality. Sport is kept fish only;
  // chum sport release mortality is not estimated (no published fleetwide rate).
  // Subsistence reporting ends in 2022; later years render as a gap.
  const MORTALITY_BUCKETS = [
    "Commercial (directed)",
    "Bycatch (PSC)",
    "Subsistence",
    "Sport (kept)",
  ];

  const chumMortalityStack = useMemo(() => {
    if (!commercialData && !pscData && !subsistenceData && !sportData) return [];
    const byYear = new Map<number, Record<string, number | null>>();
    const ensure = (yr: number) => {
      if (!byYear.has(yr)) byYear.set(yr, { year: yr });
      return byYear.get(yr)!;
    };

    if (commercialData) {
      for (const r of commercialData) {
        if (r.species !== "chum" || r.region !== "statewide") continue;
        if (r.harvest_fish == null) continue;
        const e = ensure(r.year);
        e["Commercial (directed)"] = (e["Commercial (directed)"] as number ?? 0) + r.harvest_fish;
      }
    }
    if (pscData) {
      for (const r of pscData) {
        if (r.species_code !== "CHUM" || r.is_confidential === 1) continue;
        if (r.psc_count == null) continue;
        const e = ensure(r.year);
        e["Bycatch (PSC)"] = (e["Bycatch (PSC)"] as number ?? 0) + r.psc_count;
      }
    }
    if (subsistenceData) {
      for (const r of subsistenceData) {
        if (r.chum_harvest_fish == null) continue;
        const e = ensure(r.year);
        e["Subsistence"] = (e["Subsistence"] as number ?? 0) + r.chum_harvest_fish;
      }
    }
    if (sportData) {
      for (const r of sportData) {
        if (r.species_code !== "CS" || r.record_type !== "harvest") continue;
        if (r.fish_count == null) continue;
        const e = ensure(r.year);
        e["Sport (kept)"] = (e["Sport (kept)"] as number ?? 0) + r.fish_count;
      }
    }

    if (!byYear.size) return [];
    const maxYr = Math.max(...byYear.keys());
    const minYr = maxYr - 19;
    return [...byYear.values()]
      .filter((r) => (r.year as number) >= minYr && (r.year as number) <= maxYr)
      .map((r): Record<string, string | number> => ({
        year: r.year as number,
        "Commercial (directed)": (r["Commercial (directed)"] as number) ?? 0,
        "Bycatch (PSC)":         (r["Bycatch (PSC)"]         as number) ?? 0,
        "Subsistence":           (r["Subsistence"]           as number) ?? 0,
        "Sport (kept)":          (r["Sport (kept)"]          as number) ?? 0,
      }))
      .sort((a, b) => (a.year as number) - (b.year as number));
  }, [commercialData, pscData, subsistenceData, sportData]);

  const commercialChum = useMemo(() => {
    if (!commercialData) return [];
    return commercialData.filter((r) => r.species === "chum" && r.region === "statewide").sort((a, b) => b.year - a.year);
  }, [commercialData]);

  // Commercial by region (latest year)
  const commercialByRegion = useMemo(() => {
    if (!commercialData) return { rows: [], year: null as number | null };
    const chum = commercialData.filter((r) => r.species === "chum");
    if (!chum.length) return { rows: [], year: null };
    const maxYear = Math.max(...chum.map((r) => r.year));
    const rows = chum
      .filter((r) => r.year === maxYear && r.region !== "statewide")
      .sort((a, b) => (b.harvest_fish ?? 0) - (a.harvest_fish ?? 0))
      .map((r) => [
        r.region,
        fmt(r.harvest_fish) + (r.is_preliminary === 1 ? " †" : ""),
      ]);
    return { rows, year: maxYear };
  }, [commercialData]);

  const hatcheryTrend = useMemo(() => {
    if (!hatcheryData) return { chartData: [], countries: [] };
    const countries = [...new Set(
      hatcheryData.filter((r) => r.species === "Chum" && r.data_level === "country").map((r) => r.country)
    )].sort();
    const yearMap = new Map<number, Record<string, number>>();
    for (const r of hatcheryData) {
      if (r.species !== "Chum" || r.data_level !== "country") continue;
      if (!yearMap.has(r.release_year)) {
        const entry: Record<string, number> = { year: r.release_year };
        for (const c of countries) entry[c] = 0;
        yearMap.set(r.release_year, entry);
      }
      const entry = yearMap.get(r.release_year)!;
      entry[r.country] = (entry[r.country] ?? 0) + (r.number_released ?? 0);
    }
    const chartData = [...yearMap.values()].sort((a, b) => a.year - b.year);
    return { chartData, countries };
  }, [hatcheryData]);

  // Hatchery releases detail table by country and year
  const hatcheryTable = useMemo(() => {
    if (!hatcheryData) return { rows: [], years: [] };
    const chumCountry = hatcheryData.filter((r) => r.species === "Chum" && r.data_level === "country");
    const countries = [...new Set(chumCountry.map((r) => r.country))].sort();
    const years = [...new Set(chumCountry.map((r) => r.release_year))].sort((a, b) => b - a).slice(0, 6).reverse();
    const rows = countries.map((country) =>
      [country, ...years.map((yr) => {
        const row = chumCountry.find((r) => r.country === country && r.release_year === yr);
        if (!row?.number_released) return "—";
        return row.number_released >= 1e9
          ? `${(row.number_released / 1e9).toFixed(2)}B`
          : row.number_released >= 1e6
          ? `${(row.number_released / 1e6).toFixed(0)}M`
          : fmt(row.number_released);
      })]
    );
    return { rows, years };
  }, [hatcheryData]);

  const sportChum = useMemo(() => {
    if (!sportData) return [];
    const map = new Map<number, number>();
    for (const r of sportData) {
      if (r.species_code === "CS" && r.record_type === "harvest") {
        map.set(r.year, (map.get(r.year) ?? 0) + (r.fish_count ?? 0));
      }
    }
    return [...map.entries()].sort(([a], [b]) => b - a).map(([year, fish]) => ({ year, fish }));
  }, [sportData]);

  // PSC chum bycatch by target fishery
  const pscChumTrend = useMemo(() => {
    if (!pscData) return [];
    const FISHERIES = ["Pollock (midwater)", "Pollock (bottom)", "Pacific Cod", "Other groundfish"];
    const map = new Map<number, Record<string, number>>();
    for (const r of pscData) {
      if (r.species_code !== "CHUM" || r.is_confidential === 1) continue;
      const yr = r.year;
      if (!map.has(yr)) {
        const entry: Record<string, number> = { year: yr };
        for (const f of FISHERIES) entry[f] = 0;
        map.set(yr, entry);
      }
      const entry = map.get(yr)!;
      const tf = r.target_fishery;
      let bucket = "Other groundfish";
      if (tf === "Midwater Pollock") bucket = "Pollock (midwater)";
      else if (tf === "Bottom Pollock") bucket = "Pollock (bottom)";
      else if (tf === "Pacific Cod") bucket = "Pacific Cod";
      entry[bucket] = (entry[bucket] ?? 0) + (r.psc_count ?? 0);
    }
    return [...map.values()].sort((a, b) => a.year - b.year);
  }, [pscData]);

  const pscChumLatestYear = useMemo(() => {
    if (!pscData) return null;
    const chum = pscData.filter((r) => r.species_code === "CHUM");
    return chum.length ? Math.max(...chum.map((r) => r.year)) : null;
  }, [pscData]);

  const pscChumByFishery = useMemo(() => {
    if (!pscData || pscChumLatestYear == null) return [];
    const map = new Map<string, number>();
    for (const r of pscData) {
      if (r.species_code === "CHUM" && r.year === pscChumLatestYear && r.is_confidential === 0) {
        map.set(r.target_fishery, (map.get(r.target_fishery) ?? 0) + (r.psc_count ?? 0));
      }
    }
    return [...map.entries()].filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).map(([fishery, count]) => [fishery, fmt(count)]);
  }, [pscData, pscChumLatestYear]);

  const pscChumAnnualTotal = useMemo(() => {
    if (!pscChumTrend.length) return null;
    const last = pscChumTrend[pscChumTrend.length - 1];
    return Object.entries(last).filter(([k]) => k !== "year").reduce((s, [, v]) => s + (v as number), 0);
  }, [pscChumTrend]);

  // Chum escapement
  const chumEscapement = useMemo(() => {
    const countable = filterCountableEscapement(escapementData);
    if (!countable.length) return { rows: [], year: null as number | null };
    const chum = countable.filter((r) => r.species.toLowerCase().includes("chum"));
    if (!chum.length) return { rows: [], year: null };
    const maxYear = Math.max(...chum.map((r) => r.year));
    const rows = chum
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

  const latestCommercial = commercialChum[0];
  const hatcheryLatestYear = useMemo(() => {
    if (!hatcheryTrend.chartData.length) return null;
    const last = hatcheryTrend.chartData[hatcheryTrend.chartData.length - 1];
    return {
      year: last.year as number,
      total: Object.entries(last).filter(([k]) => k !== "year").reduce((s, [, v]) => s + (v as number), 0),
    };
  }, [hatcheryTrend]);

  return (
    <>
      <Crumb topic="Chum Salmon Mortality & Genetics" />
      <h1 className="page-title">Chum Salmon Mortality &amp; Genetics</h1>

      <DataContext
        use={[
          "salmon_commercial_harvest — ADF&G statewide + regional commercial harvest",
          "hatchery_releases — NPAFC hatchery releases by country (chum)",
          "sport_harvest — ADF&G SWHS statewide sport harvest (chum)",
          "subsistence_harvest — ADF&G Division of Subsistence community surveys (chum)",
          "psc_weekly — NMFS weekly PSC reports (BSAI chum bycatch)",
          "chum_gsi — AFSC genetic stock identification of BSAI pollock chum bycatch",
          "salmon_escapement — ADF&G escapement counts (chum systems)",
        ]}
        could={[
          "hatchery_returns — NPAFC hatchery return/survival rates",
          "chum_coded_wire_tag — CWT recoveries by hatchery of origin",
          "ocean_harvest — high-seas chum harvest data (Japan, Russia)",
        ]}
        ideas={[
          "Hatchery release vs. wild escapement ratio by region",
          "Chum PSC as % of escapement goal by drainage",
          "N. Pacific hatchery production share vs. wild runs",
          "Commercial harvest trend by gear type (drift vs. set net)",
        ]}
      />

      {(latestCommercial || hatcheryLatestYear) && (
        <StatGrid
          stats={[
            {
              val: latestCommercial?.harvest_fish != null ? fmt(latestCommercial.harvest_fish) : "—",
              label: `Commercial harvest ${latestCommercial?.year ?? ""}`,
              sub: "Statewide, all gear",
              accent: latestCommercial?.is_preliminary !== 1 ? "accent" : undefined,
            },
            {
              val: hatcheryLatestYear ? `${(hatcheryLatestYear.total / 1e9).toFixed(2)}B` : "—",
              label: `N. Pacific hatchery releases ${hatcheryLatestYear?.year ?? ""}`,
              sub: "Chum salmon, all countries",
            },
            {
              val: sportChum[0]?.fish != null ? fmt(sportChum[0].fish) : "—",
              label: `Sport harvest ${sportChum[0]?.year ?? ""}`,
              sub: "Statewide (ADF&G SWHS)",
            },
            {
              val: pscChumAnnualTotal != null ? fmt(Math.round(pscChumAnnualTotal)) : "—",
              label: `BSAI chum PSC ${pscChumLatestYear ?? ""}`,
              sub: "Fish count, non-confidential rows",
            },
          ]}
        />
      )}

      {chumMortalityStack.length > 0 && (
        <>
          <h2 className="h2">Chum mortality by source, last 20 years</h2>
          <Card>
            <StackedTrend
              data={chumMortalityStack}
              xKey="year"
              stackKeys={MORTALITY_BUCKETS}
              colors={["#1a2332", "#b45309", "#7b6a4f", "#2f5d8a"]}
              title="Alaska chum — annual mortality by source (fish count)"
              yLabel="fish"
              yFormatter={(v) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v.toLocaleString()
              }
            />
            <div className="data-caption">
              Sources: ADF&amp;G salmon_commercial_harvest (statewide chum),
              NMFS psc_weekly (CHUM, non-confidential), ADF&amp;G
              subsistence_harvest (chum_harvest_fish summed across reporting
              communities), ADF&amp;G SWHS sport_harvest (CS, harvested fish).
              All buckets in fish counts. PSC and commercial figures are
              treated as 100% mortality. Sport reflects kept fish only —
              chum sport release mortality is not included (no fleetwide rate
              is published). Subsistence reporting ends in 2022; later years
              render as a gap, not a zero.
            </div>
          </Card>
        </>
      )}

      <h2 className="h2">Commercial harvest — statewide chum</h2>
      {commLoading && <p className="section-intro">Loading commercial harvest data…</p>}
      {commercialData && (
        <Card>
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Harvest (fish)", num: true },
            ]}
            rows={commercialChum.map((r) => [
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
              ]}
              rows={commercialByRegion.rows}
              caption={`Source: ADF&G annual Salmon Harvest Summary, via Mainsail salmon_commercial_harvest. † = preliminary.`}
            />
          </Card>
        </>
      )}

      {sportData && sportChum.length > 0 && (
        <>
          <h2 className="h2">Sport harvest — chum salmon (statewide)</h2>
          <Card>
            <Table
              columns={[
                { label: "Year", yr: true },
                { label: "Harvest (fish)", num: true },
              ]}
              rows={sportChum.slice(0, 10).map((r) => [r.year, fmt(r.fish)])}
              caption="Source: ADF&G SWHS via Mainsail sport_harvest (species_code CS)"
            />
          </Card>
        </>
      )}

      <h2 className="h2">BSAI chum bycatch (PSC) by target fishery</h2>
      {pscLoading && <p className="section-intro">Loading PSC data (~48 MB)…</p>}
      {pscChumTrend.length > 0 && (
        <Card>
          <StackedTrend
            data={pscChumTrend}
            xKey="year"
            stackKeys={["Pollock (midwater)", "Pollock (bottom)", "Pacific Cod", "Other groundfish"]}
            colors={["#1a2332", "#2f5d8a", "#b45309", "#d4c5b0"]}
            title="BSAI chum PSC by target fishery"
            yLabel="fish"
            yFormatter={(v) => v.toLocaleString()}
          />
        </Card>
      )}

      {pscChumByFishery.length > 0 && (
        <>
          <h2 className="h2">{pscChumLatestYear} chum PSC by target fishery — BSAI groundfish</h2>
          <Card>
            <Table
              columns={[
                { label: "Target fishery" },
                { label: "Chum PSC (fish)", num: true },
              ]}
              rows={pscChumByFishery}
              caption={`Source: NMFS weekly PSC reports via Mainsail psc_weekly, year ${pscChumLatestYear}`}
            />
          </Card>
        </>
      )}

      <h2 className="h2">Genetic stock identification (GSI) — BSAI pollock chum bycatch attribution</h2>
      {gsiLoading && <p className="section-intro">Loading GSI data…</p>}
      {gsiData && gsiData.length > 0 && (
        <Card>
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "FMP area" },
              { label: "Stock reporting group" },
              { label: "Mean attribution", num: true },
              { label: "95% CI (fish)", num: true },
              { label: "Point estimate (fish)", num: true },
              { label: "Total catch", num: true },
              { label: "Samples", num: true },
            ]}
            rows={[...gsiData]
              .sort((a, b) => b.year - a.year || b.mean_pct - a.mean_pct)
              .map((r) => [
                r.year,
                r.fmp_area,
                r.region,
                fmtPctValue(r.mean_pct),
                `${fmt(r.lower_95_ci)}–${fmt(r.upper_95_ci)}`,
                fmt(r.point_count),
                fmt(r.total_catch),
                fmt(r.n_samples),
              ])}
            caption="Source: NPFMC C2 Chum Salmon Genetics Report (Barry et al., AFSC Auke Bay Laboratories), via Mainsail chum_gsi. v1 covers BSAI 2023 B-season aggregate only; richer stratifications (sector / time-period / longitude / spatial cluster) and 2011-2022 backfill are tracked separately."
          />
        </Card>
      )}

      <h2 className="h2">North Pacific hatchery releases — chum salmon</h2>
      {hatcheryLoading && <p className="section-intro">Loading hatchery data…</p>}
      {hatcheryData && hatcheryTrend.countries.length > 0 && (
        <Card>
          <StackedTrend
            data={hatcheryTrend.chartData}
            xKey="year"
            stackKeys={hatcheryTrend.countries}
            colors={hatcheryTrend.countries.map((c) => COUNTRY_COLORS[c] ?? "#6b7280")}
            title="Chum salmon hatchery releases by country (NPAFC)"
            yLabel="fish released"
            yFormatter={(v) =>
              v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v.toLocaleString()
            }
          />
        </Card>
      )}

      {hatcheryTable.rows.length > 0 && (
        <>
          <h2 className="h2">Hatchery releases by country, recent years — North Pacific (NPAFC members)</h2>
          <Card>
            <Table
              columns={[
                { label: "Country" },
                ...hatcheryTable.years.map((yr) => ({ label: String(yr), num: true })),
              ]}
              rows={hatcheryTable.rows}
              caption="Source: NPAFC statistics via Mainsail hatchery_releases (country-level aggregates)"
            />
          </Card>
        </>
      )}

      {chumEscapement.rows.length > 0 && (
        <>
          <h2 className="h2">Chum escapement — key systems, {chumEscapement.year} (Alaska statewide)</h2>
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
              rows={chumEscapement.rows}
              caption={`Source: ADF&G escapement database via Mainsail salmon_escapement, year ${chumEscapement.year}`}
            />
          </Card>
        </>
      )}

      {sportLoading && <p className="section-intro">Loading sport harvest data…</p>}
    </>
  );
}
