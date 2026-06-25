# Mainsail Front-End Doctrine & Presentation Methods
### Data architecture, presentation rules, and the chart-method catalog for the consumer surface

**Audience:** Claude Code (and any human) building or extending a Mainsail consumer
(`mainsail_site` first, partner BI later).

**Status:** Binding for presentation decisions. Defers to `CLAUDE.md` for data-substrate
and neutral-presentation rules, and to `docs/THEORY.md` for the Seamark whitepaper's
argument. Defers to `backend/consumers/<name>/lens_config.yaml` for the current lens list.
Where this document references a substrate fact (a column, a tier, a join template), the
semantic manifest is the source of truth and wins any conflict with this prose.

**Grounded in:** The live S3 contract (`manifest.json`, 56 datasets) and the per-dataset
semantic manifests at `v1/semantic/<dataset>.yaml` as of 2026-06-22; and the live site's
chart layer in `src/seamark/SmChart.tsx`, `SmTable.tsx`, and `ChartCard.tsx`.

---

## How to read this document

This is one doctrine in **two layers**. They were written as companions and are merged
here so there is a single source of truth.

- **Part I — Doctrine: what it means and what is forbidden.** The architecture: the
  lens × archetype model, the closed archetype taxonomy, the conditional-enrichment
  engine, the fusion mental-model test, the render-decision sequence, and the
  anti-patterns. This part tells you *which shape you are rendering and what you may not
  do to it.*
- **Part II — Presentation Methods: how to draw it.** The catalog of comparison
  techniques — goal bands, rolling means, indexed deviation, dual-panel, ratio, scatter,
  waterfall, annotation — each tied back to the archetype it serves. This part tells you
  *which chart method to reach for once Part I has told you the shape.*

Read Part I first. Part II assumes you have already assigned an archetype (Part I §2) and
passed the mental-model test (Rule 5.0). The two parts share one spine: **the archetype
taxonomy (A–G) in §2 is the hinge** — every method in Part II names the archetype it
renders.

### Relationship to the other docs

- **`CLAUDE.md`** governs the data substrate and the neutral-presentation contract
  (zero-based axes, longest comparable window, published denominators, anchored
  adjectives, official names, pinned real-dollar base year, preliminary flags,
  manifest-only sourcing, no silent computed transforms). This document never relaxes
  those rules; where a presentation method could collide with one, the collision is
  called out inline and the method is constrained, not the rule.
- **`docs/THEORY.md`** governs the Seamark whitepaper's argument. The whitepaper's
  narrative voice may state a thesis; its **data layer is bound by this doctrine and by
  `CLAUDE.md` exactly as the engine is.**
- **`docs/INFORMATION_ARCHITECTURE.md`** governs the site's top-level structure.

---

# PART I — DOCTRINE: WHAT IT MEANS & WHAT IS FORBIDDEN

## 0. The one idea everything else follows from

**The dataset already knows how it wants to be shown. Your job is to read what it
knows and obey it — not to invent a presentation.**

Every Mainsail dataset ships a semantic manifest that encodes its grain, its confidence
tier, its defensive-metadata flags, its join templates, and a block of `interpretation`
rules that are mostly sentences of the form *"do not do X"* or *"this column means Y,
not Z."* That manifest is not documentation you read once. It is the **render contract.**
A card is correct when, and only when, it visibly honors every interpretation rule and
confidence caveat its manifest declares.

This inverts the usual front-end instinct. You are not deciding how to visualize a
number. You are looking up the rules the number came with and refusing to draw anything
that breaks them. When you find yourself wanting to "just sum the column" or "just plot
the line," stop and check the manifest — for most Mainsail datasets there is a rule that
says exactly why you can't.

The semantic manifests also encode something deeper than data mechanics: **they encode
how practitioners in Alaska fisheries actually think about the system.** A compliance
card that joins escapement to goals is not a charting trick — it reflects the fact that
escapement is only meaningful in relation to a goal, and that goals change on a Board of
Fisheries cycle. A mortality attribution card that fuses bycatch with escapement on one
scale reflects the fact that a manager thinks "how many Chinook were removed and by what
pathway" as a unified question, not as two separate queries. The semantic layer is the
specification of that mental model. Every presentation decision must be legible to
someone who thinks in those terms.

Three consequences drive the rest of this document:

1. **Cards are bespoke to a *shape*, not to a dataset.** A small, closed set of
   archetypes covers all 56 datasets. A dataset declares its shape; the shape determines
   the card. You build ~7 renderers, not 56 cards. (§2, §3)
2. **Richness comes from conditional enrichment, not from custom code.** "If the data
   has quality X, render affordance Y" — a deflator column earns a real-dollar toggle,
   a suppression flag earns a hatched marker, a year-aware goal earns a compliance band.
   These rules compose. (§4)
3. **Fusion is a first-class card type, not an afterthought.** The best cards join two
   or three datasets through a manifest-declared template. The join exists because the
   *question* humans ask requires both datasets — not because a designer thought it
   looked good. (§5)

---

## 1. The two-axis model: lens × archetype

Navigation has exactly two axes. Keep them separate; they answer different questions.

### 1.1 Lenses — the question frames (configuration, not doctrine)

A lens is a question frame a user enters through. Lenses are fish-vernacular, stable
once fixed, and learned once. The lens bar lives across the top of the screen.

**The current lens list is NOT encoded in this document.** It lives in:

```
backend/consumers/mainsail_site/lens_config.yaml
```

Edit that file to rename, add, or reorganize lenses. Do not edit this document to
reflect a lens change. The doctrine specifies the *rules lenses must follow*; the config
specifies the *current lenses*.

**Rules lenses must follow — these are fixed:**

> **Rule 1.1a** — Lenses are question frames, not data categories. A lens named "Harvest"
> means "I am asking a harvest question" — it is the user's intent, not a classification
> of the dataset. A dataset may appear under two lenses without contradiction.

> **Rule 1.1b** — Lens membership is a consumer concern. It belongs in `lens_config.yaml`,
> never in a substrate manifest. The manifest does not know which lens shelves a dataset;
> the consumer config does.

> **Rule 1.1c** — Lenses are fish-vernacular and stable. Names should be terms a fisheries
> practitioner uses without explanation. Once the list is fixed, adding a lens is a
> governed act requiring explicit justification — it is not a convenience. Renaming is
> lighter, but both require updating `lens_config.yaml`, not this document.

> **Rule 1.1d** — A lens does not change how a dataset renders. A dataset's archetype and
> enrichment are fixed properties of the dataset, visible identically no matter which
> lens you reached it through.

**The `lens_config.yaml` schema** (what Claude Code writes and reads):

