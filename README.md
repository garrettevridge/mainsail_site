# Mainsail Site

Public-facing frontend for Project Mainsail. A scrollable page of
stories that render Alaska fisheries data published by the companion
data-pipeline repo (`mainsail_data`) to S3.

## Architecture

```
mainsail_data (separate repo) ─► S3 bucket ─► mainsail_site (this repo)
    │                                 │                │
    adapters + publish               manifest.json     fetches manifest,
                                     v1/*.json         renders stories +
                                     v1/*.parquet      charts
                                     v1/*.schema.json
```

This repo has **no dependency on the data repo** beyond the S3
contract. It reads `manifest.json` at runtime and fetches the
datasets it needs. When the data pipeline updates its publish,
the site picks up the new data on the next page load.

## Stack

- Vite + React 19 + TypeScript (strict)
- React Router v7 (multi-page)
- Recharts for visualizations
- SWR for manifest + dataset fetching with cache
- Tailwind CSS for styling

## Design philosophy

See [DESIGN_PHILOSOPHY.md in the data repo](https://github.com/garrettevridge/mainsail_data/blob/main/docs/DESIGN_PHILOSOPHY.md)
for the binding design principles: neutral presentation, no
causation claims, every number cited to an agency publication,
methodology notes as part of every story.

## Stories (Phase 1)

- `/stories/chinook`  — Chinook total removals and escapement
- `/stories/halibut`  — Pacific halibut mortality by source (IPHC ledger)
- `/stories/discards` — Federal groundfish retained vs discarded
- `/stories/observer` — Observer coverage rates 2013-present

Each story outline is in
[`mainsail_data/docs/stories/`](https://github.com/garrettevridge/mainsail_data/tree/main/docs/stories).

## Getting started

```bash
git clone git@github.com:<org>/mainsail_site.git
cd mainsail_site
npm install
npm run dev
# → http://localhost:5173
```

Local dev fetches the production S3 manifest by default
(`https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json`),
so `npm run dev` works against real data with no env setup. To point
at a different bucket / staging artifact, set `VITE_MANIFEST_URL`:

```bash
VITE_MANIFEST_URL=https://example/manifest.json npm run dev
```

## Build

```bash
npm run build     # → dist/
npm run preview   # serves dist/ at http://localhost:4173
```

For GitHub Pages deploy under a repo subpath, set `VITE_BASE`:

```bash
VITE_BASE=/mainsail_site/ npm run build
```

## Deploy

CI deploys to GitHub Pages on every push to `main`. The workflow is
at `.github/workflows/deploy.yml`. Configure two repo settings:

- **Settings → Pages → Source**: "GitHub Actions"
- **Settings → Secrets and variables → Actions → Variables**: add
  `VITE_MANIFEST_URL = https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json`.
  If unset, the source default in `src/api/manifest.ts` points at the
  same production URL, so the build still works.

## Repository layout

```
mainsail_site/
├── README.md
├── CLAUDE.md              ← design + coding protocol
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .github/workflows/
│   └── deploy.yml         ← GitHub Pages CI
├── public/                ← static assets (favicon, icons)
└── src/
    ├── main.tsx
    ├── App.tsx            ← router
    ├── index.css          ← Tailwind + Mainsail theme
    ├── api/
    │   ├── types.ts       ← row shapes mirroring S3 contract
    │   └── manifest.ts    ← SWR-based manifest + dataset client
    ├── components/
    │   ├── Layout.tsx     ← header + nav + footer
    │   └── charts/        ← MortalityBar, StackedTrend, LineWithBand, SourcePie
    └── pages/
        ├── Home.tsx
        ├── StoryChinook.tsx
        ├── StoryHalibut.tsx
        ├── StoryDiscards.tsx
        ├── StoryObserver.tsx
        └── NotFound.tsx
```

## License

Code: MIT (or whatever Mainsail project license is chosen).

Data displayed is public agency data; cite original agencies when
reusing.
