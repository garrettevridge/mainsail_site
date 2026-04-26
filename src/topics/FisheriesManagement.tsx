import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import { filterCountableEscapement } from "../api/datasetHelpers";
import type {
  SalmonCommercialHarvestDataRow,
  SalmonEscapementRow,
  EscapementGoalsHistoryRow,
} from "../api/types";
import {
  Card,
  Crumb,
  DataContext,
  KV,
  Pill,
  Table,
} from "../components/primitives";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

export default function FisheriesManagement() {
  const { data: commercialData } =
    useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: escapementData } =
    useDataset<SalmonEscapementRow>("salmon_escapement");
  const { data: goalsData } =
    useDataset<EscapementGoalsHistoryRow>("escapement_goals_history");

  const harvestYears = useMemo(() => {
    if (!commercialData) return [];
    const statewide = commercialData.filter((r) => r.region === "statewide");
    return [...new Set(statewide.map((r) => r.year))].sort((a, b) => a - b).slice(-5);
  }, [commercialData]);

  const harvestBySpecies = useMemo(() => {
    if (!commercialData || !harvestYears.length) return [];
    const statewide = commercialData.filter((r) => r.region === "statewide");
    const SPECIES_ORDER = ["chinook", "sockeye", "coho", "pink", "chum"];
    return SPECIES_ORDER.map((sp) =>
      [sp as string | number, ...harvestYears.map((yr) => {
        const row = statewide.find((r) => r.species === sp && r.year === yr);
        if (row?.harvest_fish == null) return "—" as string | number;
        return fmt(row.harvest_fish) + (row.is_preliminary === 1 ? " †" : "");
      })]
    );
  }, [commercialData, harvestYears]);

  const recentEscapement = useMemo(() => {
    const countable = filterCountableEscapement(escapementData);
    if (!countable.length) return { rows: [] as (string | number)[][], year: null as number | null };
    const maxYear = Math.max(...countable.map((r) => r.year));
    const rows = countable
      .filter((r) => r.year === maxYear && r.actual_count != null)
      .sort((a, b) => (b.actual_count ?? 0) - (a.actual_count ?? 0))
      .slice(0, 25)
      .map((r) => [
        r.system_name,
        r.species,
        r.region ?? "—",
        r.count_method ?? "—",
        fmt(r.actual_count),
        r.goal_lower != null && r.goal_upper != null
          ? `${fmt(r.goal_lower)}–${fmt(r.goal_upper)}`
          : "—",
        r.goal_met === 1 ? "Yes" : r.goal_met === 0 ? "No" : "—",
      ]);
    return { rows, year: maxYear };
  }, [escapementData]);

  const goalsRows = useMemo(() => {
    if (!goalsData) return [];
    return [...goalsData]
      .sort((a, b) => a.system_name.localeCompare(b.system_name))
      .map((r) => [
        r.system_name,
        r.species,
        r.goal_type,
        r.goal_lower != null && r.goal_upper != null
          ? `${fmt(r.goal_lower)}–${fmt(r.goal_upper)}`
          : "—",
        String(r.effective_year_start),
        r.effective_year_end != null ? String(r.effective_year_end) : "present",
        r.source_document ?? "—",
      ]);
  }, [goalsData]);

  return (
    <>
      <Crumb topic="Fisheries Management" />
      <h1 className="page-title">Fisheries Management</h1>

      <DataContext
        use={[
          "salmon_commercial_harvest — ADF&G statewide harvest by species",
          "salmon_escapement — ADF&G escapement counts by system",
          "escapement_goals_history — ADF&G escapement goal history",
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
            ["International Pacific Halibut Commission (IPHC)", "U.S. & Canada", "Stock assessment, catch limits (TCEY), regulation of the halibut fishery coastwide", "1923"],
            ["Pacific Salmon Commission", "U.S. & Canada", "Transboundary salmon sharing under the Pacific Salmon Treaty (Stikine, Taku, Alsek; WCVI Chinook)", "1985"],
            ["Yukon River Panel", "U.S. & Canada", "Yukon Chinook, chum and coho management under the Yukon River Salmon Agreement", "1995"],
            ["North Pacific Anadromous Fish Commission (NPAFC)", "U.S., Canada, Japan, Russia, Korea", "High-seas salmon research and enforcement of no-directed-harvest rule beyond EEZs", "1993"],
          ]}
        />
      </Card>

      {commercialData && harvestBySpecies.length > 0 && (
        <>
          <h2 className="h2">Commercial salmon harvest — statewide by species (fish)</h2>
          <Card>
            <Table
              columns={[
                { label: "Species" },
                ...harvestYears.map((yr) => ({ label: String(yr), num: true })),
              ]}
              rows={harvestBySpecies}
              caption="Source: ADF&G annual Salmon Harvest Summary, via Mainsail salmon_commercial_harvest. † = preliminary."
            />
          </Card>
        </>
      )}

      {escapementData && recentEscapement.rows.length > 0 && (
        <>
          <h2 className="h2">
            Salmon escapement — top systems by count, {recentEscapement.year}
          </h2>
          <Card>
            <Table
              columns={[
                { label: "System" },
                { label: "Species" },
                { label: "Region" },
                { label: "Method" },
                { label: "Count", num: true },
                { label: "Goal range" },
                { label: "Goal met" },
              ]}
              rows={recentEscapement.rows}
              caption={`Source: ADF&G escapement database via Mainsail salmon_escapement, year ${recentEscapement.year}`}
            />
          </Card>
        </>
      )}

      {goalsData && goalsRows.length > 0 && (
        <>
          <h2 className="h2">Escapement goals history</h2>
          <Card>
            <Table
              columns={[
                { label: "System" },
                { label: "Species" },
                { label: "Goal type" },
                { label: "Goal range" },
                { label: "From" },
                { label: "To" },
                { label: "Source document" },
              ]}
              rows={goalsRows}
              caption="Source: ADF&G Board of Fisheries escapement goal history, via Mainsail escapement_goals_history"
            />
          </Card>
        </>
      )}
    </>
  );
}
