import { useDataset } from "../api/manifest";
import SourcePie from "../components/charts/SourcePie";

interface HalibutRow {
  source: string;
  value: number; // net million pounds
}

export default function StoryHalibut() {
  const { data, isLoading, error } = useDataset<HalibutRow>("halibut_mortality_by_source");
  const total = (data ?? []).reduce((s, r) => s + r.value, 0);

  return (
    <article className="prose-mainsail">
      <p className="text-sm text-muted uppercase tracking-wide mb-2">Theme B · Pacific halibut</p>
      <h1 className="font-serif text-4xl font-semibold text-ink mb-2">
        Pacific halibut: where the fish go
      </h1>
      <p className="text-xl text-muted mb-8">
        One reconciled mortality ledger, published by IPHC.
      </p>

      <section>
        <h2>Most recent year, by source</h2>
        <p>
          Pacific halibut is the only fishery Alaska shares with Canada under a
          dedicated treaty organization — the International Pacific Halibut
          Commission, founded in 1923. The IPHC sets an annual coastwide
          mortality limit (the Total Constant Exploitation Yield, or TCEY) and
          reconciles catch data from every source that removes halibut from the
          water.
        </p>
        <p>
          The chart below shows IPHC's reconciled mortality total for the most
          recent year, broken out by source. All figures are in{" "}
          <strong>net pounds</strong> — head-off, gutted, ice-and-slime
          deducted — the unit the IPHC ledger uses.
        </p>
        {isLoading && <p className="text-muted">Loading…</p>}
        {error && <p className="text-flag">Data unavailable: {error.message}</p>}
        {data && (
          <SourcePie
            data={data.map((r) => ({ source: r.source, value: r.value }))}
            title={`Pacific halibut total mortality by source — ${total.toFixed(1)} M net lb`}
            unit="M lb"
          />
        )}
      </section>

      <aside className="methodology-box">
        <h3>Why halibut mortality comes from IPHC, not NMFS or ADF&G alone</h3>
        <p>
          Three agencies measure halibut in Alaska. Their numbers differ — not
          because any of them is wrong, but because they measure in different
          units, at different stages of the supply chain, and under different
          legal frameworks:
        </p>
        <p>
          <strong>NMFS</strong> reports halibut bycatch in federal groundfish
          fisheries in round weight (whole-fish equivalent, metric tons).{" "}
          <strong>ADF&G</strong> reports recreational harvest from its Statewide
          Harvest Survey in numbers of fish, converted to weight using
          year-specific average weights. <strong>IPHC</strong> reports the
          reconciled coastwide total in net pounds (dressed, head-off, ice and
          slime deducted). IPHC ingests data from NMFS, ADF&G, DFO Canada, and
          its own commercial monitoring, harmonizes all of it to net weight, and
          produces the single coastwide mortality ledger the stock assessment
          uses.
        </p>
        <p>
          When different agencies report different halibut numbers, the answer
          is always one of three things: <strong>unit</strong> (round vs net
          weight), <strong>scope</strong> (federal vs coastwide vs one sector),
          or <strong>timing</strong> (preliminary vs finalized).
        </p>
      </aside>

      <aside className="methodology-box">
        <h3>What this story does not claim</h3>
        <p>
          This story does not attribute causes of the halibut stock's
          multi-decade decline or assess whether any one sector's harvest is
          "too much" or "too little." Those are questions IPHC, NMFS, ADF&G, and
          NPFMC evaluate through their regulatory processes.
        </p>
      </aside>

      <p className="text-sm text-muted mt-8">
        Source: IPHC Annual Stock Assessment — mortality by source, most recent
        assessment. See{" "}
        <a
          href="https://www.iphc.int/management/science-and-research/assessment"
          target="_blank"
          rel="noreferrer"
        >
          IPHC stock assessment
        </a>
        .
      </p>
    </article>
  );
}
