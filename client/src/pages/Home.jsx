import { useState, useRef, useEffect } from 'react'
import PCViewer3D from '../components/PCViewer3D'

function SavedBuildCard({ savedBuild, onContinueBuild, onDeleteBuild }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef()

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="sbc" onClick={onContinueBuild}>
      {/* 3D PC fills the card */}
      <div className="sbc-viewer">
        <PCViewer3D />
      </div>

      {/* Bottom gradient + price */}
      <div className="sbc-gradient" />
      <span className="sbc-price">{savedBuild.price}</span>

      {/* 3-dot menu */}
      <div className="sbc-menu-wrap" ref={menuRef} onClick={e => e.stopPropagation()}>
        <button className="sbc-dots" onClick={() => setMenuOpen(o => !o)}>
          ···
        </button>
        {menuOpen && (
          <div className="sbc-dropdown">
            <button className="sbc-delete-btn" onClick={() => { setMenuOpen(false); onDeleteBuild() }}>
              Delete build
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home({ onStart, savedBuild, onContinueBuild, onDeleteBuild }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      <nav className="nav">
        <div className="logo"><span className="logo-accent">Build</span>Core</div>
        <div className="nav-links">
          <a className="active" href="#">My Build</a>
          <a href="#">Assembly</a>
          <a href="#">Upgrade My PC</a>
        </div>
      </nav>

      <main className="hero">
        <h1 className="hero-headline">Build your PC.</h1>
        <p  className="hero-subheadline">Without the fear.</p>
        <p  className="hero-description">
          Answer a few questions.<br />Get your perfect parts list.
        </p>
        <button className="btn-cta" onClick={onStart}>Get Started →</button>

        {savedBuild && (
          <SavedBuildCard
            savedBuild={savedBuild}
            onContinueBuild={onContinueBuild}
            onDeleteBuild={onDeleteBuild}
          />
        )}
      </main>

    </div>
  )
}
