import { Link } from "react-router-dom";
import { Crumb, Note } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";

export default function Bycatch() {
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
        For each, this section shows the long-time-series volume, who took the
        bycatch (sector and gear), how it compares to a denominator the source
        agencies actually publish, and — for salmon — the genetic attribution
        back to river of origin. Each species has its own deep page; this is
        the parent.
      </p>

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
          <div className="card-sub">Mortality by source, GSI, escapement context</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            BSAI + GOA Chinook PSC mortality 1991–present; statewide commercial,
            sport, and subsistence harvest; genetic stock identification of
            bycatch samples against the coastwide baseline.
          </div>
        </Link>
        <Link to="/topics/chum" className="card" style={{ display: "block" }}>
          <div className="card-title">Chum salmon</div>
          <div className="card-sub">BSAI mortality, GSI attribution</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            BSAI chum bycatch series, statewide commercial harvest context,
            and the 2023 B-season GSI attribution across the six reporting
            groups (NE Asia, SE Asia, W Alaska, Up/Mid Yukon, SW Alaska, E
            GOA/PNW).
          </div>
        </Link>
        <Link to="/topics/halibut" className="card" style={{ display: "block" }}>
          <div className="card-title">Pacific halibut</div>
          <div className="card-sub">All-source mortality ledger</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            IPHC's coastwide ledger of directed commercial, bycatch,
            recreational, subsistence, and wastage mortality, plus coastwide
            spawning biomass and TCEY allocation by regulatory area.
          </div>
        </Link>
      </div>

      <h2 className="h2">Additions in this build</h2>
      <p className="section-intro">
        Two small additions sit on top of the existing deep pages once they're
        wired:
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "Chinook bycatch vs. counted escapement — context column on the existing mortality-by-source table",
            source:
              "psc_annual_historical + salmon_escapement (existing); already partially built on the Chinook page",
            status: "ready",
            note: "Per CLAUDE.md: counted escapement is partial coverage and labeled as such, not used as a complete denominator.",
          },
          {
            title:
              "Halibut bycatch vs. coastwide spawning biomass — context line on the existing mortality stack",
            source: "iphc_source_mortality + iphc_spawning_biomass (existing)",
            status: "ready",
          },
        ]}
      />

      <Note>
        <b>Status.</b> This parent page can be built immediately — it composes
        existing deep pages. Full IA in{" "}
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
