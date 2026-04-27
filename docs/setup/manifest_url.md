# Wiring `mainsail_site` to the live S3 manifest

**Audience:** maintainer flipping the site from mock fixtures to real S3.
**Time:** ~3 minutes once the `mainsail_data` first publish has succeeded.

This is the second-to-last step in the full cutover. Prerequisites:

- [ ] `mainsail_data` GH Secrets are placed (see `mainsail_data/docs/setup/github_secrets.md`).
- [ ] First successful run of `reconcile-and-publish` has uploaded artifacts to S3.
- [ ] `curl https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json` returns 200.

If any prereq is missing, do not proceed — the site will deploy successfully against an empty/stale manifest and you'll spend an hour debugging "why isn't my chart updating."

---

## Step 1 — Set the variable in GitHub

In the `mainsail_site` repo on GitHub:

**Settings → Secrets and variables → Actions → Variables tab → New repository variable:**

- [ ] Name: `VITE_MANIFEST_URL`
- [ ] Value: `https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json`

(Variable, not Secret — the URL is public.)

---

## Step 2 — Trigger a redeploy

Two options:

- **Easier:** push any commit to `main` (a CHANGELOG entry, a README tweak). Deploy workflow runs automatically.
- **No-commit:** GitHub → Actions tab → **Deploy** workflow → **Run workflow** dropdown → Run on `main`.

Wait ~3–5 min for the build to finish. Watch for build-step failures — anything from the cutover audit (CUTOVER_AUDIT.md) should already be addressed by commit `7326f1f`.

---

## Step 3 — Verify each topic page

Open the live URL (likely `https://garrettevridge.github.io/mainsail_site/` per Pages config). Click each topic and watch:

- [ ] `/topics/fisheries-management` — table of escapement + commercial-harvest pivot
- [ ] `/topics/biomass` — TAC specs table
- [ ] `/topics/observer` — coverage charts (this is the one most likely to surface a bug; touched the new `monitored_catch` enum casing)
- [ ] `/topics/halibut` — IPHC mortality charts + DMR table
- [ ] `/topics/chinook` — PSC trend, GSI table, escapement
- [ ] `/topics/chum` — commercial harvest, hatchery, escapement
- [ ] `/topics/discards` — retained vs discarded by gear/sector

For each: open browser devtools (Cmd+Opt+I) → **Console** tab → look for red errors. The most likely class of bug is "cannot read property X of undefined" — that means a field expected by the type interface isn't actually in the published JSON. CUTOVER_AUDIT.md predicts the most likely culprits.

If you see issues:
- Note the topic + the failing chart/table
- Note the dataset(s) that page uses (per CUTOVER_AUDIT.md tables)
- Tell me; I'll cross-check the published JSON shape and patch the type interface

---

## Step 4 — Lock it in

Once all 7 topics render cleanly:

- [ ] Add a short CHANGELOG.md entry: "Cut `mainsail_site` over from mock fixtures to live S3 manifest at \[date\]."
- [ ] Update `mainsail_data/MILES.md` to mark MILES §2a (failure alerting) as the next priority — publish is live but unmonitored.
- [ ] Mark Phase 1 action #1 as ✅ in `PROJECT_PLAN_2026-04-25.md`.

---

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| All pages still show mock data | Variable was set on the wrong branch's environment, or page wasn't redeployed | Hard-refresh (Cmd+Shift+R); check the deployed `dist/` for the env var bake-in |
| Some pages render, others show "no data" | Field-shape mismatch between type interface and published JSON | Check the topic's source datasets in CUTOVER_AUDIT.md; spot-check the JSON shape |
| Console: `Failed to fetch` | CORS or wrong URL | Check the bucket policy applied; URL should match exactly the curl test above |
| Charts render but values look wrong | Field semantics differ (e.g., units, enum case) | Same as field-shape — but a harder kind to spot |
| Build fails before deploy | TypeScript compile error from a dataset shape change | Run `npx tsc -b` locally; fix the offending interface |

---

## Rollback (if needed)

To roll back to mock data quickly: delete the `VITE_MANIFEST_URL` variable on the Variables tab, then redeploy. The site falls through to `public/mock-data/manifest.json` per the default in `src/api/manifest.ts:14`.
