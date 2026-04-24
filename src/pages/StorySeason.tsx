import { useDataset, useManifest } from "../api/manifest";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import UtilizationBar from "../components/charts/UtilizationBar";
import TimeSeriesLine from "../components/charts/TimeSeriesLine";

interface PscCumulativeRow {
  stat_week: number;
  current_year: number | null;
  prior_10yr_avg: number | null;
  [k: string]: string | number | null | undefined;
}

interface CatchVsTacRow {
  target_fishery: string;
  tac_mt: number;
  catch_mt: number;
  utilization_pct: number;
}

interface FishCountRow {
  count_date: string;
  daily_count: number | null;
  cumulative_count: number | null;
  [k: string]: string | number | null | undefined;
}

export default function StorySeason() {
  const { data: manifest } = useManifest();
  const psc = useDataset<PscCumulativeRow>("psc_chinook_cumulative");
  const catchTac = useDataset<CatchVsTacRow>("catch_vs_tac_current");
  const kenai = useDataset<FishCountRow>("fish_counts_kenai_late_chinook");

  const asOf = manifest ? new Date(manifest.generated_at).toLocaleDateString() : "";

  return (
    <article className="prose-mainsail">
      <p className="text-sm text-muted uppercase tracking-wide mb-2">Theme E · In-season</p>
      <h1 className="font-serif text-4xl font-semibold text-ink mb-2">
        Season tracker: what the fisheries look like right now
      </h1>
      <p className="text-xl text-muted mb-8">
        The three charts below refresh as NMFS and ADF&G publish new data —
        weekly for federal reports, daily for in-season escapement.
      </p>

      <section>
        <h2>BSAI pollock Chinook bycatch — season to date</h2>
        <p>
          The Bering Sea pollock fishery reports its Prohibited Species Catch
          (PSC) weekly to NMFS. The chart below shows cumulative Chinook PSC
          by statistical week: the solid line is the current year; the dashed
          line is the prior ten-year average. The chart updates every Tuesday
          when NMFS publishes the prior week's totals.
        </p>
        {psc.isLoading && <p className="text-muted">Loading…</p>}
        {psc.error && (
          <p className="text-flag">Data unavailable: {psc.error.message}</p>
        )}
        {psc.data && (
          <MultiLineTrend
            data={psc.data}
            xKey="stat_week"
            seriesKeys={["current_year", "prior_10yr_avg"]}
            dashed={["prior_10yr_avg"]}
            title="BSAI pollock Chinook PSC — cumulative by statistical week"
            yLabel="Chinook taken (cumulative)"
            xLabel="NMFS statistical week"
            unitSuffix="fish"
          />
        )}
        <p className="chart-caption">
          Statistical weeks run Sunday to Saturday. Data as of {asOf}. The
          prior-10-year average is a simple mean of the same statistical week
          across 2015–2024. Current-year values end at the most recently
          reported week.
        </p>
      </section>

      <section>
        <h2>Federal groundfish — catch as a share of TAC</h2>
        <p>
          Every federal groundfish fishery off Alaska operates under a Total
          Allowable Catch (TAC) set annually by the North Pacific Fishery
          Management Council. NMFS reports catch weekly and closes each
          fishery when catch reaches its TAC. The bars below show catch as a
          percent of TAC for each major target fishery, most recent
          reporting period.
        </p>
        {catchTac.isLoading && <p className="text-muted">Loading…</p>}
        {catchTac.error && (
          <p className="text-flag">Data unavailable: {catchTac.error.message}</p>
        )}
        {catchTac.data && (
          <UtilizationBar
            data={catchTac.data}
            title="Alaska federal groundfish — catch as % of TAC, current year"
          />
        )}
        <p className="chart-caption">
          100% utilization means the TAC has been fully harvested. Values
          above 100% occur when small overages are reported in final
          reconciliation and are carried into the ledger as-is. Hover a bar
          for catch and TAC in metric tons.
        </p>
      </section>

      <section>
        <h2>Kenai River late-run Chinook — cumulative passage</h2>
        <p>
          ADF&G operates a sonar on the Kenai River that counts Chinook
          salmon passing upstream. The late-run counter operates from July 1
          through early August. The chart shows cumulative passage by date
          for the most recently completed run.
        </p>
        {kenai.isLoading && <p className="text-muted">Loading…</p>}
        {kenai.error && (
          <p className="text-flag">Data unavailable: {kenai.error.message}</p>
        )}
        {kenai.data && (
          <TimeSeriesLine
            data={kenai.data}
            xKey="count_date"
            yKey="cumulative_count"
            title="Kenai River late-run Chinook — cumulative sonar passage, 2025"
            yLabel="cumulative Chinook"
            lineName="Cumulative passage"
            unitSuffix="fish"
          />
        )}
        <p className="chart-caption">
          Cumulative values reflect fish counted past the sonar and do not
          separate hatchery from wild. Daily counts are preliminary until
          reconciled at end of season.
        </p>
      </section>

      <aside className="methodology-box">
        <h3>What "in-season" means here</h3>
        <p>
          All three charts above are subject to revision as their source
          agencies reconcile preliminary reports with later data. The PSC
          weekly reports are typically revised within four weeks of initial
          publication. TAC-utilization figures finalize after the SAFE
          (Stock Assessment and Fishery Evaluation) cycle. Kenai sonar
          counts finalize after end-of-season QC. Mainsail carries the most
          recent agency-published value on each refresh; preliminary values
          are flagged in the data layer and the footer timestamp shows when
          the current view was published.
        </p>
      </aside>

      <p className="text-sm text-muted mt-8">
        Sources: NMFS Alaska Region weekly PSC and catch reports; ADF&G
        in-season sonar programs.
      </p>
    </article>
  );
}
