import { Crumb, Note } from "../components/primitives";

export default function Discards() {
  return (
    <>
      <Crumb topic="Discards & Utilization" />
      <h1 className="page-title">Discards &amp; Utilization</h1>
      <p className="page-lede first-sentence">
        "Discards" in Alaska's federal groundfish fisheries is a term with two
        distinct meanings — regulatory and economic — and both matter for
        understanding how much of the catch is actually used. The regulatory
        definition counts any fish returned to the sea, dead or alive, as a
        discard; the economic definition tracks only fish that had a plausible
        commercial path and were returned for market reasons.
      </p>
      <p className="page-lede">
        Across the federal groundfish fleet, the retained-to-landed ratio sits
        near <b>97%</b>. Discards concentrate in a handful of specific
        situations: undersized or non-target species caught incidentally, fish
        that fall outside a year's quota after a sector closes, and
        regulatory-mandated returns (prohibited species, non-retention species,
        legal-minimum shortfalls).
      </p>
      <p className="page-lede">
        The sections below decompose that headline into (i) what counts as a
        discard under each definition, (ii) discard rates by gear, and (iii)
        composition of the ~58,000 metric tons that is discarded in a typical
        year.
      </p>

      <Note>
        <b>In progress.</b> The 4-card stat grid, definitions table, by-gear
        rates, and composition-of-discards table will read from{" "}
        <code>monitored_catch</code> and <code>discard_mortality_rates</code>{" "}
        via the S3 manifest.
      </Note>
    </>
  );
}
