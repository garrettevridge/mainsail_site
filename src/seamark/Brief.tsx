import { useEffect, useState } from "react";
import ChinookSection from "./brief/ChinookSection";
import ChumSection from "./brief/ChumSection";
import HalibutSection from "./brief/HalibutSection";
import DiscardSection from "./brief/DiscardSection";
import ObserverSection from "./brief/ObserverSection";

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "chinook", label: "Chinook", tag: "01" },
  { id: "chum", label: "Chum", tag: "02" },
  { id: "halibut", label: "Halibut", tag: "03" },
  { id: "discards", label: "Discards", tag: "04" },
  { id: "observer", label: "Observer", tag: "05" },
];

const TOPICS = [
  { id: "chinook", num: "01", title: "Chinook salmon", blurb: "Where the bycatch comes from, and what it costs the rivers." },
  { id: "chum", num: "02", title: "Chum salmon", blurb: "Mostly hatchery fish from across the Pacific — not Alaska's runs." },
  { id: "halibut", num: "03", title: "Pacific halibut", blurb: "Tonnes of dead fish, and which gear actually takes them." },
  { id: "discards", num: "04", title: "Discards", blurb: "What gets thrown back, why, and which fleets do it." },
  { id: "observer", num: "05", title: "Observer coverage", blurb: "How we know any of these numbers at all." },
];

export default function Brief() {
  const [progress, setProgress] = useState("0%");
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const onScroll = () => {
      const d = document.documentElement;
      const max = d.scrollHeight - d.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, d.scrollTop / max)) : 0;
      const top = d.scrollTop + 120;
      let act = "overview";
      for (const { id } of NAV) {
        const el = document.getElementById(id);
        if (el && top >= el.offsetTop) act = id;
      }
      setProgress((p * 100).toFixed(1) + "%");
      setActive(act);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
  };

  return (
    <div className="br">
      {/* NAV */}
      <header className="br-nav">
        <div className="br-nav-inner br-wrap">
          <div className="br-wordmark" onClick={() => goTo("overview")}>
            <b>MAINSAIL</b>
            <span>Data Brief</span>
          </div>
          <nav className="br-navlinks">
            {NAV.map((n) => (
              <button key={n.id} className={`br-navlink${active === n.id ? " active" : ""}`} onClick={() => goTo(n.id)}>
                {n.label}
                {n.tag && <span className="tag">{n.tag}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div className="br-progress">
          <div style={{ width: progress }} />
        </div>
      </header>

      {/* HERO */}
      <section id="overview" className="br-hero br-wrap">
        <div className="br-hero-col">
          <div className="br-kicker">Alaska Fisheries · 2026 Edition</div>
          <h1>The numbers behind Alaska's catch and bycatch debate.</h1>
          <p className="br-hero-dek">
            A series of self-contained data briefs relevant to the current conversation about catch and bycatch in Alaska's federal fisheries. Each topic stands on its own: read one, or scroll the whole thing.
          </p>
          <div className="br-hero-meta">
            <span>Sources · NMFS · ADF&amp;G · NOAA AFSC</span>
            <span className="dot" />
            <span>Updated through 2026</span>
          </div>
        </div>

        <div className="br-toc">
          <div className="br-toc-label">In this brief — five topics</div>
          <div className="br-toc-grid">
            {TOPICS.map((t) => (
              <button key={t.id} className="br-toc-card" onClick={() => goTo(t.id)}>
                <div className="row">
                  <span className="num">{t.num}</span>
                  <span className="status">Built</span>
                </div>
                <h3>{t.title}</h3>
                <p className="blurb">{t.blurb}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <ChinookSection onNext={() => goTo("chum")} />
      <ChumSection onNext={() => goTo("halibut")} />
      <HalibutSection onNext={() => goTo("discards")} />
      <DiscardSection onNext={() => goTo("observer")} />
      <ObserverSection onTop={() => goTo("overview")} />

      <footer className="br-footer">
        <div className="br-footer-inner br-wrap">
          <span className="mark">MAINSAIL</span>
          <span className="meta">An independent data brief · Sources NMFS, ADF&amp;G, NOAA AFSC</span>
        </div>
      </footer>
    </div>
  );
}