```yaml
# backend/consumers/mainsail_site/lens_config.yaml
# Edit this file to change the lens list.
# Do not change the schema without updating this doctrine (§1.1).

lenses:
  - id: resource              # slug; stable identifier used in URLs and code
    display_name: Resource    # shown in the button bar
    description: >            # shown as shelf subtitle
      Fish in the water — escapement, biomass, forecasts, in-season counts.
    color: "#5fd0a3"          # accent color for this lens's underline
    datasets:                 # ordered shelf list; datasets may appear in multiple lenses
      - salmon_escapement
      - chinook_drainage_totals
      - stock_assessment_biomass
      - salmon_run_forecasts
      - iphc_spawning_biomass
      - fish_counts
  - id: harvest
    # ... and so on
```

The `id` is stable and used in URLs — change it only deliberately. The `display_name`
and `description` can be freely edited. The `datasets` list is the shelf and may be
reordered or extended without affecting rendering.

### 1.2 Archetypes — the render shapes (doctrine, not configuration)

The archetype is how a dataset renders. It is a **substrate concern**: it follows from
the dataset's `grain`, and once assigned it is stable. It does not change when lenses
are reorganized. The archetype taxonomy is in §2.

> **Rule 1.2** — Lens is navigation; archetype is rendering. Never let a lens dictate a
> chart type, and never let a data shape leak into the lens bar.

---

## 2. The archetype taxonomy

Every dataset is exactly one **primary archetype**. The taxonomy is closed. The
empirical spread across the 56 live datasets is shown so you can see this is not
theoretical. **The "canonical renderer" column names the Part II method that draws it.**

| # | Archetype | What the data is | Canonical renderer (→ Part II) | Live examples |
|---|-----------|------------------|--------------------------------|---------------|
| A | **Scalar series** | One value per time step | Single line; dashed tail for preliminary (II.2a); add rolling mean/YoY when noisy (II.2b) | `cpi_u_deflator`, `fx_rates`, `iphc_spawning_biomass`, `farmed_salmon_prices` |
| B | **Categorical breakdown** | One measure split by one dimension over time | Stacked area / small multiples / 100% share (II.3a–c) | `salmon_commercial_harvest` (×species), `first_wholesale_value` (×species_group), `nmfs_commercial_landings`, `observer_coverage` (×stratum) |
| C | **Multi-key cross-tab** | One measure across two or more free dimensions | Pivot-with-chart: pin all-but-one key, vary one; dual-panel when two grains share an x (II.4a); toggle to pivot table | `foss_trade` (6 keys), `census_state_exports`, `psc_weekly`, `catch_weekly`, `monitored_catch`, `subsistence_harvest` |
| D | **Actual-vs-target (compliance)** | An observed series judged against a year-aware bound | Series + goal band, points colored met/missed (II.1a); forecast-vs-outcome overlay (II.1b); TAC utilization bar (II.1c) | `salmon_escapement` × `escapement_goals_history`; `salmon_run_forecasts` (forecast vs outcome); `tac_specs` × `monitored_catch` |
| E | **Ledger / attribution** | A total decomposed into sources that sum | Stacked bar / waterfall (II.4e); record-kind tabs; drill-back to source rows | `salmon_mortality_attribution`, `iphc_mortality_by_source`, `iphc_mortality_by_area` |
| F | **Reference / lookup** | A small, slow-changing keyed table consumed by other datasets | The table itself (`SmTable`), plus a "used by" panel | `discard_mortality_rates`, `escapement_goals_history`, `nmfs_processor_count` |
| G | **Geographic** *(provisional — see §2.1)* | A measure whose primary axis is place, not time | Choropleth / point map; time becomes a slider | Candidates: `observer_coverage` by FMP area, `iphc_mortality_by_area` |

> **Rule 2.1** — Assign archetype from the manifest's `grain`, not from a glance at the
> data. `grain: year × month × HTS × country × customs_district × flow` is a cross-tab
> (C); `grain: year × base_year` with one measure is a scalar (A);
> `grain: system × species × year × goal_type` with a sibling goals table is compliance
> (D). The grain string is the tell.

> **Rule 2.2** — Reference tables (F) are not failed time-series. A 16-row lookup is a
> different *kind* of object whose value is in what it *feeds*. Render it as a table;
> show what it feeds. Do not force a chart onto it.

> **Rule 2.3** — The archetype set is closed. When a dataset won't fit, stop and escalate —
> do not quietly write a one-off card. Open the question: is this a genuinely new shape
> (then add it to the taxonomy and audit which existing datasets also want it), or is it
> an existing shape being misread?

### 2.1 The open question: is Geographic a real seventh archetype?

Geographic (G) is provisional. It may be a *projection of* B/C/E rather than its own
shape — `observer_coverage` by FMP area is a categorical breakdown whose category happens
to be a place. Treat G as its own archetype **only if** the dataset's primary axis is
space and a map conveys something a bar chart structurally cannot (spatial adjacency,
gradients, area boundaries).

Before building any map: *does this need a map, or a view toggle on a breakdown card?*
Build the map as a view toggle first; promote to archetype G only when a second and third
dataset demand the same renderer.

---

## 3. How to build the renderers

> **Rule 3.1** — One renderer per archetype, parameterized by the manifest. The scalar
> renderer that draws `cpi_u_deflator` is the same code that draws `iphc_spawning_biomass`.
> The difference is data and manifest fields, never a branch keyed on the dataset name.
> If you write `if (dataset === 'foss_trade')`, you have already lost — that logic belongs
> in the manifest as a declared field. This mirrors the site's existing component
> discipline (`CLAUDE.md`): **one chart type per component, typed data props, no generic
> "chart" that does everything.** The live `SmChart.tsx` already follows it —
> `StackedArea`, `StackedBar`, `MultiLine`, `BarColumns`, `BarLine` are each their own
> file-level component.

> **Rule 3.2** — A card shows only the controls the dataset actually has. The control strip
> is assembled from the dataset's declared dimensions and enrichment flags (§4). Controls
> are earned by the data, never boilerplate.

> **Rule 3.3** — Degrade gracefully on empty and scaffolded datasets. Five live datasets ship
> `row_count: 0`. A card for a zero-row dataset must render an intentional empty state
> that says what it will show and what it is blocked on (read the manifest's
> `known_issues`). An empty screen is an instruction, not a mood. The live
> `PlaceholderChart` in `ChartCard.tsx` is the existing implementation of this rule.

---

## 4. Conditional enrichment — the "if data has X, render Y" engine

Richness is uniform and composable: each rule keys off a manifest fact and earns a
presentation affordance. One card can fire several rules. This is where Mainsail's depth
lives without bespoke code.

### 4.1 Confidence and freshness (every card, no exceptions)

