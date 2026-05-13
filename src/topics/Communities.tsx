import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import { Card, Note, Table } from "../components/primitives";
import TimeSeriesLine from "../components/charts/TimeSeriesLine";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import SpeciesBar from "../components/charts/SpeciesBar";

type NmfsTopPortsRow = {
  year: number;
  port_name: string;
  state: string;
  landings_lbs: number | null;
  ex_vessel_value_usd_nominal: number | null;
  national_rank_by_volume: number | null;
  national_rank_by_value: number | null;
  is_alaska: number;
};

type CfecRegistryRow = {
  year: number;
  dimension: string;
  count: number | null;
  resident_share: number | null;
};

type CfecEarningsRow = {
  year: number;
  fishery_desc: string;
  total_permits_fished: number | null;
  total_lbs: number | null;
  total_earnings: number | null;
};

type CoarBuyingRow = {
  year: number;
  species_name: string;
  operation_count: number | null;
  pounds_bought: number | null;
  amount_paid: number | null;
};

type NmfsProcessorCountRow = {
  year: number;
  sector: string;
  processor_count: number | null;
};

export default function Communities() {
  const { data: ports } = useDataset<NmfsTopPortsRow>("nmfs_top_us_ports");
  const { data: registry } = useDataset<CfecRegistryRow>("cfec_registry");
  const { data: earnings } = useDataset<CfecEarningsRow>("cfec_earnings");
  const { data: coar } = useDataset<CoarBuyingRow>("coar_buying");
  const { data: procs } = useDataset<NmfsProcessorCountRow>("nmfs_processor_count");

  // Top Alaska ports by ex-vessel value (latest year with values)
  const topPorts = useMemo(() => {
    if (!ports) return { rows: [], year: null as number | null };
    const ak = ports.filter((r) => r.is_alaska === 1 && (r.ex_vessel_value_usd_nominal ?? 0) > 0);
    if (!ak.length) return { rows: [], year: null };
    const year = Math.max(...ak.map((r) => r.year));
    const rows = ak
      .filter((r) => r.year === year)
      .map((r) => ({ species: r.port_name, value: (r.ex_vessel_value_usd_nominal ?? 0) / 1_000_000 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
    return { rows, year };
  }, [ports]);

  // Top US ports by volume (latest year), Alaska highlighted
  const topPortsVolume = useMemo(() => {
    if (!ports) return { rows: [] as Array<Array<string | number>>, year: null as number | null };
    const valid = ports.filter((r) => (r.landings_lbs ?? 0) > 0);
    if (!valid.length) return { rows: [], year: null };
    const year = Math.max(...valid.map((r) => r.year));
    const rows = valid
      .filter((r) => r.year === year)
      .sort((a, b) => (b.landings_lbs ?? 0) - (a.landings_lbs ?? 0))
      .slice(0, 15)
      .map((r) => [
        r.national_rank_by_volume ?? "—",
        r.port_name,
        r.state,
        `${((r.landings_lbs ?? 0) / 1_000_000).toFixed(0)} M lbs`,
      ]);
    return { rows, year };
  }, [ports]);

  // CFEC permit registry trends
  const registryTrend = useMemo(() => {
    if (!registry) return [];
    const years = [...new Set(registry.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((yr) => {
      const rows = registry.filter((r) => r.year === yr);
      const ap = rows.find((r) => r.dimension === "active_permits");
      return {
        year: yr,
        active_permits: ap?.count ?? 0,
        resident: ap && ap.resident_share != null ? Math.round((ap.count ?? 0) * ap.resident_share) : 0,
        nonresident: ap && ap.resident_share != null
          ? Math.round((ap.count ?? 0) * (1 - ap.resident_share))
          : 0,
      };
    });
  }, [registry]);

  // Statewide ex-vessel earnings trend
  const earningsTrend = useMemo(() => {
    if (!earnings) return [];
    const years = [...new Set(earnings.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((yr) => ({
      year: yr,
      value: earnings
        .filter((r) => r.year === yr)
        .reduce((s, r) => s + (r.total_earnings ?? 0), 0) / 1_000_000,
    }));
  }, [earnings]);

  // Alaska landing communities — ex-vessel value, volume, US rank (latest year w/ values)
  const akCommunities = useMemo(() => {
    if (!ports) return { rows: [] as Array<Array<string | number>>, year: null as number | null };
    const valid = ports.filter(
      (r) => r.is_alaska === 1
        && (r.ex_vessel_value_usd_nominal ?? 0) > 0
        && (r.landings_lbs ?? 0) > 0,
    );
    if (!valid.length) return { rows: [], year: null };
    const year = Math.max(...valid.map((r) => r.year));
    const rows = valid
      .filter((r) => r.year === year)
      .sort((a, b) => (b.ex_vessel_value_usd_nominal ?? 0) - (a.ex_vessel_value_usd_nominal ?? 0))
      .map((r) => [
        r.port_name,
        `$${((r.ex_vessel_value_usd_nominal ?? 0) / 1_000_000).toFixed(1)} M`,
        `${((r.landings_lbs ?? 0) / 1_000_000).toFixed(1)} M lbs`,
        r.national_rank_by_value != null ? `#${r.national_rank_by_value}` : "—",
        r.national_rank_by_volume != null ? `#${r.national_rank_by_volume}` : "—",
      ]);
    return { rows, year };
  }, [ports]);

  // COAR buying — pounds bought + amount paid statewide
  const coarTrend = useMemo(() => {
    if (!coar) return [];
    const years = [...new Set(coar.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((yr) => {
      const rows = coar.filter((r) => r.year === yr);
      return {
        year: yr,
        amount_paid_m: rows.reduce((s, r) => s + (r.amount_paid ?? 0), 0) / 1_000_000,
        pounds_bought_m: rows.reduce((s, r) => s + (r.pounds_bought ?? 0), 0) / 1_000_000,
      };
    });
  }, [coar]);

  return (
    <>
      <h1 className="page-title">Communities</h1>

      <h2 className="h2">Alaska landing communities, by ex-vessel value, {akCommunities.year ?? "—"}</h2>
      <Card>
        {akCommunities.rows.length > 0 && (
          <Table
            columns={[
              { label: "Community" },
              { label: "Ex-vessel value", num: true },
              { label: "Volume", num: true },
              { label: "US rank (value)", num: true },
              { label: "US rank (volume)", num: true },
            ]}
            rows={akCommunities.rows}
            caption="Source: nmfs_top_us_ports · NMFS FUS port tables · Alaska ports with reported value & volume."
          />
        )}
        <Note>
          <b>Data note.</b> The Mainsail manifest currently surfaces port name,
          state, landings (lbs), ex-vessel value ($), and US ranks. The companion
          design also called for <i>region</i>, <i>primary species</i>, and an
          8-year sparkline trend per community — those fields are not in any
          published dataset yet and would need new ingestion (ADF&amp;G region
          rollup for region; ADF&amp;G fish-ticket aggregation by port for
          primary species; a multi-year port pull from FUS for trend).
        </Note>
      </Card>

      <h2 className="h2">Top Alaska ports by ex-vessel value, {topPorts.year ?? "—"}</h2>
      <Card>
        {topPorts.rows.length > 0 && (
          <SpeciesBar data={topPorts.rows} unitLabel="$M" color="#2f5d8a" />
        )}
        <div className="data-caption">Source: <code>nmfs_top_us_ports</code> · Fisheries of the United States · nominal USD millions.</div>
      </Card>

      <h2 className="h2">Top US ports by volume, {topPortsVolume.year ?? "—"}</h2>
      <Card>
        {topPortsVolume.rows.length > 0 && (
          <Table
            columns={[
              { label: "US rank", num: true },
              { label: "Port" },
              { label: "State" },
              { label: "Landings", num: true },
            ]}
            rows={topPortsVolume.rows}
            caption="Source: nmfs_top_us_ports · FUS port tables · top 15 by reported volume."
          />
        )}
      </Card>

      <h2 className="h2">CFEC active permits, statewide</h2>
      <Card>
        {registryTrend.length > 0 && (
          <MultiLineTrend
            data={registryTrend}
            xKey="year"
            seriesKeys={["resident", "nonresident"]}
            yLabel="permits"
            unitSuffix="permits"
          />
        )}
        <div className="data-caption">Source: <code>cfec_registry</code> · active_permits dimension · resident_share applied to split series.</div>
      </Card>

      <h2 className="h2">CFEC ex-vessel earnings, statewide</h2>
      <Card>
        {earningsTrend.length > 0 && (
          <TimeSeriesLine
            data={earningsTrend}
            xKey="year"
            yKey="value"
            yLabel="USD millions (nominal)"
            unitSuffix="M USD"
          />
        )}
        <div className="data-caption">Source: <code>cfec_earnings</code> · sum of <code>total_earnings</code> across all fishery codes per year.</div>
      </Card>

      <h2 className="h2">COAR buying — amount paid &amp; pounds bought</h2>
      <Card>
        {coarTrend.length > 0 && (
          <MultiLineTrend
            data={coarTrend}
            xKey="year"
            seriesKeys={["amount_paid_m", "pounds_bought_m"]}
            yLabel="millions ($ / lbs)"
            unitSuffix=" M"
          />
        )}
        <div className="data-caption">Source: <code>coar_buying</code> · ADF&amp;G Commercial Operators Annual Report.</div>
      </Card>

      <h2 className="h2">NMFS Alaska processor counts</h2>
      <Card>
        {procs && (
          <Table
            columns={[
              { label: "Year", yr: true },
              { label: "Sector" },
              { label: "Processor count", num: true },
            ]}
            rows={procs.map((r) => [
              r.year,
              r.sector,
              r.processor_count != null ? r.processor_count.toLocaleString() : "—",
            ])}
            caption="Source: nmfs_processor_count · NMFS APR/FEUS."
          />
        )}
      </Card>
    </>
  );
}
