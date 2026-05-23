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

import { useState } from 'react';
import { getActiveQuestions, getOptions } from '../data/questions';
import { computeScores, findTemplate }    from '../lib/scoring';

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
function QuizScreen({ answers, currentStep, onAnswer, onNext, onBack }) {
  const activeQuestions = getActiveQuestions(answers);
  const total           = activeQuestions.length;
  const q               = activeQuestions[currentStep];
  const opts            = getOptions(q, answers);
  const hasAnswer       = Boolean(answers[q.id]);
  const isLast          = currentStep === total - 1;

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
        {opts.map((opt) => (
          <OptionBtn
            key={opt.value}
            label={opt.label}
            selected={answers[q.id] === opt.value}
            onClick={() => onAnswer(q.id, opt.value)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="quiz-nav">
        {currentStep > 0 && (
          <button className="btn-ghost" onClick={onBack}>← Back</button>
        )}
        <button
          className="btn-primary"
          style={{ flex: 1 }}
          disabled={!hasAnswer}
          onClick={onNext}
        >
          {isLast ? 'See my build →' : 'Next →'}
        </button>
      </div>

    </div>
  );
}

/** Parts list output after the engine runs */
function ResultsScreen({ template, onHappy, onTweak }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="screen screen--top">
      <div style={{ width: '100%' }}>

        {/* Header: template badge + price */}
        <div className="results-header">
          <span className="template-badge">{template.id} · {template.name}</span>
          <span className="results-price">{template.price}</span>
        </div>

        {/* Parts list
            TO CHANGE a part: edit data/templates.js, find the template, edit parts[] */}
        <div className="parts-list">
          {template.parts.map((part) => (
            <div key={part.category} className="part-row">
              <span className="part-category">{part.category}</span>
              <span className="part-name">{part.name}</span>
              {/* Replace part.url with a real affiliate link */}
              <a className="part-price" href={part.url} target="_blank" rel="noreferrer">
                {part.price} →
              </a>
            </div>
          ))}
        </div>

        {/* Meta chips */}
        <div className="results-meta">
          <div className="meta-chip">
            <span className="meta-label">Compatibility</span>
            <span className="meta-val meta-val--ok">No issues</span>
          </div>
          <div className="meta-chip">
            <span className="meta-label">Est. wattage</span>
            <span className="meta-val">{template.wattage}</span>
          </div>
          <div className="meta-chip" style={{ cursor: 'pointer' }} onClick={handleCopy}>
            <span className="meta-label">Share link</span>
            <span className="meta-val meta-val--info">{copied ? 'Copied!' : 'Copy URL'}</span>
          </div>
        </div>

        {/* Action row */}
        <div className="results-actions">
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onTweak}>
            Tweak my answers
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onHappy}>
            I'm happy — show buy links →
          </button>
        </div>

        {/* Assembly guide teaser — v2.0 */}
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
                {opts.map((opt) => (
                  <OptionBtn
                    key={opt.value}
                    label={opt.label}
                    selected={answers[q.id] === opt.value}
                    onClick={() => onAnswerChange(q.id, opt.value)}
                  />
                ))}
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
   MAIN WIZARD COMPONENT
   Manages all state and wires the sub-components together.
============================================================ */
export default function Wizard({ onBack }) {
  // Which screen is visible — the only place this is set
  const [screen, setScreen] = useState('choose-path');

  // User's answers: { budget: '700', goal: 'gaming', ... }
  const [answers, setAnswers] = useState({});

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
            setScreen('quiz');
          }}
          onBuildOwn={() => {
            // TODO: navigate to the full parts picker when built
            alert('Full parts picker coming soon!');
          }}
        />
      )}

      {screen === 'quiz' && (
        <QuizScreen
          answers={answers}
          currentStep={currentStep}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onBack={handleQuizBack}
        />
      )}

      {screen === 'results' && matchedTemplate && (
        <ResultsScreen
          template={matchedTemplate}
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
