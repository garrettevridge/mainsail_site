import { useDataset } from "../api/manifest";
import MortalityBar from "../components/charts/MortalityBar";
import StackedTrend from "../components/charts/StackedTrend";
import LineWithBand from "../components/charts/LineWithBand";

interface ChinookMortalityRow {
  year: number;
  source: string;
  fish: number;
}

interface EscapementRow {
  system: string;
  year: number;
  value: number | null;
  goalLower?: number | null;
  goalUpper?: number | null;
}

interface GsiRow {
  year: number;
  region: string;
  mean_pct: number;
  total_catch: number;
  n_samples: number;
}

const HEADLINE_YEAR = 2024;

export default function StoryChinook() {
  const mortality = useDataset<ChinookMortalityRow>("chinook_mortality_summary");
  const escapement = useDataset<EscapementRow>("salmon_escapement_ayk_chinook");
  const gsi = useDataset<GsiRow>("chinook_gsi");

  const headlineBars = (mortality.data ?? [])
    .filter((r) => r.year === HEADLINE_YEAR)
    .map((r) => ({ source: r.source, fish: r.fish }))
    .sort((a, b) => b.fish - a.fish);

  // Pivot mortality into stacked trend shape: one row per year, cols per source
  const stackedData = (() => {
    const byYear = new Map<number, Record<string, number | string>>();
    for (const r of mortality.data ?? []) {
      if (!byYear.has(r.year)) byYear.set(r.year, { year: r.year });
      byYear.get(r.year)![r.source] = r.fish;
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  })();

  const stackKeys = ["Commercial", "Escapement", "Subsistence", "Sport", "Bycatch"];

  const yukon = (escapement.data ?? []).filter((r) => r.system === "Yukon — Pilot Station");
  const kusko = (escapement.data ?? []).filter((r) => r.system === "Kuskokwim — drainagewide");

  const gsiStack = (() => {
    const byYear = new Map<number, Record<string, number | string>>();
    const totalByYear = new Map<number, number>();
    for (const r of gsi.data ?? []) {
      totalByYear.set(r.year, r.total_catch);
      if (!byYear.has(r.year)) byYear.set(r.year, { year: r.year });
      byYear.get(r.year)![r.region] = Math.round((r.mean_pct / 100) * r.total_catch);
    }
    return [...byYear.values()].sort((a, b) => (a.year as number) - (b.year as number));
  })();

  const gsiRegions = Array.from(
    new Set((gsi.data ?? []).map((r) => r.region))
  );

  return (
    <article className="prose-mainsail">
      <p className="text-sm text-muted uppercase tracking-wide mb-2">Theme A · Chinook salmon</p>
      <h1 className="font-serif text-4xl font-semibold text-ink mb-2">
        Chinook salmon in Alaska
      </h1>
      <p className="text-xl text-muted mb-8">Removals and escapement, at rough magnitudes.</p>

      <section>
        <h2>Where do Alaska's Chinook go each year?</h2>
        <p>
          Chinook salmon is Alaska's most economically and culturally significant
          salmon species — the target of directed commercial, sport, and subsistence
          fisheries, and the species whose population trajectories shape regulatory
          decisions from the Kuskokwim to Southeast Alaska.
        </p>
        <p>
          The chart below shows rough statewide magnitudes for {HEADLINE_YEAR}:
          commercial harvest, escapement (fish that returned to spawn), subsistence
          harvest, sport harvest, and bycatch taken in federal groundfish fisheries.
          The five bars together account for essentially all of the visible Chinook
          removal picture.
        </p>
        {mortality.isLoading && <p className="text-muted">Loading…</p>}
        {mortality.error && (
          <p className="text-flag">Data unavailable: {mortality.error.message}</p>
        )}
        {mortality.data && (
          <MortalityBar
            data={headlineBars}
            title={`Alaska Chinook salmon — ${HEADLINE_YEAR} by source (statewide)`}
          />
        )}
        <p className="chart-caption">
          Note: escapement is partial — reflects ~28 monitored systems, not statewide
          total. Sport harvest shown is retained only; catch-and-release mortality
          is not applied. Marine mortality (smolt-to-adult natural losses) is not
          included — no agency publishes a statewide estimate.
        </p>
      </section>

      <section>
        <h2>The 10-year context</h2>
        <p>
          The one-year snapshot above sits inside a decade of change. Three patterns
          are visible across the 2015–2024 series: escapement has declined in western
          Alaska systems, commercial harvest has varied by year without a clear
          directional trend, and bycatch has been relatively stable at a small share
          of the total.
        </p>
        {mortality.data && (
          <StackedTrend
            data={stackedData}
            xKey="year"
            stackKeys={stackKeys}
            title="Alaska Chinook salmon — total removals + escapement, 2015–2024"
            yLabel="number of fish"
          />
        )}
      </section>

      <section>
        <h2>Where the fish come back: Yukon + Kuskokwim escapement</h2>
        <p>
          Two AYK drainages receive the most management attention. Both have shown
          multi-year declines. The shaded band on each chart is the
          <strong> effective-year escapement goal</strong> — the goal that was in
          force at the time each year's escapement occurred. Goals are revised
          through the Alaska Board of Fisheries cycle, and the band reflects each
          revision.
        </p>
        {escapement.data && yukon.length > 0 && (
          <LineWithBand
            data={yukon}
            title="Yukon River Chinook — Pilot Station sonar"
            yLabel="adult Chinook"
          />
        )}
        {escapement.data && kusko.length > 0 && (
          <LineWithBand
            data={kusko}
            title="Kuskokwim River Chinook — drainagewide"
            yLabel="adult Chinook"
          />
        )}
        <p className="chart-caption">
          Kuskokwim data before 2013 is a reconstruction (indirect estimate) rather
          than a direct count — the Bethel tower began operation in 2013. Pre-2013
          and post-2013 Kuskokwim numbers carry a methodology difference.
        </p>
      </section>

      <section>
        <h2>Where the bycatch fish come from</h2>
        <p>
          Chinook taken as bycatch in the Bering Sea pollock fishery come from many
          different river systems. Since 2011, NMFS observers have collected tissue
          samples from bycatch Chinook, and the Alaska Fisheries Science Center has
          analyzed their DNA against a coastwide baseline of known spawning
          populations.
        </p>
        <p>
          The 2023 analysis attributed 47.2% of BSAI pollock Chinook bycatch to{" "}
          <strong>Coastal Western Alaska</strong> — a grouping that includes the
          Yukon, Kuskokwim, Norton Sound, and Bristol Bay drainages. 24.0% to the
          North Alaska Peninsula; 21.4% to British Columbia; 5.5% to West Coast US;
          0.9% to Northwest Gulf of Alaska.
        </p>
        {gsi.data && gsiStack.length > 0 && (
          <StackedTrend
            data={gsiStack}
            xKey="year"
            stackKeys={gsiRegions}
            title="BSAI pollock Chinook bycatch — stock of origin (GSI attribution)"
            yLabel="estimated fish"
          />
        )}
        <p className="chart-caption">
          Chart shows 2023 only; historical 2011–2022 data is pending direct request
          to AFSC Auke Bay Laboratories (see project documentation). "Coastal
          Western Alaska" is an aggregate group and cannot be decomposed into
          individual river systems from current GSI data.
        </p>
      </section>

      <aside className="methodology-box">
        <h3>Methodology</h3>
        <p>
          <strong>Sources.</strong> Commercial: ADF&G Annual Salmon Harvest Summary
          press releases. Escapement: ADF&G Fishery Manuscripts, Special
          Publications, and Annual Management Reports. Subsistence: ADF&G Community
          Subsistence Information System (state only; federal USFWS subsistence not
          included). Sport: ADF&G Statewide Harvest Survey. Bycatch counts: NMFS
          weekly Prohibited Species Catch reports. Bycatch stock of origin: AFSC
          Auke Bay Laboratories GSI reports via NPFMC.
        </p>
        <p>
          <strong>Units.</strong> All values are whole fish counts.
        </p>
        <p>
          <strong>What this story does not claim.</strong> This story does not
          attribute causes of observed Chinook population changes. The published
          scientific literature describes multiple proposed contributing factors
          (climate-driven marine mortality, freshwater temperature, disease,
          hatchery interactions, ocean productivity, fishery impacts). The relative
          importance of each is an open question.
        </p>
      </aside>
    </article>
  );
}
