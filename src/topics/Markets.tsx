import { useMemo } from "react";
import { useDataset } from "../api/manifest";
import { Card, Note } from "../components/primitives";
import TimeSeriesLine from "../components/charts/TimeSeriesLine";
import MultiLineTrend from "../components/charts/MultiLineTrend";
import SpeciesBar from "../components/charts/SpeciesBar";

type AlaskaExportShareRow = {
  species: string;
  year: number;
  flow: string;
  alaska_share: number | null;
  total_value_usd: number | null;
};

type NmfsTradeExportsRow = {
  year: number;
  hts_description: string;
  destination_country: string;
  export_volume_kg: number | null;
  export_value_usd_nominal: number | null;
  species_group: string;
};

type AsprPricesRow = {
  report_type: string;
  year: number;
  species: string;
  product_form: string;
  area_name: string | null;
  avg_price: number | null;
};

type FaoCaptureRow = {
  year: number;
  country: string;
  iso3: string;
  capture_tonnes: number | null;
};

type CpiRow = {
  year: number;
  cpi_index: number | null;
  base_year: number;
  deflator_to_base: number | null;
};

export default function Markets() {
  const { data: share } = useDataset<AlaskaExportShareRow>("alaska_export_share");
  const { data: trade } = useDataset<NmfsTradeExportsRow>("nmfs_trade_exports");
  const { data: aspr } = useDataset<AsprPricesRow>("aspr_prices");
  const { data: fao } = useDataset<FaoCaptureRow>("fao_fishstat_capture");
  const { data: cpi } = useDataset<CpiRow>("cpi_u_deflator");

  // Total Alaska-attributed export value (USD) per year
  // total_value_usd × alaska_share, summed across all species in the dataset
  const totalAkExports = useMemo(() => {
    if (!share) return { data: [] as Array<{ year: number; value_m: number }>, range: "" };
    const exportRows = share.filter(
      (r) => r.flow === "export" && r.alaska_share != null && r.total_value_usd != null,
    );
    const byYear = new Map<number, number>();
    for (const r of exportRows) {
      byYear.set(
        r.year,
        (byYear.get(r.year) ?? 0) + (r.total_value_usd ?? 0) * (r.alaska_share ?? 0),
      );
    }
    const data = [...byYear.entries()]
      .map(([year, v]) => ({ year, value_m: v / 1_000_000 }))
      .sort((a, b) => a.year - b.year);
    return {
      data,
      range: data.length ? `${data[0].year}–${data.at(-1)?.year}` : "",
    };
  }, [share]);

  // Alaska export share by species over time
  const exportShareSeries = useMemo(() => {
    if (!share) return { data: [], keys: [] as string[] };
    const exportRows = share.filter((r) => r.flow === "export" && r.alaska_share != null);
    const species = [...new Set(exportRows.map((r) => r.species))];
    const years = [...new Set(exportRows.map((r) => r.year))].sort((a, b) => a - b);
    const data = years.map((yr) => {
      const point: Record<string, number | string> = { year: yr };
      for (const sp of species) {
        const row = exportRows.find((r) => r.year === yr && r.species === sp);
        point[sp] = row?.alaska_share != null ? Math.round(row.alaska_share * 1000) / 10 : 0;
      }
      return point;
    });
    return { data, keys: species };
  }, [share]);

  // Top export destinations by value (latest year)
  const topDestinations = useMemo(() => {
    if (!trade) return { rows: [], year: null as number | null };
    const valid = trade.filter((r) => (r.export_value_usd_nominal ?? 0) > 0);
    if (!valid.length) return { rows: [], year: null };
    const year = Math.max(...valid.map((r) => r.year));
    const totals = new Map<string, number>();
    for (const r of valid) {
      if (r.year !== year) continue;
      totals.set(r.destination_country, (totals.get(r.destination_country) ?? 0) + (r.export_value_usd_nominal ?? 0));
    }
    const rows = [...totals.entries()]
      .map(([country, v]) => ({ species: country, value: v / 1_000_000 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
    return { rows, year };
  }, [trade]);

  // ASPR average prices, sablefish + sockeye + chinook, annual reports
  const priceTrend = useMemo(() => {
    if (!aspr) return [];
    const annual = aspr.filter((r) => r.report_type === "annual" && r.avg_price != null);
    const species = [...new Set(annual.map((r) => r.species))];
    const years = [...new Set(annual.map((r) => r.year))].sort((a, b) => a - b);
    return years.map((yr) => {
      const point: Record<string, number | string | null> = { year: yr };
      for (const sp of species) {
        const rows = annual.filter((r) => r.year === yr && r.species === sp);
        if (rows.length === 0) {
          point[sp] = null;
        } else {
          const avg = rows.reduce((s, r) => s + (r.avg_price ?? 0), 0) / rows.length;
          point[sp] = +avg.toFixed(2);
        }
      }
      return point;
    });
  }, [aspr]);

  const priceSpecies = useMemo(() => {
    if (!aspr) return [];
    const annual = aspr.filter((r) => r.report_type === "annual" && r.avg_price != null);
    return [...new Set(annual.map((r) => r.species))];
  }, [aspr]);

  // FAO world capture — latest year top countries
  const faoTop = useMemo(() => {
    if (!fao) return { rows: [], year: null as number | null };
    const valid = fao.filter((r) => (r.capture_tonnes ?? 0) > 0);
    if (!valid.length) return { rows: [], year: null };
    const year = Math.max(...valid.map((r) => r.year));
    const rows = valid
      .filter((r) => r.year === year)
      .map((r) => ({ species: r.country, value: (r.capture_tonnes ?? 0) / 1_000_000 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
    return { rows, year };
  }, [fao]);

  // CPI deflator
  const cpiSeries = useMemo(() => {
    if (!cpi) return [];
    return cpi
      .filter((r) => r.cpi_index != null)
      .map((r) => ({ year: r.year, cpi_index: r.cpi_index }))
      .sort((a, b) => a.year - b.year);
  }, [cpi]);

  return (
    <>
      <h1 className="page-title">Markets</h1>

      <h2 className="h2">Total Alaska exports, {totalAkExports.range}</h2>
      <Card>
        {totalAkExports.data.length > 0 && (
          <TimeSeriesLine
            data={totalAkExports.data}
            xKey="year"
            yKey="value_m"
            yLabel="USD millions (nominal)"
            unitSuffix="M USD"
          />
        )}
        <div className="data-caption">
          Source: <code>alaska_export_share</code> · sum across 10 species (cod, crab, fishmeal, fish oil, flatfish, halibut, herring, pollock, rockfish, sablefish) of <code>total_value_usd</code> × <code>alaska_share</code>. Nominal USD; no salmon line in the source dataset yet.
        </div>
      </Card>

      <h2 className="h2">Alaska-origin export share by species</h2>
      <Card>
        {exportShareSeries.data.length > 0 && (
          <MultiLineTrend
            data={exportShareSeries.data}
            xKey="year"
            seriesKeys={exportShareSeries.keys}
            yLabel="% of US export value"
            unitSuffix="%"
          />
        )}
        <div className="data-caption">Source: <code>alaska_export_share</code> · NMFS FOSS foreign trade · product_classifier_v2.</div>
      </Card>

      <h2 className="h2">Top US seafood export destinations, {topDestinations.year ?? "—"}</h2>
      <Card>
        {topDestinations.rows.length > 0 && (
          <SpeciesBar data={topDestinations.rows} unitLabel="$M" color="#b45309" />
        )}
        <div className="data-caption">Source: <code>nmfs_trade_exports</code> · NMFS FOSS · top 12 countries by export value.</div>
      </Card>

      <h2 className="h2">ASPR annual average prices by species</h2>
      <Card>
        {priceTrend.length > 0 && priceSpecies.length > 0 && (
          <MultiLineTrend
            data={priceTrend}
            xKey="year"
            seriesKeys={priceSpecies}
            yLabel="$ / lb"
            unitSuffix="$/lb"
          />
        )}
        <div className="data-caption">Source: <code>aspr_prices</code> · ADF&amp;G Alaska Salmon Price Report annual rollup, averaged across product forms and areas.</div>
      </Card>

      <h2 className="h2">FAO world wild-capture by country, {faoTop.year ?? "—"}</h2>
      <Card>
        {faoTop.rows.length > 0 && (
          <SpeciesBar data={faoTop.rows} unitLabel="M tonnes" color="#7b6a4f" />
        )}
        <div className="data-caption">Source: <code>fao_fishstat_capture</code> · FAO FishStat · capture (wild) production, top 15.</div>
      </Card>

      <h2 className="h2">US per-capita seafood consumption</h2>
      <Card>
        <Note>
          <b>Data not yet ingested.</b> The Mainsail S3 manifest does not
          currently carry a per-capita seafood consumption series. The expected
          source is the NMFS <i>Fisheries of the United States</i> "Supply &amp;
          Use" tables — pounds per person per year, edible weight, 1910–present.
          Adding a <code>us_per_capita_seafood</code> dataset on the next data
          engine refresh would unblock this chart.
        </Note>
      </Card>

      <h2 className="h2">US CPI-U deflator (base year 2025)</h2>
      <Card>
        {cpiSeries.length > 0 && (
          <TimeSeriesLine
            data={cpiSeries}
            xKey="year"
            yKey="cpi_index"
            yLabel="CPI-U index"
            unitSuffix=""
          />
        )}
        <div className="data-caption">Source: <code>cpi_u_deflator</code> · BLS CUUR0000SA0 · used for real-dollar conversion against base year 2025.</div>
      </Card>
    </>
  );
}
