import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDataset } from "../api/manifest";
import type {
  PscAnnualHistoricalRow,
  IphcSourceMortalityRow,
} from "../api/types";
import { Crumb, Note, StatGrid } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function Bycatch() {
  const { data: pscData } =
    useDataset<PscAnnualHistoricalRow>("psc_annual_historical");
  const { data: iphcMortality } =
    useDataset<IphcSourceMortalityRow>("iphc_mortality_by_source");

  // Latest-year chinook PSC mortality (BSAI + GOA combined).
  const chinookStat = useMemo(() => {
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

  // Latest-year halibut bycatch (non-directed) from IPHC source ledger (M lbs net).
  const halibutBycatchStat = useMemo(() => {
    if (!iphcMortality) return null;
    const years = [...new Set(iphcMortality.map((r) => r.year))].sort(
      (a, b) => b - a,
    );
    for (const yr of years) {
      const rows = iphcMortality.filter((r) => r.year === yr);
      // Sum any source labeled as bycatch or non-directed mortality.
      const v = rows
        .filter((r) => /bycatch|non-?directed/i.test(r.source))
        .reduce((s, r) => s + (r.mortality_mlb ?? 0), 0);
      if (v > 0) return { year: yr, mlb: v };
    }
    return null;
  }, [iphcMortality]);

  // Halibut total mortality (latest year, for context denominator).
  const halibutTotalStat = useMemo(() => {
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

  const halibutShare =
    halibutBycatchStat && halibutTotalStat && halibutTotalStat.mlb > 0
      ? (halibutBycatchStat.mlb / halibutTotalStat.mlb) * 100
      : null;

  return (
    <article>
      <Crumb topic="Bycatch" />
      <span className="section-pill">05 · Section</span>
      <h1 className="page-title">Bycatch</h1>

      <p className="page-lede first-sentence">
        Three species drive most of the bycatch conversation: Chinook salmon,
        chum salmon, and Pacific halibut.
      </p>
      <p className="page-lede">
        For each, this section shows the long-time-series volume, who took
        the bycatch (sector and gear), how it compares to a denominator the
        source agencies actually publish, and — for salmon — the genetic
        attribution back to river of origin. Each species has its own deep
        page; this is the parent.
      </p>

      <h2 className="h2">At a glance</h2>
      <p className="section-intro">
        Latest-year totals from the federal observer and IPHC ledgers. See
        the deep pages for long-time-series, sector breakdowns, and genetics.
      </p>
      <StatGrid
        stats={[
          {
            val: chinookStat ? fmt(chinookStat.count) : "—",
            label: "Chinook PSC mortality",
            sub: chinookStat
              ? `BSAI + GOA, ${chinookStat.year}, fish`
              : "loading",
            accent: "accent",
          },
          {
            val: halibutBycatchStat
              ? `${halibutBycatchStat.mlb.toFixed(1)} M lb`
              : "—",
            label: "Halibut bycatch mortality",
            sub: halibutBycatchStat
              ? `Coastwide, ${halibutBycatchStat.year}, IPHC ledger (net wt)`
              : "loading",
          },
          {
            val: halibutTotalStat
              ? `${halibutTotalStat.mlb.toFixed(1)} M lb`
              : "—",
            label: "Halibut total mortality",
            sub: halibutTotalStat
              ? `Coastwide, ${halibutTotalStat.year}, IPHC ledger (net wt)`
              : "loading",
          },
          {
            val: halibutShare != null ? `${halibutShare.toFixed(1)}%` : "—",
            label: "Bycatch share of halibut",
            sub: "Latest-year non-directed ÷ total",
            accent: "accent",
          },
        ]}
      />

      <h2 className="h2">Deep dives</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          margin: "14px 0 20px",
        }}
      >
        <Link to="/topics/chinook" className="card" style={{ display: "block" }}>
          <div className="card-title">Chinook salmon</div>
          <div className="card-sub">
            Mortality by source, GSI, escapement context
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
            }}
          >
            BSAI + GOA Chinook PSC mortality 1991–present; statewide
            commercial, sport, and subsistence harvest; genetic stock
            identification of bycatch samples against the coastwide
            baseline.
          </div>
        </Link>
        <Link to="/topics/chum" className="card" style={{ display: "block" }}>
          <div className="card-title">Chum salmon</div>
          <div className="card-sub">BSAI mortality, GSI attribution</div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
            }}
          >
            BSAI chum bycatch series, statewide commercial harvest context,
            and the 2023 B-season GSI attribution across the six reporting
            groups (NE Asia, SE Asia, W Alaska, Up/Mid Yukon, SW Alaska,
            E GOA/PNW).
          </div>
        </Link>
        <Link
          to="/topics/halibut"
          className="card"
          style={{ display: "block" }}
        >
          <div className="card-title">Pacific halibut</div>
          <div className="card-sub">All-source mortality ledger</div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
            }}
          >
            IPHC's coastwide ledger of directed commercial, bycatch,
            recreational, subsistence, and wastage mortality, plus
            coastwide spawning biomass and TCEY allocation by regulatory
            area.
          </div>
        </Link>
      </div>

      <h2 className="h2">Stock-context additions on the deep pages</h2>
      <p className="section-intro">
        Two recent additions tied to the IA pivot's "use denominators the
        source publishes" rule:
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "Chinook bycatch vs. counted escapement — context column on the mortality-by-source table",
            source:
              "psc_annual_historical + salmon_escapement (existing); built on the Chinook page",
            status: "ready",
            note: "Counted escapement is partial coverage (only river systems with reported counts) and labeled as such.",
          },
          {
            title:
              "Halibut bycatch vs. coastwide spawning biomass — context on the mortality stack",
            source:
              "iphc_source_mortality + iphc_spawning_biomass (existing); built on the Halibut page",
            status: "ready",
          },
        ]}
      />

      <Note>
        <b>Status.</b> Parent page composes existing deep pages — no new
        datasets required. Full IA in{" "}
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
