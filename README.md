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

The site is served at root (`/`) — no subpath base config required.

## Deploy

Hosted on **AWS Amplify Hosting**. Amplify watches the `main` branch and
runs `amplify.yml` on every push: `npm ci` → `npm run build` → publish
`dist/`.

One-time AWS Console setup (per environment):

1. **Amplify Console → Create app → Host web app** → connect this GitHub
   repo, branch `main`. Amplify auto-detects `amplify.yml`.
2. **App settings → Rewrites and redirects** → add the SPA fallback so
   client-side routes resolve:
   - **Source**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|webmanifest)$)([^.]+$)/>`
   - **Target**: `/index.html`
   - **Type**: `200 (Rewrite)`
3. *(Optional)* **App settings → Environment variables** → set
   `VITE_MANIFEST_URL` if pointing at a non-default bucket. Unset is
   fine — the fallback in `src/api/manifest.ts` points at the
   production manifest.
4. *(Optional)* **App settings → Domain management** → attach a custom
   domain. Amplify provisions the ACM cert.

**S3 CORS**: the `mainsail-public-data` bucket must allow GETs from the
Amplify app's origin (the `*.amplifyapp.com` URL plus any custom
domain). Update the bucket CORS policy in the data repo / S3 console
when the Amplify URL is live.

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
├── amplify.yml            ← Amplify Hosting build spec
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
