import { useDataset } from "../api/manifest";
import StackedTrend from "../components/charts/StackedTrend";

interface DiscardRow {
  year: number;
  retained_mt: number;
  discarded_mt: number;
  utilization_pct: number;
}

export default function StoryDiscards() {
  const { data, isLoading, error } = useDataset<DiscardRow>("discard_utilization");

  const stacked = (data ?? []).map((r) => ({
    year: r.year,
    retained: r.retained_mt,
    discarded: r.discarded_mt,
    utilization_pct: r.utilization_pct,
  }));

  return (
    <article className="prose-mainsail">
      <p className="text-sm text-muted uppercase tracking-wide mb-2">Theme C · Federal groundfish</p>
      <h1 className="font-serif text-4xl font-semibold text-ink mb-2">
        Federal groundfish: what is caught, what is kept, what is discarded
      </h1>
      <p className="text-xl text-muted mb-8">
        Most of Alaska's 2-million-ton federal groundfish catch is retained.
      </p>

      <section>
        <h2>Retention and discards, 5-year view</h2>
        <p>
          Federal groundfish fisheries off Alaska land about 2 million metric
          tons of fish every year, making this one of the largest single-nation
          fishery complexes in the world. The chart below shows what happens to
          that catch: how much is retained for processing and sale, and how
          much is discarded.
        </p>
        <p>
          The retained fraction — the utilization rate — has been approximately{" "}
          <strong>97% in recent years</strong>. In 2024, total catch was about 2
          million mt and discards were under 58,000 mt. Almost everything
          caught is kept.
        </p>
        {isLoading && <p className="text-muted">Loading…</p>}
        {error && <p className="text-flag">Data unavailable: {error.message}</p>}
        {data && (
          <StackedTrend
            data={stacked}
            xKey="year"
            stackKeys={["retained", "discarded"]}
            colors={["#2f5d8a", "#b45309"]}
            title="Alaska federal groundfish — retained vs discarded, 2020–2024"
            yLabel="metric tons (round weight)"
            yFormatter={(v) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`
            }
          />
        )}
      </section>

      <section>
        <h2>The variation across gears</h2>
        <p>
          Discard rates vary substantially by gear type. Pelagic (midwater)
          trawl — used for pollock — has the lowest discard rate, under 1%:
          pollock is targeted directly and nearly everything caught is the
          target species. Bottom trawl operates at about 7%. Hook-and-line
          longline — primarily sablefish and Pacific cod — runs the highest
          among federal gears at about 19%. Pot gear is near 1%.
        </p>
        <p>
          These differences are real features of the fisheries. They reflect
          the gear's selectivity and the species each gear encounters.
        </p>
      </section>

      <aside className="methodology-box">
        <h3>Discarded does not mean dead</h3>
        <p>
          Fish returned to the water have varying survival rates depending on
          the gear, the handling, and the fish's size. For halibut — the most
          carefully studied species in this context — IPHC publishes Discard
          Mortality Rates by gear and by fish size: pot gear 10–20%, longline
          about 16%, bottom trawl 60–85%. The discard count is not the mortality
          count.
        </p>
      </aside>

      <aside className="methodology-box">
        <h3>What this story does not include</h3>
        <p>
          <strong>State fisheries are not included.</strong> ADF&G does not
          operate a catch-accounting system comparable to NMFS CAS for
          state-water groundfish. Combining state and federal discards into a
          single number is not possible from public data today.
        </p>
        <p>
          <strong>Regulatory vs economic discard</strong> — the distinction
          between fish discarded because regulation requires it (sublegal size,
          over-MRA, PSC) and fish discarded by vessel choice is not
          first-class in this data yet. Planned for a future update.
        </p>
      </aside>

      <p className="text-sm text-muted mt-8">
        Source: NMFS Alaska Region — Observed and Monitored Catch Tables. IPHC —
        non-directed commercial discard mortality rates.
      </p>
    </article>
  );
}
