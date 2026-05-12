import { Outlet } from "react-router-dom";
import { useManifest } from "../api/manifest";
import TopNav from "./primitives/TopNav";

export default function Layout() {
  const { data: manifest } = useManifest();

  return (
    <div className="min-h-screen">
      <TopNav generatedAt={manifest?.generated_at ?? null} />
      <main
        style={{
          padding: "40px 32px 96px",
          maxWidth: "var(--col-max)",
          margin: "0 auto",
        }}
      >
        <Outlet />
      </main>
      <footer
        style={{
          borderTop: "1px solid var(--rule)",
          padding: "24px 32px 40px",
          maxWidth: "var(--col-max)",
          margin: "0 auto",
          fontFamily: "var(--font-serif)",
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.55,
        }}
      >
        Figures sourced from NMFS, ADF&amp;G, IPHC, NPFMC, AFSC, FAO and BLS
        publications. Real-dollar values use a pinned base year of 2025.
        Country names use UN short-name designations.
      </footer>
    </div>
  );
}
