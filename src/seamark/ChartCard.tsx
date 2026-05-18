import type { ReactNode } from "react";

interface ChartCardProps {
  label: string;
  source: string;
  title: string;
  height?: "default" | "tall" | "short";
  caption?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({
  label,
  source,
  title,
  height = "default",
  caption,
  children,
}: ChartCardProps) {
  const heightClass =
    height === "tall" ? "tall" : height === "short" ? "short" : "";
  return (
    <div className="sm-chart">
      <div className="sm-chart-head">
        <span className="label">{label}</span>
        <span className="src">{source}</span>
      </div>
      <div className="sm-chart-title">{title}</div>
      <div className={`sm-chart-body ${heightClass}`}>{children}</div>
      {caption && <div className="sm-chart-foot">{caption}</div>}
    </div>
  );
}

export function PlaceholderChart({
  label,
  source,
  title,
  height = "default",
  caption,
  note = "Data not yet gathered",
}: ChartCardProps & { note?: string }) {
  const heightClass =
    height === "tall" ? "tall" : height === "short" ? "short" : "";
  return (
    <div className="sm-chart">
      <div className="sm-chart-head">
        <span className="label">{label}</span>
        <span className="src">{source}</span>
      </div>
      <div className="sm-chart-title">{title}</div>
      <div className={`sm-chart-body placeholder ${heightClass}`}>{note}</div>
      {caption && <div className="sm-chart-foot">{caption}</div>}
    </div>
  );
}
