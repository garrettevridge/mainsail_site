import { useEffect, useState } from "react";
import { useManifest } from "../api/manifest";
import BycatchOverview from "./sections/BycatchOverview";
import Chinook from "./sections/Chinook";
import Chum from "./sections/Chum";
import Halibut from "./sections/Halibut";
import WesternAlaska from "./sections/WesternAlaska";
import Discards from "./sections/Discards";
import Limits from "./sections/Limits";
import { Observers } from "./sections/Placeholders";

// Single scrollable data page: every dataset, organized by category, charts
// first. A sticky table of contents jumps between categories and sub-sections.

const TOC: { id: string; label: string; cat?: boolean }[] = [
  { id: "cat-bycatch", label: "1 · Bycatch", cat: true },
  { id: "bycatch-overview", label: "Total & by source" },
  { id: "chinook", label: "Chinook bycatch" },
  { id: "chum", label: "Chum bycatch" },
  { id: "halibut", label: "Halibut" },
  { id: "cat-salmon", label: "2 · Salmon removals & escapement", cat: true },
  { id: "western-alaska", label: "Escapement by drainage" },
  { id: "cat-discards", label: "3 · Discards & mortality", cat: true },
  { id: "discards", label: "Discards by fleet · DMRs" },
  { id: "cat-observer", label: "4 · Observer coverage", cat: true },
  { id: "observers", label: "Coverage by fleet" },
  { id: "cat-limits", label: "5 · Federal harvest limits", cat: true },
  { id: "limits", label: "TAC · biomass · harvest" },
];

function CatDivider({ id, n, label }: { id: string; n: string; label: string }) {
  return (
    <div className="sm-pull" id={id}>
      <div className="sm-pull-text">{label}</div>
      <div className="sm-pull-attr">{n}</div>
    </div>
  );
}

export default function DataPage() {
  const [active, setActive] = useState(TOC[0].id);
  const { data: manifest } = useManifest();

  useEffect(() => {
    const ids = TOC.map((t) => t.id);
    const onScroll = () => {
      const y = window.scrollY + 160;
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) cur = id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const generated = manifest?.generated_at
    ? new Date(manifest.generated_at).toISOString().slice(0, 10)
    : null;

  return (
    <>
      <nav className="sm-topnav scrolled">
        <a href="#top" className="brand">SEAMARK</a>
        <div className="right">
          <a href="#cat-bycatch">Bycatch</a>
          <a
            href="https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            Data
          </a>
        </div>
      </nav>

      <header className="sm-hero" id="top">
        <div>
          <div className="sm-hero-meta">
            <span className="marker">VOL 01</span>
            <span>Seamark — Alaska fisheries data</span>
            {generated && <span>Data published {generated}</span>}
          </div>
          <h1 className="sm-hero-title">
            Alaska's<br />
            fisheries,<br />
            <span className="accent">by the data.</span>
          </h1>
          <div className="sm-hero-deck">
            The best available data on bycatch, removals, discards, observer
            coverage, and harvest limits — organized by topic, drawn from public
            sources.
          </div>
        </div>
        <div className="sm-hero-foot">
          <span>Seamark Holdings, Anchorage</span>
          <span className="cue">Scroll</span>
        </div>
      </header>

      <div className="sm-layout">
        <main className="sm-paper">
          <CatDivider id="cat-bycatch" n="Section 1" label="Bycatch" />
          <BycatchOverview />
          <Chinook />
          <Chum />
          <Halibut />

          <CatDivider id="cat-salmon" n="Section 2" label="Salmon removals & escapement" />
          <WesternAlaska />

          <CatDivider id="cat-discards" n="Section 3" label="Discards & mortality" />
          <Discards />

          <CatDivider id="cat-observer" n="Section 4" label="Observer coverage" />
          <Observers />

          <CatDivider id="cat-limits" n="Section 5" label="Federal harvest limits" />
          <Limits />
        </main>

        <aside className="sm-toc">
          <div className="sm-toc-label">Contents</div>
          <nav>
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`${t.cat ? "" : "sub "}${active === t.id ? "active" : ""}`}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </aside>
      </div>

      <footer className="sm-footer">
        <span className="brand">SEAMARK</span>
        Seamark Holdings, LLC · Anchorage, Alaska · 2026
        {generated && (
          <div className="footer-meta-line">
            Data published <span className="mono">{generated}</span>
          </div>
        )}
      </footer>
    </>
  );
}
