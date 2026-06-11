import type { ReactNode } from "react";

// Generic reference-table component. One concern: render typed rows as a table
// with a labelled header and optional footnote. Charts live in their own
// per-type components (SmChart); this is the tabular counterpart, reused by any
// section that needs a small lookup/summary table rather than a time series.

export interface SmColumn<T> {
  key: string;
  header: string;
  /** Right-align + monospaced tabular figures for number columns. */
  numeric?: boolean;
  /** Custom cell renderer; defaults to String(row[key]). */
  render?: (row: T) => ReactNode;
}

interface SmTableProps<T> {
  label: string;
  title: string;
  columns: SmColumn<T>[];
  rows: T[];
  foot?: ReactNode;
  /** Optional right-aligned note in the header strip. */
  headNote?: string;
}

export default function SmTable<T>({
  label,
  title,
  columns,
  rows,
  foot,
  headNote,
}: SmTableProps<T>) {
  return (
    <div className="sm-ref">
      <div className="sm-ref-head">
        <span className="label">{label}</span>
        {headNote && <span className="label dim">{headNote}</span>}
      </div>
      <div className="sm-ref-title">{title}</div>
      <table className="sm-ref-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.numeric ? "num" : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className={c.numeric ? "num" : undefined}>
                  {c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {foot && <div className="sm-ref-foot">{foot}</div>}
    </div>
  );
}
