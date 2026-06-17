/*
================================================================
  pages/Wizard.jsx — PC Build Wizard (4 screens)
================================================================
  This component manages the entire wizard flow using React state.
  All question/template/scoring logic is imported — not defined here.

  SCREENS (managed by `screen` state):
    'choose-path'  — Build your own vs Help me pick
    'quiz'         — One question at a time
    'results'      — Matched parts list + yes / tweak
    'tweak'        — All questions at once, pre-filled

  DATA / LOGIC IMPORTS:
    data/questions.js — QUESTIONS, getActiveQuestions(), getOptions()
    data/templates.js — TEMPLATES (used indirectly via scoring)
    lib/scoring.js    — computeScores(), findTemplate()

  STATE:
    screen          — which screen is visible
    answers         — { budget: '700', goal: 'gaming', ... }
    currentStep     — index into the active question list (quiz mode)
    matchedTemplate — the Template object returned by findTemplate()

  TO ADD A NEW SCREEN:
    1. Add a new state value for `screen`
    2. Add a conditional render block below
    3. Add a button/link that sets screen to the new value

  PROPS:
    onBack — called when user wants to return to the landing page
================================================================
*/

import { useState, useEffect, useRef } from 'react';
import { getActiveQuestions, getOptions } from '../data/questions';
import { computeScores, findTemplate }    from '../lib/scoring';
import { initPrices, tickPrices, cheapestFor, fmt, RETAILERS } from '../lib/prices';
import { loadBuilds, saveBuilds } from '../lib/storage';
import PC3D from '../components/PC3D';
import PartPicker from './PartPicker';

/* ============================================================
   SUB-COMPONENTS
   Small focused components for each part of the UI.
   Keep them in this file since they're tightly coupled to
   the wizard flow. Split into separate files if they grow large.
============================================================ */