The manifest carries `confidence_tier` ∈ {`final`, `semi_stable`, `volatile`,
`cyclical`} and prose `confidence_guidance`. Live distribution: 14 final / 35
semi_stable / 5 volatile / 2 cyclical.

> **Rule 4.1a** — Every card surfaces its `confidence_tier` as a persistent badge with a
> fixed color encoding: final = green, semi_stable = amber, volatile = blue, cyclical =
> violet. The badge tells the user how much to trust the headline before they read it.

> **Rule 4.1b** — `confidence_guidance` is the source text for a card info affordance. Do
> not paraphrase it into something cheerier. `foss_trade`'s guidance — recent months
> carry ±5% revision — must reach the user intact.

> **Rule 4.1c** — `cyclical` tier means values are valid only within an effective window.
> Any card built on a cyclical dataset must expose the effective period and must not
> present a cyclical value outside its window as current. This is the flag that a
> year-aware join is mandatory.

> **Rule 4.1d** — `data_changed_at` from the manifest drives a "last updated" line.
> Prominent for volatile datasets (weekly catch, PSC, fish counts); quiet for final
> historicals. Site-wide, the footer carries `manifest.generated_at` per `CLAUDE.md`.

### 4.2 The deflator and unit-transform pattern

`cpi_u_deflator` exists to be multiplied into other datasets: `real_usd = nominal_usd ×
deflator_to_base`. This generalizes to a uniform rule about join-table transforms.

> **Rule 4.2a** — If a monetary dataset is nominal and `cpi_u_deflator` is joinable on
> `year`, the card earns a **nominal ↔ real toggle**. Default to real. Label the axis
> `real {base_year} USD` by reading `base_year` from the deflator dataset — never
> hard-code it; it re-pins every ~5 years and the manifest is the single source. (The
> site-wide base year is currently **2025**, pinned per `CLAUDE.md`; charts showing
> nominal values must label them nominal in the axis title.)

> **Rule 4.2b** — If a value is in a foreign currency and `fx_rates` covers it, the card
> earns a **currency toggle** (e.g. `farmed_salmon_prices` in NOK/kg offers NOK ↔ USD).

> **Rule 4.2c** — Any dataset with a declared unit-bearing measure and a known lossless
> conversion earns a **unit toggle** (lbs ↔ mt; count ↔ passage where `count_method`
> distinguishes them). Never offer a toggle that silently approximates.

These toggles are the only sanctioned client-side transforms, and each is a *lossless or
manifest-declared* operation — consistent with `CLAUDE.md`'s "do not compute numbers the
source didn't." See the note at II.2b/II.2c/II.4c on derived series that go beyond
lossless conversion.

### 4.3 Defensive metadata → visible marks (never silent)

Mainsail's substrate rule is *defensive metadata as first-class columns, not implicit
nulls*. The front-end corollary: those columns must produce visible marks, or the
substrate discipline was wasted.

> **Rule 4.3a** — `is_suppressed` renders as a distinct hatched or greyed marker with a
> "withheld: <3 processors" tooltip — never as a zero, never as a gap. A suppressed
> point is information; a missing point is absence. Do not let them look alike.

> **Rule 4.3b** — Preliminary flags render as a visually distinct (dashed/lighter) segment.
> `is_preliminary` on `cpi_u_deflator`'s current year must read as "not yet final"
> without a legend lookup. This is the same rule `CLAUDE.md` states: flag preliminary
> values explicitly; never omit or soften the flag.

> **Rule 4.3c** — NULL-with-cause is not zero. `salmon_escapement` makes this explicit:
> `not_operated_*` rows carry `actual_count = NULL` on purpose because zero-fill would
> read as a goal miss. Compliance and trend renderers must exclude these rows from the
> verdict and may show them only as greyed "not operated" markers. The manifest's
> `count_method` vocabulary tells you exactly which methods are non-operation.

> **Rule 4.3d** — Per-row provenance is a drill affordance. Datasets with a `provenance`
> JSON column can expose a source popover on a point: source title, URL, cell location,
> verbatim caveat. Render `caveat_verbatim` unedited — the escapement manifest is
> emphatic that per-row footnotes are verbatim from the agency document.

> **Rule 4.3e** — Per-row data-quality tiers become per-point styling. `salmon_commercial_harvest`
> carries a per-row `data_quality` tier. Map it to opacity or marker style so a chart of
> mixed-provenance points shows its own seams.

### 4.4 Interpretation rules → hard guardrails

The manifest's `interpretation` block is a list of things a naive consumer would get
wrong. These are not advisory. They are constraints the renderer enforces.

> **Rule 4.4a** — A documented "do not sum" rule disables naive aggregation in the UI.
> `salmon_escapement` says that `SUM(actual_count)` double-counts drainages 2–3× and
> that rollups must use `chinook_drainage_totals`. The card therefore must not offer a
> "statewide total" over raw escapement rows. Encode the prohibition; do not trust the
> user to read a footnote.

> **Rule 4.4b** — A documented non-comparable seam blocks pooling across it.
> `salmon_mortality_attribution` carries a hard Templin↔Barclay break (2023 vs 2024+).
> Any time-series renderer must split at the seam — separate series, a visible break
> marker, never a line drawn straight through. Same pattern: `foss_trade`'s HTS-revision
> epochs (2007/2012/2017) must be concorded before a cross-epoch trend; if not, break
> the line. **Part II II.5b** shows the period-shading method that marks such a seam
> *and explains it* rather than just breaking the line.

> **Rule 4.4c** — A documented index-vs-total distinction blocks mixed-scale charts.
> `salmon_escapement` warns that `AERIAL_INDEX` / `RUN_INDEX` rows are relative indices
> and must never be plotted on the same axis as weir/sonar counts. The renderer keys off
> `goal_type` / `count_method` and refuses to co-plot index rows with count rows.

> **Rule 4.4d** — A documented attribution requirement blocks raw rollups. `foss_trade` has
> no state-of-origin; its manifest forbids summing raw rows for an Alaska question
> without routing through the `alaska_export_share` classifier cache, with the
> classifier's own confidence surfaced. Never `SUM(value_usd)` filtered by a guessed
> country.

> **Rule 4.4e** — When a renderer cannot honor an interpretation rule, it shows less, not
> wrong. If you cannot implement the year-aware goal join yet, show the escapement series
> without a compliance verdict — never with a naive flat-goal verdict. Silence beats a
> confident error.

### 4.5 Reconciliation and peer divergence

Several manifests declare `reconciliations` — sibling datasets that measure overlapping
things by different methods with documented divergence. `foss_trade` reconciles to
`coar_production` (±20%) and the McKinley benchmark (±10%); `census_state_exports` is
the ~25%-undercount peer to `mckinley_asmi_export_benchmark`.

