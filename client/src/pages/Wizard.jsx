/*
================================================================
  pages/Wizard.jsx — PC Build Wizard
================================================================
  This component manages the build flow using React state.

  SCREENS (managed by `screen` state):
    'choose-path' — Build your own vs Help me pick (AI)
    'build-own'   — Manual parts picker (BuildOwnScreen + PartPicker)
    'ai-builder'  — AI chat builder (AIBuilderScreen, calls /api/chat)
    'assembly'    — Lego-style step-by-step assembly guide

  STATE:
    screen      — which screen is visible
    answers     — { budget: '700', goal: 'gaming', ... } — context sent to the AI
    currentStep — legacy state, currently unused by any live screen
    assemblyParts — parts passed from the AI builder into the assembly guide

  TO ADD A NEW SCREEN:
    1. Add a new state value for `screen`
    2. Add a conditional render block below
    3. Add a button/link that sets screen to the new value

  PROPS:
    onBack — called when user wants to return to the landing page
================================================================
*/

import { useState, useEffect, useRef, useMemo } from 'react';
import { loadBuilds, saveBuilds } from '../lib/storage';
import PC3D from '../components/PC3D';
import LegoBuild3D from '../components/LegoBuild3D';
import PartGlyph from '../components/PartGlyph';
import PartPicker from './PartPicker';

/* ============================================================
   SUB-COMPONENTS
   Small focused components for each part of the UI.
   Keep them in this file since they're tightly coupled to
   the wizard flow. Split into separate files if they grow large.
============================================================ */

