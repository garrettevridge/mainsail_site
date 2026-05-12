import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SubsistenceHarvestStatewideRow,
} from "../api/types";
import {
  Card,
  Crumb,
  Note,
  Table,
} from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";
import DiscardsSection from "../components/sections/DiscardsSection";
import MultiLineTrend from "../components/charts/MultiLineTrend";

const SALMON_SPECIES = ["chinook", "sockeye", "coho", "pink", "chum"] as const;
type Salmon = (typeof SALMON_SPECIES)[number];

type SalmonPoint = { year: number } & Record<Salmon, number | null>;

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function Harvest() {
  const { data: commercialData } = useDataset<SalmonCommercialHarvestDataRow>(
    "salmon_commercial_harvest",
  );
  const { data: sportData } =
    useDataset<SportHarvestDataRow>("sport_harvest");
  const { data: subsistenceData } =
    useDataset<SubsistenceHarvestStatewideRow>("subsistence_harvest_statewide");

  // Statewide commercial salmon harvest by species, long series.
  const { harvestSeries, latestCommercialYear, hasPreliminary } = useMemo(() => {
    if (!commercialData) {
      return {
        harvestSeries: [] as SalmonPoint[],
        latestCommercialYear: null as number | null,
        hasPreliminary: false,
      };
    }
    const statewide = commercialData.filter((r) => r.region === "statewide");
    if (!statewide.length) {
      return {
        harvestSeries: [] as SalmonPoint[],
        latestCommercialYear: null as number | null,
        hasPreliminary: false,
      };
    }
    const years = [...new Set(statewide.map((r) => r.year))].sort((a, b) => a - b);
    let prelim = false;
    const series: SalmonPoint[] = years.map((yr) => {
      const point: SalmonPoint = {
        year: yr,
        chinook: null,
        sockeye: null,
        coho: null,
        pink: null,
        chum: null,
      };
      for (const sp of SALMON_SPECIES) {
        const row = statewide.find(
          (r) => r.year === yr && r.species === sp,
        );
        if (row && row.harvest_fish != null) {
          point[sp] = row.harvest_fish;
          if (row.is_preliminary === 1) prelim = true;
        }
      }
      return point;
    });
    return {
      harvestSeries: series,
      latestCommercialYear: years[years.length - 1] ?? null,
      hasPreliminary: prelim,
    };
  }, [commercialData]);

  // Latest-year salmon comparison: commercial vs. sport vs. subsistence (statewide).
  // Pick the most recent year all three datasets cover, in fish counts.
  const useByUserGroupTable = useMemo(() => {
    if (!commercialData || !sportData || !subsistenceData) return null;

    const commercialYears = new Set(
      commercialData.filter((r) => r.region === "statewide").map((r) => r.year),
    );
    const sportYears = new Set(sportData.map((r) => r.year));
    const subsistenceYears = new Set(subsistenceData.map((r) => r.year));
    const candidateYears = [...commercialYears]
      .filter((y) => sportYears.has(y) && subsistenceYears.has(y))
      .sort((a, b) => b - a);
    const year = candidateYears[0] ?? null;
    if (year == null) return null;

    const sportCodeToSpecies: Record<string, Salmon> = {
      KS: "chinook",
      SS: "sockeye",
      CS: "coho",
      PS: "pink",
      DS: "chum",
    };

    const rows = SALMON_SPECIES.map((sp) => {
      const commercial =
        commercialData
          .filter(
            (r) =>
              r.region === "statewide" &&
              r.year === year &&
              r.species === sp,
          )
          .reduce((s, r) => s + (r.harvest_fish ?? 0), 0);

      const sport = sportData
        .filter(
          (r) =>
            r.year === year &&
            sportCodeToSpecies[r.species_code] === sp &&
            r.record_type === "harvest",
        )
        .reduce((s, r) => s + (r.fish_count ?? 0), 0);

      const subsistence = subsistenceData
        .filter((r) => r.year === year && r.species === sp)
        .reduce((s, r) => s + (r.harvest_count ?? 0), 0);

      return { species: sp, commercial, sport, subsistence };
    });

    return { year, rows };
  }, [commercialData, sportData, subsistenceData]);

  return (
    <article>
      <Crumb topic="Harvest" />
      <span className="section-pill">02 · Section</span>
      <h1 className="page-title">Harvest</h1>

      <p className="page-lede first-sentence">
        Alaska's harvest is diverse — more than 100 commercially-landed
        species — significant in scale, and structurally unlike most fisheries.
      </p>
      <p className="page-lede">
        The full multi-species view (Pollock, Salmon, Halibut, Sablefish,
        Crab, Flatfish, Other) is pending the NMFS commercial landings
        ingest. For now this page leads with what is already wired:
        statewide salmon harvest by species (the largest fishery by number
        of fish), and a comparison of commercial, sport, and subsistence
        use for the most recent year all three are reported. Discards and
        utilization live at the bottom.
      </p>

      {harvestSeries.length > 0 && latestCommercialYear != null && (
        <>
          <h2 className="h2">
            Alaska commercial salmon harvest by species, 1985–{latestCommercialYear}
          </h2>
          <p className="section-intro">
            Statewide commercial harvest in number of fish, all five Pacific
            salmon species. Long-window comparable series per CLAUDE.md;
            gaps render where a species has no reported value.
          </p>
          <Card>
            <MultiLineTrend
              data={harvestSeries}
              xKey="year"
              seriesKeys={[...SALMON_SPECIES]}
              title={`Alaska commercial salmon harvest by species, 1985–${latestCommercialYear}`}
              xLabel="Year"
              yLabel="fish"
              unitSuffix="fish"
            />
            <p className="card-sub" style={{ marginTop: 8 }}>
              Region: Alaska statewide. Source: Seamark Analytics, derived
              from ADF&amp;G annual Salmon Harvest Summary press releases
              (2019+) and NPAFC Pacific Salmonid Catch Statistics (1985–2018).
              {hasPreliminary &&
                " Some recent years are flagged preliminary in the underlying salmon_commercial_harvest dataset (is_preliminary=1)."}
            </p>
          </Card>
        </>
      )}

      {useByUserGroupTable && (
        <>
          <h2 className="h2">
            Salmon by user group, {useByUserGroupTable.year} — commercial vs. sport vs. subsistence
          </h2>
          <p className="section-intro">
            All five salmon species, statewide, in number of fish. Sport
            counts are kept fish only (catch-and-release mortality not
            included; see Chinook page for ADF&amp;G's site-specific
            studies). Subsistence reflects ADF&amp;G Division of Subsistence
            statewide totals; tribal and federal subsistence permits may
            be reported with a different cadence.
          </p>
          <Card>
            <Table
              columns={[
                { label: "Species" },
                { label: "Commercial (fish)", num: true },
                { label: "Sport — kept (fish)", num: true },
                { label: "Subsistence (fish)", num: true },
              ]}
              rows={useByUserGroupTable.rows.map((r) => [
                r.species.charAt(0).toUpperCase() + r.species.slice(1),
                fmt(r.commercial),
                fmt(r.sport),
                fmt(r.subsistence),
              ])}
              caption={`Region: Alaska statewide. Year: ${useByUserGroupTable.year}. Source: Seamark Analytics, derived from salmon_commercial_harvest (ADF&G/NPAFC), sport_harvest (ADF&G Statewide Harvest Survey), and subsistence_harvest_statewide (NPAFC-sourced ADF&G Division of Subsistence rollup).`}
            />
          </Card>
        </>
      )}

      <h2 className="h2">Pending — the full multi-species view</h2>
      <p className="section-intro">
        Each row below is a chart or table blocked on a dataset the
        data engine is currently building.
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "Statewide commercial harvest volume, all species, long series (round lbs)",
            source: "NMFS commercial landings",
            status: "blocked",
          },
          {
            title:
              "Statewide value — ex-vessel and first-wholesale together, real USD, long series",
            source: "NMFS commercial landings + NMFS processor reports + CPI-U",
            status: "blocked",
            note: "Real dollars use a pinned base year of 2025.",
          },
          {
            title:
              "Species mix — pie, volume share, latest year (Pollock, Salmon, Halibut, Sablefish, Crab, Flatfish, Other)",
            source: "NMFS commercial landings",
            status: "blocked",
          },
          {
            title:
              "Species mix — pie, first-wholesale value share, same 7 buckets",
            source: "NMFS first-wholesale value",
            status: "blocked",
          },
          {
            title:
              "Regional breakout — volume & value by BSAI / Bristol Bay / Kodiak / PWS / Southeast / AYK / Westward",
            source: "NMFS commercial landings (regional)",
            status: "blocked",
          },
        ]}
      />

      <Note>
        <b>Status.</b> The salmon and user-group sections above use data
        already on S3. The full multi-species statewide and regional views
        ship as soon as the NMFS commercial landings dataset lands. Full
        IA in{" "}
        <a
          href="https://github.com/garrettevridge/mainsail_site/blob/main/docs/INFORMATION_ARCHITECTURE.md"
          target="_blank"
          rel="noreferrer"
        >
          docs/INFORMATION_ARCHITECTURE.md
        </a>
        .
      </Note>

      <DiscardsSection />
    </article>
  );
}
