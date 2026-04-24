import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import type {
  PscWeeklyDataRow,
  ChinookGsiRow,
  SalmonCommercialHarvestDataRow,
  SportHarvestDataRow,
} from "../api/types";
import { Card, Crumb, Note, StatGrid, Table } from "../components/primitives";
import StackedTrend from "../components/charts/StackedTrend";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : `${(n * 100).toFixed(1)}%`;

// Normalize PSC target fisheries to a small set for the chart
function normalizeFishery(tf: string): string {
  if (tf === "Midwater Pollock") return "Pollock (midwater)";
  if (tf === "Bottom Pollock") return "Pollock (bottom)";
  if (tf === "Pacific Cod") return "Pacific Cod";
  return "Other groundfish";
}

export default function Chinook() {
  // psc_weekly is ~48 MB; load time may be several seconds on first visit
  const { data: pscData, isLoading: pscLoading, error: pscError } =
    useDataset<PscWeeklyDataRow>("psc_weekly");
  const { data: gsiData, isLoading: gsiLoading } =
    useDataset<ChinookGsiRow>("chinook_gsi");
  const { data: commercialData, isLoading: commLoading } =
    useDataset<SalmonCommercialHarvestDataRow>("salmon_commercial_harvest");
  const { data: sportData, isLoading: sportLoading } =
    useDataset<SportHarvestDataRow>("sport_harvest");

  // Annual BSAI Chinook PSC by normalized target fishery
  const pscTrend = useMemo(() => {
    if (!pscData) return [];
    const FISHERIES = [
      "Pollock (midwater)",
      "Pollock (bottom)",
      "Pacific Cod",
      "Other groundfish",
    ];
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

  // Most recent year PSC breakdown by original target fishery
  const pscLatestYear = useMemo(() => {
    if (!pscData) return null;
    const chnk = pscData.filter((r) => r.species_code === "CHNK");
    return chnk.length ? Math.max(...chnk.map((r) => r.year)) : null;
  }, [pscData]);

  const pscByFishery = useMemo(() => {
    if (!pscData || pscLatestYear == null) return [];
    const map = new Map<string, number>();
    for (const r of pscData) {
      if (
        r.species_code === "CHNK" &&
        r.year === pscLatestYear &&
        r.is_confidential === 0
      ) {
        map.set(r.target_fishery, (map.get(r.target_fishery) ?? 0) + (r.psc_count ?? 0));
      }
    }
    return [...map.entries()]
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([fishery, count]) => [fishery, fmt(count)]);
  }, [pscData, pscLatestYear]);

  const pscAnnualTotal = useMemo(() => {
    if (!pscTrend.length) return null;
    const last = pscTrend[pscTrend.length - 1];
    return Object.entries(last)
      .filter(([k]) => k !== "year")
      .reduce((s, [, v]) => s + (v as number), 0);
  }, [pscTrend]);

  // Commercial harvest — statewide chinook
  const commercialChinook = useMemo(() => {
    if (!commercialData) return [];
    return commercialData
      .filter((r) => r.species === "chinook" && r.region === "statewide")
      .sort((a, b) => b.year - a.year);
  }, [commercialData]);

  // Sport harvest — King salmon (KS code = King/Chinook in ADF&G SWHS)
  const sportChinook = useMemo(() => {
    if (!sportData) return [];
    const map = new Map<number, number>();
    for (const r of sportData) {
      if (r.species_code === "KS" && r.record_type === "harvest") {
        map.set(r.year, (map.get(r.year) ?? 0) + (r.fish_count ?? 0));
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, fish]) => ({ year, fish }));
  }, [sportData]);

  return (
    <>
      <Crumb topic="Chinook Mortality & Genetics" />
      <h1 className="page-title">Chinook Mortality &amp; Genetics</h1>
      <p className="page-lede first-sentence">
        Chinook salmon — the largest of the five Pacific salmon species and
        culturally central across Alaska — are counted as they return to
        spawning rivers, as they are caught commercially, and as they are
        sampled from bycatch at sea. Four reporting streams, each on a
        different cadence, together describe the total human-caused mortality
        in any given year.
      </p>
      <p className="page-lede">
        The four categories are <b>commercial</b> (dominated by Southeast
        Alaska troll), <b>sport</b> (harvest plus catch-and-release mortality,
        measured through the ADF&amp;G Statewide Harvest Survey),{" "}
        <b>subsistence</b> (state and federal surveys combined), and{" "}
        <b>BSAI pollock bycatch</b> (observed in real time and capped at
        approximately 47,591 fish under Amendment 91). Each is measured by a
        different agency with a different reporting lag — from one week for
        federal bycatch to over 18 months for subsistence.
      </p>
      <p className="page-lede">
        A fifth stream runs in parallel. The AFSC Auke Bay laboratory
        genotypes bycatch samples against a coastwide genetic baseline,
        attributing them to stock reporting groups such as Coastal Western
        Alaska, British Columbia, and the West Coast U.S. This answers a
        separate question from the raw count: not <i>how many</i> Chinook were
        killed, but <i>which river systems</i> they came from.
      </p>

      {/* ── BSAI PSC Section ── */}
      <h2 className="h2">BSAI pollock Chinook bycatch (PSC)</h2>
      <p className="section-intro">
        Annual bycatch count from NMFS weekly PSC reports. The Amendment 91
        cap applies to the Bering Sea pollock fleet; additional caps apply to
        other sectors.{" "}
        {pscLoading && (
          <span style={{ color: "var(--muted)" }}>
            Loading PSC data (~48 MB)…
          </span>
        )}
      </p>

      {pscError && (
        <Note>Could not load PSC data. The dataset may be temporarily unavailable.</Note>
      )}

      {pscData && pscTrend.length > 0 && (
        <>
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
          <Card>
            <StackedTrend
              data={pscTrend}
              xKey="year"
              stackKeys={[
                "Pollock (midwater)",
                "Pollock (bottom)",
                "Pacific Cod",
                "Other groundfish",
              ]}
              colors={["#1a2332", "#2f5d8a", "#b45309", "#d4c5b0"]}
              title="BSAI Chinook PSC by target fishery, 2013–present"
              yLabel="fish"
              yFormatter={(v) => v.toLocaleString()}
            />
          </Card>

          {pscByFishery.length > 0 && (
            <>
              <h3 className="h3">
                {pscLatestYear} PSC by target fishery (non-confidential)
              </h3>
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
        </>
      )}

      {/* ── Commercial Harvest ── */}
      <h2 className="h2">Commercial harvest — statewide Chinook</h2>
      <p className="section-intro">
        Statewide Alaska commercial salmon harvest from ADF&amp;G annual
        press releases. Figures are all-gear, all-region totals.
      </p>

      {commLoading && <p className="section-intro">Loading commercial harvest data…</p>}

      {commercialData && (
        <Card>
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Harvest (fish)", num: true },
              { label: "Preliminary", num: false },
            ]}
            rows={commercialChinook.map((r) => [
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
      <h2 className="h2">Sport harvest — King salmon (statewide)</h2>
      <p className="section-intro">
        Statewide King salmon (Chinook) harvest from ADF&amp;G Statewide
        Harvest Survey (SWHS). Figures include all areas and all gear types.
        The SWHS has an approximately 18-month publication lag.
      </p>

      {sportLoading && <p className="section-intro">Loading sport harvest data…</p>}

      {sportData && sportChinook.length > 0 && (
        <Card>
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Harvest (fish)", num: true },
            ]}
            rows={sportChinook.slice(0, 10).map((r) => [
              r.year,
              fmt(r.fish),
            ])}
            caption="Source: ADF&G SWHS via Mainsail sport_harvest (species_code KS = King salmon)"
          />
        </Card>
      )}

      {/* ── GSI Section ── */}
      <h2 className="h2">Genetic stock identification (GSI) — bycatch attribution</h2>
      <p className="section-intro">
        AFSC Auke Bay Laboratories genotypes Chinook bycatch samples against a
        coastwide baseline, attributing the catch to stock reporting groups.
        The dataset is currently partial: 2023 data only. Years 2011–2022 are
        pending an AFSC data request.
      </p>

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
            rows={gsiData.map((r) => [
              r.year,
              r.region,
              fmtPct(r.mean_pct),
              fmt(r.total_catch),
              fmt(r.n_samples),
            ])}
            caption="Source: AFSC Auke Bay Laboratories GSI report, via Mainsail chinook_gsi (partial — 2023 only)"
          />
        </Card>
      )}

      <Note>
        <b>Subsistence harvest.</b> The ADF&amp;G Division of Subsistence
        surveys dataset (<code>subsistence_harvest</code>) is 111,000 rows
        covering 1960–2022. Chinook subsistence figures are available for
        2021–2022. A pre-aggregated view is needed for efficient display; it
        will be wired here when available.
      </Note>
    </>
  );
}
