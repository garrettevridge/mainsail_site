import { Crumb, Note } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";
import DiscardsSection from "../components/sections/DiscardsSection";

export default function Harvest() {
  return (
    <article>
      <Crumb topic="Harvest" />
      <span className="section-pill">02 · Section</span>
      <h1 className="page-title">Harvest</h1>

      <p className="page-lede first-sentence">
        Alaska's harvest is diverse — more than 100 commercially-landed
        species — significant in scale, and structurally unlike most fisheries.
      </p>
      <p className="page-lede">
        Long time series of statewide harvest volume and value (real dollars,
        base year 2025) anchor this page. Below the statewide view, a regional
        breakout splits the catch across BSAI, Bristol Bay, Kodiak, Prince
        William Sound, Southeast, AYK, and Westward. A short sidebar puts
        commercial harvest alongside sport and subsistence so readers can see
        the relative scale of each. Discards and utilization, formerly a
        standalone page, live at the bottom.
      </p>

      <h2 className="h2">Planned elements</h2>
      <p className="section-intro">
        Each row is a chart or table in the build queue.
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "Statewide commercial harvest volume, long series (round lbs)",
            source: "NMFS commercial landings",
            status: "blocked",
          },
          {
            title:
              "Statewide value — ex-vessel and first-wholesale together, real USD, long series",
            source: "NMFS commercial landings + NMFS processor reports",
            status: "blocked",
            note: "Real dollars use a pinned base year of 2025.",
          },
          {
            title:
              "Species mix — pie, volume share, latest year (Pollock, Salmon, Halibut, Sablefish, Crab, Flatfish, Other)",
            source: "NMFS commercial landings",
            status: "blocked",
          },
          {
            title:
              "Species mix — pie, first-wholesale value share, same 7 buckets",
            source: "NMFS first-wholesale value",
            status: "blocked",
          },
          {
            title:
              "Regional breakout — volume & value by BSAI / Bristol Bay / Kodiak / PWS / Southeast / AYK / Westward",
            source: "NMFS commercial landings (regional)",
            status: "blocked",
          },
          {
            title:
              "Sport & subsistence sidebar — commercial vs. sport vs. subsistence volume",
            source:
              "sport_harvest, subsistence_harvest_statewide (existing) + commercial total",
            status: "blocked",
            note: "Sport and subsistence data already on S3; awaiting commercial total.",
          },
        ]}
      />

      <Note>
        <b>Status.</b> Commercial-harvest charts are blocked on the NMFS
        commercial landings rollup the data engine will publish. The Discards
        sub-section below is wired to the existing dataset. Full IA in{" "}
        <a
          href="https://github.com/garrettevridge/mainsail_site/blob/main/docs/INFORMATION_ARCHITECTURE.md"
          target="_blank"
          rel="noreferrer"
        >
          docs/INFORMATION_ARCHITECTURE.md
        </a>
        .
      </Note>

      <DiscardsSection />
    </article>
  );
}
