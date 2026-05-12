import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  CfecEarningsRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
  SubsistenceHarvestStatewideRow,
} from "../api/types";
import { Card, Crumb, Note, Table } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";
import DiscardsSection from "../components/sections/DiscardsSection";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import BigLine from "../components/charts/BigLine";
import SourcePie from "../components/charts/SourcePie";

const SALMON_SPECIES = ["chinook", "sockeye", "coho", "pink", "chum"] as const;
type Salmon = (typeof SALMON_SPECIES)[number];

type SalmonPoint = { year: number } & Record<Salmon, number | null>;

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

// 7-bucket harvest taxonomy used site-wide. Classify each CFEC fishery_desc
// into one of these buckets using string-match rules. Anything unmatched
// falls into "Other" (cod, herring, smelt, dive fisheries, etc.).
const BUCKET_ORDER = [
  "Pollock",
  "Salmon",
  "Halibut",
  "Sablefish",
  "Crab",
  "Flatfish",
  "Other",
] as const;
type Bucket = (typeof BUCKET_ORDER)[number];

const classifyFishery = (desc: string): Bucket => {
  const d = desc.toUpperCase();
  if (d.startsWith("SALMON")) return "Salmon";
  if (d.startsWith("HALIBUT")) return "Halibut";
  if (d.startsWith("SABLEFISH") || d.startsWith("ABLEFISH")) return "Sablefish";
  if (d.startsWith("POLLOCK") || d.includes("WALLEYE POLLOCK")) return "Pollock";
  if (
    d.includes("KING CRAB") ||
    d.includes("TANNER CRAB") ||
    d.includes("SNOW CRAB") ||
    d.includes("DUNGENESS") ||
    d.startsWith("CRAB")
  )
    return "Crab";
  if (
    d.includes("FLATFISH") ||
    d.includes("FLOUNDER") ||
    d.includes("SOLE") ||
    d.includes("TURBOT") ||
    d.includes("ARROWTOOTH") ||
    d.includes("PLAICE")
  )
    return "Flatfish";
  return "Other";
};

