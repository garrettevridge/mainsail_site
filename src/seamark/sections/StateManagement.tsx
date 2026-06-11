// State of Alaska fisheries management — the counterpart to the federal
// TAC process. Mostly narrative; the quantitative state datasets (escapement,
// run forecasts, commercial harvest) are wired elsewhere, and a state-fishery
// bycatch series is the standing data gap flagged throughout the paper.

export default function StateManagement() {
  return (
    <section id="state-management" className="sm-section">
      <div className="sm-marker">
        <span className="num">State of Alaska management</span>
        <span className="title">Inside three miles</span>
      </div>

      <h2 className="sm-h2">
        How the state <span className="accent">manages its fish.</span>
      </h2>

      <p className="sm-p">
        Alaska manages the fisheries in state waters — generally from the shore
        out to three miles — and nearly all of the salmon, wherever they are
        caught. The mandate comes from the state constitution, which directs that
        fish be managed as a renewable resource for the maximum benefit of
        Alaskans, on the principle of sustained yield. Two bodies share the work:
        the Board of Fisheries sets allocation and regulation, and the Department
        of Fish and Game runs the in-season management.
      </p>

      <p className="sm-p">
        The state's signature tool is escapement-goal management. Rather than a
        single annual quota, managers set a target range for the number of fish
        that should reach the spawning grounds, then open and close fishing
        in-season — sometimes day to day — to steer the actual return toward that
        range. When a run comes in weak, the fishery closes; when it comes in
        strong, it opens. The salmon harvest that results is therefore a
        by-product of meeting escapement, not a fixed catch limit.
      </p>

      <p className="sm-p">
        Access is controlled through limited-entry permits, introduced in the
        1970s, which cap the number of participants in each fishery. Permits are
        held disproportionately by Alaska residents, consistent with the
        constitutional mandate — a contrast with the federal fisheries, which are
        managed for the benefit of the nation.
      </p>

      <p className="sm-p">
        The important difference for this paper is one of observation, not
        intent. The state fisheries are not covered by an observer program
        comparable to the federal groundfish fleets. Catch and escapement are
        well documented; species-by-species bycatch is not. <strong>Pending
        data:</strong> a state-fishery bycatch series comparable to the federal
        catch-accounting figures does not exist in the manifest, and is the
        single largest data gap in this paper.
      </p>
    </section>
  );
}
