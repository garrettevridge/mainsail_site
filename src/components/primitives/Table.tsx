import type { ReactNode } from "react";

export interface TableColumn {
  label: string;
  num?: boolean;
  yr?: boolean;
}

export type TableCell = string | number | ReactNode;

interface TableProps {
  columns: TableColumn[];
  rows: TableCell[][];
  foot?: TableCell[];
  caption?: string;
}

function cellClass(col: TableColumn): string {
  const parts: string[] = [];
  if (col.num) parts.push("num");
  if (col.yr) parts.push("yr");
  return parts.join(" ");
}

export default function Table({ columns, rows, foot, caption }: TableProps) {
  return (
    <>
      <table className="data">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} className={c.num ? "num" : undefined}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => {
                const cls = cellClass(columns[ci] ?? { label: "" });
                return <td key={ci} className={cls || undefined}>{cell}</td>;
              })}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr>
              {foot.map((cell, ci) => {
                const cls = cellClass(columns[ci] ?? { label: "" });
                return <td key={ci} className={cls || undefined}>{cell}</td>;
              })}
            </tr>
          </tfoot>
        )}
      </table>
      {caption && <div className="data-caption">{caption}</div>}
    </>
  );
}
