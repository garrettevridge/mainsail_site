import type { ReactNode } from "react";

// A small supporting box that sits beside the body narrative — used to explain
// a mechanism (observer coverage, discard mortality rates) without giving it a
// full section. Mention the thing in the prose, then drop one of these nearby
// with the key facts or a compact table.

interface SmCalloutProps {
  label: string;
  title?: string;
  children: ReactNode;
}

export default function SmCallout({ label, title, children }: SmCalloutProps) {
  return (
    <aside className="sm-callout">
      <div className="sm-callout-label">{label}</div>
      {title && <div className="sm-callout-title">{title}</div>}
      <div className="sm-callout-body">{children}</div>
    </aside>
  );
}
