import { Outlet } from "react-router-dom";
import { useManifest } from "../api/manifest";
import Sidebar from "./primitives/Sidebar";
import { TOPICS } from "../topics/registry";

export default function Layout() {
  const { data: manifest } = useManifest();

  return (
    <div
      className="min-h-screen grid"
      style={{ gridTemplateColumns: "260px 1fr" }}
    >
      <Sidebar topics={TOPICS} generatedAt={manifest?.generated_at ?? null} />

      <main
        style={{ padding: "48px 64px 96px", maxWidth: "var(--col-max)" }}
      >
        <Outlet />
      </main>
    </div>
  );
}
