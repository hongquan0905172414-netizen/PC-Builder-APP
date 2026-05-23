/*
================================================================
  pages/Home.jsx — BuildCore landing page
================================================================
  Props:
    onStart  — called when "Get Started" is clicked
               wires into App.jsx to switch to the wizard

  TO CHANGE THE HEADLINE: edit the h1/p text below.
  TO CHANGE COLORS:       edit the CSS variables in index.css.
  TO CHANGE THE BUTTON:   edit the <button> near the bottom.
================================================================
*/

export default function Home({ onStart }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* NAV
          To add a nav link: copy an <a> inside nav-links.
          To mark the active page: add the "active" class to that link. */}
      <nav className="nav">
        <div className="logo">
          <span className="logo-accent">Build</span>Core
        </div>
        <div className="nav-links">
          <a className="active" href="#">My Build</a>
          <a href="#">Assembly</a>
          <a href="#">Upgrade My PC</a>
        </div>
        {/* TODO: add .nav-right here for login / user avatar */}
      </nav>

      {/* HERO
          To change layout/spacing: edit the inline styles below.
          To change font sizes: edit the CSS variables in index.css. */}
      <main className="hero">
        <h1 className="hero-headline">Build your PC.</h1>
        <p  className="hero-subheadline">Without the fear.</p>
        <p  className="hero-description">
          Answer a few questions.<br />
          Get your perfect parts list.
        </p>

        {/* CTA BUTTON
            onStart is passed from App.jsx — it switches the page to Wizard.
            TO CHANGE TEXT: edit the button text below. */}
        <button className="btn-cta" onClick={onStart}>
          Get Started →
        </button>
      </main>

    </div>
  );
}
