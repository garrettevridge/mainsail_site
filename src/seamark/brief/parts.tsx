import type { ReactNode } from "react";

// Compact number: 1.0M / 49k / 4.0k / 880.
export const k = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 10000 ? `${Math.round(v / 1000)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v).toLocaleString();

type Variant = "plain" | "div" | "alt";

export function Section({
  id, num, cat, title, dek, children,
}: { id: string; num: string; cat: string; title: string; dek: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="br-section">
      <div className="br-section-head br-wrap">
        <div className="col">
          <div className="br-eyebrow">
            <span className="num">{num}</span>
            <span className="tick" />
            <span className="cat">{cat}</span>
          </div>
          <h2>{title}</h2>
          <p className="br-dek">{dek}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function Block({
  variant = "plain", label, title, caption, note, children,
}: { variant?: Variant; label: string; title: ReactNode; caption?: ReactNode; note?: ReactNode; children?: ReactNode }) {
  const cls = variant === "alt" ? "br-block alt" : variant === "div" ? "br-block div" : "br-block";
  return (
    <div className={cls}>
      <div className="br-wrap">
        <div className="br-block-head">
          <span className="sq" />
          <span className="label">{label}</span>
        </div>
        <h3>{title}</h3>
        {caption != null && <p className="br-block-cap">{caption}</p>}
        {children}
        {note != null && <p className="br-block-note">{note}</p>}
      </div>
    </div>
  );
}

export type Seg = { w: number; color: string; pct?: string; textColor?: string; name: string; val?: string };

export function Magbar({ segs, inlinePct }: { segs: Seg[]; inlinePct?: boolean }) {
  return (
    <div className="br-chart">
      <div className="br-magbar">
        {segs.map((s) => (
          <span key={s.name} style={{ width: `${s.w}%`, background: s.color }}>
            {inlinePct && s.pct && s.w > 6 ? <b style={{ color: s.textColor ?? "#fff" }}>{s.pct}</b> : null}
          </span>
        ))}
      </div>
      <div className="br-legend">
        {segs.map((s) => (
          <span className="item" key={s.name}>
            <span className="sw" style={{ background: s.color }} />
            <span className="name">{s.name}</span>
            {s.val != null && <span className="val">{s.val}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LegendLines({ items }: { items: { color: string; name: string }[] }) {
  return (
    <div className="br-legend" style={{ marginTop: 18 }}>
      {items.map((it) => (
        <span className="item" key={it.name}>
          <span className="line" style={{ background: it.color }} />
          <span className="name">{it.name}</span>
        </span>
      ))}
    </div>
  );
}

export type SquareData = { px: number; color: string; val: string; lbl: string; sub: string };

export function Squares({ a, b }: { a: SquareData; b: SquareData }) {
  return (
    <div className="br-squares">
      {[a, b].map((s, i) => (
        <figure className="br-square" key={i}>
          <div className="box" style={{ width: s.px, height: s.px, background: s.color }} />
          <figcaption>
            <div className="val">{s.val}</div>
            <div className="lbl">{s.lbl}</div>
            <div className="sub">{s.sub}</div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function GearBars({ rows, max }: { rows: { gear: string; val: string; w: number }[]; max: number }) {
  return (
    <div className="br-gear">
      {rows.map((g) => (
        <div className="row" key={g.gear}>
          <div className="head">
            <span className="gear">{g.gear}</span>
            <span className="val">{g.val}</span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${Math.max(2, (g.w / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Source({ children }: { children: ReactNode }) {
  return <div className="br-source">{children}</div>;
}

export function Notes({ items }: { items: { label: string; body: ReactNode }[] }) {
  return (
    <div className="br-notes">
      <div className="br-wrap">
        <div className="br-notes-grid">
          {items.map((n) => (
            <div className="br-note" key={n.label}>
              <div className="label">{n.label}</div>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// A single wide note (halibut/observer use one full-width note before methodology).
export function WideNote({ label, body }: { label: string; body: ReactNode }) {
  return (
    <div className="br-notes" style={{ paddingBottom: 0 }}>
      <div className="br-wrap">
        <div className="br-note">
          <div className="label">{label}</div>
          <p>{body}</p>
        </div>
      </div>
    </div>
  );
}

export function Methodology({ items }: { items: { strong: string; body: ReactNode }[] }) {
  return (
    <div className="br-method">
      <div className="br-method-inner br-wrap">
        <div className="mlabel">Data sources &amp; methodology</div>
        <div className="br-method-grid">
          {items.map((m) => (
            <p key={m.strong}>
              <b>{m.strong}</b> {m.body}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UpNext({ label, title, arrow = "→", onClick }: { label: string; title: string; arrow?: string; onClick: () => void }) {
  return (
    <button className="br-upnext" onClick={onClick}>
      <div className="br-upnext-inner br-wrap">
        <div>
          <div className="ulabel">{label}</div>
          <div className="utitle">{title}</div>
        </div>
        <span className="arrow">{arrow}</span>
      </div>
    </button>
  );
}
