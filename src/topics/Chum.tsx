import { Crumb, Note } from "../components/primitives";

export default function Chum() {
  return (
    <>
      <Crumb topic="Chum Salmon Mortality & Genetics" />
      <h1 className="page-title">Chum Salmon Mortality &amp; Genetics</h1>
      <p className="page-lede first-sentence">
        Chum salmon are Alaska's second-highest-volume salmon species by number
        and the subject of a multi-decade hatchery program that now accounts
        for the majority of commercially-harvested chum statewide. Like
        Chinook, chum mortality is counted through four distinct reporting
        streams and, in parallel, genotyped against a coastwide baseline to
        attribute bycatch back to its river of origin.
      </p>
      <p className="page-lede">
        The four counting streams — commercial, subsistence, sport, and BSAI
        pollock bycatch — are the same structure as Chinook, but the magnitudes
        and the hatchery composition make chum a distinct story. The Prince
        William Sound and Southeast Alaska hatchery programs release over a
        billion chum fry annually; returning adults dominate several commercial
        districts.
      </p>
      <p className="page-lede">
        The GSI baseline resolves chum to seven reporting groups, including
        Coastal Western Alaska, Upper/Middle Yukon, and East Asian and Russian
        stocks. The proportion of each in BSAI bycatch shifts year-to-year and
        is the subject of active Council deliberation.
      </p>

      <Note>
        <b>In progress.</b> The chum GSI dataset is Phase 2 in the Mainsail
        data inventory. This page will wire up its mortality and source tables
        first (against <code>psc_weekly</code> chum strata and{" "}
        <code>salmon_commercial_harvest</code>); the GSI attribution card will
        follow when the dataset lands.
      </Note>
    </>
  );
}
