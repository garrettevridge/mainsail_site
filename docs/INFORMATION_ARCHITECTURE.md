# Mainsail Site — Information Architecture (2026-05-12 pivot)

## What changed

The site is being rebroadened from a small set of deep, single-topic
data stories (Chinook, Chum, Halibut, Discards, Observer, Biomass,
Fisheries Management) into a layered "economic 101 of Alaska
fisheries" walkthrough aimed at a general Alaskan audience.

This is **the** Mainsail site — the previous idea of building the
broadened front-end in Webflow and keeping this repo as an internal
tool has been dropped. Everything ships here.

The existing deep pages (Chinook, Chum, Halibut, Observer, Biomass)
are retained as second-level / deeper-dive content under the new
top-level sections. Discards moves from its own page into a section
of the Harvest page.

## Audience

Alaskans with little prior exposure to Alaska commercial fisheries.
Warm but realistic — the industry is mature, globally significant, and
carries 150 years of economic and cultural weight. Avoid jargon
without inline definition. Avoid advocacy framing in either direction.

## Editorial decisions logged in this pivot

- **Real-dollar base year is pinned** (initially 2025). The whole site
  uses one base year so figures don't shift under the reader on every
  data refresh. Re-pin roughly every 5 years; document the change in
  CHANGELOG when re-pinned.
- **Top-20 ports**: filter to Alaska ports and footnote their national
  rank, rather than showing all 20 US ports.
- **Bycatch vs. biomass framing**: use bycatch ÷ counted escapement as
  the context number for Chinook (already shown). Do not attempt to
  reconstruct a "total run size" denominator that would require
  modeling assumptions the source agencies don't publish.
- **"Active vessels / processors"**: use the sum of CFEC commercial
  vessel registrations and NMFS processor counts. Document overlap
  between the two registries in a footnote on the landing page.
