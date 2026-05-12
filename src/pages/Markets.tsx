import { Crumb, Note } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";

export default function Markets() {
  return (
    <article>
      <Crumb topic="Markets" />
      <span className="section-pill">03 · Section</span>
      <h1 className="page-title">Markets</h1>

      <p className="page-lede first-sentence">
        Most Alaska seafood leaves the state — here is where it goes and what
        it becomes.
      </p>
      <p className="page-lede">
        Three lenses: exports vs. domestic share over the last decade; the
        top products by both volume and value (and how those rankings differ);
        and the in-state market, which is small in dollar terms but central to
        food security and cultural use. Country names follow UN short-name
        designations.
      </p>

      <h2 className="h2">Planned elements</h2>
      <p className="section-intro">
        Each row is a chart, table, or prose section in the build queue.
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "Export vs. domestic share — stacked area, last 10–15 years, both value and volume",
            source: "NMFS Foreign Trade",
            status: "blocked",
          },
          {
            title: "Top 10 export products by value, latest year",
            source: "NMFS Foreign Trade (HTS-level)",
            status: "blocked",
          },
          {
            title: "Top 10 export products by volume, latest year",
            source: "NMFS Foreign Trade (HTS-level)",
            status: "blocked",
          },
          {
            title:
              "Volume–value scatter — top ~25 products plotted to expose the high-vol/low-val ↔ low-vol/high-val quadrants",
            source: "Derived from NMFS Foreign Trade",
            status: "blocked",
          },
          {
            title:
              "Top destination countries by value, latest year (UN short names)",
            source: "NMFS Foreign Trade",
            status: "blocked",
          },
          {
            title:
              "Domestic market — sockeye national retail, pollock to QSR and fast-casual, king crab destination claim, etc.",
            source:
              "Mostly qualitative — NMFS Fisheries of the US per-capita, ASMI marketing reports (flag industry source), trade press",
            status: "author",
            note: "Site-internal: claims must cite a publication; do not paraphrase ASMI marketing copy without attribution.",
          },
          {
            title:
              "Alaska local market — small in dollars, central to food security and cultural use",
            source: "subsistence_harvest_statewide (existing) + prose",
            status: "ready",
          },
        ]}
      />

      <Note>
        <b>Status.</b> The export and product-mix charts are blocked on the
        NMFS Foreign Trade ingest. The Alaska-local-market section can be
        drafted now using existing subsistence data. Full IA in{" "}
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
