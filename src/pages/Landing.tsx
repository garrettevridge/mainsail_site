import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SECTIONS } from "../sections/registry";
import { Crumb, Note } from "../components/primitives";
import { useDataset } from "../api/manifest";
import type {
  SalmonCommercialHarvestDataRow,
  IphcSourceMortalityRow,
  TacSpecsRow,
  PscAnnualHistoricalRow,
} from "../api/types";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function Landing() {
  const { data: commercialData } = useDataset<SalmonCommercialHarvestDataRow>(
    "salmon_commercial_harvest",
  );
  const { data: iphcMortality } =
    useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: tacData } = useDataset<TacSpecsRow>("tac_specs");
  const { data: pscData } =
    useDataset<PscAnnualHistoricalRow>("psc_annual_historical");

  // Latest-year statewide salmon harvest, total fish across all five species.
  // Ex-vessel value is not yet published on S3; volume in number of fish is.
  const salmonStat = useMemo(() => {
    if (!commercialData) return null;
    const statewide = commercialData.filter((r) => r.region === "statewide");
    if (!statewide.length) return null;
    const years = [...new Set(statewide.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    for (const yr of years) {
      const fish = statewide
        .filter((r) => r.year === yr)
        .reduce((s, r) => s + (r.harvest_fish ?? 0), 0);
      if (fish > 0) return { year: yr, fish };
    }
    return null;
  }, [commercialData]);

  // Latest-year coastwide halibut total mortality (M lbs).
  const halibutStat = useMemo(() => {
    if (!iphcMortality) return null;
    const years = [...new Set(iphcMortality.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    for (const yr of years) {
      const totals = iphcMortality.filter(
        (r) => r.year === yr && r.source.toLowerCase() === "total",
      );
      const v = totals.reduce((s, r) => s + (r.mortality_mlb ?? 0), 0);
      if (v > 0) return { year: yr, mlb: v };
    }
    return null;
  }, [iphcMortality]);

  // Latest BSAI groundfish federal TAC (sum, excluding state GHLs).
  const bsaiTacStat = useMemo(() => {
    if (!tacData) return null;
    const years = [...new Set(tacData.map((r) => r.year))].sort((a, b) => b - a);
    for (const yr of years) {
      // Pick rollup species_complex rows where available; fall back to summing
      // subarea rows. Excludes state GHL rows per the Biomass page convention.
      const yearRows = tacData.filter(
        (r) =>
          r.year === yr &&
          r.fmp_area === "BSAI" &&
          !r.data_quality_flags?.includes("state_ghl"),
      );
      if (!yearRows.length) continue;

      // Aggregate using the rollup-when-present rule.
      const complexes = [...new Set(yearRows.map((r) => r.species_complex))];
      let total = 0;
      let hadAny = false;
      for (const complex of complexes) {
        const rollup = yearRows.find(
          (r) =>
            r.species_complex === complex &&
            (r.area_detail == null ||
              r.area_detail === "" ||
              r.area_detail === "BSAI"),
        );
        if (rollup && rollup.tac_mt != null) {
          total += rollup.tac_mt;
          hadAny = true;
        } else {
          const sum = yearRows
            .filter((r) => r.species_complex === complex)
            .reduce((s, r) => s + (r.tac_mt ?? 0), 0);
          if (sum > 0) {
            total += sum;
            hadAny = true;
          }
        }
      }
      if (hadAny && total > 0) return { year: yr, mt: total };
    }
    return null;
  }, [tacData]);

  // Latest combined BSAI + GOA chinook PSC mortality.
  const chinookPscStat = useMemo(() => {
    if (!pscData) return null;
    const years = [...new Set(pscData.map((r) => r.year))].sort((a, b) => b - a);
    for (const yr of years) {
      const v = pscData
        .filter((r) => r.year === yr && r.species === "chinook")
        .reduce((s, r) => s + (r.mortality_count ?? 0), 0);
      if (v > 0) return { year: yr, count: v };
    }
    return null;
  }, [pscData]);

  return (
    <article>
      <Crumb topic="Overview" />
      <h1 className="page-title">Alaska Seafood, at a Glance</h1>

      <p className="page-lede first-sentence">
        For more than 150 years, commercial fisheries have anchored Alaska's
        economy and the communities along its coast.
      </p>
      <p className="page-lede">
        The same ecosystems that sustained Indigenous peoples for thousands of
        years now feed the largest wild-capture seafood industry in the United
        States — and one of the largest in the world. Today the sector is
        mature: roughly 100 active shore-based processors, several thousand
        commercial vessels, and dockside landings worth billions of dollars
        each year. This site is a guided tour through how the industry works,
        organized around five topics.
      </p>

      <nav className="section-row" aria-label="Top-level sections">
        {SECTIONS.map((s, i) => (
          <Link key={s.slug} to={`/${s.slug}`} className="section-btn">
            <span className="section-num">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="section-title">{s.title}</span>
            <span className="section-blurb">{s.blurb}</span>
          </Link>
        ))}
      </nav>

      <h2 className="h2">By the numbers</h2>
      <p className="section-intro">
        A handful of headline statistics from datasets already wired into the
        site. The full statewide stat strip — total ex-vessel value, total
        landings, active vessels — ships once the NMFS commercial landings
        and CFEC registry ingests reach S3.
      </p>
      <div className="stats">
        <div className="stat">
          <div className="stat-val">
            {salmonStat
              ? `${(salmonStat.fish / 1_000_000).toFixed(1)}M`
              : "—"}
          </div>
          <div className="stat-lbl">Salmon commercial harvest</div>
          <div className="stat-sub">
            {salmonStat
              ? `Statewide, ${salmonStat.year}, fish (all 5 species)`
              : "loading"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-val">
            {halibutStat
              ? `${halibutStat.mlb.toFixed(1)} M lb`
              : "—"}
          </div>
          <div className="stat-lbl">Halibut total mortality</div>
          <div className="stat-sub">
            {halibutStat
              ? `Coastwide, ${halibutStat.year}, IPHC ledger (net wt)`
              : "loading"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-val">
            {bsaiTacStat
              ? `${fmt(Math.round(bsaiTacStat.mt))} mt`
              : "—"}
          </div>
          <div className="stat-lbl">BSAI groundfish TAC</div>
          <div className="stat-sub">
            {bsaiTacStat
              ? `Federal stocks, ${bsaiTacStat.year}`
              : "loading"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-val">
            {chinookPscStat ? fmt(chinookPscStat.count) : "—"}
          </div>
          <div className="stat-lbl">Chinook PSC mortality</div>
          <div className="stat-sub">
            {chinookPscStat
              ? `BSAI + GOA, ${chinookPscStat.year}, fish`
              : "loading"}
          </div>
        </div>
      </div>

      <Note>
        <b>About these numbers.</b> Statistics on this page are taken
        directly from agency publications — ADF&amp;G, NMFS, IPHC, NPFMC —
        with no Mainsail re-modeling. Monetary figures will switch to real
        dollars (base year 2025) once the CPI-U deflator dataset reaches
        S3. The full information architecture, including which datasets
        are pending, lives in{" "}
        <a
          href="https://github.com/garrettevridge/mainsail_site/blob/main/docs/INFORMATION_ARCHITECTURE.md"
          target="_blank"
          rel="noreferrer"
        >
          docs/INFORMATION_ARCHITECTURE.md
        </a>
        .
      </Note>
    </article>
  );
}
