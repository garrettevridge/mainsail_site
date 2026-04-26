// Dataset-shaping helpers that encode binding rules from
// mainsail_data/CLAUDE.md so consumers don't have to re-implement them.

import type { SalmonEscapementRow, PscWeeklyDataRow } from "./types";

// Per CLAUDE.md "count_method Exemptions": any goal-compliance or trend
// analysis against salmon_escapement MUST exclude rows whose count_method
// starts with not_operated_ or partial_season_. These rows are not complete
// censuses and cannot be compared to annual goals.
export function filterCountableEscapement(
  rows: SalmonEscapementRow[] | undefined
): SalmonEscapementRow[] {
  if (!rows) return [];
  return rows.filter(
    (r) =>
      r.count_method == null ||
      (!r.count_method.startsWith("not_operated_") &&
        !r.count_method.startsWith("partial_season_"))
  );
}

// psc_weekly is a unioned salmon/halibut/crab table; salmon analyses must
// filter on psc_type before aggregating psc_count, otherwise halibut weights
// (kg) and crab counts get summed into a meaningless number.
export function filterPscByType(
  rows: PscWeeklyDataRow[] | undefined,
  psc_type: PscWeeklyDataRow["psc_type"]
): PscWeeklyDataRow[] {
  if (!rows) return [];
  return rows.filter((r) => r.psc_type === psc_type);
}
