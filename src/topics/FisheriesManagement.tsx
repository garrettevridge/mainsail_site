import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type { SalmonCommercialHarvestDataRow } from "../api/types";
import {
  Card,
  Crumb,
  DataContext,
  KV,
  Pill,
  Table,
} from "../components/primitives";
import MultiLineTrend from "../components/charts/MultiLineTrend";

const SPECIES_ORDER = [
  "chinook",
  "sockeye",
  "coho",
  "pink",
  "chum",
] as const;
type Species = (typeof SPECIES_ORDER)[number];

type HarvestPoint = { year: number } & Record<Species, number | null>;

export default function FisheriesManagement() {
  const { data: commercialData } =
    useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");

  // Long time series of statewide commercial salmon harvest by species.
  // Per CLAUDE.md: longest comparable window (1985-present), no imputation.
  const { harvestSeries, latestYear, hasPreliminary } = useMemo(() => {
    if (!commercialData) {
      return {
        harvestSeries: [] as HarvestPoint[],
        latestYear: null as number | null,
        hasPreliminary: false,
      };
    }
    const statewide = commercialData.filter(
      (r) => r.region === "statewide",
    );
    if (!statewide.length) {
      return {
        harvestSeries: [] as HarvestPoint[],
        latestYear: null as number | null,
        hasPreliminary: false,
      };
    }
    const years = [...new Set(statewide.map((r) => r.year))].sort(
      (a, b) => a - b,
    );
    let prelim = false;
    const series: HarvestPoint[] = years.map((yr) => {
      const point: HarvestPoint = {
        year: yr,
        chinook: null,
        sockeye: null,
        coho: null,
        pink: null,
        chum: null,
      };
      for (const sp of SPECIES_ORDER) {
        const row = statewide.find(
          (r) => r.species === sp && r.year === yr,
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
      latestYear: years[years.length - 1] ?? null,
      hasPreliminary: prelim,
    };
  }, [commercialData]);

  return (
    <>
      <Crumb topic="Fisheries Management" />
      <h1 className="page-title">Fisheries Management</h1>

      <DataContext
        use={[
          "salmon_commercial_harvest — ADF&G/NPAFC statewide harvest by species, 1985-present",
        ]}
        could={[
          "subsistence_harvest — federal/state subsistence take",
          "personal_use_harvest — dipnet and personal-use data",
          "salmon_age_sex_size — biological sampling data",
          "ADF&G tender tickets by port/processor",
        ]}
        ideas={[
          "Map view of escapement by drainage",
          "Goal attainment rate trend (% years goal met)",
          "Harvest vs. escapement ratio by system over time",
          "Jurisdiction overlay: state vs. federal waters by species",
        ]}
      />

      <h2 className="h2">Jurisdiction at a glance</h2>
      <Card>
        <Table
          columns={[
            { label: "Fishery" },
            { label: "Waters" },
            { label: "Managing body" },
            { label: "Authority" },
          ]}
          rows={[
            ["All salmon", "0–200 nm", "State — ADF&G Division of Commercial Fisheries", "Alaska statutes + Board of Fisheries regs"],
            ["Herring", "0–200 nm", "State — ADF&G", "Alaska statutes + Board of Fisheries"],
            ["State-waters groundfish", "0–3 nm", "State — ADF&G", "Alaska statutes + Board of Fisheries"],
            ["Federal groundfish (pollock, cod, sablefish, flatfish, etc.)", "3–200 nm", "Federal — NMFS AKRO, advised by NPFMC", "Magnuson-Stevens Act + FMPs"],
            ["BSAI & GOA crab", "3–200 nm", "Federal — NMFS, state cooperatively", "MSA + state-federal crab FMPs"],
            ["Pacific halibut", "Coastwide (AK, BC, WA, OR, CA)", "International — IPHC, implemented by NMFS (US) and DFO (CA)", "Halibut Convention Act of 1982"],
            ["Federal subsistence (rural, federal lands/waters)", "Federal public waters", "USFWS Office of Subsistence Management", "ANILCA Title VIII"],
            ["Recreational (sport)", "0–200 nm", "State inside 3 nm; charter halibut co-managed with IPHC/NMFS", "AK statutes + 50 CFR 300 Subpart E"],
          ]}
          caption="Region: Alaska statewide. Source: Seamark Analytics, derived from federal and state statutes, FMPs, and the Halibut Convention Act of 1982."
        />
      </Card>

      <h3 className="h3">How rules are made</h3>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <div><Pill kind="fed">Federal</Pill></div>
          <div className="card-title" style={{ marginTop: 8 }}>North Pacific Fishery Management Council</div>
          <div className="card-sub">MSA-chartered body · Anchorage-based · 15 voting members (AK, WA, OR, federal, tribal)</div>
          <KV
            pairs={[
              { dt: "Meets", dd: "5× per year, publicly, with SSC and AP advisory bodies" },
              { dt: "Key outputs", dd: "Fishery Management Plans (FMPs), annual harvest specifications, PSC caps, gear & area rules" },
              { dt: "Science", dd: "Stock assessments from AFSC (NOAA Alaska Fisheries Science Center); SAFE reports annually" },
              { dt: "Implements", dd: "NMFS AKRO promulgates and enforces as federal regulations (50 CFR 679)" },
            ]}
          />
        </Card>
        <Card>
          <div><Pill kind="st">State</Pill></div>
          <div className="card-title" style={{ marginTop: 8 }}>Alaska Board of Fisheries</div>
          <div className="card-sub">7 members appointed by the Governor · 4–6 meetings per year on regional cycles</div>
          <KV
            pairs={[
              { dt: "Cycle", dd: "Three-year rotation by region (Lower Cook Inlet, Bristol Bay, AYK, etc.)" },
              { dt: "Key outputs", dd: "Management plans, escapement goals, allocation between user groups" },
              { dt: "Science", dd: "ADF&G Division of Commercial Fisheries and Division of Sport Fish" },
              { dt: "Implements", dd: "ADF&G area managers exercise emergency order authority in-season" },
            ]}
          />
        </Card>
      </div>

      <h2 className="h2">Transboundary bodies</h2>
      <Card>
        <Table
          columns={[
            { label: "Body" },
            { label: "Parties" },
            { label: "Scope" },
            { label: "Est." },
          ]}
          rows={[
            ["International Pacific Halibut Commission (IPHC)", "United States & Canada", "Stock assessment, catch limits (TCEY), regulation of the halibut fishery coastwide", "1923"],
            ["Pacific Salmon Commission", "United States & Canada", "Transboundary salmon sharing under the Pacific Salmon Treaty (Stikine, Taku, Alsek; WCVI Chinook)", "1985"],
            ["Yukon River Panel", "United States & Canada", "Yukon Chinook, chum and coho management under the Yukon River Salmon Agreement", "1995"],
            ["North Pacific Anadromous Fish Commission (NPAFC)", "Canada, Japan, Republic of Korea, Russian Federation, United States", "High-seas salmon research and enforcement of no-directed-harvest rule beyond EEZs", "1993"],
          ]}
          caption="Region: North Pacific (transboundary). Source: Seamark Analytics, derived from IPHC, Pacific Salmon Commission, Yukon River Panel, and NPAFC convention texts and member-agency publications."
        />
      </Card>

      {commercialData && harvestSeries.length > 0 && latestYear != null && (
        <>
          <h2 className="h2">
            Alaska commercial salmon harvest by species, 1985–{latestYear}
          </h2>
          <Card>
            <MultiLineTrend
              data={harvestSeries}
              xKey="year"
              seriesKeys={[...SPECIES_ORDER]}
              title={`Alaska commercial salmon harvest by species, 1985–${latestYear}`}
              xLabel="Year"
              yLabel="fish"
              unitSuffix="fish"
            />
            <p className="card-sub" style={{ marginTop: 8 }}>
              Region: Alaska statewide. Source: Seamark Analytics, derived
              from ADF&amp;G annual Salmon Harvest Summary press releases
              (2019+) and NPAFC Pacific Salmonid Catch Statistics (1985–2018).
              Gaps render where a species has no reported value for a year;
              values are not imputed.
              {hasPreliminary && " Some recent years are flagged preliminary in the underlying salmon_commercial_harvest dataset (is_preliminary=1)."}
            </p>
          </Card>
        </>
      )}
    </>
  );
}