export default function Harvest() {
  const { data: cfecData } = useDataset<CfecEarningsRow>("cfec_earnings");
  const { data: commercialData } = useDataset<SalmonCommercialHarvestDataRow>(
    "salmon_commercial_harvest",
  );
  const { data: sportData } =
    useDataset<SportHarvestDataRow>("sport_harvest");
  const { data: subsistenceData } =
    useDataset<SubsistenceHarvestStatewideRow>("subsistence_harvest_statewide");

  // Statewide CFEC harvest + earnings, all commercial fisheries summed per year.
  const cfecSeries = useMemo(() => {
    if (!cfecData) return [];
    const byYear = new Map<number, { lbs: number; earnings: number }>();
    for (const r of cfecData) {
      if (!byYear.has(r.year)) byYear.set(r.year, { lbs: 0, earnings: 0 });
      const acc = byYear.get(r.year)!;
      if (r.total_lbs != null) acc.lbs += r.total_lbs;
      if (r.total_earnings != null) acc.earnings += r.total_earnings;
    }
    return [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, { lbs, earnings }]) => ({ year, lbs, earnings }));
  }, [cfecData]);

  const latestCfecYear = cfecSeries.length
    ? cfecSeries[cfecSeries.length - 1].year
    : null;
  const earliestCfecYear = cfecSeries.length ? cfecSeries[0].year : null;
  const latestCfec = cfecSeries.length
    ? cfecSeries[cfecSeries.length - 1]
    : null;

  // Latest-year species-bucket pie from CFEC fishery_desc classification.
  const bucketPies = useMemo(() => {
    if (!cfecData || latestCfecYear == null) return null;
    const byBucketLbs = new Map<Bucket, number>(
      BUCKET_ORDER.map((b) => [b, 0]),
    );
    const byBucketEarnings = new Map<Bucket, number>(
      BUCKET_ORDER.map((b) => [b, 0]),
    );
    for (const r of cfecData) {
      if (r.year !== latestCfecYear) continue;
      const b = classifyFishery(r.fishery_desc);
      if (r.total_lbs != null)
        byBucketLbs.set(b, (byBucketLbs.get(b) ?? 0) + r.total_lbs);
      if (r.total_earnings != null)
        byBucketEarnings.set(b, (byBucketEarnings.get(b) ?? 0) + r.total_earnings);
    }
    const lbsData = BUCKET_ORDER.map((b) => ({
      source: b,
      value: byBucketLbs.get(b) ?? 0,
    })).filter((d) => d.value > 0);
    const earningsData = BUCKET_ORDER.map((b) => ({
      source: b,
      value: byBucketEarnings.get(b) ?? 0,
    })).filter((d) => d.value > 0);
    return { lbsData, earningsData, year: latestCfecYear };
  }, [cfecData, latestCfecYear]);

  // Salmon commercial harvest series (already wired before).
  const { harvestSeries: salmonSeries, latestSalmonYear, hasPreliminary } =
    useMemo(() => {
      if (!commercialData) {
        return {
          harvestSeries: [] as SalmonPoint[],
          latestSalmonYear: null as number | null,
          hasPreliminary: false,
        };
      }
      const statewide = commercialData.filter((r) => r.region === "statewide");
      if (!statewide.length) {
        return {
          harvestSeries: [] as SalmonPoint[],
          latestSalmonYear: null as number | null,
          hasPreliminary: false,
        };
      }
      const years = [...new Set(statewide.map((r) => r.year))].sort(
        (a, b) => a - b,
      );
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
        latestSalmonYear: years[years.length - 1] ?? null,
        hasPreliminary: prelim,
      };
    }, [commercialData]);

  // User-group comparison: latest overlap year.
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
      const commercial = commercialData
        .filter(
          (r) =>
            r.region === "statewide" && r.year === year && r.species === sp,
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
        This page leads with the CFEC limited-entry permit fisheries — salmon
        nets, halibut and sablefish IFQ, crab, herring, dive fisheries,
        state-water groundfish — which form the bulk of Alaska's "small-boat"
        commercial economy. The federal BSAI pollock catcher-processor fleet
        sits outside this series; it's licensed under federal LLP, not CFEC,
        and adds roughly 3 billion pounds annually on top. NMFS commercial
        landings (still pending on the data engine) will close that gap.
      </p>

      {cfecSeries.length > 0 &&
        latestCfecYear != null &&
        earliestCfecYear != null && (
          <>
            <h2 className="h2">
              CFEC limited-entry harvest, {earliestCfecYear}–{latestCfecYear}
            </h2>
            <p className="section-intro">
              Total pounds landed across every CFEC permit-fishery, statewide.
              Excludes federal LLP-licensed fleet (BSAI pollock CPs, motherships,
              Amendment 80 trawl).
            </p>
            <BigLine
              data={cfecSeries}
              xKey="year"
              yKey="lbs"
              yLabel="pounds landed"
              unitSuffix="lbs"
              refYears={[
                { year: 1975, label: "Limited Entry" },
                { year: 1995, label: "Halibut IFQ" },
              ]}
            />
            <p className="data-caption" style={{ marginTop: 4 }}>
              Region: Alaska statewide. Source: Seamark Analytics, derived
              from ADF&amp;G CFEC permit fishery earnings reports. Latest year
              ({latestCfecYear}):{" "}
              <span className="font-mono">
                {fmt(Math.round((latestCfec?.lbs ?? 0) / 1_000_000))}M
              </span>{" "}
              pounds.
            </p>

            <h2 className="h2">
              Ex-vessel earnings, {earliestCfecYear}–{latestCfecYear}
            </h2>
            <p className="section-intro">
              Dollars paid to CFEC permit holders for the harvest above.
              Shown in nominal USD — real-dollar conversion (base year 2025)
              ships once the CPI-U deflator dataset reaches S3.
            </p>
            <BigLine
              data={cfecSeries}
              xKey="year"
              yKey="earnings"
              yLabel="ex-vessel USD (nominal)"
              unitSuffix="USD"
              color="#1a5fb4"
              refYears={[
                { year: 1975, label: "Limited Entry" },
                { year: 1995, label: "Halibut IFQ" },
              ]}
            />
            <p className="data-caption" style={{ marginTop: 4 }}>
              Region: Alaska statewide. Source: Seamark Analytics, derived
              from ADF&amp;G CFEC permit fishery earnings reports. Latest year
              ({latestCfecYear}):{" "}
              <span className="font-mono">
                ${fmt(Math.round((latestCfec?.earnings ?? 0) / 1_000_000))}M
              </span>{" "}
              nominal USD.
            </p>
          </>
        )}

      {bucketPies && bucketPies.lbsData.length > 0 && (
        <>
          <h2 className="h2">
            Species mix, {bucketPies.year}
          </h2>
          <p className="section-intro">
            CFEC-permitted fisheries classified into the 7-bucket harvest
            taxonomy by parsing each fishery's description. Two views: share
            of total pounds, and share of total permit earnings.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <Card>
              <div className="card-title">By volume (lbs)</div>
              <SourcePie data={bucketPies.lbsData} unit="lbs" />
            </Card>
            <Card>
              <div className="card-title">By ex-vessel earnings (USD)</div>
              <SourcePie data={bucketPies.earningsData} unit="USD" />
            </Card>
          </div>
          <p className="data-caption" style={{ marginTop: 4 }}>
            Region: Alaska statewide. Source: Seamark Analytics, derived from
            ADF&amp;G CFEC, classified by fishery_desc into Pollock / Salmon /
            Halibut / Sablefish / Crab / Flatfish / Other.
          </p>
        </>
      )}

      {salmonSeries.length > 0 && latestSalmonYear != null && (
        <>
          <h2 className="h2">
            Salmon by species, 1985–{latestSalmonYear}
          </h2>
          <p className="section-intro">
            Drilling into the largest fishery by fish count: statewide
            commercial salmon harvest by species, in number of fish.
          </p>
          <Card>
            <MultiLineTrend
              data={salmonSeries}
              xKey="year"
              seriesKeys={[...SALMON_SPECIES]}
              title={`Alaska commercial salmon harvest by species, 1985–${latestSalmonYear}`}
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
            Salmon by user group, {useByUserGroupTable.year}
          </h2>
          <p className="section-intro">
            All five salmon species, statewide, number of fish, across
            commercial, sport (kept fish only), and subsistence harvest.
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
              caption={`Region: Alaska statewide. Year: ${useByUserGroupTable.year}. Source: salmon_commercial_harvest (ADF&G/NPAFC) + sport_harvest (ADF&G SWHS) + subsistence_harvest_statewide (NPAFC-sourced ADF&G Division of Subsistence rollup).`}
            />
          </Card>
        </>
      )}

      <h2 className="h2">Pending</h2>
      <p className="section-intro">
        Two pieces still in the build queue:
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "Regional breakout — volume & earnings by BSAI / Bristol Bay / Kodiak / PWS / Southeast / AYK / Westward",
            source:
              "CFEC fishery_desc parsing or NMFS commercial landings (regional)",
            status: "blocked",
            note: "CFEC fishery_desc carries region info; parser is on the build list.",
          },
          {
            title:
              "First-wholesale value alongside ex-vessel (real and nominal)",
            source: "NMFS processor reports / ADF&G COAR",
            status: "blocked",
            note: "coar_production placeholder exists on S3 but is currently empty.",
          },
        ]}
      />

      <Note>
        <b>Status.</b> Statewide harvest, earnings, and species mix all read
        from CFEC. Salmon detail uses the ADF&amp;G/NPAFC salmon dataset.
        Discards below uses NMFS AKRO Catch Accounting. Full IA in{" "}
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