> **Rule 4.5a** — Where a dataset has a declared reconciliation peer, the card may offer a
> "compare to <peer>" overlay that shows both series and the documented reason they
> differ, using the manifest's own `reason_for_divergence` text. A dumb dashboard hides
> that two sources disagree. Mainsail explains the disagreement.

---

## 5. Fusion cards — joined datasets and the mental-model test

The escapement card that fuses `salmon_escapement` with `escapement_goals_history` works
not because of how it looks, but because of what it reflects: **in Alaska fisheries
management, an escapement count is only meaningful in relation to a goal.** You would
not report escapement to the Board of Fisheries without a goal alongside it. The card
honors that.

This is the test every fusion card must pass before it is built. **Every cross-dataset
method in Part II §II.4 is gated by it.**

> **Rule 5.0 — The mental-model test.** A fused card is only justified if the join
> reflects how practitioners in the field actually think about the system. If a fisheries
> manager, a stock assessment biologist, or a policy analyst would naturally hold these
> two things together in a single thought — then the card should show them together. If
> the join is a charting convenience, or an answer to a question no practitioner would
> ask, do not build it. The semantic manifest is the specification of which joins pass
> this test, because the manifests were written by people who understand the system. A
> declared join template is evidence the join reflects real mental-model alignment. A
> join you invented without a template is evidence it probably does not.

Concrete examples of joins that pass the mental-model test:

- **Escapement × goals** (D archetype): A count is only useful against its target.
  The manager's question is always "did we meet goal," never "what was escapement."
- **Mortality attribution ledger** (E archetype): Bycatch, in-river harvest, and
  escapement are three pathways of the same fish. A biologist thinking about Chinook
  conservation holds all three simultaneously on a single scale.
- **Nominal value × CPI deflator**: Economic comparisons across decades are meaningless
  in nominal dollars. Any serious analyst converts to real dollars before comparing.
  The toggle reflects that.
- **Discards × discard-mortality rates**: A discard count is not a mortality count.
  The halibut ecologist's question is always dead discards, not total discards.
- **Forecast × outcome** (D archetype): Run forecasting is evaluated by how close the
  pre-season prediction came to the post-season count. The two numbers only have meaning
  in relation to each other.

Concrete examples of joins that fail the mental-model test — do not build these:

- Escapement from one drainage plotted against first-wholesale value from a different
  drainage, connected by year but not by fish. The practitioner would not hold these
  together; no declared join template exists.
- Bycatch counts co-plotted with port-of-landing trade values on one axis. These are
  different units answering different questions and the join produces a chart that
  *looks* correlated but has no causal structure the user can interpret.
- Halibut spawning biomass co-plotted with salmon escapement on a shared y-axis. Both
  are "abundance" but for different species and management systems; the joint view
  produces no question a manager would ask.

> **Rule 5.1** — Use the manifest's declared join template; never improvise a join. Manifests
> ship join SQL verbatim — `discard_mortality_rates` carries `join_with_monitored_catch`,
> the escapement compliance join is specified in `interpretation` and `relationships`.
> Render that join. If you want a join that is not declared, propose adding the template
> to the manifest upstream. Do not hand-roll it in the front end.

> **Rule 5.2** — Year-aware joins are mandatory wherever an effective window exists. Goals,
> discard-mortality rates, and deflator base-years all change over time. The join must
> be `value.year BETWEEN ref.effective_year_start AND COALESCE(ref.effective_year_end, 9999)`.
> A flat join that applies today's goal to a 2008 count is a factual error, not a styling
> choice. The `cyclical` confidence tier is the manifest's signal that this applies.

> **Rule 5.3** — Grain friction is a render-time hazard; surface it, don't paper over it.
> The `discard_mortality_rates` × `monitored_catch` join has a documented grain mismatch
> (`dmr.species` is a single species; `mc.species_group` is a bucket). When a declared
> join carries a grain-friction note, the fusion card must either apply the crosswalk or
> visibly flag the approximation. A join across mismatched grains that looks clean is the
> most dangerous thing the front end can ship.

> **Rule 5.4** — A fusion card names its sources. The footer states which datasets it
> combines and on what key. The user must be able to see that the verdict on screen is a
> computed relationship between two authoritative tables, both traceable. The live
> `ChartCard` already carries a `source` slot for exactly this.

> **Rule 5.5** — Derived datasets are pre-fused; render them as first-class and link their
> lineage. `chinook_drainage_totals`, `salmon_mortality_attribution`,
> `first_wholesale_value`, `alaska_export_share`, `nmfs_trade_exports`, `cfec_registry`,
> `production_weekly` are rollups computed in the substrate. Tag them "derived" and link
> to their base datasets so a user can drill from the rollup to the raw rows. **Prefer a
> substrate-published derived value over re-deriving it in the chart** (this is also how
> `CLAUDE.md`'s "do not compute numbers the source didn't" is satisfied: the computation
> already happened upstream, with provenance).

---

## 6. Progressive disclosure — depth without overwhelm

> **Rule 6.1** — Overview first, zoom, then details on demand. The lens bar is overview. The
> shelf shows name, one-line description, confidence badge, and archetype — nothing more.
> The opened card is the zoom. The point-level drill (provenance popover, raw value,
> source link) is details on demand.

> **Rule 6.2** — Two disclosure levels before a deliberate "expand." Shelf → card is one;
> card → drill is two. Anything deeper (full pivot, raw table, all dimensions) lives
> behind an explicit control, not auto-revealed.

> **Rule 6.3** — The card's default view answers the most common question. A cross-tab
> defaults to the single most-asked projection, other keys available but collapsed. Do
> not open on a wall of every dimension at once.

> **Rule 6.4** — The headline of a card is a thesis, not a number dump. Lead with the one
> fact the dataset most exists to convey. The manifest's `purpose` /
> `what_this_dataset_measures` block is the source for that thesis. **Anchor it** — per
> `CLAUDE.md`, "97% utilization," not "high utilization."

---

## 7. The render-decision sequence

When building or revising a card, execute in this order. Each step is a manifest lookup,
not a judgment call.

1. **Read the manifest.** `v1/semantic/<dataset>.yaml`. All of it — especially
   `interpretation`, `known_issues`, and `relationships`.
2. **Determine archetype** from `grain` (§2, Rule 2.1). If none fit, stop and escalate
   (Rule 2.3).
3. **Select the renderer** for that archetype (Rule 3.1). Reuse; do not fork by dataset
   name.
4. **Choose the presentation method** from Part II that matches the *question the user is
   asking* of this archetype (Part II §II.6 decision table). The archetype narrows the
   options; the user's question picks among them.
