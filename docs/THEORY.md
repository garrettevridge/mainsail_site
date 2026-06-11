# Seamark Whitepaper — Theory of the Piece

The north star for all section prose. Reset as of 2026-06: the piece is
**data-first, opinion-last.**

## Spine

**"This is what the best available data say."** Present the key data on Alaska's
most contested fisheries questions, cleanly and neutrally. Offer our conclusion
**once, at the end, clearly signed.**

## Audience

The **median voter who wants to know more** — not experts, not the already
convinced. We will not win everyone. The goal is a trustworthy guide through the
data, not a brief.

## The reset (why this changed)

We began neutral, drifted into advocacy threaded through every section, and that
turned the piece into a maze of five competing arguments. Reset: the **body is
strictly neutral** data presentation; the **opinion lives only in the
conclusion.** Rigor first, perspective last. For this audience that reads as more
trustworthy, and it returns the body to Mainsail's neutral-presentation ethos.

## Structure (full restructure)

Opening (frame + method, NO thesis) → four data movements → signed conclusion →
appendix.

1. **Scale** — what these fisheries are: volume, value, pollock as the largest
   U.S. fishery. (Wire the unused economic data so this is fact, not assertion.)
2. **Catch & bycatch** — what's caught and thrown back, by gear (the discard-rate
   chart carries it); total volume; the federal-vs-state coverage caveat.
3. **Salmon** — bycatch counts → accounting → genetics (incl. Japanese hatchery
   chum) → escapement collapse → marine-survival / climate. **Merges today's
   Chinook + Chum + Western Alaska + Climate into one movement.**
4. **Halibut** — the mortality budget; pollock ~1%; sport.

**Conclusion — "What we make of it"** — the one signed section. Clean, large,
well-measured; the cost is real but small, shared, and falling; the Western
Alaska collapse tracks the ocean, not the fleet; improve, don't dismantle.

**Appendix** (for the reader who wants more) — harvest caps & biomass, habitat,
methodology, sources, pending data.

**Call-out boxes (in the body, NOT the appendix):** observer coverage and DMRs.
Mention in the narrative, then a small supporting table/box nearby — enough to
ground the reader, not a whole section.

## Voice

- **Body: strictly neutral.** Anchored numbers, longest comparable series,
  published denominators. No advocacy verbs, no steelman, no "trawl is not one
  word," no telling the reader what to conclude. Let the charts carry it.
- **Conclusion: clearly Seamark's read.** The only place we interpret.
- **Register everywhere:** short, plain, in-between. Banned: meta-framing ("let's
  be frank"), melodrama, defensive hedging ("we recognize…", "we don't set it
  aside"), coaching the reader's feelings.

## Data the conclusion rests on (reference, all live from manifest)

- Discard rate by gear (2020–24): pelagic pollock trawl **0.4%**, pot 2.5%,
  bottom trawl **8.0%**, hook-and-line **21.5%**.
- Pollock = largest U.S. fishery, ~**1.4 M metric tons / 3.1 B lb** (2024).
- Halibut: pollock ~**1%** of bycatch (down ~**91%** since 2013); non-directed
  bycatch ~**16%** of coastwide mortality; charter/rec ~**20%** (exceeds bycatch).
- Chum BSAI ~**260 k/yr** avg (highly variable); Japan releases ~**42 B**
  hatchery chum/yr, Russia ~**17 B** (vs. the Western AK runs).
- Chinook bycatch ≈ **8%** of all Chinook taken by people; ~**47%** Coastal
  Western AK origin (single-year genetics).
- BSAI take ≈ **14–16%** of assessed biomass; 2026 pollock TAC **35%** below ABC,
  **47%** below OFL.
- The causal driver of the Western AK collapse — **marine survival / a warming
  ocean** — is the conclusion's weakest data claim today (placeholders; see
  pending ingests).

## Quick-win data already in the manifest (wire these — no new ingest)

- **Economic value** of the reward: `first_wholesale_value`, ex-vessel value in
  `nmfs_commercial_landings`, `cfec_earnings` (resident vs non-resident → the
  "benefit to Alaskans" split). → Scale.
- **Asian hatchery chum**: `hatchery_releases.country` (Japan ~42 B, Russia
  ~17 B, Korea, US, Canada). → Salmon.
- **Chinook escapement goals vs actuals**: `escapement_goals_history`. → Salmon.

## Pending ingests (carry the conclusion's weakest claims — see PENDING_DATA.md)

Marine-survival / return-per-spawner indices; Bering Sea SST + cold-pool extent;
multi-year Chinook & chum GSI + per-drainage run reconstructions.

## Guardrails (bind the whole data layer, body and conclusion)

Zero-based axes; longest comparable window; published denominators (counted
escapement, coastwide biomass — never reconstructed run totals); anchored
adjectives; official country names; real-dollar base year 2025; flag
preliminary; read only from the S3 manifest; any applied rate (e.g. sport
catch-and-release mortality) documented as an explicit methodology choice in the
prose, never baked into a chart.
