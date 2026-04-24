import { Crumb, Note } from "../components/primitives";

export default function Biomass() {
  return (
    <>
      <Crumb topic="Biomass, TAC & ABC" />
      <h1 className="page-title">Biomass, TAC &amp; ABC</h1>
      <p className="page-lede first-sentence">
        Every federally-managed groundfish stock in Alaska — pollock, cod,
        sablefish, the flatfishes, rockfish — carries an annual catch limit
        that is built, not chosen. Stock assessment scientists first estimate
        the biomass in the water and the biological maximum it could
        theoretically yield; the Council then reduces that figure twice before
        anyone fishes.
      </p>
      <p className="page-lede">
        The sequence is <b>OFL → ABC → TAC → Catch</b>. The Overfishing Limit
        (OFL) is the biological maximum. The Acceptable Biological Catch (ABC)
        steps it down for scientific uncertainty. The Total Allowable Catch
        (TAC) steps it down again for Council policy — bycatch limits,
        ecosystem caps, the 2-million-ton BSAI optimum yield ceiling. Realized
        catch is what the fleet actually lands.
      </p>
      <p className="page-lede">
        Across the Bering Sea-Aleutian Islands and Gulf of Alaska combined,
        exploitable groundfish biomass is in the tens of millions of metric
        tons. Realized annual harvest is typically below 10% of that biomass,
        and below the TAC for most stocks.
      </p>

      <Note>
        <b>In progress.</b> This topic will read from{" "}
        <code>catch_weekly</code> and SAFE-derived biomass tables published by
        the Mainsail data pipeline. The chart set (BSAI pollock OFL/ABC/TAC/
        Catch; IPHC coastwide spawning biomass) and BSAI specifications table
        are specified in the design handoff and will be wired in when those
        datasets are available via the S3 manifest.
      </Note>
    </>
  );
}
