# Changelog

## 2026-04-29 — SPA deep-link support on GitHub Pages

Added a `public/404.html` fallback and a small history-rewrite snippet
in `index.html` so direct navigation to deep links such as
`/mainsail_site/topics/halibut` resolves correctly. Previously the
SPA only worked from the root because GitHub Pages serves static files
and 404s on any path that doesn't exist on disk; the new fallback
captures the path, redirects to `/mainsail_site/?/<path>`, and the
snippet rewrites history before React mounts. URLs stay clean and the
in-app `NotFound` route now handles unknown deep links instead of
GitHub's stock 404. Technique:
https://github.com/rafgraph/spa-github-pages.
