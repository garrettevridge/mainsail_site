import { useMemo } from "react";
import { useDataset } from "../../api/manifest";
import type { ChinookDrainageTotalsRow } from "../../api/types";
import ChartCard, { PlaceholderChart } from "../ChartCard";
import { MultiLine, Legend } from "../SmChart";
import { SERIES } from "../colors";

// Counted in-river escapement for Western AK Chinook drainages.
// Yukon basin + Kuskokwim basin + Nushagak River (Bristol Bay) cover the
// "Western Alaska" framing in this section.

const W_AK_DRAINAGES = ["Yukon basin", "Kuskokwim basin", "Nushagak River"];

export default function WesternAlaska() {
  const { data: drainage } = useDataset<ChinookDrainageTotalsRow>("chinook_drainage_totals");

  const escData = useMemo(() => {
    if (!drainage) return [];
    const byYear = new Map<number, Record<string, number>>();
    for (const r of drainage) {
      if (!W_AK_DRAINAGES.includes(r.drainage)) continue;
      if (r.actual_count == null) continue;
      const row = byYear.get(r.year) ?? { year: r.year };
      row[r.drainage] = (row[r.drainage] ?? 0) + r.actual_count;
      byYear.set(r.year, row);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  }, [drainage]);

  return (
    <section id="western-alaska" className="sm-section">
      <div className="sm-marker">
        <span className="num">03c / Western Alaska salmon</span>
        <span className="title">What the data says about cause</span>
      </div>

      <h2 className="sm-h2">
        The harder conversation <span className="accent">Western Alaska deserves.</span>
      </h2>

      <p className="sm-p">
        It is tragic that salmon runs are suffering. Across Western Alaska
        — the Yukon and Kuskokwim river systems and the broader Arctic-
        Yukon-Kuskokwim region — Chinook and chum returns have collapsed
        over the past decade, and subsistence fisheries have closed for
        multiple consecutive years. The losses to communities that have
        organized food, culture, and economy around these runs for
        generations are difficult to overstate. Any honest discussion of
        Alaska's fisheries has to begin there. But pointing blame at trawl
        bycatch is not a solution, and the data does not support the
        simpler narrative.
      </p>

      <p className="sm-p">
        The argument that BSAI pollock trawl bycatch contributes to Western
        Alaska's salmon decline is not without basis. The pollock fleet
        incidentally captures Chinook and chum salmon every year — Chinook
        in the thousands, chum in the tens of thousands and in some years
        substantially more. NOAA genetic sampling has shown that a
        meaningful share of that Chinook bycatch originates from Coastal
        Western Alaska stocks, roughly 47 percent in recent assessment
        years. When escapement goals are missed by hundreds of fish, or
        when returns fall to a fraction of historical levels, every
        individual fish carries weight. The frustration of fishermen,
        families, and tribal organizations who have been asked to absorb
        closure after closure while watching offshore vessels continue to
        fish is real, and it is rational. To dismiss the bycatch concern as
        misinformed would be both inaccurate and disrespectful.
      </p>

      <ChartCard
        label="Fig 3.4 · primary · the comparison that matters"
        source="ADF&G drainage rollup (chinook_drainage_totals)"
        title="Western Alaska Chinook — counted in-river escapement, by drainage."
        height="tall"
        caption={
          <>
            Lines, counted in-river escapement (sum across canonical
            drainage rows from chinook_drainage_totals, which selects one
            authoritative count per drainage-year to avoid double-counting
            drainagewide reconstructions against component tributaries).
            Yukon, Kuskokwim, and Nushagak basins shown. The visual point:
            historical runs were measured in hundreds of thousands; recent
            counts are a fraction of those. Bycatch losses, by comparison,
            are in the low thousands of Western-AK-origin fish per year —
            small relative to the runs that have disappeared.
          </>
        }
      >
        {escData.length > 0 ? (
          <>
            <MultiLine
              data={escData}
              xKey="year"
              keys={W_AK_DRAINAGES}
              height={360}
              yFormatter={(v) => v.toLocaleString()}
              yLabel="Counted escapement (fish)"
            />
            <Legend
              items={W_AK_DRAINAGES.map((d, i) => ({ label: d, color: SERIES[i] }))}
            />
          </>
        ) : (
          <div className="sm-chart-body placeholder tall">Loading…</div>
        )}
      </ChartCard>

      <p className="sm-p">
        But the empirical question is whether bycatch is a primary cause of
        the collapse, and on that question the data points clearly in one
        direction. Three findings matter. First, Chinook bycatch from
        Coastal Western Alaska averages roughly 5,000 to 7,000 fish per
        year in recent BSAI seasons. The historical runs on the Yukon and
        Kuskokwim were measured in hundreds of thousands. Removing the
        entire bycatch from the equation does not produce a recovery — it
        produces a slightly smaller run failure. Second, chum bycatch
        genetics tell an even sharper story. Western Alaska accounts for
        roughly 8 percent of identified-origin chum bycatch in the BSAI;
        the great majority is Asian and Pacific Northwest hatchery stock.
        Reducing chum bycatch to zero would primarily affect Asian and PNW
        returns, not Western Alaska runs. Third, and most fundamentally,
        the same marine survival crash has hit stocks that share nothing
        in common except their ocean phase. Yukon Chinook, Kuskokwim
        Chinook, AYK chum, and other stocks failing across the region
        include populations that do not meaningfully interact with the
        BSAI pollock trawl fishery. Whatever is causing the collapse is
        acting on these stocks at sea, after they have left their natal
        rivers and before they return, and it is acting on them regardless
        of fishery overlap.
      </p>

      <PlaceholderChart
        label="Fig 3.5 · marine survival"
        source="ADF&G research · AFSC ESR"
        title="Marine survival indices for Western Alaska salmon stocks."
        caption={
          <>
            Time series of marine survival or return-per-spawner for major
            Western AK Chinook and chum stocks, alongside Bering Sea ocean
            temperature anomalies. Data not yet gathered.
          </>
        }
        note="Awaiting AFSC ESR / ADF&G survival index ingest"
      >
        {null}
      </PlaceholderChart>

      <p className="sm-p">
        Seamark's position is that the available data does not support a
        direct causal connection between BSAI pollock trawl bycatch and the
        collapse of Western Alaska salmon runs. The dominant signal is
        marine survival, which has crashed across the region in step with
        environmental shifts visible since 2014 and accelerating after
        2018. The Bering Sea has warmed to historical highs, the cold pool
        has retreated, the forage base has shifted. The same window covers
        the AYK run failures, the Bering Sea snow crab collapse, the Gulf
        of Alaska Pacific cod recruitment failure, and adjacent ecological
        events with no plausible fishery cause. The runs in distress are
        not in distress because of bycatch. They are in distress because
        the ocean they spend most of their lives in has changed.
      </p>

      <p className="sm-p">
        This conclusion is not a defense of the status quo on bycatch, and
        it should not be read as one. Bycatch is not zero, and at
        critically low escapement levels every removed fish matters morally
        regardless of the proportional contribution to total mortality.
        Continued investment in bycatch avoidance — gear improvements,
        real-time data sharing across vessels, area-based closures, and
        the cooperative governance mechanisms that already drive bycatch
        reductions within the fleet — is the right policy for its own
        reasons. Seamark supports it. The point of this section is
        narrower: bycatch reduction, even substantial reduction, is not
        the policy that recovers Western Alaska salmon. Treating it as if
        it were means committing political and management effort to a
        lever that cannot produce the outcome the public is asking for.
      </p>

      <p className="sm-p">
        The harder conversation, and the one Western Alaska deserves, is
        about marine survival, climate adaptation, in-river productivity,
        and the economic and food-security support that affected
        communities need while the science catches up to a changing ocean.
        That conversation has been crowded out by a bycatch debate that
        has more political energy than empirical foundation. We are
        presenting the data plainly, and stating our position on it
        plainly, so the harder conversation can begin.
      </p>
    </section>
  );
}
