/*
================================================================
  PartGlyph.jsx — flat drawings of each part
================================================================
  Used in the "what you need" tray at the side of each assembly
  step, the way a Lego booklet shows the bricks for that page.
  Pictures only — no labels.
================================================================
*/

const S = { width: '100%', height: '100%', display: 'block' };

/* Each glyph draws inside a 48×48 box */
const GLYPHS = {
  'case': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="13" y="4" width="22" height="40" rx="2" fill="#4a4a54" stroke="#2a2a32" strokeWidth="1.5" />
      <rect x="17" y="9" width="14" height="18" rx="1" fill="#2a2a32" />
      <circle cx="29" cy="37" r="1.6" fill="#7fd0ff" />
    </svg>
  ),
  'psu': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="7" y="16" width="34" height="17" rx="2" fill="#5a5a62" stroke="#33333b" strokeWidth="1.5" />
      <circle cx="18" cy="24.5" r="6" fill="none" stroke="#33333b" strokeWidth="1.5" />
      <circle cx="18" cy="24.5" r="1.5" fill="#33333b" />
      <rect x="29" y="20" width="8" height="9" rx="1" fill="#3f3f47" />
    </svg>
  ),
  'motherboard': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="7" y="7" width="34" height="34" rx="2" fill="#1f6b3a" stroke="#134526" strokeWidth="1.5" />
      <rect x="12" y="12" width="11" height="11" rx="1" fill="#134526" />
      <rect x="27" y="12" width="3" height="16" rx="1" fill="#134526" />
      <rect x="32" y="12" width="3" height="16" rx="1" fill="#134526" />
      <rect x="12" y="31" width="23" height="4" rx="1" fill="#134526" />
    </svg>
  ),
  'cpu': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="13" y="13" width="22" height="22" rx="2" fill="#c9a227" stroke="#8a6f13" strokeWidth="1.5" />
      <rect x="18" y="18" width="12" height="12" rx="1" fill="#e0be48" />
      <path d="M16 16 L20 16 L16 20 Z" fill="#8a6f13" />
      {[17, 22, 27, 32].map((v) => (
        <g key={v}>
          <rect x={v - 1} y="9" width="2" height="4" fill="#8a6f13" />
          <rect x={v - 1} y="35" width="2" height="4" fill="#8a6f13" />
        </g>
      ))}
    </svg>
  ),
  'cpu-cooler': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="15" y="8" width="18" height="24" rx="1" fill="#8a8a94" stroke="#55555f" strokeWidth="1.5" />
      {[12, 16, 20, 24, 28].map((y) => (
        <line key={y} x1="15" y1={y} x2="33" y2={y} stroke="#55555f" strokeWidth="1" />
      ))}
      <circle cx="24" cy="38" r="6" fill="none" stroke="#55555f" strokeWidth="1.5" />
      <circle cx="24" cy="38" r="1.5" fill="#55555f" />
    </svg>
  ),
  'ram': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="5" y="18" width="38" height="12" rx="1" fill="#2f6bd8" stroke="#1c4490" strokeWidth="1.5" />
      <rect x="9" y="21" width="30" height="4" rx="1" fill="#4d86ef" />
      <rect x="21" y="29" width="4" height="3" fill="#1c4490" />
      {[8, 12, 16, 28, 32, 36].map((x) => (
        <rect key={x} x={x} y="29" width="2" height="2" fill="#1c4490" />
      ))}
    </svg>
  ),
  'storage': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="9" y="20" width="30" height="8" rx="1" fill="#22223a" stroke="#0f0f20" strokeWidth="1.5" />
      <rect x="13" y="22" width="9" height="4" rx="1" fill="#3a3a58" />
      <rect x="35" y="22" width="2" height="4" fill="#c9a227" />
      <rect x="38" y="22" width="2" height="4" fill="#c9a227" />
    </svg>
  ),
  'gpu': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="5" y="15" width="38" height="16" rx="1.5" fill="#2a2a48" stroke="#15152a" strokeWidth="1.5" />
      <circle cx="16" cy="23" r="5" fill="none" stroke="#5c5c88" strokeWidth="1.5" />
      <circle cx="31" cy="23" r="5" fill="none" stroke="#5c5c88" strokeWidth="1.5" />
      <rect x="9" y="31" width="14" height="3" fill="#c9a227" />
    </svg>
  ),
  'glass': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="13" y="5" width="22" height="38" rx="2" fill="#9fc4ff" fillOpacity="0.35" stroke="#6f9fe0" strokeWidth="1.5" />
      <line x1="17" y1="12" x2="29" y2="24" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="17" y1="20" x2="25" y2="28" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.45" />
    </svg>
  ),
  'screwdriver': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="27" y="9" width="7" height="16" rx="3" transform="rotate(45 30.5 17)" fill="#d9534f" stroke="#a03330" strokeWidth="1.5" />
      <rect x="16" y="24" width="4" height="15" rx="1" transform="rotate(45 18 31.5)" fill="#b8b8c0" stroke="#7a7a84" strokeWidth="1.2" />
    </svg>
  ),
  'screws': (
    <svg viewBox="0 0 48 48" style={S}>
      {[[16, 18], [30, 18], [23, 32]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="6" fill="#b8b8c0" stroke="#7a7a84" strokeWidth="1.5" />
          <line x1={cx - 3} y1={cy} x2={cx + 3} y2={cy} stroke="#7a7a84" strokeWidth="1.5" />
          <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 3} stroke="#7a7a84" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  ),
  'paste': (
    <svg viewBox="0 0 48 48" style={S}>
      <rect x="18" y="14" width="12" height="24" rx="3" fill="#dcdce4" stroke="#8a8a94" strokeWidth="1.5" />
      <rect x="21" y="8" width="6" height="6" rx="1" fill="#8a8a94" />
      <circle cx="24" cy="26" r="3.5" fill="#b8b8c0" />
    </svg>
  ),
  'cable': (
    <svg viewBox="0 0 48 48" style={S}>
      <path d="M10 34 C 18 34, 18 16, 26 16 S 34 26, 40 26" fill="none" stroke="#3a3a42" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="6" y="30" width="7" height="8" rx="1.5" fill="#c9a227" stroke="#8a6f13" strokeWidth="1.2" />
    </svg>
  ),
};

export default function PartGlyph({ kind }) {
  return GLYPHS[kind] ?? GLYPHS['screws'];
}
