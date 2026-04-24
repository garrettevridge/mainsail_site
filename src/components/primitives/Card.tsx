import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  sub?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, sub, children, className }: CardProps) {
  return (
    <div className={"card" + (className ? " " + className : "")}>
      {title && <div className="card-title">{title}</div>}
      {sub && <div className="card-sub">{sub}</div>}
      {children}
    </div>
  );
}
