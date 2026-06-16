import { useEffect, useState, type ReactNode } from "react";
import ChinookSlide from "./slides/ChinookSlide";
import ChumSlide from "./slides/ChumSlide";
import HalibutSlide from "./slides/HalibutSlide";
import ObserverSlide from "./slides/ObserverSlide";

// Paginated brief deck: one comprehensive, scrollable card per topic, arrow-
// navigated. Mobile-friendly.

const SLIDES: { id: string; node: ReactNode }[] = [
  { id: "chinook", node: <ChinookSlide /> },
  { id: "chum", node: <ChumSlide /> },
  { id: "halibut", node: <HalibutSlide /> },
  { id: "observer", node: <ObserverSlide /> },
];

export default function Deck() {
  const [i, setI] = useState(0);
  const go = (n: number) => setI((p) => Math.min(SLIDES.length - 1, Math.max(0, p + n)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    // Recharts ResponsiveContainer can measure 0 width above the fold on
    // mount; nudge a re-measure once layout has settled.
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
    return () => clearTimeout(t);
  }, [i]);

  return (
    <>
      <nav className="sm-topnav scrolled">
        <a href="#" className="brand">SEAMARK</a>
        <div className="right">
          <a
            href="https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            Data
          </a>
        </div>
      </nav>

      <div className="sm-deck">
        {SLIDES[i].node}

        <div className="sm-deck-nav">
          <button onClick={() => go(-1)} disabled={i === 0}>← Previous</button>
          <div className="sm-deck-dots">
            {SLIDES.map((s, n) => (
              <i key={s.id} className={n === i ? "on" : ""} />
            ))}
          </div>
          <button onClick={() => go(1)} disabled={i === SLIDES.length - 1}>Next →</button>
        </div>
      </div>
    </>
  );
}