/** The "choose your path" opening screen */
function ChoosePathScreen({ onNeedHelp, onBuildOwn }) {
  return (
    <div className="screen">
      <h1 className="screen-title">How do you want to build?</h1>
      <p  className="screen-subtitle">Pick the path that suits you.</p>

      <div className="path-cards">
        {/* Experienced builders skip the wizard */}
        <button className="path-card" onClick={onBuildOwn}>
          <div className="path-card-eyebrow">Experienced builder</div>
          <div className="path-card-title">Build your own</div>
          <div className="path-card-desc">
            Skip the wizard. Go straight to the full parts picker.
          </div>
        </button>

        {/* Guided path — starts the quiz */}
        <button className="path-card path-card--highlighted" onClick={onNeedHelp}>
          <div className="path-card-eyebrow">Need guidance</div>
          <div className="path-card-title">Help me pick parts</div>
          <div className="path-card-desc">
            Answer a few questions. We'll find the right parts for you.
          </div>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PC_PARTS — shared part metadata (emoji/color/description).
   Used by the AI Builder parts grid and the Assembly guide's
   highlight labels.
============================================================ */
const PC_PARTS = [
  {
    id: 'cpu', emoji: '⚙️', label: 'CPU', tagline: 'The Brain',
    color: '#0A84FF', bg: 'rgba(10,132,255,0.15)',
    desc: "Every single thing your PC does runs through here first — opening apps, loading games, rendering video. Think of it as the person in charge: nothing happens without their say-so. Faster CPU = less waiting.",
  },
  {
    id: 'gpu', emoji: '🎮', label: 'GPU', tagline: 'The Artist',
    color: '#30D158', bg: 'rgba(48,209,88,0.15)',
    desc: "The GPU paints everything you see on screen — every frame, every shadow, every pixel. It's especially important for gaming. A stronger GPU means smoother visuals and higher frame rates.",
  },
  {
    id: 'motherboard', emoji: '🔌', label: 'Motherboard', tagline: 'The City',
    color: '#FF9F0A', bg: 'rgba(255,159,10,0.15)',
    desc: "Every other part plugs into this. It's the city your PC lives in — the roads that let the CPU, RAM, GPU, and storage all talk to each other. You'll barely think about it, but nothing works without it.",
  },
  {
    id: 'ram', emoji: '📋', label: 'RAM', tagline: 'Your Desk Space',
    color: '#BF5AF2', bg: 'rgba(191,90,242,0.15)',
    desc: "Imagine your desk. The bigger it is, the more things you can have spread out and working at once. RAM is your PC's desk. More RAM = more browser tabs, more apps open, less slowdown.",
  },
  {
    id: 'storage', emoji: '💾', label: 'Storage', tagline: 'Your Library',
    color: '#FF375F', bg: 'rgba(255,55,95,0.15)',
    desc: "This is where everything lives when you're not using it — games, files, photos. A fast SSD opens things almost instantly. More storage means more space for everything you care about.",
  },
  {
    id: 'case', emoji: '🖥️', label: 'Case', tagline: 'The Shell',
    color: '#8E8E93', bg: 'rgba(99,99,102,0.2)',
    desc: "The outer body that holds and protects everything inside. It affects airflow and how it looks on your desk. Some have glass panels to show off the components. Some are compact; some are full towers.",
  },
  {
    id: 'cooling', emoji: '❄️', label: 'Cooling', tagline: 'The AC Unit',
    color: '#5AC8FA', bg: 'rgba(90,200,250,0.15)',
    desc: "PCs get hot when they work hard. Cooling — fans or liquid — keeps the temperature down so parts last longer and don't throttle themselves during an intense gaming session.",
  },
  {
    id: 'psu', emoji: '⚡', label: 'PSU', tagline: 'The Heart',
    color: '#FFD60A', bg: 'rgba(255,214,10,0.15)',
    desc: "The power supply pumps electricity to every component inside. Think of it like the heart — if it's unreliable, everything suffers. A good one protects your parts; a cheap one can damage them.",
  },
];

const BUILD_ROWS = [
  { id: 'cpu',         label: 'CPU',          emoji: '⚙️',  watts: 65  },
  { id: 'cpu-cooler',  label: 'CPU Cooler',   emoji: '❄️',  watts: 10  },
  { id: 'motherboard', label: 'Motherboard',  emoji: '🔌',  watts: 5   },
  { id: 'memory',      label: 'Memory',       emoji: '📋',  watts: 5   },
  { id: 'storage',     label: 'Storage',      emoji: '💾',  watts: 5   },
  { id: 'gpu',         label: 'Video Card',   emoji: '🎮',  watts: 200 },
  { id: 'case',        label: 'Case',         emoji: '🖥️',  watts: 0   },
  { id: 'psu',         label: 'Power Supply', emoji: '⚡',  watts: 0   },
];

function BuildOwnScreen({ buildId, onStartAssembly }) {
  const [activeBuildId] = useState(
    () => buildId ?? String(Date.now())
  );

  const [selected, setSelected] = useState(() => {
    if (!buildId) return {};
    const saved = loadBuilds().find((b) => b.id === buildId);
    return saved?.selected ?? {};
  });

  const [pickerFor, setPickerFor] = useState(null);

  // Auto-save whenever selected changes (only if at least one part picked)
  useEffect(() => {
    if (!Object.values(selected).some(Boolean)) return;
    const builds = loadBuilds();
    const build = {
      id: activeBuildId,
      name: 'My Build',
      savedAt: new Date().toISOString(),
      selected,
      partsCount: Object.values(selected).filter(Boolean).length,
    };
    const idx = builds.findIndex((b) => b.id === activeBuildId);
    if (idx >= 0) { builds[idx] = build; } else { builds.unshift(build); }
    saveBuilds(builds);
  }, [selected]);

  const watts = BUILD_ROWS.reduce(
    (sum, r) => selected[r.id] ? sum + r.watts : sum, 0
  );
  const total = Object.values(selected).reduce(
    (sum, p) => sum + (p?.cents ?? 0), 0
  );
  const pickedCount = Object.values(selected).filter(Boolean).length;

  function fmtPrice(cents) {
    return cents ? '$' + (cents / 100).toLocaleString('en-US') : '—';
  }

  if (pickerFor !== null) {
    return (
      <PartPicker
        partType={pickerFor}
        onAdd={(part) => {
          setSelected((s) => ({ ...s, [pickerFor]: part }));
          setPickerFor(null);
        }}
        onClose={() => setPickerFor(null)}
      />
    );
  }

  return (
    <div className="build-own">

      {/* Compatibility + wattage bar */}
      <div className="build-status">
        <div className="build-status-left">
          <span className="build-status-dot" />
          <span>Compatibility: No issues found</span>
        </div>
        <div className="build-status-right">
          Estimated Wattage: <strong>{watts}W</strong>
        </div>
      </div>

      {/* Column headers */}
      <div className="build-head">
        <span className="bc-name">Component</span>
        <span className="bc-sel">Selection</span>
        <span className="bc-price">Price</span>
      </div>

      {/* Component rows */}
      <div className="build-table">
        {BUILD_ROWS.map((row) => {
          const part = selected[row.id];
          return (
            <div key={row.id} className={`build-row${part ? ' build-row--filled' : ''}`}>
              <div className="bc-name">
                <span className="build-row-emoji">{row.emoji}</span>
                <span className="build-row-label">{row.label}</span>
              </div>

              <div className="bc-sel">
                {part ? (
                  <div className="build-chosen">
                    <span className="build-chosen-name">{part.name}</span>
                    <button
                      className="build-remove-btn"
                      onClick={() => setSelected((s) => { const n = { ...s }; delete n[row.id]; return n; })}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    className="build-choose-btn"
                    onClick={() => setPickerFor(row.id)}
                  >
                    + Choose A {row.label}
                  </button>
                )}
              </div>

              <div className="bc-price">
                {fmtPrice(part?.cents)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div className="build-total-row">
        <span className="build-total-label">Total</span>
        <span className="build-total-price">{total ? fmtPrice(total) : '—'}</span>
      </div>

      {/* Go to the step-by-step assembly guide using these parts */}
      <div className="build-assembly-cta">
        <button
          className="build-assembly-btn"
          disabled={pickedCount === 0}
          onClick={() => onStartAssembly?.(selected)}
        >
          🔧 Build It — Step-by-Step Guide
        </button>
        <p className="build-assembly-hint">
          {pickedCount === 0
            ? 'Pick at least one part to start the assembly guide.'
            : `Walks you through putting your ${pickedCount} selected part${pickedCount === 1 ? '' : 's'} together.`}
        </p>
      </div>

    </div>
  );
}


/** Rich card shown in the chat when Claude recommends a part */
function PartCard({ rec, onAdd }) {
  const emoji    = rec.emoji    ?? '💻';
  const gradient = rec.gradient ?? 'linear-gradient(135deg, #1a1a2e, #0d0d1e)';
  const specs    = rec.specs    ?? [];
  const pros     = rec.pros     ?? [];
  const cons     = rec.cons     ?? [];

  return (
    <div className="part-card">
      <div className="part-card-top">
        <div className="part-card-icon" style={{ background: gradient }}>{emoji}</div>
        <div className="part-card-info">
          <div className="part-card-name">{rec.name}</div>
          <div className="part-card-meta">
            <span className="part-card-category">{rec.category}</span>
            {rec.badge && <span className="part-card-badge">{rec.badge}</span>}
          </div>
        </div>
        <div className="part-card-price">{rec.price}</div>
      </div>
      <div className="part-card-body">
        {specs.length > 0 && (
          <div className="part-card-specs">
            {specs.map((s, i) => <span key={i} className="part-card-spec">{s}</span>)}
          </div>
        )}
        {(pros.length > 0 || cons.length > 0) && (
          <div className="part-card-pros-cons">
            <div className="part-card-pros">
              {pros.map((p, i) => <div key={i} className="part-card-pro">✓ {p}</div>)}
            </div>
            <div className="part-card-cons">
              {cons.map((c, i) => <div key={i} className="part-card-con">✗ {c}</div>)}
            </div>
          </div>
        )}
        {rec.note && <div className="part-card-note">💬 {rec.note}</div>}
        {onAdd && (
          <button className="part-card-add-btn" onClick={onAdd}>
            + Add to Build
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   LEGO-STYLE ASSEMBLY GUIDE

   Wordless on purpose. Each page shows only two things, the
   way a Lego booklet does:
     1. a tray of the pieces you need for this page
     2. a picture of the build so far, with the new piece
        floating beside its slot and an arrow pointing in

   piece — which 3D piece gets added (null = nothing new,
           e.g. the cable page and the finished page)
   need  — which of the user's picked parts this page is for;
           pages for parts they did not pick are skipped
   tray  — [glyph name, how many] for the parts tray
============================================================ */
const LEGO_STEPS = [
  { piece: 'case',        need: 'case',        tray: [['case', 1], ['screwdriver', 1]] },
  { piece: 'psu',         need: 'psu',         tray: [['psu', 1], ['screws', 4]] },
  { piece: 'motherboard', need: 'motherboard', tray: [['motherboard', 1], ['screws', 9]] },
  { piece: 'cpu',         need: 'cpu',         tray: [['cpu', 1]] },
  { piece: 'cpu-cooler',  need: 'cpu-cooler',  tray: [['paste', 1], ['cpu-cooler', 1], ['screws', 4]] },
  { piece: 'ram-1',       need: 'memory',      tray: [['ram', 1]] },
  { piece: 'ram-2',       need: 'memory',      tray: [['ram', 1]] },
  { piece: 'storage',     need: 'storage',     tray: [['storage', 1], ['screws', 1]] },
  { piece: 'gpu',         need: 'gpu',         tray: [['gpu', 1], ['screws', 2]] },
  { piece: null,          need: null,          tray: [['cable', 3]] },
  { piece: 'glass',       need: 'case',        tray: [['glass', 1], ['screws', 2]] },
  { piece: null,          need: null,          tray: [] },
];

/** Lego-style step-by-step assembly guide — pictures, no words */
function AssemblyScreen({ selectedParts = {}, onBack, backLabel = 'Back' }) {
  const [step, setStep] = useState(0);

  // Only show pages for parts the user actually picked.
  // If they picked nothing at all, show the whole guide.
  const pages = useMemo(() => {
    const anyPicked = Object.values(selectedParts).some(Boolean);
    if (!anyPicked) return LEGO_STEPS;
    return LEGO_STEPS.filter((s) => !s.need || selectedParts[s.need]);
  }, [selectedParts]);

  const total   = pages.length;
  const safe    = Math.min(step, total - 1);
  const current = pages[safe];

  // Everything placed on earlier pages is already in the picture.
  // The last page has no incoming piece, so it shows the finished build.
  const installed = pages
    .slice(0, safe)
    .map((s) => s.piece)
    .filter(Boolean);

  return (
    <div className="lego-page">

      {/* Leave the guide — no label, just an X */}
      <button className="lego-close" onClick={onBack} title={backLabel} aria-label={backLabel}>
        ✕
      </button>

      {/* Step number, in the corner box Lego puts it in */}
      <div className="lego-step-badge">{safe + 1}</div>

      {/* Parts tray for this page */}
      {current.tray.length > 0 && (
        <div className="lego-tray">
          {current.tray.map(([kind, count], i) => (
            <div key={i} className="lego-tray-item">
              <div className="lego-tray-glyph"><PartGlyph kind={kind} /></div>
              <span className="lego-tray-count">{count}x</span>
            </div>
          ))}
        </div>
      )}

      {/* The build */}
      <div className="lego-canvas">
        <LegoBuild3D installed={installed} incoming={current.piece} />
      </div>

      {/* Page turn */}
      <button
        className="lego-arrow lego-arrow--prev"
        onClick={() => setStep((s) => Math.max(0, s - 1))}
        disabled={safe === 0}
        aria-label="Previous step"
      >
        ‹
      </button>
      <button
        className="lego-arrow lego-arrow--next"
        onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
        disabled={safe === total - 1}
        aria-label="Next step"
      >
        ›
      </button>

      <div className="lego-dots">
        {pages.map((_, i) => (
          <button
            key={i}
            className={`lego-dot${i === safe ? ' lego-dot--active' : i < safe ? ' lego-dot--done' : ''}`}
            onClick={() => setStep(i)}
            aria-label={`Step ${i + 1}`}
          />
        ))}
      </div>

    </div>
  );
}

const CATEGORY_KEY = {
  CPU: 'cpu', GPU: 'gpu', RAM: 'ram', Storage: 'storage',
  Motherboard: 'motherboard', PSU: 'psu', Case: 'case', Cooler: 'cooling',
};
const PART_WATTS = {
  'rtx-4060': 115, 'rtx-4070': 200, 'rtx-4070-ti-super': 285, 'rtx-4090': 450, 'rx-7800-xt': 263,
  'ryzen-5-7600x': 105, 'ryzen-7-7800x3d': 120, 'i5-14600k': 125, 'i9-14900k': 253,
};
const GPU_FPS_1440P = {
  'rtx-4060': 80, 'rtx-4070': 120, 'rtx-4070-ti-super': 160, 'rtx-4090': 220, 'rx-7800-xt': 100,
};
const PERF_TIER = {
  'rtx-4060': 'Mid-Range', 'rtx-4070': 'High-End', 'rtx-4070-ti-super': 'High-End',
  'rtx-4090': 'Enthusiast', 'rx-7800-xt': 'High-End',
};

const SUBSTITUTES = {
  'ryzen-7-7800x3d': [
    { id:'ryzen-5-7600x',  name:'AMD Ryzen 5 7600X',          price:'$215',  tradeoff:'Saves $145 — still hits 300+ FPS in Valorant but ~15% fewer 1% lows.' },
    { id:'i5-14600k',      name:'Intel Core i5-14600K',        price:'$230',  tradeoff:'Better for streaming/multitasking. Needs Intel board + DDR4/5.' },
  ],
  'ryzen-5-7600x': [
    { id:'ryzen-7-7800x3d',name:'AMD Ryzen 7 7800X3D',         price:'$360',  tradeoff:'+$145 — 3D V-Cache gives ~15% better 1% lows. Best gaming CPU period.' },
    { id:'i5-14600k',      name:'Intel Core i5-14600K',        price:'$230',  tradeoff:'Similar price, stronger multi-core. Needs different board & platform.' },
  ],
  'i5-14600k': [
    { id:'ryzen-5-7600x',  name:'AMD Ryzen 5 7600X',          price:'$215',  tradeoff:'Saves $15. Slightly better gaming FPS. Needs AM5 board + DDR5.' },
    { id:'ryzen-7-7800x3d',name:'AMD Ryzen 7 7800X3D',         price:'$360',  tradeoff:'+$130 — best gaming CPU. 3D V-Cache unmatched for FPS.' },
  ],
  'i9-14900k': [
    { id:'ryzen-7-7800x3d',name:'AMD Ryzen 7 7800X3D',         price:'$360',  tradeoff:'Saves ~$200. Better pure gaming FPS, runs cooler. Different platform.' },
    { id:'i5-14600k',      name:'Intel Core i5-14600K',        price:'$230',  tradeoff:'Saves ~$330. Plenty fast for gaming, much less power draw.' },
  ],
  'rtx-4090': [
    { id:'rtx-4070-ti-super',name:'NVIDIA RTX 4070 Ti Super',  price:'$800',  tradeoff:'Saves ~$800. Only ~25% less performance at 1440p — 4090 is wasted here.' },
    { id:'rtx-4070',       name:'NVIDIA RTX 4070',             price:'$550',  tradeoff:'Saves ~$1050. Great 1440p card. 4090 only makes sense at 4K.' },
  ],
  'rtx-4070-ti-super': [
    { id:'rtx-4070',       name:'NVIDIA RTX 4070',             price:'$550',  tradeoff:'Saves $250 — ~20% less performance, 4GB less VRAM. Smart budget pick.' },
    { id:'rtx-4090',       name:'NVIDIA RTX 4090',             price:'$1600', tradeoff:'+$800 — ~25% faster. Only worth it at 4K or for heavy content creation.' },
    { id:'rx-7800-xt',     name:'AMD RX 7800 XT',              price:'$450',  tradeoff:'Saves $350. No DLSS (FSR instead). Good rasterization, weaker RT.' },
  ],
  'rtx-4070': [
    { id:'rtx-4060',       name:'NVIDIA RTX 4060',             price:'$295',  tradeoff:'Saves $255 — ~25% less 1440p perf but still great for esports titles.' },
    { id:'rtx-4070-ti-super',name:'NVIDIA RTX 4070 Ti Super',  price:'$800',  tradeoff:'+$250 — 20% faster, 16GB VRAM. Better long-term investment.' },
    { id:'rx-7800-xt',     name:'AMD RX 7800 XT',              price:'$450',  tradeoff:'Saves $100. Similar raw performance, no DLSS, has FSR 3.' },
  ],
  'rtx-4060': [
    { id:'rtx-4070',       name:'NVIDIA RTX 4070',             price:'$550',  tradeoff:'+$255 — ~25% faster, much better for future AAA at 1440p.' },
    { id:'rx-7800-xt',     name:'AMD RX 7800 XT',              price:'$450',  tradeoff:'+$155 — noticeably faster at 1440p. No DLSS but has FSR 3.' },
  ],
  'rx-7800-xt': [
    { id:'rtx-4070',       name:'NVIDIA RTX 4070',             price:'$550',  tradeoff:'+$100 — adds DLSS 3 + Frame Gen. Similar raw performance.' },
    { id:'rtx-4060',       name:'NVIDIA RTX 4060',             price:'$295',  tradeoff:'Saves $155. Still 300+ FPS in Valorant. Weaker for demanding titles.' },
  ],
  'ddr5-32gb-corsair': [
    { id:'ddr5-32gb-gskill',name:'G.Skill Trident Z5 32GB',    price:'$110',  tradeoff:'$5 more. Almost identical performance, better RGB aesthetics.' },
  ],
  'ddr5-32gb-gskill': [
    { id:'ddr5-32gb-corsair',name:'Corsair Vengeance 32GB DDR5',price:'$105', tradeoff:'Saves $5. Same speed, great warranty support.' },
  ],
  'samsung-990-pro-1tb': [
    { id:'wd-sn850x-1tb',  name:'WD Black SN850X 1TB',         price:'$90',   tradeoff:'Saves ~$10. Slightly slower peak reads, negligible real-world difference.' },
  ],
  'wd-sn850x-1tb': [
    { id:'samsung-990-pro-1tb',name:'Samsung 990 Pro 1TB',      price:'$100',  tradeoff:'+$10 — marginally faster, excellent endurance, great software.' },
  ],
  'msi-b650-tomahawk': [
    { id:'asus-b650-strix', name:'ASUS ROG Strix B650-A',       price:'$230',  tradeoff:'+$30 — better RGB aesthetics, slightly more features, same performance.' },
  ],
  'asus-b650-strix': [
    { id:'msi-b650-tomahawk',name:'MSI B650 Tomahawk WiFi',     price:'$200',  tradeoff:'Saves $30. Same strong VRMs, less RGB, equally reliable.' },
  ],
  'asus-z790-hero': [
    { id:'msi-b650-tomahawk',name:'MSI B650 Tomahawk WiFi',     price:'$200',  tradeoff:'Saves $350 — requires switching to AMD AM5 platform.' },
  ],
  'corsair-rm850x': [
    { id:'seasonic-focus-850',name:'Seasonic Focus GX 850W',    price:'$120',  tradeoff:'Saves $20. Arguably better build quality — Seasonic OEMs many brands.' },
  ],
  'seasonic-focus-850': [
    { id:'corsair-rm850x',  name:'Corsair RM850x',              price:'$140',  tradeoff:'+$20 — whisper-quiet fan, great monitoring software, trusted brand.' },
  ],
  'fractal-north': [
    { id:'lian-li-o11',    name:'Lian Li O11 Dynamic',          price:'$150',  tradeoff:'+$20 — 3-sided glass showcase build. Needs more fans. Stunning but bulky.' },
    { id:'nzxt-h510',      name:'NZXT H510',                    price:'$70',   tradeoff:'Saves $60. Compact and clean, but tighter cable management.' },
  ],
  'lian-li-o11': [
    { id:'fractal-north',  name:'Fractal Design North',         price:'$130',  tradeoff:'Saves $20. Wood + mesh aesthetic, better airflow, easier to build in.' },
    { id:'nzxt-h510',      name:'NZXT H510',                    price:'$70',   tradeoff:'Saves $80. Much smaller, clean look, but tight for large GPUs.' },
  ],
  'nzxt-h510': [
    { id:'fractal-north',  name:'Fractal Design North',         price:'$130',  tradeoff:'+$60 — much better airflow, stunning Scandinavian design, more room.' },
    { id:'lian-li-o11',   name:'Lian Li O11 Dynamic',          price:'$150',  tradeoff:'+$80 — dual-chamber showcase build with 3-sided glass. Needs AIO.' },
  ],
  'noctua-nh-d15': [
    { id:'corsair-h150i-elite',name:'Corsair H150i Elite 360mm',price:'$180', tradeoff:'+$100 — 360mm AIO. Better temps under sustained all-core load.' },
  ],
  'corsair-h150i-elite': [
    { id:'noctua-nh-d15',  name:'Noctua NH-D15',                price:'$80',   tradeoff:'Saves $100. Quieter at idle, no pump noise, extremely reliable.' },
  ],
};

/** Split-screen: AI chat on the left, parts grid on the right */
function AIBuilderScreen({ answers = {}, onStartTutorial, resumeId }) {
  const [activeBuildId] = useState(() => resumeId ?? String(Date.now()));

  const [messages, setMessages] = useState([
    {
      id: 1, from: 'ai',
      text: "Hey! I'm your AI PC builder. Tell me what you mainly want to use your PC for — gaming, work, video editing, school — and I'll help you figure out the right parts.",
    },
  ]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [hoveredId, setHoveredId]     = useState(null);
  const [selectedParts, setSelectedParts] = useState(() => {
    if (!resumeId) return {};
    const saved = loadBuilds().find((b) => b.id === resumeId);
    return saved?.selectedParts ?? {};
  });
  const [activeSlot, setActiveSlot]   = useState(null);
  const bottomRef                     = useRef(null);

  // Auto-save whenever parts change
  useEffect(() => {
    if (Object.keys(selectedParts).length === 0) return;
    const cpu  = selectedParts['cpu'];
    const gpu  = selectedParts['gpu'];
    const nameParts = [
      cpu?.name?.split(' ').slice(-3).join(' '),
      gpu?.name?.split(' ').slice(-3).join(' '),
    ].filter(Boolean);
    const name = nameParts.length > 0 ? `AI: ${nameParts.join(' + ')}` : 'AI Build';
    const builds = loadBuilds();
    const build  = {
      id: activeBuildId,
      name,
      savedAt:      new Date().toISOString(),
      type:         'ai',
      selectedParts,
      partsCount:   Object.keys(selectedParts).length,
    };
    const idx = builds.findIndex((b) => b.id === activeBuildId);
    if (idx >= 0) { builds[idx] = build; } else { builds.unshift(build); }
    saveBuilds(builds);
  }, [selectedParts]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now(), from: 'user', text: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Skip the opening AI greeting (index 0) — Anthropic messages must start with role "user"
      // For assistant turns, reconstruct the JSON shape so Claude sees the format it expects
      const apiMessages = updatedMessages.slice(1).map((msg) => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.from === 'ai'
          ? JSON.stringify({ message: msg.text, recommendations: msg.recommendations ?? [] })
          : msg.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, build: answers }),
      });

      const data = await res.json();
      const reply           = data.reply           ?? data.error ?? 'Something went wrong. Please try again.';
      const recommendations = data.recommendations ?? [];
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: 'ai', text: reply, recommendations }]);

      if (recommendations.length > 0) {
        const incoming = {};
        recommendations.forEach((rec) => {
          const key = CATEGORY_KEY[rec.category];
          if (key && !incoming[key]) incoming[key] = rec;
        });
        setSelectedParts((prev) => ({ ...prev, ...incoming }));
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1, from: 'ai',
        text: 'Could not reach the server. Make sure the backend is running.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  const partCount      = Object.keys(selectedParts).length;
  const totalPrice     = Object.values(selectedParts).reduce((sum, p) => {
    const n = parseFloat((p.price ?? '').replace(/[$,]/g, ''));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const gpuPart        = selectedParts['gpu'];
  const cpuPart        = selectedParts['cpu'];
  const casePart       = selectedParts['case'];
  const estimatedWatts = (PART_WATTS[gpuPart?.id] ?? 0) + (PART_WATTS[cpuPart?.id] ?? 0) + (partCount > 2 ? 80 : 0);
  const estimatedFPS   = GPU_FPS_1440P[gpuPart?.id] ?? null;
  const perfTier       = PERF_TIER[gpuPart?.id] ?? null;
  const showGlass      = ['lian-li-o11', 'nzxt-h510'].includes(casePart?.id);
  const showRgb        = casePart?.id === 'lian-li-o11' || selectedParts['ram']?.id?.includes('corsair') || selectedParts['ram']?.id?.includes('gskill');

  return (
    <div className="ai-builder">

      {/* ── Left: chat ── */}
      <div className="ai-chat">
        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-msg ai-msg--${msg.from}`}>
              {msg.from === 'ai' && <span className="ai-msg-label">AI Builder</span>}
              <div className="ai-msg-bubble">{msg.text}</div>
              {msg.recommendations?.length > 0 && (
                <div className="ai-recommendations">
                  {msg.recommendations.map((rec, i) => (
                    <PartCard
                      key={i}
                      rec={rec}
                      onAdd={() => {
                        const key = CATEGORY_KEY[rec.category];
                        if (key) setSelectedParts((prev) => ({ ...prev, [key]: rec }));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="ai-chat-bar">
          <input
            className="ai-chat-input"
            type="text"
            placeholder="Ask anything — best GPU for $1000, AMD vs Intel, what PSU do I need…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            className="ai-chat-send"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            {loading ? '…' : 'Send'}
          </button>
        </div>
        <div className="ai-tutorial-btn-row">
          <button className="ai-tutorial-btn" onClick={() => onStartTutorial(selectedParts)}>
            📋 Generate My Build Tutorial
          </button>
        </div>
      </div>

      {/* ── Right: 3D viewer + parts grid + substitutes ── */}
      <div className="ai-parts-panel">
        <div className="ai-parts-header">
          <span className="ai-parts-title">Your Build</span>
          <span className="ai-parts-hint">
            {partCount > 0 ? `${partCount} / 8 — click a part` : 'Ask AI to get started'}
          </span>
        </div>

        <div className="ai-3d-viewer">
          <PC3D showRgb={showRgb} showGlass={showGlass} highlighted={activeSlot} />
          {partCount === 0 && (
            <div className="ai-3d-placeholder">
              Ask the AI to build your PC and watch it come to life here
            </div>
          )}
          {activeSlot && (
            <div className="ai-3d-label">
              {PC_PARTS.find(p => p.id === activeSlot)?.label} highlighted
            </div>
          )}
        </div>

        <div className="ai-parts-grid">
          {PC_PARTS.map((p) => {
            const sel       = selectedParts[p.id];
            const fillBg    = sel?.gradient ?? 'linear-gradient(135deg,#1a1a2e,#0d0d1e)';
            const fillEmoji = sel?.emoji    ?? '💻';
            const isActive = activeSlot === p.id;
            return (
              <div
                key={p.id}
                className={`ai-part-card${sel ? ' ai-part-card--filled' : ''}${isActive ? ' ai-part-card--selected' : ''}`}
                onClick={() => setActiveSlot(isActive ? null : p.id)}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="ai-part-icon" style={{ background: sel ? fillBg : p.bg }}>
                  <span className="ai-part-emoji">{sel ? fillEmoji : p.emoji}</span>
                </div>
                {sel ? (
                  <>
                    <span className="ai-part-name-filled">{sel.name}</span>
                    <span className="ai-part-price-filled">{sel.price}</span>
                  </>
                ) : (
                  <span className="ai-part-label">{p.label}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Build stats (always shown when parts exist) */}
        {partCount > 0 && !activeSlot && (
          <div className="ai-build-stats">
            <div className="ai-stat-row">
              <span className="ai-stat-label">Total</span>
              <span className="ai-stat-value">${totalPrice.toLocaleString()}</span>
            </div>
            {estimatedWatts > 0 && (
              <div className="ai-stat-row">
                <span className="ai-stat-label">Est. Power Draw</span>
                <span className="ai-stat-value">{estimatedWatts}W</span>
              </div>
            )}
            {estimatedFPS && (
              <div className="ai-stat-row">
                <span className="ai-stat-label">Est. FPS @ 1440p</span>
                <span className="ai-stat-value ai-stat-value--highlight">{estimatedFPS}+ FPS</span>
              </div>
            )}
            {perfTier && (
              <div className="ai-stat-row">
                <span className="ai-stat-label">Performance Tier</span>
                <span className="ai-stat-value">{perfTier}</span>
              </div>
            )}
          </div>
        )}

        {/* Substitutes panel — shown when a part card is clicked */}
        {activeSlot && (() => {
          const current = selectedParts[activeSlot];
          const subs    = current ? (SUBSTITUTES[current.id] ?? []) : [];
          const slotInfo = PC_PARTS.find(p => p.id === activeSlot);
          return (
            <div className="ai-subs-panel">
              <div className="ai-subs-header">
                <span className="ai-subs-title" style={{ color: slotInfo?.color }}>
                  {slotInfo?.label}
                </span>
                <button className="ai-subs-close" onClick={() => setActiveSlot(null)}>✕</button>
              </div>

              {current ? (
                <>
                  <div className="ai-subs-current">
                    <span className="ai-subs-current-label">Current</span>
                    <span className="ai-subs-current-name">{current.name}</span>
                    <span className="ai-subs-current-price">{current.price}</span>
                  </div>

                  {subs.length > 0 ? (
                    <>
                      <p className="ai-subs-section-label">Alternatives</p>
                      {subs.map((sub) => (
                        <div key={sub.id} className="ai-sub-card">
                          <div className="ai-sub-card-top">
                            <span className="ai-sub-name">{sub.name}</span>
                            <span className="ai-sub-price">{sub.price}</span>
                          </div>
                          <p className="ai-sub-tradeoff">💬 {sub.tradeoff}</p>
                          <button
                            className="ai-sub-switch-btn"
                            onClick={() => {
                              setSelectedParts(prev => ({
                                ...prev,
                                [activeSlot]: { ...sub, category: current.category },
                              }));
                              setActiveSlot(null);
                            }}
                          >
                            Switch to this
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="ai-subs-none">No alternatives listed. Ask the AI for options.</p>
                  )}
                </>
              ) : (
                <p className="ai-subs-none">No part selected for this slot yet. Ask the AI to recommend one.</p>
              )}
            </div>
          );
        })()}
      </div>

    </div>
  );
}


/* ============================================================
   MAIN WIZARD COMPONENT
   Manages all state and wires the sub-components together.
============================================================ */
export default function Wizard({ onBack, resumeBuildId }) {
  const [screen, setScreen] = useState(() => {
    if (!resumeBuildId) return 'choose-path';
    const saved = loadBuilds().find((b) => b.id === resumeBuildId);
    return saved?.type === 'ai' ? 'ai-builder' : 'build-own';
  });

  // User's answers: { budget: '700', goal: 'gaming', ... }
  const [answers, setAnswers] = useState({ budget: '50000' });

  // Current step index — legacy state, no live screen reads it anymore
  const [currentStep, setCurrentStep] = useState(0);

  // Parts passed to AssemblyScreen, and which screen sent us there
  const [assemblyParts, setAssemblyParts] = useState({});
  const [assemblyFrom, setAssemblyFrom]   = useState('ai-builder');

  /* ----------------------------------------------------------
    Nav: go back to the landing page
  ---------------------------------------------------------- */
  function handleNavBack() {
    setScreen('choose-path');
    setAnswers({});
    setCurrentStep(0);
    onBack();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* NAV */}
      <nav className="nav">
        <div className="logo">
          <span className="logo-accent">Build</span>Core
        </div>
        <div className="nav-links">
          <a href="#" onClick={handleNavBack}>My Build</a>
          <a className="active" href="#">Assembly</a>
          <a href="#">Upgrade My PC</a>
        </div>
      </nav>

      {/* SCREENS — only one visible at a time */}

      {screen === 'choose-path' && (
        <ChoosePathScreen
          onNeedHelp={() => {
            setAnswers({});
            setCurrentStep(0);
            setScreen('ai-builder');
          }}
          onBuildOwn={() => setScreen('build-own')}
        />
      )}

      {screen === 'build-own' && (
        <BuildOwnScreen
          buildId={resumeBuildId ?? undefined}
          onStartAssembly={(parts) => {
            setAssemblyParts(parts);
            setAssemblyFrom('build-own');
            setScreen('assembly');
          }}
        />
      )}

      {screen === 'ai-builder' && (
        <AIBuilderScreen
          answers={answers}
          onStartTutorial={(parts) => {
            setAssemblyParts(parts);
            setAssemblyFrom('ai-builder');
            setScreen('assembly');
          }}
          resumeId={resumeBuildId ?? undefined}
        />
      )}

      {screen === 'assembly' && (
        <AssemblyScreen
          selectedParts={assemblyParts}
          backLabel={assemblyFrom === 'build-own' ? 'Back to My Build' : 'Back to AI Chat'}
          onBack={() => setScreen(assemblyFrom)}
        />
      )}

    </div>
  );
}
