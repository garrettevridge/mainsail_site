import { Crumb, Note } from "../components/primitives";

export default function Observer() {
  return (
    <>
      <Crumb topic="Observer Coverage" />
      <h1 className="page-title">Observer Coverage</h1>
      <p className="page-lede first-sentence">
        The catch limits set each year are only as credible as the data that
        feeds them — and in Alaska, that data comes from human observers and
        electronic cameras placed directly on fishing vessels. Observers sample
        what was caught, what was kept, and what was discarded; their numbers
        are extrapolated to the parts of the fleet not observed in real time.
      </p>
      <p className="page-lede">
        The North Pacific Observer Program operates on two tiers.{" "}
        <b>Full coverage</b> sectors — BSAI pollock catcher-processors,
        motherships, Amendment 80 bottom trawl — carry observers on every trip,
        sometimes two per vessel, producing coverage rates at or above 100%.{" "}
        <b>Partial coverage</b> sectors — halibut and sablefish IFQ longline,
        smaller trawl catcher-vessels — are sampled through stratified random
        selection, with rates set each year in a public Annual Deployment Plan.
      </p>
      <p className="page-lede">
        The system as it exists today dates to a 2013 restructure that ended
        length-based, pay-as-you-go deployment. Since then, electronic
        monitoring has been introduced as an alternative in several fixed-gear
        partial-coverage categories.
      </p>

      <Note>
        <b>In progress.</b> The coverage-over-time chart (multi-series line
        with a 2013 restructure annotation) and the 2023 coverage-by-fleet
        table are specified in the design handoff. They will be wired to the{" "}
        <code>observer_discards</code> dataset and the AKR coverage report
        once exposed via the S3 manifest.
      </Note>
    </>
  );
}
