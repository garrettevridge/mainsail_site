import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SECTIONS } from "../sections/registry";
import { Crumb, Note } from "../components/primitives";
import { useDataset } from "../api/manifest";
import type {
  CfecEarningsRow,
  IphcSourceMortalityRow,
  TacSpecsRow,
  PscAnnualHistoricalRow,
} from "../api/types";
import BigLine from "../components/charts/BigLine";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function Landing() {
  const { data: cfecData } =
    useDataset<CfecEarningsRow>("cfec_earnings");
  const { data: iphcMortality } =
    useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");
  const { data: tacData } = useDataset<TacSpecsRow>("tac_specs");
  const { data: pscData } =
    useDataset<PscAnnualHistoricalRow>("psc_annual_historical");

  // Long-window total commercial harvest, statewide, in pounds.
  // Sum total_lbs across every CFEC fishery_code per year. Permits-based
  // (commercial only); halibut IFQ + sablefish IFQ + crab + salmon nets + all
  // groundfish state and federal fisheries roll up here.
  const harvestSeries = useMemo(() => {
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

  const latestHarvestYear = harvestSeries.length
    ? harvestSeries[harvestSeries.length - 1].year
    : null;
  const earliestHarvestYear = harvestSeries.length
    ? harvestSeries[0].year
    : null;

  const latestHarvest = harvestSeries.length
    ? harvestSeries[harvestSeries.length - 1]
    : null;

  // Coastwide halibut total mortality, latest year.
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

  // Chinook PSC, latest year.
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
        States — and one of the largest in the world. The chart below traces
        the limited-entry commercial fishery — salmon, halibut, sablefish,
        crab, herring, state-water groundfish — from the mid-1970s, when the
        Limited Entry Act reshaped Alaska's permit system, through to last
        season. The federal BSAI pollock catcher-processor fleet sits outside
        this series (it's licensed under federal LLP, not CFEC) and lands
        roughly 3 billion pounds annually on top.
      </p>

      {harvestSeries.length > 0 &&
        latestHarvestYear != null &&
        earliestHarvestYear != null && (
          <>
            <h2 className="h2">
              CFEC limited-entry harvest, {earliestHarvestYear}–{latestHarvestYear}
            </h2>
            <p className="section-intro">
              Total pounds landed across every CFEC permit-fishery — salmon
              nets, halibut and sablefish IFQ, crab, herring, dive fisheries,
              state-water groundfish. Excludes the federal BSAI pollock
              catcher-processor fleet (licensed under federal LLP, not CFEC).
            </p>
            <BigLine
              data={harvestSeries}
              xKey="year"
              yKey="lbs"
              yLabel="pounds landed"
              unitSuffix="lbs"
              refYears={[
                { year: 1975, label: "Limited Entry Act" },
                { year: 1995, label: "Halibut IFQ" },
              ]}
            />
            <p className="data-caption" style={{ marginTop: 4 }}>
              Region: Alaska statewide, all CFEC-permitted commercial fisheries
              summed. Source: Seamark Analytics, derived from ADF&amp;G CFEC
              permit fishery earnings reports.
              {latestHarvest && (
                <>
                  {" "}
                  Latest year ({latestHarvestYear}):{" "}
                  <span className="font-mono">
                    {fmt(Math.round(latestHarvest.lbs / 1_000_000))}M
                  </span>{" "}
                  pounds,{" "}
                  <span className="font-mono">
                    $
                    {fmt(Math.round(latestHarvest.earnings / 1_000_000))}M
                  </span>{" "}
                  to permit holders (nominal USD; real-dollar conversion
                  pending the CPI-U deflator).
                </>
              )}
            </p>
          </>
        )}

      <h2 className="h2">Five threads</h2>
      <p className="section-intro">
        The rest of this site is organized into five threads — communities,
        what gets caught, where it goes, how the rules are made, and the
        species taken as bycatch alongside the directed catch.
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
        A few headline figures from the deeper pages, latest year on the wire.
      </p>
      <div className="stats">
        <div className="stat">
          <div className="stat-val">
            {latestHarvest
              ? `${(latestHarvest.lbs / 1_000_000).toFixed(0)}M lb`
              : "—"}
          </div>
          <div className="stat-lbl">CFEC limited-entry harvest</div>
          <div className="stat-sub">
            {latestHarvestYear
              ? `Statewide, ${latestHarvestYear}, excludes BSAI pollock CPs`
              : "loading"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-val">
            {latestHarvest
              ? `$${(latestHarvest.earnings / 1_000_000_000).toFixed(2)}B`
              : "—"}
          </div>
          <div className="stat-lbl">CFEC permit earnings</div>
          <div className="stat-sub">
            {latestHarvestYear
              ? `Statewide, ${latestHarvestYear}, nominal USD`
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
            {bsaiTacStat ? `${fmt(Math.round(bsaiTacStat.mt))} mt` : "—"}
          </div>
          <div className="stat-lbl">BSAI groundfish TAC</div>
          <div className="stat-sub">
            {bsaiTacStat
              ? `Federal stocks, ${bsaiTacStat.year}`
              : "loading"}
          </div>
        </div>
      </div>

      <Note>
        <b>About these numbers.</b> Statistics are taken directly from agency
        publications — ADF&amp;G CFEC, NMFS, IPHC, NPFMC — with no Mainsail
        re-modeling. Ex-vessel earnings are shown in nominal dollars; the
        site will switch to real dollars (base year 2025) once the CPI-U
        deflator dataset reaches S3. Chinook PSC for the latest year on
        record: <span className="font-mono">{chinookPscStat ? fmt(chinookPscStat.count) : "—"}</span>{" "}
        fish ({chinookPscStat?.year ?? "—"}). Full IA in{" "}
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
