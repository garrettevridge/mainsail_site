// Alaska Fisheries Reference Dashboard — panel definitions
// Tables-first, neutral presentation. Figures cited from briefings/*.md.

// --- Palette from CSS vars (recomputed on each chart build) -----------------
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
function PAL() {
  return {
    ink:     cssVar('--ink',       '#121212'),
    inkSoft: cssVar('--ink-soft',  '#333333'),
    muted:   cssVar('--muted',     '#666666'),
    rule:    cssVar('--rule',      '#dcdcdc'),
    ruleSoft:cssVar('--rule-soft', '#ececec'),
    blue:    cssVar('--accent-blue',   '#1a5fb4'),
    red:     cssVar('--accent-red',    '#b4261a'),
    yellow:  cssVar('--accent-yellow', '#c79a0c'),
    accent:  cssVar('--accent',    '#1a5fb4'),
    accent2: cssVar('--accent-2',  '#b4261a'),
    accent3: cssVar('--accent-3',  '#c79a0c'),
  };
}

const TOPICS = [
  { id: 'management', title: 'Fisheries Management' },
  { id: 'biomass',    title: 'Biomass, TAC & ABC' },
  { id: 'observer',   title: 'Observer Coverage' },
  { id: 'halibut',    title: 'Halibut Mortality by Source' },
  { id: 'chinook',    title: 'Chinook Mortality & Genetics' },
  { id: 'chum',       title: 'Chum Salmon Mortality & Genetics' },
  { id: 'discards',   title: 'Discards & Utilization' },
];

// ====================================================================
// Helpers
// ====================================================================
const svgNS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, ...children) {
  const e = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of children) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}
function fmt(n, d = 0) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

// ====================================================================
// CHART: simple line / bar engine
// ====================================================================
function lineChart({ series, xDomain, yDomain, width = 680, height = 260, yTicks = 5, yLabel = '', xTicks, annotations = [] }) {
  const m = { t: 16, r: 16, b: 28, l: 46 };
  const W = width, H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const [x0, x1] = xDomain, [y0, y1] = yDomain;
  const sx = (v) => m.l + ((v - x0) / (x1 - x0)) * iw;
  const sy = (v) => m.t + ih - ((v - y0) / (y1 - y0)) * ih;

  const svg = el('svg', { class: 'chart', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });

  // y grid + ticks
  for (let i = 0; i <= yTicks; i++) {
    const v = y0 + (y1 - y0) * i / yTicks;
    const y = sy(v);
    svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y, stroke: PAL().ruleSoft, 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end', 'font-size': 10, 'font-family': 'JetBrains Mono, monospace', fill: PAL().muted }, fmt(v)));
  }

  // x ticks
  const xt = xTicks || Array.from({ length: Math.min(8, x1 - x0 + 1) }, (_, i) => Math.round(x0 + (x1 - x0) * i / Math.min(7, x1 - x0)));
  xt.forEach(v => {
    const x = sx(v);
    svg.appendChild(el('line', { x1: x, x2: x, y1: m.t + ih, y2: m.t + ih + 3, stroke: PAL().muted }));
    svg.appendChild(el('text', { x, y: H - 10, 'text-anchor': 'middle', 'font-size': 10, 'font-family': 'JetBrains Mono, monospace', fill: PAL().muted }, String(v)));
  });

  // axis
  svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih, stroke: PAL().ink, 'stroke-width': 1 }));

  // annotations (vertical lines with labels)
  annotations.forEach(a => {
    const x = sx(a.x);
    svg.appendChild(el('line', { x1: x, x2: x, y1: m.t, y2: m.t + ih, stroke: PAL().accent2, 'stroke-dasharray': '3 3', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: x + 4, y: m.t + 10, 'font-size': 10, fill: PAL().accent2, 'font-family': 'Inter' }, a.label));
  });

  // series
  series.forEach(s => {
    const pts = s.data.map(d => `${sx(d[0])},${sy(d[1])}`).join(' ');
    svg.appendChild(el('polyline', { points: pts, fill: 'none', stroke: s.color, 'stroke-width': 1.8 }));
    s.data.forEach(d => svg.appendChild(el('circle', { cx: sx(d[0]), cy: sy(d[1]), r: 2.2, fill: s.color })));
  });

  // y label
  if (yLabel) svg.appendChild(el('text', { x: 8, y: m.t + ih / 2, 'font-size': 10, fill: PAL().muted, transform: `rotate(-90 8 ${m.t + ih/2})`, 'text-anchor': 'middle' }, yLabel));

  return svg;
}

function stackedBar({ categories, series, width = 680, height = 260, yLabel = '', yFmt = fmt }) {
  const m = { t: 16, r: 16, b: 40, l: 50 };
  const W = width, H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const n = categories.length;
  const bw = iw / n * 0.72;
  const gap = iw / n * 0.28;

  // compute stack totals per category
  const totals = categories.map((_, i) => series.reduce((s, ser) => s + (ser.data[i] || 0), 0));
  const yMax = Math.max(...totals) * 1.1;

  const sx = (i) => m.l + (iw / n) * i + gap / 2;
  const sy = (v) => m.t + ih - (v / yMax) * ih;

  const svg = el('svg', { class: 'chart', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });

  // y ticks
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const v = (yMax * i) / yTicks;
    const y = sy(v);
    svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y, stroke: PAL().ruleSoft }));
    svg.appendChild(el('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end', 'font-size': 10, fill: PAL().muted, 'font-family': 'JetBrains Mono, monospace' }, yFmt(Math.round(v))));
  }

  // bars
  categories.forEach((c, i) => {
    let acc = 0;
    series.forEach(ser => {
      const v = ser.data[i] || 0;
      const y = sy(acc + v);
      const h = ih - (sy(v) - m.t);
      if (v > 0) svg.appendChild(el('rect', { x: sx(i), y, width: bw, height: Math.max(0.5, ih - (sy(v + acc) - m.t) - (ih - (sy(acc) - m.t))), fill: ser.color }));
      acc += v;
    });
    // redo bars properly:
  });

  // Redo bars with correct math (clearer)
  categories.forEach((_, i) => {
    let acc = 0;
    series.forEach(ser => {
      const v = ser.data[i] || 0;
      if (v <= 0) return;
      const y1 = sy(acc + v);
      const y2 = sy(acc);
      svg.appendChild(el('rect', { x: sx(i), y: y1, width: bw, height: y2 - y1, fill: ser.color }));
      acc += v;
    });
  });

  // Remove duplicates: the first loop drew possibly malformed rects; clear and re-add
  // Simpler: rebuild the svg with only the second set
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // y grid + ticks again
  for (let i = 0; i <= yTicks; i++) {
    const v = (yMax * i) / yTicks;
    const y = sy(v);
    svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y, stroke: PAL().ruleSoft }));
    svg.appendChild(el('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end', 'font-size': 10, fill: PAL().muted, 'font-family': 'JetBrains Mono, monospace' }, yFmt(Math.round(v))));
  }

  // bars (clean pass)
  categories.forEach((c, i) => {
    let acc = 0;
    series.forEach(ser => {
      const v = ser.data[i] || 0;
      if (v <= 0) return;
      const y1 = sy(acc + v);
      const y2 = sy(acc);
      svg.appendChild(el('rect', { x: sx(i), y: y1, width: bw, height: y2 - y1, fill: ser.color }));
      acc += v;
    });
    // category label
    svg.appendChild(el('text', { x: sx(i) + bw / 2, y: H - 22, 'text-anchor': 'middle', 'font-size': 10, fill: PAL().muted, 'font-family': 'JetBrains Mono, monospace' }, String(c)));
  });

  svg.appendChild(el('line', { x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih, stroke: PAL().ink }));

  if (yLabel) svg.appendChild(el('text', { x: 8, y: m.t + ih / 2, 'font-size': 10, fill: PAL().muted, transform: `rotate(-90 8 ${m.t + ih/2})`, 'text-anchor': 'middle' }, yLabel));

  return svg;
}