/** Single option button used on both quiz and tweak screens */
function OptionBtn({ label, selected, onClick }) {
  return (
    <button
      className={`option-btn${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function BudgetSlider({ value, onChange }) {
  const maxBudget = 100000;
  const budgetValue = Number(value) || 0;
  const displayAmount = `$${budgetValue.toLocaleString()}`;
  const fillPercent = Math.round((budgetValue / maxBudget) * 100);

  return (
    <div className="budget-slider">
      <div className="budget-slider-header">
        <div className="budget-slider-title">{displayAmount}</div>
      </div>

      <input
        className="budget-input"
        type="range"
        min="0"
        max={maxBudget}
        step="100"
        value={budgetValue}
        onChange={(event) => onChange(String(event.target.value))}
        style={{
          background: `linear-gradient(90deg, var(--color-accent) ${fillPercent}%, var(--color-surface) ${fillPercent}%)`,
        }}
        aria-label="Budget slider"
      />
    </div>
  );
}

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

/** Step-through quiz — one question at a time */
function QuizScreen({ answers, currentStep, onAnswer, onSelect, onNext, onBack }) {
  const activeQuestions = getActiveQuestions(answers);
  const total           = activeQuestions.length;
  const q               = activeQuestions[currentStep];
  const opts            = getOptions(q, answers);
  const hasAnswer       = Boolean(answers[q.id]);
  const isLast          = currentStep === total - 1;
  const isBudget        = q.id === 'budget';

  return (
    <div className="screen">

      {/* Progress bar */}
      <div style={{ width: '100%' }}>
        <div className="quiz-progress-row">
          <span className="quiz-progress-text">
            Question {currentStep + 1} of {total}
          </span>
        </div>
        <div className="quiz-progress-track">
          <div
            className="quiz-progress-fill"
            style={{ width: `${((currentStep + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question text */}
      <div className="quiz-question">{q.text}</div>

      {/* Answer options */}
      <div className="quiz-options">
        {isBudget ? (
          <BudgetSlider
            value={answers[q.id]}
            onChange={(value) => onAnswer(q.id, value)}
          />
        ) : (
          opts.map((opt) => (
            <OptionBtn
              key={opt.value}
              label={opt.label}
              selected={answers[q.id] === opt.value}
              onClick={() => onSelect(q.id, opt.value)}
            />
          ))
        )}
      </div>

      {/* Navigation — always show Back; only show Next for budget question */}
      <div className="quiz-nav">
        {currentStep > 0 && (
          <button className="btn-ghost" onClick={onBack}>← Back</button>
        )}
        {isBudget && (
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            disabled={!hasAnswer}
            onClick={onNext}
          >
            {isLast ? 'See my build →' : 'Next →'}
          </button>
        )}
      </div>

    </div>
  );
}

/** Parts list output after the engine runs */
function ResultsScreen({ template, answers, onHappy, onTweak }) {
  const [copied,     setCopied]     = useState(false);
  const [prices,     setPrices]     = useState(() => initPrices(template.parts));
  const [secsAgo,    setSecsAgo]    = useState(0);

  // Simulate live price ticks every 8 seconds
  useEffect(() => {
    const tick    = setInterval(() => { setPrices((p) => tickPrices(p)); setSecsAgo(0); }, 8000);
    const counter = setInterval(() => { setSecsAgo((s) => s + 1); }, 1000);
    return () => { clearInterval(tick); clearInterval(counter); };
  }, []);

  const showRgb   = answers.rgb   && answers.rgb   !== 'none';
  const showGlass = answers.glass === 'yes';

  // Total using the cheapest retailer per part
  const totalCheapest = template.parts.reduce((sum, part) => {
    const p = prices[part.category];
    return sum + (p ? Math.min(...Object.values(p)) : 0);
  }, 0);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="screen screen--top">
      <div style={{ width: '100%' }}>

        {/* 3D PC Model */}
        <PC3D showRgb={showRgb} showGlass={showGlass} />

        {/* Header */}
        <div className="results-header" style={{ marginTop: '14px' }}>
          <span className="template-badge">{template.id} · {template.name}</span>
          <span className="results-price">{fmt(totalCheapest)}</span>
        </div>

        {/* Meta chips */}
        <div className="results-meta" style={{ marginBottom: '12px' }}>
          <div className="meta-chip">
            <span className="meta-label">Compatibility</span>
            <span className="meta-val meta-val--ok">No issues</span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">Est. wattage</span>
            <span className="meta-val">{template.wattage}</span>
          </div>
          <div className="meta-chip" style={{ cursor: 'pointer' }} onClick={handleCopy}>
            <span className="meta-label">Share</span>
            <span className="meta-val meta-val--info">{copied ? 'Copied!' : 'Copy link'}</span>
          </div>
        </div>

        {/* Live price indicator */}
        <div className="price-live-row">
          <span className="price-live-dot" />
          <span className="price-live-text">Live prices · updated {secsAgo}s ago</span>
          <span className="price-live-demo">demo</span>
        </div>

        {/* Price comparison table */}
        <div className="price-table">
          <div className="price-table-head">
            <span className="pt-col-part">Part</span>
            {RETAILERS.map((r) => (
              <span key={r} className="pt-col-price">{r}</span>
            ))}
          </div>

          {template.parts.map((part) => {
            const catPrices = prices[part.category] || {};
            const cheapest  = cheapestFor(catPrices);
            return (
              <div key={part.category} className="price-table-row">
                <div className="pt-col-part">
                  <span className="pt-category">{part.category}</span>
                  <span className="pt-name">{part.name}</span>
                </div>
                {RETAILERS.map((retailer) => {
                  const isBest = retailer === cheapest;
                  return (
                    <div key={retailer} className={`pt-col-price${isBest ? ' pt-best' : ''}`}>
                      <span>{fmt(catPrices[retailer] ?? 0)}</span>
                      {isBest && <span className="pt-best-badge">Best</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Totals row */}
          <div className="price-table-total">
            <span className="pt-col-part">Total</span>
            {RETAILERS.map((retailer) => {
              const total = template.parts.reduce(
                (sum, part) => sum + (prices[part.category]?.[retailer] ?? 0), 0
              );
              return (
                <span key={retailer} className="pt-col-price pt-total-val">
                  {fmt(total)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="results-actions" style={{ marginTop: '14px' }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onTweak}>
            Tweak my answers
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onHappy}>
            Buy cheapest picks →
          </button>
        </div>

        <div className="assembly-teaser">
          Parts ordered?{' '}
          <span style={{ color: 'var(--color-text-muted)' }}>Guided assembly mode</span>
          {' '}coming in v2.0
        </div>

      </div>
    </div>
  );
}

/** All questions at once, pre-filled — user can change any and regenerate */
function TweakScreen({ answers, onAnswerChange, onRegenerate, onBack }) {
  const activeQuestions = getActiveQuestions(answers);

  return (
    <div className="screen screen--top">
      <div style={{ width: '100%' }}>

        <div className="tweak-header">
          <div className="screen-title" style={{ fontSize: '20px' }}>Tweak your answers</div>
          <div className="screen-subtitle" style={{ marginBottom: 0 }}>
            Your previous picks are highlighted. Change any and regenerate.
          </div>
        </div>

        {/* All active questions with current answers highlighted */}
        {activeQuestions.map((q, index) => {
          const opts = getOptions(q, answers);
          return (
            <div key={q.id} className="tweak-block">
              <div className="tweak-q-label">Q{index + 1} — {q.text}</div>
              <div className="tweak-options">
                {q.id === 'budget' ? (
                  <BudgetSlider
                    value={answers[q.id]}
                    onChange={(value) => onAnswerChange(q.id, value)}
                  />
                ) : (
                  opts.map((opt) => (
                    <OptionBtn
                      key={opt.value}
                      label={opt.label}
                      selected={answers[q.id] === opt.value}
                      onClick={() => onAnswerChange(q.id, opt.value)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}

        <div className="tweak-footer">
          <button className="btn-ghost" onClick={onBack}>← Back to results</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onRegenerate}>
            Regenerate build →
          </button>
        </div>

      </div>
    </div>
  );
}


/* ============================================================
   PART INTRO DATA + SCREEN
   Shown after "Help me pick parts" — hover each icon to learn
   what each component does before starting the quiz.
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

/** bare=true: hides the header text and button — used for the manual picker path */
function PartIntroScreen({ onContinue, bare = false }) {
  const [hoveredId, setHoveredId] = useState(null);
  const part = PC_PARTS.find((p) => p.id === hoveredId) ?? null;

  return (
    <div className="part-intro">

      <div className="part-intro-left">
        {!bare && (
          <>
            <h1 className="part-intro-title">Your PC has 8 core parts.</h1>
            <p className="part-intro-sub">Hover any part to learn what it does.</p>
          </>
        )}

        <div className="part-icon-grid" style={bare ? { marginBottom: 0 } : undefined}>
          {PC_PARTS.map((p) => (
            <div
              key={p.id}
              className={`part-icon-card${hoveredId === p.id ? ' part-icon-card--active' : ''}`}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="part-icon-box" style={{ background: p.bg }}>
                <span className="part-icon-emoji">{p.emoji}</span>
              </div>
              <span className="part-icon-label">{p.label}</span>
            </div>
          ))}
        </div>

        {!bare && onContinue && (
          <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={onContinue}>
            Help me pick my parts →
          </button>
        )}
      </div>

      <div className={`part-intro-right${part ? ' part-intro-right--show' : ''}`}>
        {part && (
          <div className="part-intro-desc">
            <div className="part-intro-desc-name" style={{ color: part.color }}>
              {part.label}
            </div>
            <div className="part-intro-desc-tagline">{part.tagline}</div>
            <p className="part-intro-desc-body">{part.desc}</p>
          </div>
        )}
      </div>

    </div>
  );
}


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

function BuildOwnScreen({ buildId }) {
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

    </div>
  );
}


/** Fork shown after "Help me pick" — manual grid vs AI chat */
function PathForkScreen({ onManual, onAI }) {
  return (
    <div className="screen">
      <h1 className="screen-title">How do you want to build?</h1>
      <p  className="screen-subtitle">Pick the approach that feels right.</p>
      <div className="path-cards">
        <button className="path-card" onClick={onManual}>
          <div className="path-card-eyebrow">I know what I want</div>
          <div className="path-card-title">Pick parts by myself</div>
          <div className="path-card-desc">
            Browse the 8 core components. Hover to learn what each one does.
          </div>
        </button>
        <button className="path-card path-card--highlighted" onClick={onAI}>
          <div className="path-card-eyebrow">Not sure where to start</div>
          <div className="path-card-title">Chat with AI Builder</div>
          <div className="path-card-desc">
            Tell the AI what you need. It will guide you and fill in the parts live.
          </div>
        </button>
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

const ASSEMBLY_STEPS = [
  {
    id: 'workspace', emoji: '🛡️', highlight: null,
    title: 'Set Up Your Workspace',
    subtitle: 'Before you open any boxes',
    components: [
      { emoji: '🪛', name: 'Phillips #2 Screwdriver', note: 'The only tool you need' },
      { emoji: '🛡️', name: 'Anti-static Wrist Strap', note: 'Clips to bare metal on the case' },
      { emoji: '📦', name: 'All Part Boxes', note: 'Unbox and lay flat nearby' },
    ],
    steps: [
      'Find a large flat surface — a kitchen table or desk works perfectly',
      'Put on your anti-static wrist strap and clip it to the metal case frame',
      'Unbox every component and keep all bags of screws labelled nearby',
      'Open the motherboard manual and bookmark the RAM slot diagram',
    ],
    tip: 'Take a photo of your components before building — great reference for later',
  },
  {
    id: 'cpu', emoji: '🧠', highlight: 'cpu',
    title: 'Install the CPU',
    subtitle: 'The brain — handle by the edges only',
    components: [
      { emoji: '⚙️', name: 'CPU Chip', note: 'Hold edges only, never touch pins' },
      { emoji: '🔩', name: 'ZIF Lever', note: 'Already attached to the socket' },
      { emoji: '🧴', name: 'Thermal Paste', note: 'Usually included with the cooler' },
    ],
    steps: [
      'Lift the ZIF lever on the motherboard socket fully upright',
      'Find the small golden triangle on one corner of the CPU chip',
      'Match that triangle to the triangle marker on the socket — drop the CPU straight in',
      'No pressure needed — it falls in by gravity when aligned',
      'Lower the lever back down to lock it in place',
      'Apply a small pea-sized dot of thermal paste in the centre of the CPU',
    ],
    warning: 'Never press or force the CPU in. If it needs pressure, it is misaligned — stop.',
    tip: 'The triangle markers are small. Look closely at the corner of the chip and socket.',
  },
  {
    id: 'cooler', emoji: '❄️', highlight: 'cooling',
    title: 'Install the CPU Cooler',
    subtitle: 'Keep those temperatures in check',
    components: [
      { emoji: '❄️', name: 'CPU Cooler', note: 'Tower heatsink or AIO radiator' },
      { emoji: '🔩', name: 'Mounting Screws', note: 'Included with the cooler' },
      { emoji: '🔌', name: 'Fan Power Cable', note: '4-pin — plugs into CPU_FAN header' },
    ],
    steps: [
      'Peel the protective film off the flat copper base of the cooler',
      'Align the cooler mounting bracket with the four holes around the CPU socket',
      'Lower the cooler straight down — the thermal paste spreads itself',
      'Tighten the screws in a diagonal (X) pattern, a little at a time on each corner',
      'Plug the fan cable into the CPU_FAN header on the motherboard',
    ],
    warning: 'Tighten screws evenly — never fully tighten one before the others are started.',
    tip: 'A firm press and slight twist tells you the paste has spread evenly.',
  },
  {
    id: 'ram', emoji: '📋', highlight: 'ram',
    title: 'Install the RAM',
    subtitle: 'Your desk space — snap it in',
    components: [
      { emoji: '📋', name: 'RAM Sticks ×2', note: '32 GB DDR5 kit' },
      { emoji: '🔲', name: 'DIMM Slots A2 + B2', note: 'Check the manual — skip the first slot' },
    ],
    steps: [
      'Check the motherboard manual for correct slots — usually A2 and B2 (not the ones closest to the CPU)',
      'Open the retention clips on both ends of each target slot',
      'Line up the notch cut-out on the RAM stick with the bump in the slot',
      'Press down firmly with both thumbs — equal pressure on both ends at the same time',
      'The retention clips will snap shut automatically when it seats fully',
    ],
    warning: 'DDR5 only fits one direction. If it is not sliding in, flip it 180°.',
    tip: 'You will hear a satisfying double-click when both ends lock. If no click, press harder.',
  },
  {
    id: 'storage', emoji: '💾', highlight: 'storage',
    title: 'Install the M.2 SSD',
    subtitle: 'Tiny card, blazing speed',
    components: [
      { emoji: '💾', name: 'M.2 NVMe SSD', note: 'About the size of a stick of gum' },
      { emoji: '🔩', name: 'M.2 Retention Screw', note: 'Tiny — check the mobo accessory bag' },
      { emoji: '🛡️', name: 'M.2 Heatsink Cover', note: 'Remove before inserting, replace after' },
    ],
    steps: [
      'Find the M.2 slot on the motherboard — usually below the CPU under a metal cover',
      'Unscrew and lift the heatsink cover off',
      'Slide the SSD into the slot at roughly 30° (like inserting a letter into an envelope)',
      'Gently press the far end flat and screw in the tiny retention screw to hold it down',
      'Replace the heatsink cover over the SSD',
    ],
    tip: 'The SSD sticks up at an angle before screwing — completely normal. Do not force it flat.',
  },
  {
    id: 'case-prep', emoji: '🖥️', highlight: 'case',
    title: 'Prepare the Case',
    subtitle: 'Build the shell first',
    components: [
      { emoji: '🖥️', name: 'PC Case', note: 'Remove both side panels' },
      { emoji: '🔩', name: 'Standoffs ×9', note: 'Usually pre-installed for ATX' },
      { emoji: '🛡️', name: 'I/O Shield', note: 'Included in your motherboard box' },
    ],
    steps: [
      'Remove both side panels — most use thumbscrews or a latch at the back',
      'Take the I/O shield from the motherboard box and push it into the rear cutout from inside the case — it snaps in with firm pressure',
      'Verify 9 standoffs are installed in the ATX layout (check your case manual)',
      'Remove any drive bay covers or plastic covers you do not need',
    ],
    warning: 'Install the I/O shield BEFORE the motherboard — nearly impossible to add after.',
    tip: 'The I/O shield has sharp stamped metal tabs. Push it with a cloth-wrapped screwdriver.',
  },
  {
    id: 'motherboard', emoji: '🔌', highlight: 'motherboard',
    title: 'Install the Motherboard',
    subtitle: 'The city finds its home',
    components: [
      { emoji: '🔌', name: 'Motherboard', note: 'With CPU, cooler, and RAM already installed' },
      { emoji: '🔩', name: 'Mobo Screws ×9', note: 'Usually included with the case' },
    ],
    steps: [
      'Lower the motherboard in at a slight angle so the ports slide into the I/O shield cutout',
      'Rest it flat — every screw hole should sit directly over a standoff',
      'Start all 9 screws by hand before tightening any of them',
      'Tighten in a star pattern (centre → diagonal corners), snug but not over-tight',
    ],
    warning: 'Do not fully tighten one screw before the others are started — it warps the board.',
    tip: 'The I/O shield tabs will push against the board ports. A little resistance is normal.',
  },
  {
    id: 'psu', emoji: '⚡', highlight: 'psu',
    title: 'Install the Power Supply',
    subtitle: 'The heartbeat of your build',
    components: [
      { emoji: '⚡', name: 'Power Supply Unit', note: '850W fully modular' },
      { emoji: '🔩', name: 'PSU Screws ×4', note: 'Included with the PSU' },
      { emoji: '🔌', name: '24-pin ATX Cable', note: 'Main board power — right side of mobo' },
      { emoji: '🔌', name: '8-pin EPS Cable', note: 'CPU power — top-left corner of mobo' },
      { emoji: '🔌', name: 'PCIe Cables ×2', note: 'GPU power — route now, plug in at GPU step' },
    ],
    steps: [
      'Slide the PSU into the bottom chamber — fan facing DOWN toward the floor vent',
      'Screw in the 4 rear PSU screws',
      'Route the 24-pin ATX cable through the back panel cutout to the right side of the motherboard and plug it in',
      'Route the 8-pin EPS cable to the top-left of the motherboard and plug it in',
      'Route PCIe cables toward where the GPU will go — leave them loose for now',
    ],
    tip: 'Thread cables through back-panel cutouts before connecting — cleaner look, better airflow.',
  },
  {
    id: 'gpu', emoji: '🎮', highlight: 'gpu',
    title: 'Install the GPU',
    subtitle: 'The artist takes the stage',
    components: [
      { emoji: '🎮', name: 'Graphics Card', note: 'The biggest part in the build' },
      { emoji: '🔩', name: 'PCIe Bracket Screws ×2', note: 'Secure card to the case' },
      { emoji: '🔌', name: 'PCIe Power Cables', note: '2× 8-pin or 1× 16-pin from the PSU' },
    ],
    steps: [
      'Remove 2–3 PCIe slot covers from the rear of the case (line them up with the GPU bracket)',
      'Unlock the PCIe x16 retention clip on the motherboard',
      'Lower the GPU straight down into the long PCIe x16 slot until you hear it click',
      'Screw the bracket into the rear of the case with 2 screws',
      'Plug the PCIe power cables from the PSU into the GPU connectors',
    ],
    warning: 'Do not skip the power cables — the GPU will not display anything without them.',
    tip: 'Listen for the click. If you do not hear it, the GPU is not fully seated — press again.',
  },
  {
    id: 'boot', emoji: '🚀', highlight: null,
    title: 'First Boot',
    subtitle: 'The moment of truth',
    components: [
      { emoji: '🖥️', name: 'Monitor', note: 'Plug into the GPU, not the motherboard' },
      { emoji: '⌨️', name: 'Keyboard + Mouse', note: 'Any USB port on the I/O panel' },
      { emoji: '🔌', name: 'Power Cable', note: 'Into the PSU rear socket' },
    ],
    steps: [
      'Connect the monitor DisplayPort or HDMI cable to the GPU output (not the motherboard)',
      'Plug keyboard and mouse into USB ports on the rear I/O panel',
      'Connect the power cable to the PSU, flip the PSU switch to ON (marked I)',
      'Press the case power button — the PC should start and show the BIOS screen',
      'In BIOS: find the XMP / EXPO setting and enable it so RAM runs at full speed',
      'Save and exit BIOS, then boot from a USB drive to install your OS',
    ],
    warning: 'No display? Check: monitor is in the GPU port, GPU power cables are fully clicked in, RAM is reseated.',
    tip: 'The first boot usually goes straight to BIOS — that is completely normal.',
  },
];

/** Lego-style step-by-step assembly guide */
function AssemblyScreen({ selectedParts = {}, onBack }) {
  const [step, setStep] = useState(0);
  const current = ASSEMBLY_STEPS[step];
  const total   = ASSEMBLY_STEPS.length;

  const cpuName  = selectedParts['cpu']?.name  ?? 'your CPU';
  const gpuName  = selectedParts['gpu']?.name  ?? 'your GPU';
  const caseName = selectedParts['case']?.name ?? 'your case';

  // Personalise a couple of step subtitles with real part names
  const subtitle = current.id === 'gpu'  ? `Installing the ${gpuName}`
                 : current.id === 'cpu'  ? `Installing the ${cpuName}`
                 : current.id === 'case-prep' ? `Preparing the ${caseName}`
                 : current.subtitle;

  return (
    <div className="lego-assembly">

      {/* Progress bar */}
      <div className="lego-progress">
        <button className="lego-back-btn" onClick={onBack}>← Back to AI Chat</button>
        <div className="lego-progress-track">
          <div className="lego-progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
        <span className="lego-step-count">Step {step + 1} of {total}</span>
      </div>

      {/* Body */}
      <div className="lego-body">

        {/* Left: instructions */}
        <div className="lego-left">
          <div className="lego-step-emoji">{current.emoji}</div>
          <h2 className="lego-step-title">{current.title}</h2>
          <p className="lego-step-subtitle">{subtitle}</p>

          {/* Component tray */}
          <p className="lego-section-label">What you need</p>
          <div className="lego-component-tray">
            {current.components.map((c, i) => (
              <div key={i} className="lego-component-card">
                <span className="lego-component-emoji">{c.emoji}</span>
                <span className="lego-component-name">{c.name}</span>
                <span className="lego-component-note">{c.note}</span>
              </div>
            ))}
          </div>

          {/* Steps */}
          <p className="lego-section-label">Steps</p>
          <ol className="lego-steps-list">
            {current.steps.map((s, i) => (
              <li key={i} className="lego-step-item">
                <span className="lego-step-num">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>

          {current.warning && (
            <div className="lego-warning">⚠️ {current.warning}</div>
          )}
          {current.tip && (
            <div className="lego-tip">💡 {current.tip}</div>
          )}
        </div>

        {/* Right: 3D model */}
        <div className="lego-right">
          <PC3D
            highlighted={current.highlight}
            showRgb={!!selectedParts['ram']}
            showGlass={['lian-li-o11','nzxt-h510'].includes(selectedParts['case']?.id)}
            height="100%"
          />
          {current.highlight && (
            <div className="lego-3d-label">
              {PC_PARTS.find(p => p.id === current.highlight)?.label} ↑ highlighted in the model
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="lego-footer">
        <button
          className="lego-nav-btn lego-nav-btn--back"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ← Previous
        </button>

        <div className="lego-dots">
          {ASSEMBLY_STEPS.map((_, i) => (
            <button
              key={i}
              className={`lego-dot${i === step ? ' lego-dot--active' : i < step ? ' lego-dot--done' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <button
          className="lego-nav-btn lego-nav-btn--next"
          onClick={() => setStep(s => Math.min(total - 1, s + 1))}
          disabled={step === total - 1}
        >
          {step === total - 1 ? '🎉 Done!' : 'Next →'}
        </button>
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

  // Current step index into the active question list (quiz mode)
  const [currentStep, setCurrentStep] = useState(0);

  // The matched Template object from findTemplate()
  const [matchedTemplate, setMatchedTemplate] = useState(null);

  // Parts selected in the AI builder — passed to AssemblyScreen
  const [assemblyParts, setAssemblyParts] = useState({});

  /* ----------------------------------------------------------
    Removes answers for questions that are no longer applicable.
    Called whenever an answer changes (e.g. if RGB changes to
    'none', glass + cables answers are cleared automatically).
  ---------------------------------------------------------- */
  function pruneAndUpdate(newAnswers) {
    const active   = getActiveQuestions(newAnswers);
    const validIds = new Set(active.map((q) => q.id));
    const pruned   = Object.fromEntries(
      Object.entries(newAnswers).filter(([id]) => validIds.has(id))
    );
    return pruned;
  }

  /* ----------------------------------------------------------
    Quiz: record an answer and re-prune conditional answers
  ---------------------------------------------------------- */
  function handleAnswer(questionId, value) {
    const updated = pruneAndUpdate({ ...answers, [questionId]: value });
    setAnswers(updated);
  }

  /* ----------------------------------------------------------
    Quiz: advance to the next step or run the engine on the last
  ---------------------------------------------------------- */
  function handleNext() {
    const active = getActiveQuestions(answers);
    if (currentStep < active.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      runEngine();
    }
  }

  /* ----------------------------------------------------------
    Quiz: record an answer AND immediately advance (used for
    all questions except budget, which needs an explicit Next)
  ---------------------------------------------------------- */
  function handleSelect(questionId, value) {
    const updated = pruneAndUpdate({ ...answers, [questionId]: value });
    setAnswers(updated);
    const active = getActiveQuestions(updated);
    if (currentStep < active.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      const scores   = computeScores(updated);
      const template = findTemplate(scores);
      setMatchedTemplate(template);
      setScreen('results');
    }
  }

  /* ----------------------------------------------------------
    Quiz: go back one step
  ---------------------------------------------------------- */
  function handleQuizBack() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  /* ----------------------------------------------------------
    Run the scoring engine and show results
  ---------------------------------------------------------- */
  function runEngine() {
    const scores   = computeScores(answers);
    const template = findTemplate(scores);
    setMatchedTemplate(template);
    setScreen('results');
  }

  /* ----------------------------------------------------------
    Tweak: update an answer and re-prune in real time
  ---------------------------------------------------------- */
  function handleTweakAnswer(questionId, value) {
    const updated = pruneAndUpdate({ ...answers, [questionId]: value });
    setAnswers(updated);
  }

  /* ----------------------------------------------------------
    "Happy" — open buy links in new tabs
    TODO: replace the alert with real affiliate URL logic once
          the urls in data/templates.js are filled in.
  ---------------------------------------------------------- */
  function handleHappy() {
    // matchedTemplate.parts.forEach(p => window.open(p.url, '_blank'));
    alert('Opening buy links! Add real URLs to each part in client/src/data/templates.js');
  }

  /* ----------------------------------------------------------
    Nav: go back to the landing page
  ---------------------------------------------------------- */
  function handleNavBack() {
    setScreen('choose-path');
    setAnswers({});
    setCurrentStep(0);
    setMatchedTemplate(null);
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
        <BuildOwnScreen buildId={resumeBuildId ?? undefined} />
      )}

      {screen === 'path-fork' && (
        <PathForkScreen
          onManual={() => setScreen('parts-manual')}
          onAI={() => setScreen('ai-builder')}
        />
      )}

      {screen === 'parts-manual' && (
        <PartIntroScreen bare />
      )}

      {screen === 'parts-intro' && (
        <PartIntroScreen onContinue={() => setScreen('quiz')} />
      )}

      {screen === 'ai-builder' && (
        <AIBuilderScreen
          answers={answers}
          onStartTutorial={(parts) => { setAssemblyParts(parts); setScreen('assembly'); }}
          resumeId={resumeBuildId ?? undefined}
        />
      )}

      {screen === 'assembly' && (
        <AssemblyScreen
          selectedParts={assemblyParts}
          onBack={() => setScreen('ai-builder')}
        />
      )}

      {screen === 'quiz' && (
        <QuizScreen
          answers={answers}
          currentStep={currentStep}
          onAnswer={handleAnswer}
          onSelect={handleSelect}
          onNext={handleNext}
          onBack={handleQuizBack}
        />
      )}

      {screen === 'results' && matchedTemplate && (
        <ResultsScreen
          template={matchedTemplate}
          answers={answers}
          onHappy={handleHappy}
          onTweak={() => setScreen('tweak')}
        />
      )}

      {screen === 'tweak' && (
        <TweakScreen
          answers={answers}
          onAnswerChange={handleTweakAnswer}
          onRegenerate={runEngine}
          onBack={() => setScreen('results')}
        />
      )}

    </div>
  );
}
