import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { ObserverCoverageRow } from "../../api/types";
import ChartCard from "../ChartCard";
import { MultiLine, Legend } from "../SmChart";
import { ACCENT } from "../colors";

const TEAL = "#2f6b73";
const OBSERVER = TEAL;
const EM = "#c97f4a"; // clay — second monitoring method
// Compact thousands: 8,415 → "8.4k", 326 → "326".
const k = (v: number) =>
  v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toLocaleString();

type Cat = "full" | "partial" | "zero";

export default function ObserverSlide() {
  const { data: obs } = useDataset<ObserverCoverageRow>("observer_coverage");

  // Long view: trip-weighted realized coverage of the partial-coverage fleet,
  // split by monitoring method (human observer vs electronic monitoring).
  const series = useMemo(() => {
    if (!obs) return [];
    const years = [...new Set(obs.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((year) => {
      const agg = (method: string) => {
        let s = 0, t = 0;
        for (const r of obs) {
          if (r.year === year && r.coverage_category === "partial" && r.monitoring_method === method && r.total_trips) {
            s += r.sampled_trips ?? 0;
            t += r.total_trips;
          }
        }
        return t > 0 ? (s / t) * 100 : null;
      };
      return {
        year,
        "Full-coverage fleet": 100,
        "Partial · observer": agg("observer"),
        "Partial · EM": agg("em"),
      };
    });
  }, [obs]);

  // Latest-year monitoring landscape: trips by coverage category.
  const landscape = useMemo(() => {
    if (!obs) return null;
    const year = Math.max(...obs.map((r) => r.year));
    const cats: Record<Cat, { trips: number; sampled: number }> = {
      full: { trips: 0, sampled: 0 },
      partial: { trips: 0, sampled: 0 },
      zero: { trips: 0, sampled: 0 },
    };
    let emTrips = 0, emSampled = 0;
    for (const r of obs) {
      if (r.year !== year || r.total_trips == null) continue;
      cats[r.coverage_category].trips += r.total_trips;
      cats[r.coverage_category].sampled += r.sampled_trips ?? 0;
      if (r.monitoring_method === "em") { emTrips += r.total_trips; emSampled += r.sampled_trips ?? 0; }
    }
    const total = cats.full.trips + cats.partial.trips + cats.zero.trips;
    return { year, total, cats, emTrips, emSampled };
  }, [obs]);

  const segs: { key: Cat; label: string; color: string }[] = [
    { key: "full", label: "Full coverage", color: TEAL },
    { key: "partial", label: "Partial coverage", color: "#b0ada4" },
    { key: "zero", label: "Zero coverage", color: "#e1ded3" },
  ];

  return (
    <div className="sm-slide">
      <div className="sm-slide-kicker">Monitoring · 04</div>
      <h2 className="sm-slide-title">Observer coverage</h2>

      <div className="sm-block">
        <div className="sm-block-label">The long view</div>
        <ChartCard
          label="Partial-coverage fleet · realized monitoring rate"
          source="NOAA FMA / North Pacific Observer Program annual reports"
          title="How much of the partial-coverage fleet is monitored, by method."
          caption="The largest vessels — the catcher-processors and motherships that take most of the bycatch — carry full coverage at essentially 100% every year (top line). The smaller, partial-coverage fleet is sampled far more lightly: human observers ride 15–22% of trips, and electronic monitoring (cameras) now covers a growing share. The gap between the lines is the gap between a census and a sample."
        >
          {series.length > 0 ? (
            <>
              <MultiLine
                data={series}
                xKey="year"
                keys={["Full-coverage fleet", "Partial · observer", "Partial · EM"]}
                colors={[ACCENT, OBSERVER, EM]}
                height={240}
                yFormatter={(v) => `${Math.round(v)}%`}
              />
              <Legend items={[{ label: "Full-coverage fleet (≈100%)", color: ACCENT }, { label: "Partial — human observer", color: OBSERVER }, { label: "Partial — electronic monitoring", color: EM }]} />
            </>
          ) : (
            <div className="sm-chart-body placeholder">Loading…</div>
          )}
        </ChartCard>
      </div>

      {/* THE MONITORING LANDSCAPE — trips by coverage category */}
      <div className="sm-block">
        <div className="sm-block-label">The monitoring landscape{landscape ? ` · ${landscape.year}` : ""}</div>
        {landscape && landscape.total > 0 ? (
          <>
            <div className="sm-magbar">
              {segs.map((s) => (
                <span key={s.key} style={{ width: `${(landscape.cats[s.key].trips / landscape.total) * 100}%`, background: s.color }} />
              ))}
            </div>
            <div className="sm-magbar-legend">
              {segs.map((s) => {
                const c = landscape.cats[s.key];
                const pct = Math.round((c.trips / landscape.total) * 100);
                const obsPct = c.trips > 0 ? Math.round((c.sampled / c.trips) * 100) : 0;
                return (
                  <span key={s.key}>
                    <span className="sw" style={{ background: s.color }} />
                    {s.label} {k(c.trips)} trips ({pct}%){s.key !== "zero" ? ` · ${obsPct}% monitored` : ""}
                  </span>
                );
              })}
            </div>
            <div className="sm-magbar-cap">
              By trip count the federally-managed fleet runs roughly a third full coverage, half partial, a sixth zero. But trips are not catch: the catcher-processors that take most of the salmon and halibut bycatch sit in the <b style={{ color: "var(--ink)" }}>full-coverage</b> group, where every haul is observed or filmed — so those bycatch numbers are a near-census, not a sample.
            </div>
            <div className="sm-context">
              Electronic monitoring is closing the gap: in {landscape.year} cameras covered{" "}
              <b>{k(landscape.emTrips)}</b> trips — the fastest-growing form of coverage on the smaller boats that observers can't always ride.
            </div>
          </>
        ) : (
          <div className="sm-chart-body placeholder short">Loading…</div>
        )}
      </div>

      <div className="sm-note">
        <div className="sm-note-label">Why this slide comes last</div>
        <p>
          Every number on the other slides rests on this one. The BSAI pollock and Amendment 80 fleets — the largest sources of Chinook, chum, and halibut bycatch — are monitored at essentially 100%, so their Prohibited Species Catch counts are an actual tally, not an estimate. The partial-coverage fixed-gear fleets are sampled at 14–32% and statistically expanded, which carries real uncertainty; the confidence intervals in the source data make that explicit.{" "}
          <a href="https://www.fisheries.noaa.gov/alaska/fisheries-observers/north-pacific-observer-program" target="_blank" rel="noreferrer">NOAA Fisheries</a>
        </p>
      </div>

      {/* METHODOLOGY */}
      <div className="sm-method">
        <div className="sm-method-label">Data sources &amp; methodology</div>
        <p>
          <b>Coverage.</b> North Pacific Observer Program coverage by monitoring stratum, 2016–present, from the NOAA Fisheries Monitoring &amp; Analysis annual reports and annual deployment plans. Each stratum is classified as full, partial, or zero coverage, and monitored by human observer, electronic monitoring (EM), or none.
        </p>
        <p>
          <b>The long view</b> shows realized coverage of the partial-coverage fleet, trip-weighted across that year's partial strata, split by method. The full-coverage fleet (regulatory and EM trawl) sits at ≈100% throughout and is drawn as a reference line rather than a series.
        </p>
        <p>
          <b>The landscape bar</b> sums each year's strata by coverage category, weighted by total trips, for the most recent year. &quot;Monitored&quot; is sampled trips ÷ total trips within the category. Trip counts describe fleet structure, not catch volume — a single catcher-processor trip lands far more fish than a small fixed-gear trip.
        </p>
      </div>
    </div>
  );
}
