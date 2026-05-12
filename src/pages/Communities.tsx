import { Crumb, Note } from "../components/primitives";
import PlannedElements from "../components/primitives/PlannedElements";

export default function Communities() {
  return (
    <article>
      <Crumb topic="Communities" />
      <span className="section-pill">01 · Section</span>
      <h1 className="page-title">Communities</h1>

      <p className="page-lede first-sentence">
        Alaska is a global fishing powerhouse, and a handful of small towns
        drive an outsized share of US seafood.
      </p>
      <p className="page-lede">
        On this page, a <em>community</em> is a specific town: Kodiak, Cordova,
        Dutch Harbor, Sitka, King Salmon, Nome. Bristol Bay, Prince William
        Sound, and Southeast are <em>regions</em>, not communities — those
        appear in the regional breakouts on the Harvest page.
      </p>

      <h2 className="h2">Planned elements</h2>
      <p className="section-intro">
        Each row below is a chart or table in the build queue. Status reflects
        whether the source data is already on S3 or pending the data engine.
      </p>
      <PlannedElements
        elements={[
          {
            title:
              "World wild-capture ranking — top ~15 countries, with Alaska as a peer bar",
            source: "FAO FishStat capture production",
            status: "blocked",
            note: "Alaska's tonnage computed separately from NMFS landings.",
          },
          {
            title:
              "Top 20 US ports by ex-vessel value — Alaska ports only, national rank footnoted",
            source: 'NMFS "Fisheries of the United States" port tables',
            status: "blocked",
          },
          {
            title:
              "Top 20 US ports by landings volume — Alaska ports only, national rank footnoted",
            source: 'NMFS "Fisheries of the United States" port tables',
            status: "blocked",
          },
          {
            title:
              "Alaska community detail — ex-vessel + first-wholesale, latest year + 10-yr sparkline",
            source: "NMFS commercial landings + ADF&G COAR",
            status: "blocked",
            note: "Confidentiality suppression flags passed through from source.",
          },
          {
            title: "Region vs. community framing note",
            source: "Editorial",
            status: "author",
          },
        ]}
      />

      <Note>
        <b>Status.</b> All charts on this page are blocked on new datasets the
        data engine will publish. The full information architecture is in{" "}
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
