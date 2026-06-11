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

/** Split-screen: AI chat on the left, parts grid on the right */
function AIBuilderScreen() {
  const [messages, setMessages] = useState([
    {
      id: 1, from: 'ai',
      text: "Hey! I'm your AI PC builder. Tell me what you mainly want to use your PC for — gaming, work, video editing, school — and I'll help you figure out the right parts.",
    },
  ]);
  const [input, setInput]       = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1, from: 'ai',
          text: "Thanks for sharing that! Full AI integration is coming soon — once it's live, I'll be able to recommend specific parts based on exactly what you tell me. For now, hover any part on the right to learn what it does.",
        },
      ]);
    }, 750);
  }

  const hovered = PC_PARTS.find((p) => p.id === hoveredId) ?? null;

  return (
    <div className="ai-builder">

      {/* ── Left: chat ── */}
      <div className="ai-chat">
        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-msg ai-msg--${msg.from}`}>
              {msg.from === 'ai' && <span className="ai-msg-label">AI Builder</span>}
              <div className="ai-msg-bubble">{msg.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="ai-chat-bar">
          <input
            className="ai-chat-input"
            type="text"
            placeholder="Tell me about your needs…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            className="ai-chat-send"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>

      {/* ── Right: parts grid + hover description ── */}
      <div className="ai-parts-panel">
        <div className="ai-parts-header">
          <span className="ai-parts-title">Your Build</span>
          <span className="ai-parts-hint">Hover to explore</span>
        </div>

        <div className="ai-parts-grid">
          {PC_PARTS.map((p) => (
            <div
              key={p.id}
              className={`ai-part-card${hoveredId === p.id ? ' ai-part-card--active' : ''}`}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="ai-part-icon" style={{ background: p.bg }}>
                <span className="ai-part-emoji">{p.emoji}</span>
              </div>
              <span className="ai-part-label">{p.label}</span>
            </div>
          ))}
        </div>

        <div className={`ai-part-desc${hovered ? ' ai-part-desc--show' : ''}`}>
          {hovered && (
            <>
              <div className="ai-part-desc-name" style={{ color: hovered.color }}>
                {hovered.label}
              </div>
              <div className="ai-part-desc-tagline">{hovered.tagline}</div>
              <p className="ai-part-desc-body">{hovered.desc}</p>
            </>
          )}
        </div>
      </div>

    </div>
  );
}


/* ============================================================
   MAIN WIZARD COMPONENT
   Manages all state and wires the sub-components together.
============================================================ */
export default function Wizard({ onBack, resumeBuildId }) {
  const [screen, setScreen] = useState(
    resumeBuildId ? 'build-own' : 'choose-path'
  );

  // User's answers: { budget: '700', goal: 'gaming', ... }
  const [answers, setAnswers] = useState({ budget: '50000' });

  // Current step index into the active question list (quiz mode)
  const [currentStep, setCurrentStep] = useState(0);

  // The matched Template object from findTemplate()
  const [matchedTemplate, setMatchedTemplate] = useState(null);

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
        <AIBuilderScreen />
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
