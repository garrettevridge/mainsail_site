import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { MonitoredCatchRow } from "../../api/types";
import ChartCard from "../ChartCard";
import { MultiLine, Legend } from "../SmChart";
import SmCallout from "../SmCallout";
import { SERIES } from "../colors";

// Bycatch rate by gear: discarded / (retained + discarded), by gear and year.
// Use monitored_or_total === "Total" so we get the full catch picture.

const GEAR_ORDER = ["Pelagic Trawl", "Nonpelagic Trawl", "Hook and Line", "Pot", "Jig"] as const;

export default function BycatchOverview() {
  const { data } = useDataset<MonitoredCatchRow>("monitored_catch");

  const chartData = useMemo(() => {
    if (!data) return [];
    type Acc = { retained: number; discarded: number };
    const byYearGear = new Map<number, Map<string, Acc>>();
    for (const r of data) {
      if (r.monitored_or_total !== "Total") continue;
      const yr = byYearGear.get(r.year) ?? new Map<string, Acc>();
      const slot = yr.get(r.gear) ?? { retained: 0, discarded: 0 };
      if (r.disposition === "Retained") slot.retained += r.metric_tons;
      else if (r.disposition === "Discarded") slot.discarded += r.metric_tons;
      yr.set(r.gear, slot);
      byYearGear.set(r.year, yr);
    }
    return [...byYearGear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, gears]) => {
        const row: Record<string, number> = { year };
        for (const g of GEAR_ORDER) {
          const a = gears.get(g);
          if (!a) continue;
          const total = a.retained + a.discarded;
          if (total <= 0) continue;
          row[g] = +((a.discarded / total) * 100).toFixed(2);
        }
        return row;
      });
  }, [data]);

  // Frankness about volume: the midwater (pollock) fleet's total catch and
  // absolute discard tonnage in the latest year — a low rate on an enormous
  // catch is still a large catch, and we say so.
  const pollockVolume = useMemo(() => {
    if (!data) return null;
    const latest = Math.max(...data.map((r) => r.year));
    let total = 0;
    let disc = 0;
    for (const r of data) {
      if (r.monitored_or_total !== "Total" || r.year !== latest) continue;
      if (r.gear !== "Pelagic Trawl") continue;
      total += r.metric_tons;
      if (r.disposition === "Discarded") disc += r.metric_tons;
    }
    if (total <= 0) return null;
    return {
      year: latest,
      catchMmt: total / 1e6,
      catchBlbs: (total * 2204.62) / 1e9,
      discardMt: Math.round(disc),
    };
  }, [data]);

  // Headline framing figure: total federal groundfish discards in the most
  // recent year, in millions of pounds, and as a share of total catch.
  const totals = useMemo(() => {
    if (!data) return null;
    let discardLatest = 0;
    let totalLatest = 0;
    const latest = Math.max(...data.map((r) => r.year));
    for (const r of data) {
      if (r.monitored_or_total !== "Total" || r.year !== latest) continue;
      if (r.disposition === "Discarded") discardLatest += r.metric_tons;
      totalLatest += r.metric_tons;
    }
    if (totalLatest <= 0) return null;
    return {
      year: latest,
      mlb: Math.round((discardLatest * 2204.62) / 1e6),
      ratePct: (discardLatest / totalLatest) * 100,
    };
  }, [data]);

  return (
    <section id="bycatch-overview" className="sm-section">
      <div className="sm-marker">
        <span className="num">Bycatch, by gear</span>
        <span className="title">What's caught, and what gets thrown back</span>
      </div>

      <h2 className="sm-h2">
        What's caught, <span className="accent">and what gets thrown back.</span>
      </h2>

      <p className="sm-p">
        Bycatch is the part of a fishery's catch it does not keep — non-target
        animals brought up alongside the target and returned to the sea. Across
        Alaska's federal groundfish fisheries, discards came to about{" "}
        {totals ? `${totals.mlb} million pounds` : "a hundred-plus million pounds"}{" "}
        in {totals ? totals.year : "a recent year"}, roughly{" "}
        {totals ? `${totals.ratePct.toFixed(0)} percent` : "a few percent"} of
        total catch by weight.
      </p>

      <p className="sm-p">
        The discarded share varies sharply by gear. The chart below shows it for
        each major gear type. The midwater (pelagic) trawl gear used in the
        pollock fishery discards under one percent of its catch by weight; bottom
        trawl discards about eight percent; hook-and-line gear discards roughly a
        fifth. Pollock is also the largest fishery in the United States by volume
        —{" "}
        {pollockVolume
          ? `about ${pollockVolume.catchMmt.toFixed(1)} million metric tons (${pollockVolume.catchBlbs.toFixed(1)} billion pounds) in ${pollockVolume.year}`
          : "well over a million metric tons a year"}
        , more by weight than any other American fishery.
      </p>

      <ChartCard
        label={`Fig 2.1 · gear comparison · 2013–${chartData.at(-1)?.year ?? ""}`}
        source="NOAA AKR Catch Accounting (monitored_catch, Total)"
        title="Federal Alaska bycatch rate by major gear — discarded share of total catch."
        caption={
          <>
            Lines, percent of total federal catch by weight discarded, by gear.
            State fisheries (salmon set/drift gillnet, seine) are not in this
            federal accounting system.
          </>
        }
      >
        {chartData.length > 0 ? (
          <>
            <MultiLine
              data={chartData}
              xKey="year"
              keys={[...GEAR_ORDER]}
              height={320}
              yFormatter={(v) => `${v.toFixed(1)}%`}
              yLabel="Discarded share (%)"
            />
            <Legend
              items={GEAR_ORDER.map((g, i) => ({ label: g, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder">Loading…</div>
        )}
      </ChartCard>

      <p className="sm-p">
        Two limits apply to every figure here. First, by weight most groundfish
        discards are not salmon or halibut but jellyfish and other low-value
        invertebrates. <strong>Pending data:</strong> a full species breakdown
        requires the NMFS non-target catch tables, not yet ingested. Second,
        these numbers come from the federally observed fisheries; the
        state-managed fisheries, most salmon fisheries among them, are not
        observed at the same resolution, so their bycatch is largely unmeasured.
        The sections that follow take the species that drive the public debate:
        salmon and halibut.
      </p>

      <SmCallout label="Supporting · observer coverage" title="How these numbers are collected.">
        The federal catch figures in this paper come from one of the most
        intensively monitored fisheries in the world. The Bering Sea pollock
        fleet carries an observer or camera on essentially every trip; shoreside
        plants run two observers per offload. Gulf of Alaska and smaller vessels
        fall under partial coverage — statistically sampled trips and electronic
        monitoring. State fisheries, by and large, carry close to none. Every
        comparison between a federal and a state fishery should be read with that
        asymmetry in mind.
      </SmCallout>
    </section>
  );
}