- **Domestic market**: largely qualitative due to data limitations.
  Use NMFS Fisheries of the US per-capita consumption, ASMI marketing
  reports (flag industry source), and trade-press references where
  needed. State product-specific claims (e.g. "king crab is primarily
  a domestic product") only when sourced.
- **Country names**: existing CLAUDE.md rule applies — UN short-name
  designations in all dataset values, page copy, table cells.

## Visual direction

- **Reference:** NYT quantitative section (Upshot / The Daily 202 data
  pieces), slightly denser. Information-rich, not airy. Modest
  whitespace, generous use of small-multiples and dense tables.
- **Typography:**
  - Headers / titles / display copy → **serif** (currently Source
    Serif 4, already wired in `tailwind.config.js`).
  - Narrative body, table cells, chart axes/labels/legends →
    **sans-serif** (Inter, already wired).
  - Number cells → monospaced tabular figures (already wired via
    `font-mono` + `tabular-nums`).
- **Landing page layout:** Top-level sections (Communities, Harvest,
  Markets, Management, Bycatch) render as a **horizontal row of
  buttons** on the landing page — not a vertical list. The existing
  left sidebar (numbered vertical list of deep topics) can remain on
  interior pages, but the landing page leads with the horizontal
  section row above the hero narrative.

## URL structure

URL slugs are technical identifiers, not editorial. We keep
existing `/topics/{chinook,chum,halibut,biomass,observer}` deep-page
paths as-is to avoid breaking inbound links. New top-level pages get
short paths: `/communities`, `/harvest`, `/markets`, `/management`,
`/bycatch`. The landing page is `/`.

## Top-level information architecture

```
/                       Landing
/communities            Communities
/harvest                Harvest          (Discards lives inside here)
/markets                Markets
/management             Fisheries management
/bycatch                Bycatch          (parent page; links to chinook/chum/halibut)
/topics/chinook         Chinook mortality & genetics       (kept)
/topics/chum            Chum mortality & genetics          (kept)
/topics/halibut         Halibut mortality by source        (kept)
/topics/biomass         Biomass, TAC & ABC                 (kept; linked from /management)
/topics/observer        Observer coverage                  (kept; linked from /management)
```

## Page-by-page matrix

### Landing — `/`

**Takeaway:** Alaska seafood is a 150-year-old industry that is
mature, diverse, and globally significant.

| Element | Source | Status |
|---|---|---|
| Historical intro (150 yr arc, pre-contact ecosystems → commercial era) | Prose | Author |
| Modern stat strip: active processors, active vessels, statewide ex-vessel $ (real), first-wholesale $, total lbs, # communities, # commercial permits | CFEC + NMFS rollups | **Data: new ingest** |
| Hero chart: statewide ex-vessel value, real $, long series | NMFS commercial landings | **Data: new ingest** |
| Topic nav tiles | — | Author |

### Communities — `/communities`

**Takeaway:** Alaska is a global fishing powerhouse; a handful of small
towns drive an outsized share of US seafood.

| Element | Source | Status |
|---|---|---|
| World wild-capture ranking, top ~15 countries with Alaska shown as a peer bar | FAO FishStat capture production | **Data: new ingest** |
| Top 20 US ports — Alaska ports only, national rank footnoted, by ex-vessel value | NMFS "Fisheries of the United States" port tables | **Data: new ingest** |
| Top 20 US ports — Alaska ports only, by volume | Same | **Data: new ingest** |
| AK community detail: ex-vessel + first-wholesale, latest year, 10-yr sparkline | NMFS + ADF&G COAR | **Data: new ingest** |
| Region vs. community framing note (Bristol Bay / PWS / Southeast are regions, not communities) | Prose | Author |

### Harvest — `/harvest`

**Takeaway:** Alaska's harvest is diverse (100+ species), significant,
and structurally unlike most fisheries.

| Element | Source | Status |
|---|---|---|
| Statewide harvest volume, long series | NMFS | **Data: new ingest** |
| Statewide value (ex-vessel + first-wholesale together), real $, long series | NMFS + processor reports | **Data: new ingest** |
| Species mix pie — volume, 7 buckets: Pollock / Salmon / Halibut / Sablefish / Crab / Flatfish / Other | NMFS | **Data: new ingest** |
| Species mix pie — first-wholesale value, same 7 buckets | NMFS | **Data: new ingest** |
| Regional breakout: BSAI, Bristol Bay, Kodiak, PWS, Southeast, AYK, Westward — volume & value | NMFS / ADF&G area rollups | **Data: new ingest** |
| Sport & subsistence sidebar — small bar of commercial vs. sport vs. subsistence | `sport_harvest`, `subsistence_harvest_statewide` (existing) + new commercial total | **Partial** |
| Discards & utilization (sub-section) | `discard_mortality_rate` (existing) | **Build: move from existing page** |

### Markets — `/markets`

**Takeaway:** Most Alaska seafood leaves the state — here is where it
goes and what it becomes.

| Element | Source | Status |
|---|---|---|
| Export vs. domestic share, stacked area, last 10–15 yr, value & volume | NMFS Foreign Trade | **Data: new ingest** |
| Top 10 export products by value | NMFS Foreign Trade | **Data: new ingest** |
| Top 10 export products by volume | NMFS Foreign Trade | **Data: new ingest** |
| Volume–value scatter, top 25 products | Derived | Build |
| Top destination countries, by value, UN short names | NMFS Foreign Trade | **Data: new ingest** |
| Domestic market (qualitative) — sockeye national retail, pollock to QSR / fast-casual, king crab claim TBD, etc. | NMFS Fisheries of US + ASMI + trade press | Author + cite |
| Alaska local market — small in $, central in food security; subsistence + personal-use + local retail | Prose + `subsistence_harvest_statewide` | Author |

### Fisheries management — `/management`

**Takeaway:** Two bodies (NPFMC federally, BOF at the state) make the
rules — here's the makeup, cadence, and authority of each.

| Element | Source | Status |
|---|---|---|
| NPFMC card: 11 voting members, ~5 meetings/yr, MSA authority, jurisdiction, mini process diagram | NPFMC.org | Author |
| BOF card: 7 members, ~6 meetings/yr on rotating area cycle, state authority | ADF&G | Author |
| Treaty / cross-jurisdiction strip: IPHC, Pacific Salmon Treaty, NPAFC | Existing FM page content | Reuse |
| Science process: NMFS stock assessment cycle, ADF&G in-season management, SSC review | Prose | Author |
| Observer coverage summary + deep link to existing observer page | `monitored_catch` (existing) | Reuse |
| Biomass / TAC link to existing Biomass page | Existing | Reuse |

### Bycatch — `/bycatch`

**Takeaway:** Three species (Chinook, chum, halibut) drive most of the
bycatch conversation — volume, who took it, biomass context, and
(for salmon) where the fish came from.

| Element | Source | Status |
|---|---|---|
| Parent-page summary of the three species with deep-link cards | — | Author |
| Chinook — mortality by source, GSI, vs. counted escapement | `psc_annual_historical`, `salmon_commercial_harvest`, `subsistence_harvest_statewide`, `sport_harvest`, `chinook_gsi`, `salmon_escapement` (all existing) | Reuse |
| Chum — mortality by source, GSI | `psc_*`, `chum_gsi` (existing) | Reuse |
| Halibut — sources of mortality, who took it, vs. spawning biomass | `iphc_source_mortality`, `iphc_area_mortality`, `iphc_spawning_biomass` (existing) | Reuse |

## Datasets the data engine needs to publish

Listed here for the `mainsail_data` repo to pick up. Order is rough
build priority.

1. **NMFS commercial landings rollup** — statewide & regional, volume
   + ex-vessel value (nominal + real with documented deflator),
   long time series. Region keys: BSAI, Bristol Bay, Kodiak, PWS,
   Southeast, AYK, Westward, Statewide.
2. **First-wholesale value** — NMFS processor reports / ADF&G COAR,
   statewide and by species rollup (7-bucket).
3. **NMFS "Fisheries of the United States" port tables** — top US
   ports by volume and by value, latest year + recent history.
4. **CFEC vessel + permit registry rollup** — annual active vessels,
   active permits, by area / fishery.
5. **NMFS processor count** — annual number of active processors.
6. **NMFS Foreign Trade** — exports by product (HTS), by destination
   country, volume + value.
7. **FAO FishStat capture production** — top countries by wild-capture
   tonnage, with Alaska computed from #1.
8. **CPI-U deflator series** — pinned to base year (2025 initially).

Existing datasets continue to power the bycatch / observer / biomass
deep pages and are not changing.

## Build order (proposed; subject to user sign-off)

This is the order in which we'd ship pages on the site, decoupled
from the data-engine work which proceeds in parallel.

1. **Skeleton + navigation** — add the new top-level routes, a
   reorganized header, redirect `/` to `/landing`. All new pages
   render placeholder shells citing the IA in this doc. Existing
   deep pages keep working unchanged.
2. **Bycatch parent page** — pure composition / linking page over
   existing data. No new ingest needed.
3. **Fisheries management page rewrite** — KPI / process cards using
   public NPFMC + BOF content; reuse existing observer & biomass
   links. No new ingest needed.
4. **Harvest page (with Discards sub-section)** — once dataset #1
   (NMFS landings) and #2 (first-wholesale) are live, build the
   long-series charts, pies, and regional breakouts. Move existing
   Discards content in as a sub-section. Retire the standalone
   `/topics/discards` route (redirect to `/harvest#discards`).
5. **Communities page** — once datasets #3, #4, #5, #7 are live.
6. **Markets page** — once dataset #6 is live; domestic-market
   prose can be drafted in parallel.
7. **Landing page polish** — once all stat-strip dependencies are
   live; rewrite hero narrative.

Each step is shippable independently and the site remains in a
working state at every commit.
