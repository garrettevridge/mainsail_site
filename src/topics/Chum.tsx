import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { SalmonCommercialHarvestDataRow, HatcheryReleasesRow, SportHarvestDataRow } from "../api/types";
import { Card, Crumb, Note, StatGrid, Table } from "../components/primitives";
import StackedTrend from "../components/charts/StackedTrend";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

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

  // Statewide commercial chum harvest
  const commercialChum = useMemo(() => {
    if (!commercialData) return [];
    return commercialData
      .filter((r) => r.species === "chum" && r.region === "statewide")
      .sort((a, b) => b.year - a.year);
  }, [commercialData]);

  // Hatchery releases of chum by country/year (country-level rows only)
  const hatcheryTrend = useMemo(() => {
    if (!hatcheryData) return { chartData: [], countries: [] };

    const countries = [
      ...new Set(
        hatcheryData
          .filter((r) => r.species === "Chum" && r.data_level === "country")
          .map((r) => r.country)
      ),
    ].sort();

    const yearMap = new Map<
      number,
      Record<string, number>
    >();
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

  // Sport harvest chum (CS = Chum Salmon in ADF&G SWHS)
  const sportChum = useMemo(() => {
    if (!sportData) return [];
    const map = new Map<number, number>();
    for (const r of sportData) {
      if (r.species_code === "CS" && r.record_type === "harvest") {
        map.set(r.year, (map.get(r.year) ?? 0) + (r.fish_count ?? 0));
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, fish]) => ({ year, fish }));
  }, [sportData]);

  // Latest year commercial harvest for stat
  const latestCommercial = commercialChum[0];

  // Total North Pacific chum releases (most recent year available)
  const hatcheryLatestYear = useMemo(() => {
    if (!hatcheryTrend.chartData.length) return null;
    const last = hatcheryTrend.chartData[hatcheryTrend.chartData.length - 1];
    return {
      year: last.year as number,
      total: Object.entries(last)
        .filter(([k]) => k !== "year")
        .reduce((s, [, v]) => s + (v as number), 0),
    };
  }, [hatcheryTrend]);

  return (
    <>
      <Crumb topic="Chum Salmon Mortality & Genetics" />
      <h1 className="page-title">Chum Salmon Mortality &amp; Genetics</h1>
      <p className="page-lede first-sentence">
        Chum salmon are Alaska's second-highest-volume salmon species by
        number and the subject of a multi-decade hatchery program that now
        accounts for the majority of commercially-harvested chum statewide.
        Like Chinook, chum mortality is counted through four distinct reporting
        streams and, in parallel, genotyped against a coastwide baseline to
        attribute bycatch back to its river of origin.
      </p>
      <p className="page-lede">
        The four counting streams — commercial, subsistence, sport, and BSAI
        pollock bycatch — are the same structure as Chinook, but the magnitudes
        and the hatchery composition make chum a distinct story. The Prince
        William Sound and Southeast Alaska hatchery programs release over a
        billion chum fry annually; returning adults dominate several commercial
        districts.
      </p>
      <p className="page-lede">
        The GSI baseline resolves chum to seven reporting groups, including
        Coastal Western Alaska, Upper/Middle Yukon, and East Asian and Russian
        stocks. The proportion of each in BSAI bycatch shifts year-to-year and
        is the subject of active Council deliberation.
      </p>

      {(commLoading || hatcheryLoading || sportLoading) && (
        <p className="section-intro">Loading chum data…</p>
      )}

      {(latestCommercial || hatcheryLatestYear) && (
        <StatGrid
          stats={[
            {
              val: latestCommercial?.harvest_fish != null
                ? fmt(latestCommercial.harvest_fish)
                : "—",
              label: `Commercial harvest ${latestCommercial?.year ?? ""}`,
              sub: "Statewide, all gear",
              accent: latestCommercial?.is_preliminary === 1 ? undefined : "accent",
            },
            {
              val: hatcheryLatestYear
                ? `${(hatcheryLatestYear.total / 1e9).toFixed(2)}B`
                : "—",
              label: `N. Pacific hatchery releases ${hatcheryLatestYear?.year ?? ""}`,
              sub: "Chum salmon, all countries",
            },
            {
              val: sportChum[0]?.fish != null ? fmt(sportChum[0].fish) : "—",
              label: `Sport harvest ${sportChum[0]?.year ?? ""}`,
              sub: "Statewide (ADF&G SWHS)",
            },
          ]}
        />
      )}

      {/* ── Commercial Harvest ── */}
      <h2 className="h2">Commercial harvest — statewide chum</h2>
      <p className="section-intro">
        Statewide Alaska commercial chum salmon harvest from ADF&amp;G annual
        press releases. Figures are all-gear, all-region totals.
      </p>

      {commercialData && (
        <Card>
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Harvest (fish)", num: true },
              { label: "Preliminary" },
            ]}
            rows={commercialChum.map((r) => [
              r.year,
              fmt(r.harvest_fish),
              r.is_preliminary === 1 ? (
                <span className="preliminary-flag">Prelim</span>
              ) : (
                ""
              ),
            ])}
            caption="Source: ADF&G annual Salmon Harvest Summary press releases, via Mainsail salmon_commercial_harvest"
          />
        </Card>
      )}

      {/* ── Sport Harvest ── */}
      {sportData && sportChum.length > 0 && (
        <>
          <h2 className="h2">Sport harvest — chum salmon (statewide)</h2>
          <p className="section-intro">
            Statewide chum salmon harvest from ADF&amp;G SWHS (species code CS
            = Chum Salmon). Approximately 18-month publication lag.
          </p>
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

      {/* ── Hatchery Releases ── */}
      <h2 className="h2">North Pacific hatchery releases — chum salmon</h2>
      <p className="section-intro">
        Annual chum salmon hatchery releases by country, from the North
        Pacific Anadromous Fish Commission (NPAFC) database. The U.S. (Alaska)
        and Japan are the largest release programs; Russian and Korean programs
        have grown substantially since 2000.
      </p>

      {hatcheryData && hatcheryTrend.countries.length > 0 && (
        <Card>
          <StackedTrend
            data={hatcheryTrend.chartData}
            xKey="year"
            stackKeys={hatcheryTrend.countries}
            colors={hatcheryTrend.countries.map(
              (c) => COUNTRY_COLORS[c] ?? "#6b7280"
            )}
            title="Chum salmon hatchery releases by country (NPAFC)"
            yLabel="fish released"
            yFormatter={(v) =>
              v >= 1e9
                ? `${(v / 1e9).toFixed(1)}B`
                : v >= 1e6
                ? `${(v / 1e6).toFixed(0)}M`
                : v.toLocaleString()
            }
          />
        </Card>
      )}

      <Note>
        <b>BSAI chum PSC.</b> The <code>psc_weekly</code> dataset currently
        covers Chinook (CHNK) bycatch only. Chum bycatch from the BSAI pollock
        fishery is recorded but not yet included in this version of the
        dataset. Chum GSI attribution is also a Phase 2 item in the Mainsail
        data inventory.
      </Note>
    </>
  );
}
