import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SECTIONS } from "../sections/registry";
import { Crumb, Note } from "../components/primitives";
import { useDataset } from "../api/manifest";
import type {
  IphcSourceMortalityRow,
  TacSpecsRow,
  SalmonCommercialHarvestDataRow,
  CfecEarningsRow,
} from "../api/types";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function Landing() {
  const { data: iphcMortality } =
    useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: tacData } = useDataset<TacSpecsRow>("tac_specs");
  const { data: commercialData } = useDataset<SalmonCommercialHarvestDataRow>(
    "salmon_commercial_harvest",
  );
  const { data: cfecData } = useDataset<CfecEarningsRow>("cfec_earnings");

  // Active CFEC permits — latest year. Sum total_permits_fished across all
  // fishery_codes. Permit holders with permits across multiple fisheries
  // are counted once per permit (not once per holder); CFEC publishes
  // permits, not unique holders, in this rollup.
  const permitsStat = useMemo(() => {
    if (!cfecData) return null;
    const years = [...new Set(cfecData.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    for (const yr of years) {
      const v = cfecData
        .filter((r) => r.year === yr)
        .reduce((s, r) => s + (r.total_permits_fished ?? 0), 0);
      if (v > 0) return { year: yr, count: v };
    }
    return null;
  }, [cfecData]);

  // Coastwide halibut total mortality, latest year — full-coverage IPHC ledger.
  const halibutStat = useMemo(() => {
    if (!iphcMortality) return null;
    const years = [...new Set(iphcMortality.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    for (const yr of years) {
      const v = iphcMortality
        .filter((r) => r.year === yr && r.source.toLowerCase() === "total")
        .reduce((s, r) => s + (r.mortality_mlb ?? 0), 0);
      if (v > 0) return { year: yr, mlb: v };
    }
    return null;
  }, [iphcMortality]);

  // BSAI groundfish federal TAC, latest year.
  const bsaiTacStat = useMemo(() => {
    if (!tacData) return null;
    const years = [...new Set(tacData.map((r) => r.year))].sort((a, b) => b - a);
    for (const yr of years) {
      const yearRows = tacData.filter(
        (r) =>
          r.year === yr &&
          r.fmp_area === "BSAI" &&
          !r.data_quality_flags?.includes("state_ghl"),
      );
      if (!yearRows.length) continue;
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


  // Statewide salmon harvest (volume in fish), latest year — comprehensive
  // because ADF&G/NPAFC covers every Alaska commercial salmon fishery.
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
        each year. The five sections below walk through how the industry
        works.
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
        Headline figures from comprehensive, agency-published datasets — each
        the most recent year on the wire.
      </p>
      <div className="stats">
        <div className="stat">
          <div className="stat-val">
            {salmonStat
              ? `${(salmonStat.fish / 1_000_000).toFixed(0)}M`
              : "—"}
          </div>
          <div className="stat-lbl">Salmon commercial harvest</div>
          <div className="stat-sub">
            {salmonStat
              ? `Statewide, ${salmonStat.year}, fish — all 5 species`
              : "loading"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-val">
            {halibutStat ? `${halibutStat.mlb.toFixed(1)} M lb` : "—"}
          </div>
          <div className="stat-lbl">Halibut total mortality</div>
          <div className="stat-sub">
            {halibutStat
              ? `Coastwide, ${halibutStat.year}, IPHC ledger`
              : "loading"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-val">
            {bsaiTacStat
              ? `${fmt(Math.round(bsaiTacStat.mt / 1000))}k mt`
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
            {permitsStat ? fmt(permitsStat.count) : "—"}
          </div>
          <div className="stat-lbl">Active CFEC permits</div>
          <div className="stat-sub">
            {permitsStat
              ? `Statewide, ${permitsStat.year}, permits fished`
              : "loading"}
          </div>
        </div>
      </div>

      <Note>
        <b>About these numbers.</b> A true statewide-all-species commercial
        landings figure (total pounds, total ex-vessel value in real dollars)
        is pending the NMFS commercial landings ingest. The stat block above
        uses comprehensive, full-coverage agency datasets — IPHC's coastwide
        halibut ledger, NPFMC's federal groundfish TAC, NMFS's PSC mortality
        roll-ups, and ADF&amp;G's statewide salmon harvest — to anchor the
        page without combining incomplete series. Full IA in{" "}
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
