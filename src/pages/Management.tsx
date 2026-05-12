import { Link } from "react-router-dom";
import { Crumb, Note } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";

export default function Management() {
  return (
    <article>
      <Crumb topic="Fisheries Management" />
      <span className="section-pill">04 · Section</span>
      <h1 className="page-title">Fisheries Management</h1>

      <p className="page-lede first-sentence">
        Two bodies make the rules — the North Pacific Fishery Management
        Council federally, and the Alaska Board of Fisheries at the state —
        plus a handful of treaties for the species that cross borders.
      </p>
      <p className="page-lede">
        This page is mostly composition: KPI cards for each rulemaking body
        (members, meeting cadence, authority, jurisdiction), a short flow of
        the science-to-rule process, and pointers to the deeper data pages on{" "}
        <Link to="/topics/biomass">Biomass &amp; TAC</Link> and{" "}
        <Link to="/topics/observer">Observer coverage</Link>, which power most
        of the numbers behind the rules.
      </p>

      <h2 className="h2">Planned elements</h2>
      <p className="section-intro">
        This page can be built largely without new data — the source material
        is on the NPFMC and ADF&amp;G public sites.
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "NPFMC card — 11 voting members, ~5 meetings/yr, MSA authority, jurisdiction, mini process diagram (SSC → AP → Council → Secretary of Commerce)",
            source: "NPFMC.org",
            status: "author",
          },
          {
            title:
              "Board of Fisheries card — 7 members, ~6 meetings/yr on rotating area cycle, state authority, regulatory process",
            source: "ADF&G / Board of Fisheries",
            status: "author",
          },
          {
            title:
              "Treaty & cross-jurisdiction strip — IPHC, Pacific Salmon Treaty, NPAFC: parties, scope, authority",
            source: "Existing Fisheries Management page content",
            status: "ready",
          },
          {
            title:
              "Science process — NMFS stock assessment cycle, ADF&G in-season management, SSC review",
            source: "Editorial",
            status: "author",
          },
          {
            title:
              "Observer coverage summary + deep link to existing Observer page",
            source: "monitored_catch (existing)",
            status: "ready",
          },
          {
            title:
              "Biomass / TAC summary + deep link to existing Biomass page",
            source: "stock_assessment_biomass + tac_specs (existing)",
            status: "ready",
          },
        ]}
      />

      <Note>
        <b>Status.</b> No new data dependencies — this page is unblocked and
        is a good candidate for an early build. Full IA in{" "}
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