// Horizontal proportion bar (for "where the mortality goes")
function proportionBar({ parts, width = 680, height = 56 }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const W = width, H = height;
  const svg = el('svg', { class: 'chart', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' });
  let x = 0;
  parts.forEach(p => {
    const w = (p.value / total) * W;
    svg.appendChild(el('rect', { x, y: 8, width: w, height: 26, fill: p.color }));
    if (w > 60) {
      svg.appendChild(el('text', { x: x + w / 2, y: 25, 'text-anchor': 'middle', 'font-size': 11, fill: '#ffffff', 'font-family': 'Inter', 'font-weight': 600 },
        ((p.value / total) * 100).toFixed(p.value / total < 0.05 ? 1 : 0) + '%'));
    }
    x += w;
  });
  return svg;
}

function legend(items) {
  const div = document.createElement('div');
  div.className = 'legend';
  items.forEach(i => {
    const s = document.createElement('div');
    s.innerHTML = `<span class="sw" style="background:${i.color}"></span>${i.label}`;
    div.appendChild(s);
  });
  return div;
}

// ====================================================================
// Build navigation
// ====================================================================
const navEl = document.getElementById('nav');
TOPICS.forEach((t, i) => {
  const li = document.createElement('li');
  li.className = 'topic-link';
  li.dataset.id = t.id;
  li.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span><span>${t.title}</span>`;
  li.addEventListener('click', () => show(t.id));
  navEl.appendChild(li);
});

// ====================================================================
// PANELS
// ====================================================================
const panelsEl = document.getElementById('panels');
let __activeId = null;
function section(id, title, headHtml) {
  const sec = document.createElement('section');
  sec.className = 'topic-section';
  sec.id = 'sec-' + id;
  sec.innerHTML = headHtml;
  panelsEl.appendChild(sec);
  return sec;
}

// Wrapped so we can rebuild after palette changes
function buildAllPanels() {
  panelsEl.innerHTML = '';
  buildManagement();
  buildBiomass();
  buildObserver();
  buildHalibut();
  buildChinook();
  buildChum();
  buildDiscards();
}
window.rebuildPanels = function () {
  buildAllPanels();
  if (__activeId) show(__activeId);
};

function makeTable(head, rows, cls = '') {
  const t = document.createElement('table');
  t.className = 'data ' + cls;
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  head.forEach(h => {
    const th = document.createElement('th');
    if (typeof h === 'object') {
      th.textContent = h.label;
      if (h.num) th.className = 'num';
    } else th.textContent = h;
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  t.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach(r => {
    const tr = document.createElement('tr');
    r.forEach((c, i) => {
      const td = document.createElement('td');
      const spec = head[i];
      if (typeof spec === 'object' && spec.num) td.className = 'num';
      if (typeof spec === 'object' && spec.yr) td.className = 'yr';
      if (typeof c === 'object' && c.html) td.innerHTML = c.html;
      else td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  t.appendChild(tbody);
  return t;
}

// ====================================================================
// TOPIC 1 — FISHERIES MANAGEMENT
// ====================================================================
function buildManagement() {
  const s = section('management', 'Fisheries Management',
    `<div class="crumb">Topic 01</div>
     <h1 class="page-title">Fisheries Management</h1>
     <p class="page-lede first-sentence">Alaska supplies more than half of all U.S. seafood by weight, drawn from some of the most productive marine ecosystems in the world — and it does so under a fisheries management system that is unusual for its scientific basis, its layered jurisdiction, and its record of avoiding stock collapse since statehood in 1959.</p>
     <p class="page-lede">Three bodies share authority. The <b>State of Alaska</b> manages all salmon, herring, shellfish, and nearshore groundfish inside three nautical miles from shore. The <b>federal government</b>, through NMFS and the North Pacific Fishery Management Council, manages groundfish and crab between 3 and 200 miles. <b>Pacific halibut</b> is managed coastwide by the International Pacific Halibut Commission under a 1923 U.S.–Canada treaty — the oldest active fisheries treaty in North America.</p>
     <p class="page-lede">Each body sets catch limits through a public, peer-reviewed process: biologists estimate what the stock can support, the limit is reduced for uncertainty and policy considerations, and the final number is published before the season opens. The rest of this page describes that system as it stands today.</p>`);

  // State vs federal jurisdiction
  const h2 = document.createElement('h2'); h2.className = 'h2'; h2.textContent = 'Jurisdiction at a glance';
  s.appendChild(h2);

  const jurisdictionCard = document.createElement('div'); jurisdictionCard.className = 'card';
  jurisdictionCard.appendChild(makeTable(
    ['Fishery', 'Waters', 'Managing body', 'Authority'],
    [
      ['All salmon',        '0–200 nm', 'State — ADF&G Division of Commercial Fisheries', 'Alaska statutes + Board of Fisheries regs'],
      ['Herring',           '0–200 nm', 'State — ADF&G', 'Alaska statutes + Board of Fisheries'],
      ['State-waters groundfish', '0–3 nm', 'State — ADF&G', 'Alaska statutes + Board of Fisheries'],
      ['Federal groundfish (pollock, cod, sablefish, flatfish, etc.)', '3–200 nm', 'Federal — NMFS AKRO, advised by NPFMC', 'Magnuson-Stevens Act + FMPs'],
      ['BSAI & GOA crab',   '3–200 nm', 'Federal — NMFS, state cooperatively', 'MSA + state-federal crab FMPs'],
      ['Pacific halibut',   'Coastwide (AK, BC, WA, OR, CA)', 'International — IPHC, implemented by NMFS (US) and DFO (CA)', 'Halibut Convention Act of 1982'],
      ['Federal subsistence (rural, federal lands/waters)', 'Federal public waters', 'USFWS Office of Subsistence Management', 'ANILCA Title VIII'],
      ['Recreational (sport)', '0–200 nm', 'State inside 3 nm; charter halibut co-managed with IPHC/NMFS', 'AK statutes + 50 CFR 300 Subpart E'],
    ]
  ));
  s.appendChild(jurisdictionCard);

  // Federal vs state process
  const h3 = document.createElement('h3'); h3.className = 'h3'; h3.textContent = 'How rules are made';
  s.appendChild(h3);

  const grid = document.createElement('div'); grid.className = 'grid-2';
  const fedCard = document.createElement('div'); fedCard.className = 'card';
  fedCard.innerHTML = `
    <div><span class="pill fed">Federal</span></div>
    <h3 class="card-title">North Pacific Fishery Management Council</h3>
    <div class="card-sub">MSA-chartered body · Anchorage-based · 15 voting members (AK, WA, OR, federal, tribal)</div>
    <dl class="kv">
      <dt>Meets</dt><dd>5× per year, publicly, with SSC and AP advisory bodies</dd>
      <dt>Key outputs</dt><dd>Fishery Management Plans (FMPs), annual harvest specifications, PSC caps, gear &amp; area rules</dd>
      <dt>Science</dt><dd>Stock assessments from AFSC (NOAA Alaska Fisheries Science Center); SAFE reports annually</dd>
      <dt>Implements</dt><dd>NMFS AKRO promulgates and enforces as federal regulations (50 CFR 679)</dd>
    </dl>
  `;
  grid.appendChild(fedCard);

  const stCard = document.createElement('div'); stCard.className = 'card';
  stCard.innerHTML = `
    <div><span class="pill st">State</span></div>
    <h3 class="card-title">Alaska Board of Fisheries</h3>
    <div class="card-sub">7 members appointed by the Governor · 4–6 meetings per year on regional cycles</div>
    <dl class="kv">
      <dt>Cycle</dt><dd>Three-year rotation by region (Lower Cook Inlet, Bristol Bay, AYK, etc.)</dd>
      <dt>Key outputs</dt><dd>Management plans, escapement goals, allocation between user groups</dd>
      <dt>Science</dt><dd>ADF&amp;G Division of Commercial Fisheries and Division of Sport Fish</dd>
      <dt>Implements</dt><dd>ADF&amp;G area managers exercise emergency order authority in-season</dd>
    </dl>
  `;
  grid.appendChild(stCard);
  s.appendChild(grid);

  // IPHC + transboundary
  const h4 = document.createElement('h2'); h4.className = 'h2'; h4.textContent = 'Transboundary bodies';
  s.appendChild(h4);

  const intTable = makeTable(
    ['Body', 'Parties', 'Scope', 'Est.'],
    [
      ['International Pacific Halibut Commission (IPHC)', 'U.S. & Canada', 'Stock assessment, catch limits (TCEY), regulation of the halibut fishery coastwide', '1923'],
      ['Pacific Salmon Commission', 'U.S. & Canada', 'Transboundary salmon sharing under the Pacific Salmon Treaty (Stikine, Taku, Alsek; WCVI Chinook)', '1985'],
      ['Yukon River Panel', 'U.S. & Canada', 'Yukon Chinook, chum and coho management under the Yukon River Salmon Agreement', '1995'],
      ['North Pacific Anadromous Fish Commission (NPAFC)', 'U.S., Canada, Japan, Russia, Korea', 'High-seas salmon research and enforcement of no-directed-harvest rule beyond EEZs', '1993'],
      ['International Convention for the Conservation of Antarctic Living Marine Resources / IATTC etc.', 'Multilateral', 'Not Alaska-applicable but relevant to U.S. fisheries context', '—'],
    ]
  );
  const intCard = document.createElement('div'); intCard.className = 'card';
  intCard.appendChild(intTable);
  s.appendChild(intCard);

  const note = document.createElement('div'); note.className = 'note';
  note.innerHTML = `<b>IPHC.</b> The International Pacific Halibut Commission was established in 1923 by treaty between the U.S. and Canada. Its annual stock assessment consolidates halibut mortality reported by U.S. and Canadian agencies into a single coastwide ledger.`;
  s.appendChild(note);
}

// ====================================================================
// TOPIC 2 — BIOMASS, TAC & ABC
// ====================================================================
function buildBiomass() {
  const s = section('biomass', 'Biomass, TAC & ABC',
    `<div class="crumb">Topic 02</div>
     <h1 class="page-title">Biomass, TAC &amp; ABC</h1>
     <p class="page-lede first-sentence">Every federally-managed groundfish stock in Alaska — pollock, cod, sablefish, the flatfishes, rockfish — carries an annual catch limit that is built, not chosen. Stock assessment scientists first estimate the biomass in the water and the biological maximum it could theoretically yield; the Council then reduces that figure twice before anyone fishes.</p>
     <p class="page-lede">The sequence is <b>OFL → ABC → TAC → Catch</b>. The Overfishing Limit (OFL) is the biological maximum. The Acceptable Biological Catch (ABC) steps it down for scientific uncertainty. The Total Allowable Catch (TAC) steps it down again for Council policy — bycatch limits, ecosystem caps, the 2-million-ton BSAI optimum yield ceiling. Realized catch is what the fleet actually lands.</p>
     <p class="page-lede">Across the Bering Sea-Aleutian Islands and Gulf of Alaska combined, exploitable groundfish biomass is in the tens of millions of metric tons. Realized annual harvest is typically below 10% of that biomass, and below the TAC for most stocks.</p>`);

  // Funnel flow
  const h0 = document.createElement('h2'); h0.className = 'h2'; h0.textContent = 'From biomass estimate to landed fish';
  s.appendChild(h0);

  const flow = document.createElement('div'); flow.className = 'flow';
  [
    { l: 'Exploitable biomass', v: '~26 M mt', s: 'AFSC stock assessments, BSAI+GOA' },
    { l: 'Overfishing Limit (OFL)', v: 'F₀₋MSY', s: 'Max sustainable fishing mortality' },
    { l: 'Accept. Biol. Catch (ABC)', v: '≤ OFL', s: 'OFL minus scientific uncertainty' },
    { l: 'TAC (sum of stocks)', v: '≤ ABC', s: 'Capped at 2 M mt in BSAI' },
    { l: 'Actual catch', v: '≤ TAC', s: '2024: ~2.0 M mt all AK' },
  ].forEach(x => {
    const d = document.createElement('div'); d.className = 'flow-step';
    d.innerHTML = `<div class="step-label">${x.l}</div><div class="step-value">${x.v}</div><div style="font-size:10.5px;color:var(--muted);margin-top:4px">${x.s}</div>`;
    flow.appendChild(d);
  });
  s.appendChild(flow);

  // Stats strip
  const stats = document.createElement('div'); stats.className = 'stats';
  stats.innerHTML = `
    <div class="stat"><div class="stat-val">~26 M mt</div><div class="stat-lbl">Exploitable groundfish biomass</div><div class="stat-sub">BSAI + GOA, recent SAFE</div></div>
    <div class="stat"><div class="stat-val">2.0 M mt</div><div class="stat-lbl">BSAI TAC cap (statutory)</div><div class="stat-sub">Set by MSA — a hard ceiling</div></div>
    <div class="stat"><div class="stat-val">~8%</div><div class="stat-lbl">Approx. realized exploitation rate</div><div class="stat-sub">Catch ÷ exploitable biomass</div></div>
    <div class="stat"><div class="stat-val">&gt;92%</div><div class="stat-lbl">Fraction left in the ocean</div><div class="stat-sub">After each year's harvest</div></div>
  `;
  s.appendChild(stats);

  // Scientific process
  const h1 = document.createElement('h2'); h1.className = 'h2'; h1.textContent = 'The scientific process';
  s.appendChild(h1);

  const procCard = document.createElement('div'); procCard.className = 'card';
  procCard.appendChild(makeTable(
    ['Step', 'Who', 'What they produce', 'Cadence'],
    [
      ['1. Bottom-trawl &amp; acoustic surveys', 'NOAA AFSC', 'Fishery-independent abundance indices by species × area', 'Annual (EBS shelf); biennial (GOA, AI)'],
      ['2. Age/length sampling', 'AFSC + industry observers', 'Age composition, growth, maturity for each stock', 'Annual'],
      ['3. Stock assessment model', 'AFSC assessment authors', 'Spawning biomass, recruitment, F-rates, OFL, ABC', 'Annual or biennial per stock'],
      ['4. SSC review', 'NPFMC Scientific &amp; Statistical Committee', 'Recommended ABC; may reduce below author-recommended value', 'Annual (Dec)'],
      ['5. Council specifications', 'NPFMC', 'TACs by stock and area, PSC caps, apportionments', 'Annual (Dec)'],
      ['6. Federal rulemaking', 'NMFS AKRO', 'Final harvest specifications in Federal Register', 'Annual (Mar of fishing year)'],
      ['7. In-season management', 'NMFS AKRO + industry co-ops', 'Open/close dates, sector allocations, re-apportionments', 'Continuous'],
    ]
  ));
  s.appendChild(procCard);

  // BSAI 2024 specs table
  const h2 = document.createElement('h2'); h2.className = 'h2'; h2.textContent = '2024 BSAI groundfish specifications';
  s.appendChild(h2);
  const p2 = document.createElement('p'); p2.className = 'section-intro';
  p2.textContent = 'Columns show the regulatory step-down from biological limit to actual catch. Catch ÷ Biomass on the right-hand column is the realized exploitation rate — typically well below 10%.';
  s.appendChild(p2);

  const bsaiTable = makeTable(
    ['Stock', { label: 'Biomass (kt)', num: true }, { label: 'OFL (kt)', num: true }, { label: 'ABC (kt)', num: true }, { label: 'TAC (kt)', num: true }, { label: 'Catch (kt)', num: true }, { label: 'Catch / Biomass', num: true }],
    [
      ['BSAI walleye pollock',     '9,660', '2,313', '1,300', '1,300', '1,299', '13.4%'],
      ['BSAI Pacific cod',         '  640', '  168', '  136', '  111', '  103', '16.1%'],
      ['BSAI Atka mackerel',       '  372', '  110', '   82', '   74', '   49', '13.2%'],
      ['Yellowfin sole (EBS)',     '2,170', '  260', '  236', '  130', '  108', ' 5.0%'],
      ['Rock sole (EBS/AI)',       '1,040', '  136', '  123', '   47', '   22', ' 2.1%'],
      ['Arrowtooth flounder (BSAI)', '  780', '  105', '   88', '   20', '    8', ' 1.0%'],
      ['Sablefish (BSAI)',         '  210', '   31', '   27', '   21', '   20', ' 9.5%'],
      ['BSAI flathead sole',       '  475', '   67', '   56', '   15', '    7', ' 1.5%'],
      ['BSAI Greenland turbot',    '   84', '    5', '    4', '    4', '    3', ' 3.6%'],
    ]
  );
  const t2Card = document.createElement('div'); t2Card.className = 'card';
  t2Card.appendChild(bsaiTable);
  const cap2 = document.createElement('div'); cap2.style.cssText = 'font-size:11px;color:var(--muted);margin-top:6px;';
  cap2.innerHTML = 'kt = thousand metric tons. Biomass values are exploitable biomass from the 2023/24 SAFE reports, rounded. The 2 million metric-ton optimum yield cap on BSAI applies to the sum of TACs, not to individual stock ABCs.';
  t2Card.appendChild(cap2);
  s.appendChild(t2Card);

  // Chart: catch vs TAC vs ABC trend (BSAI pollock illustrative)
  const h3 = document.createElement('h2'); h3.className = 'h2'; h3.textContent = 'BSAI pollock — the biggest single-species fishery';
  s.appendChild(h3);
  const pw = document.createElement('div'); pw.className = 'chart-wrap card';
  pw.innerHTML = `<div class="chart-title">BSAI pollock OFL, ABC, TAC and catch (thousand mt)</div>
                  <div class="chart-sub">Catch consistently ≤ TAC ≤ ABC ≤ OFL. The 2 M-mt BSAI cap binds when pollock ABC rises above it.</div>`;
  const years = [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];
  const ofl = [2803,3413,3910,3640,3914,4797,3914,4117,4127,3653,2313];
  const abc = [1637,1637,2090,2800,2979,3914,1842,1952,2090,1945,1300];
  const tac = [1310,1310,1340,1345,1364,1397,1425,1375,1300,1300,1300];
  const cat = [1302,1308,1349,1351,1379,1395,1398,1365,1293,1299,1299];
  pw.appendChild(lineChart({
    series: [
      { name: 'OFL', color: PAL().red, data: years.map((y,i)=>[y, ofl[i]]) },
      { name: 'ABC', color: PAL().yellow, data: years.map((y,i)=>[y, abc[i]]) },
      { name: 'TAC', color: PAL().blue, data: years.map((y,i)=>[y, tac[i]]) },
      { name: 'Catch', color: PAL().ink, data: years.map((y,i)=>[y, cat[i]]) },
    ],
    xDomain: [2014, 2024], yDomain: [0, 5000], yTicks: 5,
    xTicks: [2014,2016,2018,2020,2022,2024]
  }));
  pw.appendChild(legend([
    { color: PAL().red, label: 'OFL (Overfishing Limit)' },
    { color: PAL().yellow, label: 'ABC (Acceptable Biol. Catch)' },
    { color: PAL().blue, label: 'TAC (Council spec)' },
    { color: PAL().ink, label: 'Actual catch' },
  ]));
  s.appendChild(pw);

  // Halibut SB
  const h4 = document.createElement('h2'); h4.className = 'h2'; h4.textContent = 'Halibut — coastwide spawning biomass';
  s.appendChild(h4);
  const p4 = document.createElement('p'); p4.className = 'section-intro';
  p4.textContent = 'Pacific halibut is assessed by IPHC separately, coastwide. Spawning biomass has declined from the late-1990s peak and TCEY is recalibrated annually against it.';
  s.appendChild(p4);
  const hw = document.createElement('div'); hw.className = 'chart-wrap card';
  hw.innerHTML = `<div class="chart-title">IPHC coastwide female spawning biomass (M lb, net)</div>
                  <div class="chart-sub">1997 peak &gt; 430 M lb; 2024 ≈ 178 M lb. Schematic — verify against latest AM assessment.</div>`;
  const hYears = [1997,2000,2005,2010,2015,2020,2024];
  const hSb = [430, 395, 315, 235, 210, 190, 178];
  hw.appendChild(lineChart({
    series: [{ color: PAL().blue, data: hYears.map((y,i)=>[y, hSb[i]]) }],
    xDomain: [1997, 2024], yDomain: [0, 500], yTicks: 5,
    xTicks: [1997,2000,2005,2010,2015,2020,2024],
  }));
  s.appendChild(hw);

  const note = document.createElement('div'); note.className = 'note';
  note.innerHTML = `<b>Definitions.</b> OFL is a biological limit. ABC is OFL reduced for scientific uncertainty. TAC is ABC reduced for Council policy considerations, including social, economic and PSC interactions. Catch is the realized harvest. In recent years, realized catch has generally been at or below TAC, and TAC has been at or below ABC.`;
  s.appendChild(note);
}

// ====================================================================
// TOPIC 3 — OBSERVER COVERAGE
// ====================================================================
function buildObserver() {
  const s = section('observer', 'Observer Coverage',
    `<div class="crumb">Topic 03</div>
     <h1 class="page-title">Observer Coverage</h1>
     <p class="page-lede first-sentence">The catch limits set each year are only as credible as the data that feeds them — and in Alaska, that data comes from human observers and electronic cameras placed directly on fishing vessels. Observers sample what was caught, what was kept, and what was discarded; their numbers are extrapolated to the parts of the fleet not observed in real time.</p>
     <p class="page-lede">The North Pacific Observer Program operates on two tiers. <b>Full coverage</b> sectors — BSAI pollock catcher-processors, motherships, Amendment 80 bottom trawl — carry observers on every trip, sometimes two per vessel, producing coverage rates at or above 100%. <b>Partial coverage</b> sectors — halibut and sablefish IFQ longline, smaller trawl catcher-vessels — are sampled through stratified random selection, with rates set each year in a public Annual Deployment Plan.</p>
     <p class="page-lede">The system as it exists today dates to a 2013 restructure that ended length-based, pay-as-you-go deployment. Since then, electronic monitoring has been introduced as an alternative in several fixed-gear partial-coverage categories.</p>`);

  // Time series
  const h = document.createElement('h2'); h.className = 'h2'; h.textContent = 'Federal observer coverage over time';
  s.appendChild(h);
  const p = document.createElement('p'); p.className = 'section-intro';
  p.innerHTML = 'Realized coverage on a trips-basis for representative full- and partial-coverage sectors. The dashed line at 2013 marks the program restructure — pre-2013 and post-2013 rates are not methodologically comparable.';
  s.appendChild(p);

  const covYears = [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];
  const cov = {
    'BSAI pollock CP/MS (full)':        [200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200,200],
    'Amendment 80 (full)':              [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
    'BSAI pollock CV (full / EM)':      [ 60, 60, 60, 60, 60, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    'CV Nonpelagic Trawl (partial)':    [ 30, 30, 30, 30, 30, 12, 14, 17, 20, 22, 24, 28, 30, 32, 38, 45, 42],
    'Hook-and-line ≥40 ft (partial)':   [ 22, 22, 22, 22, 22, 12, 13, 14, 15, 16, 18, 19, 20, 22, 23, 25, 24],
    'Pot gear (partial)':               [ 10, 10, 10, 10, 10,  8,  9, 10, 11, 12, 12, 13, 14, 14, 14, 14, 14],
  };
  const P = PAL(); const palette = [P.ink, P.blue, '#4a6a88', P.red, P.yellow, '#8a6a00'];
  const cw = document.createElement('div'); cw.className = 'chart-wrap card';
  cw.innerHTML = `<div class="chart-title">Realized observer / EM coverage rate by sector (%)</div>
                  <div class="chart-sub">Values &gt;100 reflect two observers per vessel. Partial-coverage series show the drop-and-ramp after 2013's selection-pool rollout.</div>`;
  cw.appendChild(lineChart({
    series: Object.entries(cov).map(([n, d], i) => ({ color: palette[i], data: covYears.map((y,k)=>[y, d[k]]) })),
    xDomain: [2008, 2024], yDomain: [0, 220], yTicks: 5,
    xTicks: [2008,2010,2012,2013,2015,2018,2021,2024],
    annotations: [{ x: 2013, label: '2013 restructure' }],
  }));
  cw.appendChild(legend(Object.keys(cov).map((k, i) => ({ color: palette[i], label: k }))));
  s.appendChild(cw);

  // Coverage by fleet table (current)
  const h2 = document.createElement('h2'); h2.className = 'h2'; h2.textContent = 'Coverage by fleet, 2023';
  s.appendChild(h2);
  const covTable = makeTable(
    ['Sector', 'Category', { label: 'Trips-basis', num: true }, { label: 'MT-basis', num: true }, 'Monitoring type'],
    [
      ['BSAI pollock catcher-processor', 'Full',    '200%', '200%', 'Two observers + EM'],
      ['BSAI pollock mothership',        'Full',    '200%', '200%', 'Two observers + EM'],
      ['BSAI pollock catcher vessel',    'Full',    '100%', '100%', 'One observer or EM'],
      ['Amendment 80 (non-pollock BSAI trawl CP)', 'Full', '100%', '100%', 'Observer, continuous'],
      ['CV Pelagic Trawl (GOA)',         'Full',    '100%', '100%', 'Observer or EM'],
      ['CP Hook-and-Line',               'Full',    '100%', '100%', 'Observer'],
      ['CV Nonpelagic Trawl (partial)',  'Partial', ' 45%', ' 41%', 'Observer, selection pool'],
      ['Hook-and-line ≥ 57.5 ft',        'Partial', ' 32%', ' 28%', 'Observer, selection pool'],
      ['Hook-and-line 40 – 57.5 ft',     'Partial', ' 25%', ' 22%', 'Observer or EM'],
      ['Hook-and-line &lt; 40 ft',       'Partial', ' 18%', ' 14%', 'EM-preferred'],
      ['Pot gear',                       'Partial', ' 14%', ' 12%', 'Observer or EM'],
      ['Jig',                            'Zero',    '  0%', '  0%', 'Logbook only'],
    ]
  );
  const tcov = document.createElement('div'); tcov.className = 'card'; tcov.appendChild(covTable);
  s.appendChild(tcov);

  // Methodology
  const h3 = document.createElement('h2'); h3.className = 'h2'; h3.textContent = 'How observer data becomes catch data';
  s.appendChild(h3);
  const method = document.createElement('div'); method.className = 'card';
  method.appendChild(makeTable(
    ['Step', 'On the vessel', 'What gets sampled', 'How it scales up'],
    [
      ['Haul-level observation', 'Observer records total haul weight, species composition by subsample', 'Random subsample of the haul (typically 200–400 kg)', 'Subsample species ratios applied to total haul weight'],
      ['Biological sampling', 'Observer takes lengths, sexes, otoliths from a subset', 'Length-stratified subsample', 'Used for length/age composition in stock assessments'],
      ['PSC sampling', 'Every salmon, halibut, crab counted; tissue taken', 'Census on PSC species (BSAI pollock)', 'Direct cap accounting; GSI lab genotypes a subset'],
      ['Observed → unobserved', 'CAS (Catch Accounting System) rolls up by sector', 'Observed hauls only', 'Applied to fish-ticket landings for unobserved trips'],
      ['Verification', 'Shoreside monitoring of deliveries', 'Census of landings', 'Cross-checks observer and at-sea data'],
    ]
  ));
  s.appendChild(method);

  const note = document.createElement('div'); note.className = 'note';
  note.innerHTML = `<b>Interpretation of coverage rates.</b> A 20% observer coverage rate indicates that 20% of trips are observed directly; estimates for unobserved trips are generated by applying observed rates to fish-ticket landings. Electronic monitoring records retention and discards; biological sampling for age, genetics and sex requires a human observer.`;
  s.appendChild(note);
}

// ====================================================================
// TOPIC 4 — HALIBUT MORTALITY BY SOURCE
// ====================================================================
function buildHalibut() {
  const s = section('halibut', 'Halibut Mortality by Source',
    `<div class="crumb">Topic 04</div>
     <h1 class="page-title">Halibut Mortality by Source</h1>
     <p class="page-lede first-sentence">Pacific halibut is the only Alaska fishery with a single, coastwide ledger that reconciles every pound of mortality — directed commercial, bycatch, recreational, subsistence, research, wastage — into one annual total. That reconciliation is done by the International Pacific Halibut Commission, established by a 1923 U.S.–Canada treaty that predates every other agency involved.</p>
     <p class="page-lede">The logic runs from a coastwide biological estimate down to the share available to the directed commercial fleet. IPHC sets the <b>Total Constant Exploitation Yield (TCEY)</b> — the all-source mortality limit — each January. From TCEY it deducts the projected mortality from bycatch in groundfish fisheries, recreational harvest, subsistence, and wastage. What remains is the <b>Fishery Constant Exploitation Yield (FCEY)</b>, the directed-commercial allocation divided among eight regulatory areas from the Oregon coast to the Aleutians.</p>
     <p class="page-lede">All figures on this page are in net pounds (head-off, gutted), the IPHC unit. Values reported elsewhere in round pounds — NMFS groundfish bycatch, for example — are converted before IPHC consolidates them. The categories and the year-over-year trend are shown below.</p>`);

  // Where mortality goes — proportion bar
  const h = document.createElement('h2'); h.className = 'h2'; h.textContent = 'Where the mortality goes — 2024 coastwide';
  s.appendChild(h);

  const bar = document.createElement('div'); bar.className = 'card';
  bar.innerHTML = '<div class="card-title">Share of total coastwide halibut mortality, 2024 (≈ 32.5 M lb)</div>';
  const P = PAL(); const palette = {
    o26: P.ink, u26: P.inkSoft, byc: P.red, rec: P.blue, sub: '#5b7a8b', res: P.yellow, was: '#bfbfbf'
  };
  bar.appendChild(proportionBar({
    parts: [
      { label: 'O26 directed commercial', value: 22.4, color: palette.o26 },
      { label: 'U26 discard (sublegal)',  value:  1.8, color: palette.u26 },
      { label: 'Non-directed bycatch',    value:  4.6, color: palette.byc },
      { label: 'Recreational',            value:  2.3, color: palette.rec },
      { label: 'Subsistence',             value:  0.8, color: palette.sub },
      { label: 'Research',                value:  0.3, color: palette.res },
      { label: 'Wastage / other',         value:  0.3, color: palette.was },
    ]
  }));
  bar.appendChild(legend([
    { color: palette.o26, label: 'O26 directed commercial' },
    { color: palette.u26, label: 'U26 sublegal discard' },
    { color: palette.byc, label: 'Non-directed bycatch (groundfish)' },
    { color: palette.rec, label: 'Recreational (charter + unguided)' },
    { color: palette.sub, label: 'Subsistence' },
    { color: palette.res, label: 'Research (FISS survey)' },
    { color: palette.was, label: 'Wastage' },
  ]));
  s.appendChild(bar);

  // Detailed table
  const h2 = document.createElement('h2'); h2.className = 'h2'; h2.textContent = 'Mortality by source, coastwide, 2024';
  s.appendChild(h2);
  const p2 = document.createElement('p'); p2.className = 'section-intro';
  p2.textContent = 'All figures in million pounds, net weight. Rows sum (allowing for rounding) to the coastwide total.';
  s.appendChild(p2);

  const halTable = makeTable(
    ['Source', 'Who/What', { label: 'Million lb', num: true }, { label: 'Share', num: true }, 'Key methodology'],
    [
      ['O26 directed commercial',   'IFQ & CDQ longline fleet, legal-size (≥32")', '22.4', '69%', 'Fish-ticket census'],
      ['U26 discards (sublegal)',   '<32" halibut caught in directed fishery, discarded', ' 1.8', ' 5%', 'IPHC DMR applied (~16% longline)'],
      ['Non-directed bycatch',      'Groundfish trawl, longline, pot — PSC discards', ' 4.6', '14%', 'Observer data × gear-specific DMR'],
      ['Recreational',              'Charter + unguided sport + C&R mortality',   ' 2.3', ' 7%', 'ADF&G SWHS × average weight'],
      ['Subsistence',               'State + federal subsistence harvest',         ' 0.8', ' 2%', 'ADF&G CSIS + USFWS OSM'],
      ['Research',                  'IPHC FISS + NMFS survey take',                ' 0.3', ' 1%', 'Census on survey stations'],
      ['Wastage',                   'Deadloss, unattributed',                       ' 0.3', ' 1%', 'Residual in IPHC ledger'],
    ]
  );
  halTable.appendChild(Object.assign(document.createElement('tfoot'), { innerHTML: `<tr><td>Total</td><td></td><td class="num">32.5</td><td class="num">100%</td><td></td></tr>` }));
  const halCard = document.createElement('div'); halCard.className = 'card'; halCard.appendChild(halTable);
  s.appendChild(halCard);

  // Non-directed bycatch decomposition
  const h3 = document.createElement('h2'); h3.className = 'h2'; h3.textContent = 'Bycatch decomposition — directed vs non-directed';
  s.appendChild(h3);
  const p3 = document.createElement('p'); p3.className = 'section-intro';
  p3.innerHTML = 'Non-directed bycatch is halibut taken incidentally in groundfish fisheries and discarded, with gear-specific Discard Mortality Rates applied. U26 discard is halibut caught in the directed halibut fishery that is below legal size (32 inches).';
  s.appendChild(p3);

  const bycTable = makeTable(
    ['Gear / sector', { label: 'Encounter (M lb)', num: true }, { label: 'Applied DMR', num: true }, { label: 'Mortality (M lb)', num: true }],
    [
      ['BSAI bottom trawl (Amendment 80)', '3.7', '82%', '3.0'],
      ['BSAI / GOA longline (Pacific cod)', '1.6', '16%', '0.3'],
      ['GOA bottom trawl',                  '1.4', '73%', '1.0'],
      ['BSAI / GOA pot gear',               '0.5', '18%', '0.1'],
      ['Trawl CV miscellaneous',            '0.3', '70%', '0.2'],
    ]
  );
  bycTable.appendChild(Object.assign(document.createElement('tfoot'), { innerHTML: `<tr><td>Total non-directed bycatch</td><td class="num">7.5</td><td class="num">—</td><td class="num">4.6</td></tr>` }));
  const bc = document.createElement('div'); bc.className = 'card'; bc.appendChild(bycTable);
  const capb = document.createElement('div'); capb.style.cssText = 'font-size:11px;color:var(--muted);margin-top:6px'; capb.textContent = 'DMRs are gear- and length-specific; single-value shown is the weighted average. Encounter = total halibut pounds caught and discarded before mortality conversion.';
  bc.appendChild(capb);
  s.appendChild(bc);

  // Stacked bar: 10-year trend by source
  const h4 = document.createElement('h2'); h4.className = 'h2'; h4.textContent = 'Coastwide mortality, 10-year trend';
  s.appendChild(h4);
  const tw = document.createElement('div'); tw.className = 'chart-wrap card';
  tw.innerHTML = `<div class="chart-title">IPHC coastwide halibut mortality by source, 2015–2024 (M lb, net)</div>
                  <div class="chart-sub">Annual coastwide halibut mortality, by source, 2015–2024. Directed commercial varies with FCEY; non-directed bycatch varies within a narrower range.</div>`;
  const yrs = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];
  tw.appendChild(stackedBar({
    categories: yrs,
    series: [
      { color: palette.o26, data: [28.5, 25.6, 24.1, 23.2, 22.0, 21.1, 24.9, 25.0, 23.7, 22.4] },
      { color: palette.u26, data: [ 2.1,  1.9,  1.8,  1.7,  1.6,  1.6,  1.9,  1.9,  1.8,  1.8] },
      { color: palette.byc, data: [ 6.5,  6.0,  5.6,  5.4,  5.2,  5.0,  4.9,  4.8,  4.7,  4.6] },
      { color: palette.rec, data: [ 2.4,  2.5,  2.3,  2.2,  2.1,  1.9,  2.2,  2.3,  2.3,  2.3] },
      { color: palette.sub, data: [ 0.9,  0.9,  0.9,  0.9,  0.8,  0.8,  0.8,  0.8,  0.8,  0.8] },
      { color: palette.res, data: [ 0.3,  0.3,  0.3,  0.3,  0.3,  0.3,  0.3,  0.3,  0.3,  0.3] },
    ],
    yFmt: (v) => v.toFixed(0),
  }));
  tw.appendChild(legend([
    { color: palette.o26, label: 'O26 directed' },
    { color: palette.u26, label: 'U26 discard' },
    { color: palette.byc, label: 'Non-directed bycatch' },
    { color: palette.rec, label: 'Recreational' },
    { color: palette.sub, label: 'Subsistence' },
    { color: palette.res, label: 'Research' },
  ]));
  s.appendChild(tw);

  const note = document.createElement('div'); note.className = 'note';
  note.innerHTML = `<b>TCEY and FCEY.</b> The Total Constant Exploitation Yield (TCEY) is the all-source coastwide mortality limit set by IPHC each January. The Fishery Constant Exploitation Yield (FCEY) is the directed-commercial allocation: TCEY minus deductions for bycatch, recreational, subsistence and wastage. The 2025 coastwide TCEY was set at 29.7 million pounds, compared with 35.3 million pounds in 2024.`;
  s.appendChild(note);
}

// ====================================================================
// TOPIC 5 — CHINOOK MORTALITY & GENETICS
// ====================================================================
function buildChinook() {
  const s = section('chinook', 'Chinook Mortality & Genetics',
    `<div class="crumb">Topic 05</div>
     <h1 class="page-title">Chinook Mortality &amp; Genetics</h1>
     <p class="page-lede first-sentence">Chinook salmon — the largest of the five Pacific salmon species and culturally central across Alaska — are counted as they return to spawning rivers, as they are caught commercially, and as they are sampled from bycatch at sea. Four reporting streams, each on a different cadence, together describe the total human-caused mortality in any given year.</p>
     <p class="page-lede">The four categories are <b>commercial</b> (dominated by Southeast Alaska troll), <b>sport</b> (harvest plus catch-and-release mortality, measured through the ADF&amp;G Statewide Harvest Survey), <b>subsistence</b> (state and federal surveys combined), and <b>BSAI pollock bycatch</b> (observed in real time and capped at 45,000 fish under Amendment 91). Each is measured by a different agency with a different reporting lag — from one week for federal bycatch to over 18 months for subsistence.</p>
     <p class="page-lede">A fifth stream runs in parallel. The AFSC Auke Bay laboratory genotypes bycatch samples against a coastwide genetic baseline, attributing them to stock reporting groups such as Coastal Western Alaska, British Columbia, and the West Coast U.S. This answers a separate question from the raw count: not <em>how many</em> Chinook were killed, but <em>which river systems</em> they came from.</p>`);

  // Where mortality goes
  const h = document.createElement('h2'); h.className = 'h2'; h.textContent = 'Where Alaska Chinook mortality goes — 2023';
  s.appendChild(h);
  const p = document.createElement('p'); p.className = 'section-intro';
  p.textContent = 'Approximate share of statewide directly-measured Chinook mortality by source. Counts are whole fish; values are order-of-magnitude and will shift year-to-year with ocean conditions, closures and management actions.';
  s.appendChild(p);

  const P_ch = PAL(); const cpal = { com: P_ch.blue, sp: '#4a6a88', sub: P_ch.red, byc: P_ch.ink };
  const pb = document.createElement('div'); pb.className = 'card';
  pb.innerHTML = '<div class="card-title">Share of 2023 statewide Chinook mortality (≈ 480,000 fish)</div>';
  pb.appendChild(proportionBar({
    parts: [
      { label: 'Commercial',   value: 290, color: cpal.com },
      { label: 'Sport (harvest + C&R mortality)', value: 110, color: cpal.sp },
      { label: 'Subsistence',  value:  68, color: cpal.sub },
      { label: 'BSAI pollock bycatch', value: 12, color: cpal.byc },
    ]
  }));
  pb.appendChild(legend([
    { color: cpal.com, label: 'Commercial' },
    { color: cpal.sp,  label: 'Sport (harvest + released × C&R mortality)' },
    { color: cpal.sub, label: 'Subsistence (state + federal)' },
    { color: cpal.byc, label: 'BSAI pollock bycatch (fed.)' },
  ]));
  s.appendChild(pb);

  // Table of sources
  const h2 = document.createElement('h2'); h2.className = 'h2'; h2.textContent = 'Chinook mortality by source, 2023';
  s.appendChild(h2);

  const chT = makeTable(
    ['Source', { label: 'Fish', num: true }, { label: 'Share', num: true }, 'Principal sector(s)', 'Data source', 'Lag'],
    [
      ['Commercial',          '290,000', '60%', 'Southeast troll; Yakutat set-net; minor other', 'ADF&G fish tickets', '~2 mo preliminary; COAR 12–18 mo'],
      ['Sport (harvest)',     ' 85,000', '18%', 'Kenai, Kasilof, Southeast charter/unguided',     'ADF&G SWHS',         '~540 days'],
      ['Sport (C&R mortality)', ' 25,000', ' 5%', 'Released fish × 5–15% mortality rate',          'SWHS + literature rate', 'Same as SWHS'],
      ['Subsistence (state)', ' 45,000', ' 9%', 'AYK (Yukon/Kuskokwim reduced), Copper, Cook Inlet', 'ADF&G CSIS',       'Variable; multi-year'],
      ['Subsistence (federal)', ' 23,000', ' 5%', 'ANILCA §804 rural priority on federal waters', 'USFWS OSM',          '12+ mo'],
      ['BSAI pollock bycatch', ' 11,855', ' 2%', 'BSAI walleye pollock midwater trawl', 'NMFS PSC weekly', '1 week inseason'],
      ['GOA pollock/cod bycatch', '  5,000', ' 1%', 'CGOA pollock, GOA Pacific cod',      'NMFS PSC weekly', '1 week inseason'],
    ]
  );
  chT.appendChild(Object.assign(document.createElement('tfoot'), { innerHTML: '<tr><td>Total</td><td class="num">~485,000</td><td class="num">100%</td><td colspan="3"></td></tr>' }));
  const chCard = document.createElement('div'); chCard.className = 'card'; chCard.appendChild(chT);
  s.appendChild(chCard);

  // Bycatch trend
  const h3 = document.createElement('h2'); h3.className = 'h2'; h3.textContent = 'BSAI pollock Chinook bycatch — 13-year trend';
  s.appendChild(h3);
  const p3 = document.createElement('p'); p3.className = 'section-intro';
  p3.innerHTML = 'The hard cap in BSAI pollock is 45,000 Chinook (Amendment 91, 2011). The performance standard is 33,318 Chinook; exceeding it in three of seven years reduces the hard cap. Annual observed bycatch is shown below.';
  s.appendChild(p3);

  const bw = document.createElement('div'); bw.className = 'chart-wrap card';
  bw.innerHTML = `<div class="chart-title">BSAI pollock Chinook PSC (fish) — 2011–2023</div>
                  <div class="chart-sub">NMFS weekly reports, year-end totals. Observer coverage on BSAI pollock is ≥100%.</div>`;
  const byrs = [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023];
  const bv   = [25499,11361,13314,14755,20820,21768,32512,14326,25020,32300,34430,23600,11855];
  bw.appendChild(lineChart({
    series: [
      { color: PAL().red, data: byrs.map((y,i)=>[y, 45000]) },
      { color: PAL().yellow, data: byrs.map((y,i)=>[y, 33318]) },
      { color: PAL().ink, data: byrs.map((y,i)=>[y, bv[i]]) },
    ],
    xDomain: [2011, 2023], yDomain: [0, 50000], yTicks: 5,
    xTicks: [2011,2013,2015,2017,2019,2021,2023],
  }));
  bw.appendChild(legend([
    { color: PAL().red, label: 'Hard cap (45,000)' },
    { color: PAL().yellow, label: 'Performance standard (33,318)' },
    { color: PAL().ink, label: 'Realized bycatch' },
  ]));
  s.appendChild(bw);

  // Genetics table
  const h4 = document.createElement('h2'); h4.className = 'h2'; h4.textContent = 'Genetic stock identification — BSAI pollock Chinook bycatch';
  s.appendChild(h4);
  const p4 = document.createElement('p'); p4.className = 'section-intro';
  p4.innerHTML = 'AFSC Auke Bay Laboratories genotypes tissue samples from bycatch Chinook against a coastwide baseline (Van Doornik et al. 2024). Results published with a ~12–18 month lag. Season-split (A = Jan–Apr; B = Jun–Nov).';
  s.appendChild(p4);

  const gT = makeTable(
    ['Stock reporting group', 'Rivers included', { label: 'A-season %', num: true }, { label: 'B-season %', num: true }, { label: 'Annual %', num: true }, { label: 'Fish (2023)', num: true }],
    [
      ['Coastal Western Alaska', 'Yukon, Kuskokwim, Norton Sound, Bristol Bay, AK Peninsula N. side', '50.0%', '30.4%', '47.2%', '5,600'],
      ['North Alaska Peninsula',  'Chignik, AK Peninsula',                                             '21.8%', '35.7%', '24.0%', '2,845'],
      ['British Columbia',        'Fraser, Skeena, Nass, smaller BC systems',                         '20.9%', '24.5%', '21.4%', '2,537'],
      ['West Coast U.S.',         'Columbia, Puget Sound, Oregon/California coast',                   ' 6.2%', ' 8.3%', ' 5.5%',   '652'],
      ['Northwest GOA',           'Copper, Bering',                                                    ' 1.1%', ' 1.1%', ' 0.9%',   '107'],
    ]
  );
  gT.appendChild(Object.assign(document.createElement('tfoot'), { innerHTML: '<tr><td>Total</td><td></td><td class="num">100%</td><td class="num">100%</td><td class="num">100%</td><td class="num">11,741</td></tr>' }));
  const gCard = document.createElement('div'); gCard.className = 'card'; gCard.appendChild(gT);
  const capg = document.createElement('div'); capg.style.cssText = 'font-size:11px;color:var(--muted);margin-top:6px'; capg.textContent = 'Point estimates. AFSC publishes 95% CIs alongside each figure. Stock reporting groups cannot be decomposed to individual rivers with current baseline resolution.';
  gCard.appendChild(capg);
  s.appendChild(gCard);

  const note = document.createElement('div'); note.className = 'note';
  note.innerHTML = `<b>Scope of this page.</b> Published research identifies multiple factors associated with Western Alaska Chinook escapement trends, including at-sea mortality, ocean productivity, freshwater temperature, disease, hatchery interactions, and bycatch. Assessing the relative contribution of each is outside the scope of this dashboard. Figures on this page reflect counts and GSI attribution as published by NMFS and AFSC.`;
  s.appendChild(note);
}

// ====================================================================
// TOPIC 6 — CHUM SALMON MORTALITY & GENETICS
// ====================================================================
function buildChum() {
  const s = section('chum', 'Chum Salmon Mortality & Genetics',
    `<div class="crumb">Topic 06</div>
     <h1 class="page-title">Chum Salmon Mortality &amp; Genetics</h1>
     <p class="page-lede first-sentence">Chum salmon — Alaska's third-largest commercial salmon species by count, after pink and sockeye — are unusual among Pacific salmon for the scale of hatchery production behind their abundance. Alaska's own hatcheries release roughly 600 million chum fry each year; Japan and Russia release an order of magnitude more across the broader North Pacific.</p>
     <p class="page-lede">Chum mortality is tracked across the same four categories as Chinook: <b>commercial</b> (dominant, centered in Southeast Alaska, Prince William Sound, and Kodiak), <b>subsistence</b> (AYK-concentrated, sharply reduced during the 2021–2024 closures), <b>sport</b> (small), and <b>BSAI pollock bycatch</b> (typically a few hundred thousand fish per year, with no regulatory hard cap — the figure is managed through sector Incentive Plan Agreements).</p>
     <p class="page-lede">The genetic stock identification question is the same as for Chinook but the answer is different in shape. The AFSC baseline for chum spans seven reporting groups across the North Pacific, and in most years the majority of BSAI chum bycatch is attributed to Asian hatchery origin — Japan and Russia — rather than to Alaska rivers. The Coastal Western Alaska share is typically in the single digits of percent.</p>`);

  // Mortality split
  const h = document.createElement('h2'); h.className = 'h2'; h.textContent = 'Where Alaska chum mortality goes — 2023';
  s.appendChild(h);
  const p = document.createElement('p'); p.className = 'section-intro';
  p.textContent = 'Directly-measured removals by source. Annual totals vary; 2023 is shown for consistency with other pages on this dashboard. Values are in thousands of fish.';
  s.appendChild(p);

  const P_cm = PAL(); const mpal = { com: P_cm.blue, sub: P_cm.red, byc: P_cm.ink, sp: '#4a6a88' };
  const pb = document.createElement('div'); pb.className = 'card';
  pb.innerHTML = '<div class="card-title">Share of 2023 Alaska chum mortality (≈ 8.5 M fish)</div>';
  pb.appendChild(proportionBar({
    parts: [
      { label: 'Commercial',          value: 7700, color: mpal.com },
      { label: 'BSAI pollock bycatch', value: 339, color: mpal.byc },
      { label: 'Subsistence',         value:  220, color: mpal.sub },
      { label: 'Sport',               value:   30, color: mpal.sp  },
    ]
  }));
  pb.appendChild(legend([
    { color: mpal.com, label: 'Commercial' },
    { color: mpal.byc, label: 'BSAI pollock bycatch' },
    { color: mpal.sub, label: 'Subsistence' },
    { color: mpal.sp,  label: 'Sport' },
  ]));
  s.appendChild(pb);

  // Table
  const h2 = document.createElement('h2'); h2.className = 'h2'; h2.textContent = 'Chum mortality by source, 2023';
  s.appendChild(h2);
  const chT = makeTable(
    ['Source', { label: 'Fish', num: true }, { label: 'Share', num: true }, 'Principal sector(s)', 'Notes'],
    [
      ['Commercial',            '7,710,000', '90.7%', 'SE AK gillnet/seine; Kodiak; Prince William Sound; Bristol Bay', 'Includes hatchery returns in several regions'],
      ['BSAI pollock bycatch',  '  339,200', ' 4.0%', 'BSAI walleye pollock midwater trawl',                           'No regulatory hard cap; managed via sector IPA caps'],
      ['Subsistence (state+fed)', '  220,000', ' 2.6%', 'AYK (reduced by closures), Kotzebue, Bristol Bay',             'AYK subsistence and commercial harvest reduced by closures, 2021–2024'],
      ['Sport',                 '   30,000', ' 0.4%', 'Kenai, Susitna, SE AK',                                        'Minor species for sport effort'],
      ['GOA pollock/cod bycatch', '    8,500', ' 0.1%',  'CGOA, WGOA pollock',                                          'Separate accounting from BSAI'],
      ['Hatchery brood + research', '~ 180,000', ' 2.1%', 'AK hatchery egg-take; ADF&G/AFSC survey',                    'Counted in AK hatchery management reports'],
    ]
  );
  chT.appendChild(Object.assign(document.createElement('tfoot'), { innerHTML: '<tr><td>Total</td><td class="num">~8,487,700</td><td class="num">100%</td><td colspan="2"></td></tr>' }));
  const chCard = document.createElement('div'); chCard.className = 'card'; chCard.appendChild(chT);
  s.appendChild(chCard);

  // Bycatch trend chart
  const h3 = document.createElement('h2'); h3.className = 'h2'; h3.textContent = 'BSAI pollock chum bycatch — 13-year trend';
  s.appendChild(h3);
  const p3 = document.createElement('p'); p3.className = 'section-intro';
  p3.textContent = 'Observed BSAI pollock chum bycatch has ranged from approximately 20,000 to over 500,000 fish annually. There is no regulatory hard cap on chum bycatch; management is conducted through sector Incentive Plan Agreements (IPAs).';
  s.appendChild(p3);
  const bw = document.createElement('div'); bw.className = 'chart-wrap card';
  bw.innerHTML = `<div class="chart-title">BSAI pollock chum salmon PSC (thousand fish) — 2011–2023</div>
                  <div class="chart-sub">Scale note: much larger than Chinook bycatch by count — but with very different stock-of-origin profile.</div>`;
  const cyrs = [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023];
  const cv   = [191, 22, 125, 219, 236, 340, 465, 49, 339, 343, 546, 242, 339];
  bw.appendChild(lineChart({
    series: [{ color: PAL().ink, data: cyrs.map((y,i)=>[y, cv[i]]) }],
    xDomain: [2011, 2023], yDomain: [0, 600], yTicks: 6,
    xTicks: [2011,2013,2015,2017,2019,2021,2023],
  }));
  s.appendChild(bw);

  // Genetics
  const h4 = document.createElement('h2'); h4.className = 'h2'; h4.textContent = 'Genetic stock identification — BSAI chum bycatch';
  s.appendChild(h4);
  const p4 = document.createElement('p'); p4.className = 'section-intro';
  p4.innerHTML = 'AFSC attributes BSAI chum bycatch samples across 7 reporting groups spanning the North Pacific. Asian hatchery-origin fish — Japan and Russia — typically account for the majority of bycatch.';
  s.appendChild(p4);
  const gT = makeTable(
    ['Stock reporting group', 'Origin', { label: 'A-season %', num: true }, { label: 'B-season %', num: true }, { label: 'Annual %', num: true }],
    [
      ['Eastern GOA / Pacific NW', 'SE AK, BC, WA, OR',            '18.2%', ' 5.4%', ' 7.8%'],
      ['Upper/Middle Yukon',        'Canadian Yukon mainstem',      ' 3.5%', ' 1.0%', ' 1.4%'],
      ['Coastal Western Alaska',    'Kuskokwim, Yukon coastal, Norton Sound', '12.8%', ' 4.1%', ' 5.7%'],
      ['North Asia',                'Russia (Kamchatka, Magadan)',  '41.0%', '48.3%', '47.0%'],
      ['Japan',                     'Japanese hatcheries',          '21.3%', '31.7%', '30.0%'],
      ['SE Asia / Korea',           'Korean & South Asian',         ' 1.2%', ' 3.9%', ' 3.5%'],
      ['Aggregate Asia (for reference)', 'NA + Japan + SE Asia',   '63.5%', '83.9%', '80.5%'],
    ]
  );
  const gC = document.createElement('div'); gC.className = 'card'; gC.appendChild(gT);
  const capg = document.createElement('div'); capg.style.cssText = 'font-size:11px;color:var(--muted);margin-top:6px'; capg.textContent = 'Multi-year averages from AFSC chum GSI reports. Reported CWAK share has varied from approximately 4% to 13% across years; North Asia and Japan reporting groups together account for the majority of attributed samples in most years.';
  gC.appendChild(capg);
  s.appendChild(gC);

  const note = document.createElement('div'); note.className = 'note';
  note.innerHTML = `<b>CWAK share of chum bycatch.</b> The Coastal Western Alaska (Kuskokwim, Yukon-coastal, Norton Sound) share of BSAI pollock chum bycatch is typically a single-digit percent of the total. Applied to 2023's 339,000-fish total bycatch, CWAK-origin chum is estimated at approximately 19,000 fish.`;
  s.appendChild(note);
}

// ====================================================================
// TOPIC 7 — DISCARDS & UTILIZATION
// ====================================================================
function buildDiscards() {
  const s = section('discards', 'Discards & Utilization',
    `<div class="crumb">Topic 07</div>
     <h1 class="page-title">Discards &amp; Utilization</h1>
     <p class="page-lede first-sentence">Not every fish that is caught is kept. A <b>discard</b> is a fish that is caught and returned to the water — because regulation requires it, because it is under a size limit, or because the vessel chose not to retain it. Whether a discarded fish survives depends on gear and species: pot-caught halibut survive most of the time; bottom-trawl-caught halibut often do not.</p>
     <p class="page-lede">Across Alaska's federal groundfish and halibut fisheries combined, the retention rate is approximately 97% — about 58,000 metric tons of discards out of roughly 2 million metric tons of total catch. The rate varies by gear: near-zero for pelagic trawl (pollock), higher for hook-and-line where size-based rules drive sorting, and intermediate for bottom trawl.</p>
     <p class="page-lede">The remaining 3% is not a single category. Some of it is regulatory (halibut and salmon prohibited from retention in groundfish fisheries; fish below minimum size). Some is economic (low-market-value species like arrowtooth flounder). The composition of the 58,000 metric tons is shown below.</p>`);

  // Scale
  const h = document.createElement('h2'); h.className = 'h2'; h.textContent = 'Putting the numbers in context';
  s.appendChild(h);
  const stats = document.createElement('div'); stats.className = 'stats';
  stats.innerHTML = `
    <div class="stat"><div class="stat-val">~2.0 M mt</div><div class="stat-lbl">Total federal catch (2024)</div><div class="stat-sub">BSAI + GOA groundfish + halibut</div></div>
    <div class="stat"><div class="stat-val">&lt;58,000 mt</div><div class="stat-lbl">Total discards</div><div class="stat-sub">All gear, all sectors</div></div>
    <div class="stat"><div class="stat-val">~97%</div><div class="stat-lbl">Overall utilization rate</div><div class="stat-sub">Retained ÷ total catch</div></div>
    <div class="stat"><div class="stat-val">~26 M mt</div><div class="stat-lbl">Exploitable biomass</div><div class="stat-sub">Discards ≈ 0.2% of biomass</div></div>
  `;
  s.appendChild(stats);

  // What counts as discard
  const h2 = document.createElement('h2'); h2.className = 'h2'; h2.textContent = 'What counts as a discard';
  s.appendChild(h2);
  const dT = makeTable(
    ['Category', 'Definition', 'Examples'],
    [
      ['Regulatory (required)', 'Vessel is required by rule to discard', 'Halibut and salmon in groundfish fisheries (PSC); over-MRA non-target retention; undersized fish; non-retainable species'],
      ['Economic (voluntary)',  'Vessel chose to discard a legally retainable fish', 'Low-market-value flatfish; damaged fish; species lacking processor demand in-season'],
      ['Mortality ≠ discard',   'Discarded fish may live, depending on gear and species', 'Pot-caught halibut has ~10–20% mortality; bottom-trawl-caught halibut 60–85%'],
    ]
  );
  const dC = document.createElement('div'); dC.className = 'card'; dC.appendChild(dT);
  s.appendChild(dC);

  // Discard rate by gear vs biomass
  const h3 = document.createElement('h2'); h3.className = 'h2'; h3.textContent = 'Discards by gear, 2024 — scaled to biomass and harvest';
  s.appendChild(h3);
  const p3 = document.createElement('p'); p3.className = 'section-intro';
  p3.textContent = 'Discard rate varies across gears. Longline rates are higher, reflecting size-based retention rules; pelagic trawl (pollock) rates are near zero.';
  s.appendChild(p3);

  const gearT = makeTable(
    ['Gear', { label: 'Catch (kt)', num: true }, { label: 'Discards (kt)', num: true }, { label: 'Discard rate', num: true }, { label: '% of exploitable biomass', num: true }, 'Dominant fisheries'],
    [
      ['Pelagic trawl',  '1,420',  ' 11',  ' 0.8%',  '0.04%',  'BSAI + GOA pollock'],
      ['Bottom trawl',   '  380',  ' 27',  ' 7.1%',  '0.10%',  'Amendment 80, flatfish, P. cod, some rockfish'],
      ['Hook &amp; line','  135',  ' 26',  '19.3%',  '0.10%',  'Halibut IFQ, sablefish IFQ, P. cod longline'],
      ['Pot',            '   55',  '  0.6', ' 1.1%', '0.002%', 'Sablefish pot, P. cod pot, crab (separate)'],
      ['Jig / small',    '    3',  '  0.1', ' 3.3%', '<0.001%', 'Under-60 ft Pacific cod, rockfish jig'],
    ]
  );
  gearT.appendChild(Object.assign(document.createElement('tfoot'), { innerHTML: '<tr><td>Total</td><td class="num">~1,993</td><td class="num">~65</td><td class="num">~3.3%</td><td class="num">~0.25%</td><td></td></tr>' }));
  const gC = document.createElement('div'); gC.className = 'card'; gC.appendChild(gearT);
  s.appendChild(gC);

  // What's in the 58k mt
  const h4 = document.createElement('h2'); h4.className = 'h2'; h4.textContent = 'What\u2019s in the 58,000 metric tons of discards';
  s.appendChild(h4);
  const discT = makeTable(
    ['Category', { label: 'mt (est.)', num: true }, { label: 'Share', num: true }, 'Regulatory basis'],
    [
      ['Arrowtooth flounder (low-market)',      '18,500', '32%', 'Economic — low product value despite large biomass'],
      ['Undersize / sublegal fish (all species)', '12,000', '21%', 'Regulatory — below minimum size'],
      ['Pacific halibut PSC',                   ' 7,200', '12%', 'Regulatory — halibut cannot be retained in groundfish fishery'],
      ['Grenadier, sculpin, skates (non-target)', ' 6,800', '12%', 'Mixed — low MRA; limited market'],
      ['Over-MRA retained species',             ' 5,000', ' 9%', 'Regulatory — Maximum Retainable Amount exceeded'],
      ['Salmon PSC (Chinook + chum)',           ' 1,500', ' 3%', 'Regulatory — PSC species, prohibited retention'],
      ['Damaged / fallout',                     ' 4,000', ' 7%', 'Economic — processing quality below threshold'],
      ['Other species',                         ' 3,000', ' 5%', 'Various'],
    ]
  );
  discT.appendChild(Object.assign(document.createElement('tfoot'), { innerHTML: '<tr><td>Total</td><td class="num">~58,000</td><td class="num">100%</td><td></td></tr>' }));
  const dC2 = document.createElement('div'); dC2.className = 'card'; dC2.appendChild(discT);
  const capd = document.createElement('div'); capd.style.cssText = 'font-size:11px;color:var(--muted);margin-top:6px';
  capd.innerHTML = 'Shares are approximate; NMFS monitored-catch tables decompose by species × sector in the authoritative form. "Regulatory" vs "economic" split is not first-class in the current schema — Phase 2.';
  dC2.appendChild(capd);
  s.appendChild(dC2);

  const note = document.createElement('div'); note.className = 'note';
  note.innerHTML = `<b>Reading this table.</b> The largest single category is arrowtooth flounder, an economic discard from a stock with approximately 780 kt of exploitable biomass whose TAC is not fully taken. The PSC categories (halibut and salmon) are regulatory discards: retention is prohibited, and mortality is estimated by applying species- and gear-specific Discard Mortality Rates. Category shares vary year to year.`;
  s.appendChild(note);
}

// ====================================================================
// SHOW/ROUTE
// ====================================================================
function show(id) {
  __activeId = id;
  document.querySelectorAll('.topic-link').forEach(el => el.classList.toggle('active', el.dataset.id === id));
  document.querySelectorAll('.topic-section').forEach(el => el.classList.toggle('active', el.id === 'sec-' + id));
  const t = TOPICS.find(x => x.id === id);
  const crumb = document.getElementById('crumb-topic');
  if (crumb) crumb.textContent = t ? t.title : '';
  history.replaceState(null, '', '#' + id);
}

// Initial build + route
buildAllPanels();
const initial = (window.location.hash || '').replace('#', '') || TOPICS[0].id;
show(TOPICS.find(x => x.id === initial) ? initial : TOPICS[0].id);
