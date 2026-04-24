// tweaks-app.jsx — Dashboard's Tweaks panel
// Lean, academic, NYT-leaning controls. Swaps CSS custom properties live.

const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "serif": "Source Serif 4",
  "sans": "Inter",
  "baseSize": 14.5,
  "primary": "#1a5fb4",
  "secondary": "#b4261a",
  "tertiary": "#c79a0c",
  "showDropCap": false,
  "columnMax": 1060,
  "accentStyle": "primaries"
}/*EDITMODE-END*/;

// --- Preset palettes --------------------------------------------------------
const PALETTES = {
  primaries:   { primary: '#1a5fb4', secondary: '#b4261a', tertiary: '#c79a0c', label: 'Primary colors' },
  bauhaus:     { primary: '#1d4ed8', secondary: '#dc2626', tertiary: '#eab308', label: 'Bauhaus' },
  muted:       { primary: '#2f4858', secondary: '#8e2f1b', tertiary: '#8a6a00', label: 'Muted primaries' },
  ink:         { primary: '#222222', secondary: '#222222', tertiary: '#666666', label: 'All ink' },
  custom:      { primary: '#1a5fb4', secondary: '#b4261a', tertiary: '#c79a0c', label: 'Custom' },
};

// --- Type pairings ----------------------------------------------------------
const SERIF_OPTIONS = ['Source Serif 4', 'Georgia', 'Libre Caslon Text', 'Lora', 'Merriweather'];
const SANS_OPTIONS  = ['Inter', 'Helvetica Neue', 'IBM Plex Sans', 'system-ui'];

// --- Apply tweaks to CSS custom properties ---------------------------------
function applyTweaks(t) {
  const r = document.documentElement;
  if (t.theme === 'dark') {
    r.style.setProperty('--bg', '#151515');
    r.style.setProperty('--panel', '#1a1a1a');
    r.style.setProperty('--ink', '#f0ede6');
    r.style.setProperty('--ink-soft', '#c8c5bd');
    r.style.setProperty('--muted', '#8a8880');
    r.style.setProperty('--rule', '#2a2a2a');
    r.style.setProperty('--rule-soft', '#222');
    r.style.setProperty('--table-alt', '#1e1e1e');
  } else if (t.theme === 'cream') {
    r.style.setProperty('--bg', '#f7f4ec');
    r.style.setProperty('--panel', '#fbfaf5');
    r.style.setProperty('--ink', '#121212');
    r.style.setProperty('--ink-soft', '#333');
    r.style.setProperty('--muted', '#6a655a');
    r.style.setProperty('--rule', '#d9d4c3');
    r.style.setProperty('--rule-soft', '#e9e4d4');
    r.style.setProperty('--table-alt', '#f1ede0');
  } else {
    r.style.setProperty('--bg', '#ffffff');
    r.style.setProperty('--panel', '#ffffff');
    r.style.setProperty('--ink', '#121212');
    r.style.setProperty('--ink-soft', '#333333');
    r.style.setProperty('--muted', '#666666');
    r.style.setProperty('--rule', '#dcdcdc');
    r.style.setProperty('--rule-soft', '#ececec');
    r.style.setProperty('--table-alt', '#fafafa');
  }

  // Accents
  const pal = t.accentStyle === 'custom'
    ? { primary: t.primary, secondary: t.secondary, tertiary: t.tertiary }
    : PALETTES[t.accentStyle] || PALETTES.primaries;

  r.style.setProperty('--accent-blue',   pal.primary);
  r.style.setProperty('--accent-red',    pal.secondary);
  r.style.setProperty('--accent-yellow', pal.tertiary);
  r.style.setProperty('--accent',   pal.primary);
  r.style.setProperty('--accent-2', pal.secondary);
  r.style.setProperty('--accent-3', pal.tertiary);

  // Type + size
  r.style.setProperty('--font-serif', `'${t.serif}', Georgia, serif`);
  r.style.setProperty('--font-sans',  `'${t.sans}', system-ui, sans-serif`);
  r.style.setProperty('--base-size', t.baseSize + 'px');
  r.style.setProperty('--col-max',  t.columnMax + 'px');

  // Drop cap on/off
  const ledeCss = document.getElementById('__tweak_lede_css') || (() => {
    const s = document.createElement('style'); s.id = '__tweak_lede_css'; document.head.appendChild(s); return s;
  })();
  ledeCss.textContent = t.showDropCap
    ? '.page-lede.first-sentence::first-letter { color: var(--accent-2); font-weight: 600; }'
    : '';
}

// --- Re-render charts when accents change ----------------------------------
let __rerenderTimer = null;
function scheduleRerenderPanels() {
  clearTimeout(__rerenderTimer);
  __rerenderTimer = setTimeout(() => {
    if (typeof window.rebuildPanels === 'function') window.rebuildPanels();
  }, 120);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply CSS-variable tweaks on every change (instant, no rebuild)
  useEffect(() => { applyTweaks(t); }, [t]);

  // Rebuild chart DOM only when palette-affecting keys change
  useEffect(() => { scheduleRerenderPanels(); }, [
    t.accentStyle, t.primary, t.secondary, t.tertiary, t.theme,
  ]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Palette" />
      <TweakRadio
        label="Accent style"
        value={t.accentStyle}
        options={['primaries', 'bauhaus', 'muted', 'ink', 'custom']}
        onChange={(v) => setTweak('accentStyle', v)}
      />
      {t.accentStyle === 'custom' && (
        <>
          <TweakColor label="Primary"   value={t.primary}   onChange={(v) => setTweak('primary', v)} />
          <TweakColor label="Secondary" value={t.secondary} onChange={(v) => setTweak('secondary', v)} />
          <TweakColor label="Tertiary"  value={t.tertiary}  onChange={(v) => setTweak('tertiary', v)} />
        </>
      )}

      <TweakSection label="Surface" />
      <TweakRadio
        label="Theme"
        value={t.theme}
        options={['light', 'cream', 'dark']}
        onChange={(v) => setTweak('theme', v)}
      />

      <TweakSection label="Typography" />
      <TweakSelect
        label="Serif"
        value={t.serif}
        options={SERIF_OPTIONS}
        onChange={(v) => setTweak('serif', v)}
      />
      <TweakSelect
        label="Sans"
        value={t.sans}
        options={SANS_OPTIONS}
        onChange={(v) => setTweak('sans', v)}
      />
      <TweakSlider label="Base size" value={t.baseSize} min={12} max={18} step={0.5} unit="px"
        onChange={(v) => setTweak('baseSize', v)} />
      <TweakToggle label="Drop cap on lede" value={t.showDropCap}
        onChange={(v) => setTweak('showDropCap', v)} />

      <TweakSection label="Layout" />
      <TweakSlider label="Column width" value={t.columnMax} min={820} max={1280} step={20} unit="px"
        onChange={(v) => setTweak('columnMax', v)} />
    </TweaksPanel>
  );
}

// Mount
(function mount() {
  const root = document.createElement('div');
  root.id = '__tweaks_root';
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(<App />);
})();