5. **Assemble the control strip** from the grain's free dimensions and earned enrichment
   toggles (§4.2): unit/currency/real toggles where they fire; break-out selectors for
   cross-tab keys; effective-window controls for cyclical refs.
6. **Apply confidence and defensive-metadata marks** (§4.1, §4.3): tier badge, freshness
   line, suppression hatching, preliminary dashing, NULL-with-cause exclusion, provenance
   drill.
7. **Enforce interpretation guardrails** (§4.4): disable forbidden aggregations; break at
   non-comparable seams; separate index from total; route through required classifiers. If
   a guardrail cannot be honored yet, render the reduced card (Rule 4.4e).
8. **Apply the mental-model test to any join** (Rule 5.0). If the join passes, wire the
   manifest's declared template — year-aware (5.2), grain-friction-flagged (5.3), sources
   named (5.4). If no template exists, do not build the join.
9. **Set the default view and headline thesis** (§6.3, §6.4) from the manifest's
   `purpose`.
10. **Build the empty/blocked state** from `known_issues` if `row_count` is 0 or coverage
    is partial (Rule 3.3) — use `PlaceholderChart`.

If you did all ten, the card is rich, correct, and consistent with every other card —
and you wrote no dataset-specific code.

---

## 8. Lens configuration — how to edit lenses without touching doctrine

To rename, reorder, or add a lens:

1. Edit `backend/consumers/mainsail_site/lens_config.yaml`.
2. Do not edit this document.
3. Keep lens `id` values stable — they appear in URLs and routing logic.
4. `display_name` and `description` can change freely.
5. Adding a lens requires a comment in the PR explaining why no existing lens covers the
   new question frame. The bar is not high, but the justification must exist.
6. Removing a lens requires migrating its `datasets` list to surviving lenses before the
   `id` is deleted.

The lens list will evolve. That is expected and designed for. The rules governing lenses
(§1.1) will not evolve on the same schedule. Keep them in different files.

---

## 9. Anti-patterns (always wrong)

- **Branching a renderer on a dataset name.** The variation belongs in the manifest.
- **Summing a column the manifest says not to sum.** `salmon_escapement` is the loud
  case, but it is not the only one.
- **Drawing a line through a non-comparable seam.** Templin↔Barclay, HTS revision
  epochs, goal-era boundaries. Break the line (and shade/explain it — II.5b).
- **Co-plotting an index with a total on one axis.**
- **Rendering a suppressed value as zero or as a gap.** It is neither; it is withheld.
- **Zero-filling a `not_operated` count** and calling it a goal miss.
- **A flat join where an effective window exists.** Factual error.
- **A clean-looking join across mismatched grains.** Flag it or crosswalk it.
- **Hard-coding the deflator base year** instead of reading it from the manifest.
- **Rewriting a verbatim agency caveat** to sound nicer.
- **Forcing a chart onto a reference/lookup table.** Show the table; show what feeds it.
- **A blank card for a zero-row dataset** instead of an intentional blocked state.
- **Inventing a join not declared in any manifest.** Propose it upstream first.
- **Building a fusion card that fails the mental-model test.** Two datasets on one chart
  is not inherently good. It is only good if a practitioner would naturally hold those
  two things together.
- **Reconstructing a denominator the source didn't publish** — e.g. labeling a removals
  budget "total run." See II.4c and II.4e.
- **A dual y-axis whose scales are tuned to make two lines look parallel.** See II.4b.
- **A derived series (rolling mean, index, ratio) drawn without a subtitle that states
  the computation.** See II.2b, II.2c, II.4c.

---

## 10. What stays out of Part I

Part I is an architecture-and-presentation contract, not a visual style guide. Palette,
typography, spacing, motion, and component library live elsewhere (`tailwind.config.js`,
`src/index.css`, and the "Visual direction" section of `CLAUDE.md`). The test for whether
something belongs here: *does it determine whether the card is factually correct and
consistent with the data's own contract?* If yes, it is doctrine. If it only affects how
the card looks, it is style.

The substrate side — ingest, validation, publish — is governed by `CLAUDE.md` and the
`docs/` tree. Where this document references a substrate fact (a column, a tier, a join
template), the manifest is the source of truth and wins any conflict with this prose.

The current lens list is governed by `backend/consumers/mainsail_site/lens_config.yaml`.
Where this document and that file conflict on which datasets belong to which lens, the
config file wins. Where they conflict on the rules lenses must follow, this document wins.

---

# PART II — PRESENTATION METHODS: HOW TO DRAW IT

This part is the *how to draw it* catalog. It assumes you have read Part I, assigned an
archetype (§2), and — for any join — passed the mental-model test (Rule 5.0). It tells
you which presentation method to reach for and why.

## The core tension

Every Mainsail dataset exists inside a system of relationships. Escapement is meaningful
against a goal. First-wholesale value is meaningful deflated. Bycatch is meaningful as a
share of escapement. A single series in isolation — the "line graph with toggles"
instinct — answers the question "what happened?" The richer question is always "what
happened relative to what?" The presentation method is what creates or destroys that
relational reading.

This catalog is organized by **comparison type**, not by chart type. The question "should
I use a bar or a line?" is the wrong starting point. The right starting point is "what is
the user comparing?" — and the chart type follows from that, gated by the archetype Part I
assigned.

## Current component inventory — what you have, what you must build

Be honest about the starting point. The entire live chart layer is `src/seamark/SmChart.tsx`
(plus `SmTable.tsx` and `ChartCard.tsx`). Do **not** assume a component exists; check here
first.

**Present today (`SmChart.tsx`):**

| Component | Recharts base | Use |
|---|---|---|
| `StackedArea` | `AreaChart` | composition over time (II.3a); supports `yDomain` for 100% share |
| `StackedBar` | `BarChart` | composition / parts of a whole (II.3a); supports horizontal `refLines` |
| `MultiLine` | `LineChart` | one or more line series (II.2a); supports `yDomain` + horizontal `refLines` |
| `BarColumns` | `BarChart` + `Cell` | per-category columns, independently colored, **not** parts of a whole |
| `BarLine` | `ComposedChart` | dual-axis bar + context line — **both axes forced zero-based** (II.4b) |
| `Legend` | — | text+swatch legend (accessibility: color is never the only cue) |
| `SmTable` | — | reference/lookup tables (archetype F) and GSI-style tables that pair share with n |
| `ChartCard` / `PlaceholderChart` | — | card chrome (`label`/`source`/`title`/`caption`) and the intentional empty state (Rule 3.3) |

Recharts primitives imported and available: `ReferenceLine` (horizontal, `y=`),
`CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Cell`.

**Not yet present — these methods require new work, do not cite them as existing:**

- `ScatterChart` — **not imported.** Needed for II.4d. Add it.
- `ReferenceArea` — **not imported.** Needed for the goal band (II.1a) and period shading
  (II.5b). Add it.
