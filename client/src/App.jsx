/*
================================================================
  App.jsx — Root component / page router
================================================================
  Manages which top-level page is shown using simple React state.
  No external router library needed at this stage.

  PAGES:
    'home'   — BuildCore landing page  (pages/Home.jsx)
    'wizard' — Build wizard flow       (pages/Wizard.jsx)

  TO ADD A NEW PAGE:
    1. Import the component at the top
    2. Add a new state value (e.g. 'parts-picker')
    3. Add a conditional render block below
    4. Pass a navigation callback as a prop to the trigger button

  UPGRADING TO URL-BASED ROUTING LATER:
    Replace this state logic with react-router-dom.
    The page components (Home, Wizard) don't need to change —
    just swap onStart/onBack props for <Link> or useNavigate().
================================================================
*/

import { useState } from 'react';
import Home        from './pages/Home';
import Wizard      from './pages/Wizard';
import PartsPicker from './pages/PartsPicker';

function loadSavedBuild() {
  try { return JSON.parse(localStorage.getItem('pc-build')) ?? null; }
  catch { return null; }
}

export default function App() {
  const [page, setPage]                     = useState('home');
  const [resumeTemplate, setResumeTemplate] = useState(null);
  const [savedBuild, setSavedBuild]         = useState(() => loadSavedBuild());

  function handleContinueBuild() {
    setResumeTemplate(savedBuild);
    setPage('wizard');
  }

  function handleDeleteBuild() {
    localStorage.removeItem('pc-build');
    setSavedBuild(null);
  }

  function handleBack() {
    setResumeTemplate(null);
    setSavedBuild(loadSavedBuild());
    setPage('home');
  }

  return (
    <>
      {page === 'home' && (
        <Home
          onStart={() => setPage('wizard')}
          savedBuild={savedBuild}
          onContinueBuild={handleContinueBuild}
          onDeleteBuild={handleDeleteBuild}
        />
      )}
      {page === 'wizard' && (
        <Wizard
          onBack={handleBack}
          resumeTemplate={resumeTemplate}
          onBuildOwn={() => setPage('parts-picker')}
        />
      )}
      {page === 'parts-picker' && (
        <PartsPicker onBack={() => setPage('home')} />
      )}
    </>
  );
}
