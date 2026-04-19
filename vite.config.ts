import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When deploying to GitHub Pages under a repo subpath (e.g.
// https://<org>.github.io/mainsail_site/), BASE needs to be set so
// asset URLs and the router basename resolve correctly.
//
// Locally we run at "/" (root). CI sets VITE_BASE to "/mainsail_site/".

const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
});