- A YoY-delta component — **does not exist** (there is no `br-delta` and no `delta` code
  in `src/`). Needed for II.2b. Build it (one derived array + reuse `MultiLine`/a small
  bar).
- A rolling-mean overlay, an indexed-deviation transform, and a waterfall renderer —
  none exist. II.2b, II.2c, II.4e. Each is mostly a data transform plus an existing or
  near-existing component.
- `syncId`-linked dual panels — not wired. II.4a. Add the `syncId` prop to two stacked
  charts.
- A vertical event line (`ReferenceLine x=`) and inline end-of-series labels — not wired.
  II.5c, II.5d.

> **Naming note:** components are the `Sm*` family (`SmChart`, `SmTable`, `ChartCard`).
> `sm-` and `br-` are *CSS class* prefixes (Seamark deck vs. Brief layout), **not**
> component namespaces. There is no `br-delta` or `br-gsi-table` component.

> **Dataset note:** `salmon_mortality_attribution` is a real archetype-E dataset in the
> S3 manifest (Part I §2, Rule 5.5), but it is **not yet wired into the site's
> `src/api/types.ts`.** Methods that depend on it (II.4c, II.4e) are buildable against
> the substrate but require adding the type + fetch first.

---

## II.1 Comparison against a target or standard  → archetype D (and C/D)

**When:** An observed series is only meaningful against a threshold, goal, or expected
range. The user's question is "did we make it?"

**Datasets:** `salmon_escapement` × `escapement_goals_history`, `salmon_run_forecasts`
vs outcome, `tac_specs` × `monitored_catch`.

### Method 1a — Goal band with colored points *(requires `ReferenceArea`; not yet built)*

The correct renderer for escapement compliance (archetype D). A shaded band defines the
goal range; each annual point is colored by outcome (met = teal, below goal = buoy/orange,
not operated = grey). The band is more honest than a single line because the goal *is* a
range — a SEG of 65,000–120,000 is not 92,500.

```jsx
// Needs: import { ReferenceArea } from "recharts"  ← not currently imported
<ReferenceArea y1={goalLow} y2={goalHigh} fill="rgba(95,208,163,0.12)" />
<ReferenceLine y={goalLow} stroke="#5fd0a3" strokeDasharray="3 3" strokeOpacity={0.7} />
<ReferenceLine y={goalHigh} stroke="#5fd0a3" strokeDasharray="3 3" strokeOpacity={0.7} />
<Line dataKey="actual" dot={<ColoredDot />} />  // dot color keyed to the goal_met field
```

**Status today:** the data side of this exists — `goalLow`/`goalHigh`/`belowGoal` are
already computed in the Chum sections, and the year-aware `effective_year_start/end` join
logic exists elsewhere — but it is rendered as text/tables, not as a band-with-colored-dots
chart. Building the chart means adding `ReferenceArea` and per-point `Cell`/`dot` coloring.

**Traps:**
- A flat `<ReferenceLine>` using *today's* goal on historical data is a factual error
  (Rule 5.2). The join must honor `effective_year_start`/`effective_year_end`. If you
  cannot implement the year-aware join, omit the band rather than draw the wrong one
  (Rule 4.4e).
- The point color encodes the literal `goal_met` field, not an adjective. Keep it tied
  to the field and labeled — "below goal," not "poor year" (anchored adjectives,
  `CLAUDE.md`).
- Exclude `not_operated` rows from the verdict; show them only as grey markers
  (Rule 4.3c).

### Method 1b — Forecast vs. outcome overlay  → archetype D

For `salmon_run_forecasts`: pre-season forecast as a dashed line, post-season outcome as
solid points, both on the same axis. The gap between them is the forecast error — the
real story. A small error panel below (deviation from zero) makes the miss legible.

### Method 1c — TAC utilization bar  → archetype C/D *(new component)*

For `tac_specs` × `monitored_catch`: a horizontal bar showing catch as a filled segment
against the TAC as the full bar width. Instant utilization read — better than a line for a
quota question because quota is a ceiling, not a trend. Compute the rate as a published
ratio where possible (II.4c) and **anchor the label** ("87% of TAC"), per Rule 6.4.

---

## II.2 Comparison across time — trends and change  → archetypes A / B

**When:** "How has this changed?" / "Is this getting better or worse?"

### Method 2a — The line (the baseline)  → `MultiLine`

Appropriate for smooth continuous series: `iphc_spawning_biomass`, `farmed_salmon_prices`,
`cpi_u_deflator`. The reader reads slope and level simultaneously. Dashed tail for the
preliminary segment (Rule 4.3b).

**When the line is wrong:** when the series has meaningful gaps (`not_operated` years),
when the grain is annual with high interannual variance (escapement), or when the story
is the distribution of outcomes rather than the trend. In those cases the line overstates
smoothness — reach for 2b.

### Method 2b — Year-over-year delta and rolling mean  *(both new — no `delta` component exists)*

A secondary display alongside the primary series showing change from the prior year.
Appropriate when the series is noisy, when the decision depends on *direction* (is it
recovering?) not *level*, or when the absolute dollar matters less than whether it is up
or down on last season (`first_wholesale_value`). Belongs on every monetary and every
biomass series.

**Rolling-mean overlay** — for a noisy annual series (escapement, commercial harvest),
draw a 5-year rolling mean as a thicker, lower-opacity line behind the annual points. The
annual variation stays visible; the long-run signal becomes readable. This is one of the
highest-value low-code additions available — a derived array plus a second `<Line>` in
`MultiLine`.

```js
const rollingMean = (data, n = 5) => data.map((d, i) => ({
  ...d,
  rolling: i < n - 1 ? null
    : data.slice(i - n + 1, i + 1).reduce((s, r) => s + r.value, 0) / n,
}));
// <Line dataKey="value" dot /> + <Line dataKey="rolling" dot={false} strokeWidth={2.5} opacity={0.5} />
```

> **Doctrine tie (`CLAUDE.md`: "do not compute numbers the source didn't").** A rolling
> mean and a YoY delta are *presentational smoothings*, not new facts — permitted, but
> the card **must carry a subtitle that states the computation** ("5-yr trailing mean")
> so the transform is never silent. Do not bake an applied *rate* (e.g. catch-and-release
> mortality) into the series this way; that is a methodology choice for the prose, never
> a chart transform.

### Method 2c — Indexed deviation from a baseline  *(new — mostly a data transform)*

The single most underused technique for fisheries data. Instead of raw counts or values,
plot each series as its deviation from a reference-period mean (e.g. 1990–2010 = 100).
Every series starts at the same origin, so the reader sees which stocks are above or
below their historical norm and how they move together or diverge.

