// Mainsail Data Brief — editorial palette (design handoff, 2026).
// Warm-paper neutrals, terracotta accent, teal secondary. Greys here are a
// deliberate editorial ink scale, not the "all-black" deck scheme.

export const ACCENT = "#b8421e"; // terracotta — bycatch / the contested slice
export const TEAL = "#2f6b73"; // secondary — escapement / observer / directed
export const CLAY = "#c97f4a"; // third line — electronic monitoring
export const HATCHERY = "#7b6a4f"; // chum Asian-hatchery line

// Ink scale (headline → muted label)
export const INK_HEAD = "#15140f";
export const INK = "#1a1916"; // primary
export const INK_2 = "#3a3833";
export const INK_3 = "#4a463e"; // dek / strong body
export const INK_BODY = "#56524b"; // block caption body
export const INK_4 = "#6a665e"; // methodology body
export const INK_5 = "#7a7770";
export const INK_MUTED = "#8a8579"; // kickers, legend values
export const INK_FAINT = "#a39e92"; // mono labels, axis ticks

// Surfaces
export const PAGE = "#ffffff";
export const ALT = "#fcfbf7"; // alternating block
export const METH_BG = "#faf8f2"; // methodology recess
export const FOOTER_BG = "#15140f";

// Rules
export const RULE_SECTION = "#e7e3d9";
export const RULE_BLOCK = "#f0ece2";
export const RULE_NAV = "#ece8dd";
export const RULE_AXIS = "#d8d3c6"; // chart baseline
export const RULE_GRID = "#efece3"; // chart gridline
export const RULE_3 = RULE_BLOCK; // back-compat for older imports

// Neutral chart grays (proportion-bar non-accent segments, light → lighter)
export const NEUTRAL = ["#bcb6aa", "#cdc7bb", "#d2ccc0", "#ddd8cd", "#e8e4d9"];
export const LANDSCAPE_PARTIAL = "#b0ada4";
export const LANDSCAPE_ZERO = "#e1ded3";

// Recharts: light axis/grid lines, mono grey tick text (per design).
export const AXIS = RULE_AXIS;
export const CHART_TICK = INK_FAINT;
export const BAND_STROKE = PAGE; // separator between stacked bands

// Categorical scale (kept for any multi-series chart)
export const SERIES = [TEAL, ACCENT, "#d2a23f", "#6e8c5a", "#7d5a7f", "#3f5a78", CLAY, "#8a8780"];
