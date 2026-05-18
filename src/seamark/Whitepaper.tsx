import { useEffect, useRef, useState } from "react";
import { useManifest } from "../api/manifest";
import Intro from "./sections/Intro";
import Scale from "./sections/Scale";
import Limits from "./sections/Limits";
import BycatchOverview from "./sections/BycatchOverview";
import Chinook from "./sections/Chinook";
import Chum from "./sections/Chum";
import WesternAlaska from "./sections/WesternAlaska";
import Halibut from "./sections/Halibut";
import Discards from "./sections/Discards";
import {
  OtherFisheries,
  Observers,
  Climate,
  Habitat,
  Closing,
} from "./sections/Placeholders";

const TOC_ITEMS: { id: string; label: string; sub?: boolean }[] = [
  { id: "hero", label: "Cover" },
  { id: "intro", label: "00 · Introduction" },
  { id: "scale", label: "01 · Scale" },
  { id: "limits", label: "02 · Biomass & limits" },
  { id: "bycatch-overview", label: "03 · Bycatch" },
  { id: "chinook", label: "Chinook", sub: true },
  { id: "chum", label: "Chum", sub: true },
  { id: "western-alaska", label: "Western AK salmon", sub: true },
  { id: "halibut", label: "Halibut", sub: true },
  { id: "other-bycatch", label: "Other fisheries", sub: true },
  { id: "discards", label: "04 · Discards & DMRs" },
  { id: "observers", label: "05 · Observer coverage" },
  { id: "climate", label: "06 · Climate & ocean" },
  { id: "habitat", label: "07 · Habitat impact" },
  { id: "closing", label: "Closing" },
];

export default function Whitepaper() {
  const [active, setActive] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const { data: manifest } = useManifest();

  useEffect(() => {
    const ids = TOC_ITEMS.map((t) => t.id);
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const y = window.scrollY + 140;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) current = id;
      }
      setActive(current);
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
      <nav className={`sm-topnav ${scrolled ? "scrolled" : ""}`} ref={navRef}>
        <span className="brand">SEAMARK</span>
        <div className="right">
          <a href="#intro">Contents</a>
          <a
            href="https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            Data
          </a>
          <a href="#closing">Methodology</a>
          <a href="#closing">Download</a>
        </div>
      </nav>

      <div className="sm-layout">
        <main className="sm-paper">
          <header className="sm-hero" id="hero">
            <div>
              <div className="sm-hero-meta">
                <span className="marker">VOL 01</span>
                <span>Seamark Whitepaper / 2026</span>
                <span>~25 min read · interactive</span>
              </div>

              <h1 className="sm-hero-title">
                Alaska's<br />
                fisheries,<br />
                <span className="accent">by the data.</span>
              </h1>

              <div className="sm-hero-deck">
                A century of commercial fishing in Alaska, and what the best
                available data actually says about the contested topics of
                2026.
              </div>
            </div>

            <div className="sm-hero-foot">
              <span>Seamark Holdings, Anchorage</span>
              <span className="cue">Scroll</span>
            </div>
          </header>

          <Intro />
          <Scale />
          <Limits />

          <div className="sm-pull">
            <div className="sm-pull-text">
              Bycatch is a reality of <span className="accent">every fishery.</span>
              <br />
              The data is uneven.
            </div>
            <div className="sm-pull-attr">Section 3 · Bycatch</div>
          </div>

          <BycatchOverview />
          <Chinook />
          <Chum />
          <WesternAlaska />
          <Halibut />
          <OtherFisheries />
          <Discards />
          <Observers />
          <Climate />
          <Habitat />
          <Closing />
        </main>

        <aside className="sm-toc">
          <div className="sm-toc-label">Contents</div>
          <nav>
            {TOC_ITEMS.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`${t.sub ? "sub " : ""}${active === t.id ? "active" : ""}`}
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
          <div style={{ marginTop: 8, color: "var(--ink-3)" }}>
            Data published <span className="mono">{generated}</span>
          </div>
        )}
        <div className="meta">
          <a href="#closing">Methodology</a>
          <a
            href="https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            Source data
          </a>
          <a href="#closing">API</a>
          <a href="#closing">Contact</a>
        </div>
      </footer>
    </>
  );
}