**Appropriate for:** `iphc_spawning_biomass` vs `stock_assessment_biomass` vs
`salmon_commercial_harvest` on one chart — three series that cannot share a y-axis because
they are different units. Indexed, they can. Draw a horizontal reference line at 100.

```js
const BASE = { start: 1990, end: 2010 };
const baseMean = data.filter(d => d.year >= BASE.start && d.year <= BASE.end)
  .reduce((s, d, _, a) => s + d.value / a.length, 0);
const indexed = data.map(d => ({ ...d, index: (d.value / baseMean) * 100 }));
```

**Traps:**
- Never index against a baseline period that was itself anomalous (e.g. the 1970s herring
  crash). The reference period must be a defensible "normal," and you must **state it in
  the subtitle** ("indexed to 1990–2010 average = 100").
- An indexed chart is a deliberate departure from a raw count; under `CLAUDE.md`'s
  zero-based-axes rule it is one of the "clearly labeled reason" exceptions — so the
  label is mandatory, not optional. Like 2b, it is a stated computed transform, not a
  silent one.

---

## II.3 Comparison across categories — composition  → archetypes B / E

**When:** "What is it made of?" / "Who contributes what share?"

**Datasets:** `salmon_commercial_harvest` (×species), `first_wholesale_value`
(×species_group), `iphc_mortality_by_source` (×sector), `chum_gsi` / `chinook_gsi`
(×stock group).

### Method 3a — Stacked area / stacked bar  → `StackedArea` / `StackedBar`

Appropriate when the parts sum to a meaningful total and the reader needs total and
composition at once. `salmon_commercial_harvest` by species is the canonical case.

