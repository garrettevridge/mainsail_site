import { Crumb, Note } from "../components/primitives";

export default function Halibut() {
  return (
    <>
      <Crumb topic="Halibut Mortality by Source" />
      <h1 className="page-title">Halibut Mortality by Source</h1>
      <p className="page-lede first-sentence">
        Pacific halibut is the only Alaska fishery with a single, coastwide
        ledger that reconciles every pound of mortality — directed commercial,
        bycatch, recreational, subsistence, research, wastage — into one annual
        total. That reconciliation is done by the International Pacific Halibut
        Commission, established by a 1923 U.S.–Canada treaty that predates
        every other agency involved.
      </p>
      <p className="page-lede">
        The logic runs from a coastwide biological estimate down to the share
        available to the directed commercial fleet. IPHC sets the{" "}
        <b>Total Constant Exploitation Yield (TCEY)</b> — the all-source
        mortality limit — each January. From TCEY it deducts the projected
        mortality from bycatch in groundfish fisheries, recreational harvest,
        subsistence, and wastage. What remains is the{" "}
        <b>Fishery Constant Exploitation Yield (FCEY)</b>, the
        directed-commercial allocation divided among eight regulatory areas
        from the Oregon coast to the Aleutians.
      </p>
      <p className="page-lede">
        All figures on this page are in net pounds (head-off, gutted), the IPHC
        unit. Values reported elsewhere in round pounds — NMFS groundfish
        bycatch, for example — are converted before IPHC consolidates them.
      </p>

      <Note>
        <b>In progress.</b> The 2024 proportion bar, source-by-source table,
        bycatch decomposition, and 10-year stacked-mortality trend will read
        from the four <code>iphc_*</code> datasets and{" "}
        <code>monitored_catch</code> via the S3 manifest.
      </Note>
    </>
  );
}
