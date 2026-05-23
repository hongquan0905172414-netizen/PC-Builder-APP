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
import Home   from './pages/Home';
import Wizard from './pages/Wizard';

export default function App() {
  // Controls which top-level page is rendered
  // 'home' | 'wizard'  — add more keys here as the app grows
  const [page, setPage] = useState('home');

  return (
    <>
      {page === 'home'   && <Home   onStart={() => setPage('wizard')} />}
      {page === 'wizard' && <Wizard onBack={()  => setPage('home')}  />}

      {/* TODO: add more pages here as they are built
          {page === 'parts-picker' && <PartsPicker onBack={() => setPage('home')} />}
      */}
    </>
  );
}
