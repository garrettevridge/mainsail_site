import type { ReactNode } from "react";

export interface KVPair {
  dt: string;
  dd: ReactNode;
}

interface KVProps {
  pairs: KVPair[];
}

export default function KV({ pairs }: KVProps) {
  return (
    <dl className="kv">
      {pairs.map((p, i) => (
        <span key={i} style={{ display: "contents" }}>
          <dt>{p.dt}</dt>
          <dd>{p.dd}</dd>
        </span>
      ))}
    </dl>
  );
}
