import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { SalmonCommercialHarvestDataRow } from "../api/types";
import { Card, Crumb, Note } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";
import DiscardsSection from "../components/sections/DiscardsSection";
import MultiLineTrend from "../components/charts/MultiLineTrend";

const SALMON_SPECIES = ["chinook", "sockeye", "coho", "pink", "chum"] as const;
type Salmon = (typeof SALMON_SPECIES)[number];
type SalmonPoint = { year: number } & Record<Salmon, number | null>;

export default function Harvest() {
  const { data: commercialData } = useDataset<SalmonCommercialHarvestDataRow>(
    "salmon_commercial_harvest",
  );

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
        A true statewide harvest series — total pounds and total ex-vessel
        value across every Alaska commercial fishery, including the federal
        BSAI pollock catcher-processor fleet — is pending the NMFS commercial
        landings ingest. In the meantime, the comprehensive salmon series
        below speaks to scale: in a typical year Alaska's commercial salmon
        fishery alone lands more than 100 million fish.
      </p>

      {salmonSeries.length > 0 && latestSalmonYear != null && (
        <>
          <h2 className="h2">
            Alaska commercial salmon harvest, 1985–{latestSalmonYear}
          </h2>
          <p className="section-intro">
            Statewide commercial harvest by species, in number of fish. ADF&amp;G
            and NPAFC coverage is comprehensive — every commercial salmon
            fishery in Alaska reports here.
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
                " Some recent years are flagged preliminary in the underlying salmon_commercial_harvest dataset."}
            </p>
          </Card>
        </>
      )}

      <h2 className="h2">Pending</h2>
      <p className="section-intro">
        These ship once the data engine publishes the NMFS commercial landings
        rollup and the COAR first-wholesale dataset (currently empty on S3).
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
            source:
              "NMFS commercial landings + ADF&G COAR processor production + CPI-U",
            status: "blocked",
            note: "Real dollars use a pinned base year of 2025.",
          },
          {
            title:
              "Species mix — pie, single year, by volume and first-wholesale value (Pollock / Salmon / Halibut / Sablefish / Crab / Flatfish / Other)",
            source: "NMFS commercial landings + COAR production",
            status: "blocked",
          },
          {
            title:
              "Regional breakout — BSAI / Bristol Bay / Kodiak / PWS / Southeast / AYK / Westward",
            source: "NMFS commercial landings (regional)",
            status: "blocked",
          },
        ]}
      />

      <Note>
        <b>Status.</b> Comprehensive Alaska commercial harvest figures all
        come from NMFS — currently absent from the manifest. CFEC
        limited-entry data exists on S3 but excludes the BSAI pollock
        catcher-processor fleet (federal LLP, not CFEC), so it can't stand in
        as a "statewide total." The salmon detail above is comprehensive
        within salmon. Discards & Utilization, below, is sourced from the
        NMFS AKRO Catch Accounting System and is current. Full IA in{" "}
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
