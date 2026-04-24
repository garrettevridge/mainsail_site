import type { ReactNode } from "react";

interface PillProps {
  kind?: "fed" | "st" | "int";
  children: ReactNode;
}

export default function Pill({ kind, children }: PillProps) {
  return <span className={"pill" + (kind ? " " + kind : "")}>{children}</span>;
}
