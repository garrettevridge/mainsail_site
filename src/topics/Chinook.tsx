import { Crumb, Note } from "../components/primitives";

export default function Chinook() {
  return (
    <>
      <Crumb topic="Chinook Mortality & Genetics" />
      <h1 className="page-title">Chinook Mortality &amp; Genetics</h1>
      <p className="page-lede first-sentence">
        Chinook salmon — the largest of the five Pacific salmon species and
        culturally central across Alaska — are counted as they return to
        spawning rivers, as they are caught commercially, and as they are
        sampled from bycatch at sea. Four reporting streams, each on a
        different cadence, together describe the total human-caused mortality
        in any given year.
      </p>
      <p className="page-lede">
        The four categories are <b>commercial</b> (dominated by Southeast
        Alaska troll), <b>sport</b> (harvest plus catch-and-release mortality,
        measured through the ADF&amp;G Statewide Harvest Survey),{" "}
        <b>subsistence</b> (state and federal surveys combined), and{" "}
        <b>BSAI pollock bycatch</b> (observed in real time and capped at 45,000
        fish under Amendment 91). Each is measured by a different agency with a
        different reporting lag — from one week for federal bycatch to over 18
        months for subsistence.
      </p>
      <p className="page-lede">
        A fifth stream runs in parallel. The AFSC Auke Bay laboratory
        genotypes bycatch samples against a coastwide genetic baseline,
        attributing them to stock reporting groups such as Coastal Western
        Alaska, British Columbia, and the West Coast U.S. This answers a
        separate question from the raw count: not <i>how many</i> Chinook were
        killed, but <i>which river systems</i> they came from.
      </p>

      <Note>
        <b>In progress.</b> The 2023 mortality proportion bar, source table,
        BSAI pollock Chinook PSC chart (with hard cap and performance
        standard), and GSI attribution table will read from{" "}
        <code>psc_weekly</code>, <code>chinook_gsi</code>,{" "}
        <code>subsistence_harvest</code>, <code>sport_harvest</code>, and{" "}
        <code>salmon_commercial_harvest</code> via the S3 manifest.
      </Note>
    </>
  );
}