**Rule:** only stack when the parts are mutually exclusive and exhaustive (they truly sum
to the whole). Never stack estimates with overlapping CIs, or when one part is a subset of
another. (This is the front-end face of archetype E's "sources that sum.")

### Method 3b — Small multiples (faceted lines)  → grid of `MultiLine`

When you have 5+ categories and stacking would be an illegible layer cake. Each category
gets its own panel with **identical axes**; readers compare shape across panels rather
than reading segment widths. Appropriate for `subsistence_harvest` by community or
`observer_coverage` by stratum. One `MultiLine` per category, same `yDomain`, arranged in
a CSS grid — the shared scale does the comparison work.

### Method 3c — 100% stacked (share chart)  → `StackedBar` with `yDomain={[0,100]}`

When the question is about *share*, not *total*. `chum_gsi` attribution — what fraction
came from Western Alaska vs. Asian hatcheries — is a share question. Pre-normalize the
data to percentages and fix the domain to [0, 100].

> **The GSI trap (and the n rule).** Never show a share chart without the underlying n.
> A 60% Western Alaska share from 200 fish means something different from 60% of 2,000.
> The GSI tables (built on `SmTable` in the Chum/Chinook sections) already pair share with
> n — do not collapse them to a bare share chart that drops the sample size. This is the
> presentation face of Part I Rule 4.4 (honor what the manifest says a number does and
> doesn't support).

---

## II.4 Comparison across datasets — the joining question  → fusion (gated by Rule 5.0)

**Every method here is a fusion card. Before building any of them, apply the mental-model
test (Part I §5, Rule 5.0) and use the manifest's declared join template (Rule 5.1).**
Ordered from least to most analytically demanding.

### Method 4a — Dual-panel (synchronized x, no shared y)  *(add `syncId`)*

Two charts stacked vertically, sharing the x-axis (year), each with its own y-axis. The
reader sees both series at once; the x-axis is the common ground.

**Passes the test when** two genuinely related series are in different units that cannot
share an axis: `iphc_spawning_biomass` above, `iphc_tcey` below ("biomass drives the
quota"); `psc_weekly` above, `catch_weekly` below ("bycatch happened during which fishing
periods?" — archetype C).

Identical x-domain on both; hide the bottom x-axis. Recharts `syncId` links the cursor.

```jsx
<LineChart syncId="shared" data={biomass}>…</LineChart>
<LineChart syncId="shared" data={tcey}>…</LineChart>
```

### Method 4b — Dual y-axis  → `BarLine` (already enforces the house rule)

One chart, two y-axes, two series. The live `BarLine` (`ComposedChart`) is the canonical
implementation — **both axes are forced zero-based and the legend names each series**, so
the differing scales are explicit, not implied.

**Correct when** the two series have a genuine, direct causal or definitional
relationship and the user needs the proportionality: PSC counts (left) vs. directed catch
(right). **Wrong when** the series are merely correlated, or when the scale choice could
manufacture the correlation.

> A dual y-axis is one of the most misleading charts in existence when the scales are
> tuned to make the lines look parallel. Use it only when (1) a manifest-declared join
> exists and (2) the y-scales are defensible as natural — which, per the live `BarLine`
> and `CLAUDE.md`, means **both zero-based**. Do not freehand a `ComposedChart` with a
> non-zero axis to tighten a correlation.

### Method 4c — Ratio / derived series  → compute upstream, plot one line

Instead of two series, plot the single derived value the practitioner already thinks in:

- Observer coverage rate = observed ÷ total trips (already in `observer_coverage`).
- Catch ÷ TAC = utilization rate.
- First-wholesale value ÷ deflator = real value (the toggle, Rule 4.2a).
- Bycatch ÷ **escapement** = bycatch as a share of the **published escapement** — what
  `salmon_mortality_attribution` pre-computes (archetype E, Rule 5.5).

> **Doctrine tie — denominators (`CLAUDE.md`).** Use the denominator the agency
> publishes: **counted escapement** for Chinook/chum, **coastwide spawning biomass** for
> halibut. Call the result "share of escapement," **never "share of run."** Do **not**
> reconstruct "total run size" or any modeled denominator — that is the original agency's
> methodology decision, not Mainsail's. Where the ratio is published by the substrate as
> a derived dataset, render that; do not re-derive it in the chart (Rule 5.5).

### Method 4d — Scatter / correlation plot  *(requires `ScatterChart`; not yet imported)*

Two continuous variables, one per axis, one point per observation (usually a year).
Reveals whether a relationship is linear, curved, or absent — which a time series cannot.

**Passes the test when** the hypothesis is a *direct relationship*, not a time trend:
`iphc_spawning_biomass` (x) vs `iphc_tcey` (y); `hatchery_releases` (x) vs same-species
`salmon_commercial_harvest` (y). Both datasets are year-keyed; the join is a year join.

**Caution:** scatter invites causal inference. The subtitle/tooltip must say "relationship
across years," not "biomass drives quota." Add `ScatterChart` to the bundle to build this.

### Method 4e — Waterfall / attribution decomposition  → archetype E *(new renderer)*

For the ledger archetype, a waterfall shows a starting total, adds/subtracts each
component, and arrives at an ending total — making each pathway's contribution legible.
`salmon_mortality_attribution` is a mortality budget: escapement + each counted removal
(bycatch, in-river harvest) form one accounting.

Implement as a `BarChart` with transparent base segments (compute running totals
manually; Recharts has no native waterfall).

> **Doctrine tie — do not relabel the budget as "the run."** The waterfall's total is the
> **sum of the published pathways** (escapement + counted removals), presented as exactly
> that. It is **not** a reconstructed "total Chinook returning"/"total run size," which
> `CLAUDE.md` forbids Mainsail from modeling. Anchor and label the chart on the additive
> budget of published figures; if a component is not a published figure, it does not go
> in the budget. Split the series at the Templin↔Barclay seam (Rule 4.4b) — never draw a
> bar straight across it.

---

## II.5 Indicators and annotation — telling the reader what to see

A chart without annotation is a shape. Annotation turns a shape into an argument — within
the neutral-presentation bounds of `CLAUDE.md` (anchored, sourced, no causal claims in
Mainsail's voice).

### Method 5a — Threshold lines  → `ReferenceLine` (horizontal, already supported)

A horizontal `ReferenceLine` marking a policy threshold, management target, or historical
extreme; labeled inline. `MultiLine` and `StackedBar` already accept `refLines`. Uses:
goal bounds, a stock-of-concern threshold, a known structural break level.

### Method 5b — Period shading  *(requires `ReferenceArea`; not yet imported)*

A vertical `ReferenceArea` shading a meaningful span: a regulatory change, a regime shift,
an environmental event. This is the doctrine-preferred way to handle a non-comparable seam
(Rule 4.4b) — shade and *explain* the Templin↔Barclay GSI break rather than silently
breaking the line. Other uses: the post-2011 Chinook PSC-cap era on bycatch series; the
hatchery-expansion era on chum.

```jsx
// Needs: import { ReferenceArea } from "recharts"  ← not currently imported
<ReferenceArea x1={2011} x2={2024} fill="rgba(232,181,75,0.08)"
  label={{ value: "Templin baseline", position: "insideTopLeft", fontSize: 10 }} />
```

### Method 5c — Event annotations  *(vertical `ReferenceLine x=`; not yet wired)*

A vertical line at a specific year with a label — "PSC cap enacted," "warm blob." The
most information-dense annotation a chart can carry: one label, multiple series affected.
The current `refLines` support only horizontal (`y=`) lines; add an `x`-keyed variant.

### Method 5d — Inline callout on the latest value  *(custom `Label`; not yet wired)*

Label the end of each series directly with its name and current value, instead of a legend
lookup (the Bloomberg/Kpler convention). A custom `<Label>` on the last data point of each
`<Line>`.

> **Accessibility caveat (`CLAUDE.md`: color is never the only cue).** Inline end-labels
> may **supplement** the legend but must not be the *only* identifier if a series is
> otherwise distinguished by color alone. If every series carries a direct text label at
> its end, that satisfies the rule; if not, keep the `Legend`.

---

## II.6 Decision table — which method for which question

A lookup, not a style guide. The user's question picks the method; the archetype (Part I
§2) confirms it is possible.

| User question | Method | Archetype |
|---|---|---|
| Did this stock meet its goal? | Goal band with colored points (II.1a) | D |
| Was the forecast accurate? | Forecast vs. outcome overlay (II.1b) | D |
| How much of the TAC was used? | Utilization bar (II.1c) | C/D |
| How has this changed over time? | Line + rolling mean / YoY (II.2a/2b) | A/B |
| Is this above or below normal? | Indexed deviation from baseline (II.2c) | A/B |
| What is it made of? | Stacked area or bar (II.3a) | B/E |
| How does the composition change? | 100% stacked share chart (II.3c) | B/E |
| What happened during which week? | Dual panel, synchronized (II.4a) | C |
| Do these two things move together? | Dual y-axis (II.4b) — only if a causal join is declared | fusion |
| What fraction is this of the total? | Compute the ratio, plot one line (II.4c) | fusion |
| Is there a direct relationship? | Scatter chart (II.4d) | fusion |
| What removed each fish? | Waterfall / attribution (II.4e) | E |
| What does this number mean? | Threshold line or period shade (II.5a/5b) | any |

---

## II.7 Build priority — re-tiered to the real inventory

Honest about what exists (above). Items that the earlier draft called "low effort because
you have the components" in fact require new imports or components — reflected here.

**High value, genuinely low effort (reuse + a data transform):**
1. **Rolling 5-year mean overlay** on every noisy annual series (escapement, harvest).
   One derived array + a second `<Line>` in `MultiLine`. (II.2b)
2. **Indexed deviation** for cross-dataset comparison (biomass, TAC, harvest on one
   view). One normalization function + a 100 reference line on `MultiLine`. (II.2c)
3. **100% share charts** for GSI/composition. Normalize data, `StackedBar` with
   `yDomain={[0,100]}` — but keep the n (II.3c).

**High value, one new import/component:**
4. **Period shading** for the GSI/PSC seams — add `ReferenceArea`. (II.5b)
5. **YoY delta panel** — new small component; no `delta` code exists today. (II.2b)
6. **Goal band with colored points** for escapement compliance — add `ReferenceArea` +
   per-point coloring; the data/join logic already exists. (II.1a)
7. **Inline end-of-series labels** and **vertical event lines** — custom `Label` and an
   `x`-keyed `ReferenceLine`. (II.5c/5d)

**High value, new component + a data wire-up:**
8. **Scatter** of `iphc_spawning_biomass` vs `iphc_tcey` — add `ScatterChart`; year join.
   (II.4d)
9. **Waterfall** for `salmon_mortality_attribution` — new renderer; also wire the dataset
   into `src/api/types.ts` first, and anchor on the published budget, not a reconstructed
   run (II.4e).
10. **TAC utilization bar** — new horizontal-bar component; ratio computed upstream
    (II.1c/4c).

---

## II.8 The one rule that governs all of these

**The method should make the practitioner's question visible without making them do the
arithmetic.** A manager asking "is bycatch too high?" should see a ratio against the
published escapement, not two raw counts. An economist asking "are real prices
recovering?" should see the deflated series, not nominal with a footnote. A biologist
asking "is the stock above historical norms?" should see the index chart, not a raw series
they must mentally compare to a remembered baseline.

Every method here does that arithmetic for the user, shows the result, and makes the
underlying structure visible through annotation — **within the neutral-presentation
contract of `CLAUDE.md` and the archetype/fusion rules of Part I.** The line graph with
toggles is where you start. These methods are how you get from a correct chart to a
useful one.
