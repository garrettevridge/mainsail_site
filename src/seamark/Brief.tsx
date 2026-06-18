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
          <h1>The numbers behind Alaska's fisheries debates.</h1>
          <p className="br-hero-dek">
            A series of self-contained data briefs relevant to the current conversation about catch and bycatch in Alaska's federal fisheries. Each topic stands on its own: read one, or scroll the whole thing.
          </p>
        </div>

      </section>

      <ChinookSection />
      <ChumSection />
      <HalibutSection />
      <DiscardSection />
      <ObserverSection />

      <footer className="br-footer">
        <div className="br-footer-inner br-wrap">
          <span className="mark">MAINSAIL</span>
          <span className="meta">An independent data brief · Sources NMFS, ADF&amp;G, NOAA AFSC</span>
        </div>
      </footer>
    </div>
  );
}
