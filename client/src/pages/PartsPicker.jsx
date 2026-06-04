import { useState, useRef, useEffect } from 'react'
import { CATEGORIES, PARTS_DB, SPEC_COLS, checkCompatibility } from '../data/partsDatabase'

/* ── Price comparison popover ─────────────────────────────── */
function PricePopover({ vendors, selectedIdx, onSelect }) {
  return (
    <div className="pp-vendor-pop" onClick={e => e.stopPropagation()}>
      <div className="pp-vendor-pop-title">Compare prices</div>
      {vendors.map((v, i) => (
        <button
          key={i}
          className={`pp-vendor-row${i === selectedIdx ? ' pp-vendor-row--active' : ''}`}
          onClick={() => onSelect(i)}
        >
          <span className="pp-vendor-store">{v.store}</span>
          <span className="pp-vendor-price">${v.price}</span>
          {i === 0 && <span className="pp-vendor-tag">Cheapest</span>}
          {i === selectedIdx && i !== 0 && <span className="pp-vendor-selected">Selected</span>}
        </button>
      ))}
    </div>
  )
}

/* ── Category part selector ───────────────────────────────── */
function CategoryPicker({ category, onSelect, onBack }) {
  const [search,          setSearch]          = useState('')
  const [openPopover,     setOpenPopover]      = useState(null)   // partId
  const [vendorPicks,     setVendorPicks]      = useState({})     // partId → vendorIdx
  const popRef = useRef()

  // Close popover when clicking outside
  useEffect(() => {
    function handler(e) {
      if (popRef.current && !popRef.current.contains(e.target)) setOpenPopover(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const parts   = PARTS_DB[category] ?? []
  const cols    = SPEC_COLS[category] ?? []
  const filtered = parts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  function vendorIdx(partId)   { return vendorPicks[partId] ?? 0 }
  function activeVendor(part)  { return part.vendors[vendorIdx(part.id)] }

  function handleAdd(part) {
    const v = activeVendor(part)
    onSelect({ ...part, price: v.price, store: v.store, url: v.url })
  }

  return (
    <div className="pp-picker">
      <div className="pp-picker-header">
        <button className="pp-back-btn" onClick={onBack}>← Back</button>
        <h2 className="pp-picker-title">Choose a {category}</h2>
      </div>

      <input
        className="pp-search"
        placeholder={`Search ${category}…`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
      />

      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead>
            <tr>
              <th>Name</th>
              {cols.map(([, label]) => <th key={label}>{label}</th>)}
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(part => {
              const vIdx    = vendorIdx(part.id)
              const vendor  = activeVendor(part)
              const isOpen  = openPopover === part.id
              const cheapest = part.vendors[0]

              return (
                <tr key={part.id} className="pp-table-row" onClick={() => handleAdd(part)}>
                  <td className="pp-part-name">{part.name}</td>
                  {cols.map(([key]) => (
                    <td key={key} className="pp-spec">
                      {typeof part.specs[key] === 'boolean'
                        ? (part.specs[key] ? 'Yes' : 'No')
                        : (part.specs[key] ?? '—')}
                    </td>
                  ))}

                  {/* Clickable price cell with popover */}
                  <td className="pp-price-cell" ref={isOpen ? popRef : null}>
                    <button
                      className={`pp-price-btn${vIdx !== 0 ? ' pp-price-btn--alt' : ''}`}
                      onClick={e => {
                        e.stopPropagation()
                        setOpenPopover(isOpen ? null : part.id)
                      }}
                    >
                      <span>${vendor.price}</span>
                      <span className="pp-price-store">{vendor.store}</span>
                      <span className="pp-price-chevron">▾</span>
                    </button>
                    {isOpen && (
                      <PricePopover
                        vendors={part.vendors}
                        selectedIdx={vIdx}
                        onSelect={i => {
                          setVendorPicks(prev => ({ ...prev, [part.id]: i }))
                          setOpenPopover(null)
                        }}
                      />
                    )}
                  </td>

                  <td>
                    <button
                      className="pp-select-btn"
                      onClick={e => { e.stopPropagation(); handleAdd(part) }}
                    >
                      Add
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={cols.length + 3} className="pp-empty">No parts found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Main parts list ──────────────────────────────────────── */
export default function PartsPicker({ onBack }) {
  const [selected, setSelected] = useState({})
  const [picking,  setPicking]  = useState(null)

  const total  = Object.values(selected).reduce((sum, p) => sum + p.price, 0)
  const issues = checkCompatibility(selected)

  function handleSelect(category, part) {
    setSelected(prev => ({ ...prev, [category]: part }))
    setPicking(null)
  }

  function handleRemove(category) {
    setSelected(prev => { const n = { ...prev }; delete n[category]; return n })
  }

  const Nav = () => (
    <nav className="nav">
      <div className="logo"><span className="logo-accent">Build</span>Core</div>
      <div className="nav-links">
        <a href="#" onClick={onBack}>My Build</a>
        <a className="active" href="#">Assembly</a>
        <a href="#">Upgrade My PC</a>
      </div>
    </nav>
  )

  if (picking) {
    return (
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <Nav />
        <CategoryPicker
          category={picking}
          onSelect={part => handleSelect(picking, part)}
          onBack={() => setPicking(null)}
        />
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />
      <div className="pp-wrap">

        {/* Compatibility bar */}
        <div className={`pp-compat ${issues.length === 0 ? 'pp-compat--ok' : 'pp-compat--err'}`}>
          <span className="pp-compat-icon">{issues.length === 0 ? '✓' : '⚠'}</span>
          <span>{issues.length === 0 ? 'No issues or incompatibilities found' : issues.join(' · ')}</span>
          {total > 0 && (
            <span className="pp-wattage">
              Total · <strong>${total.toLocaleString()}</strong>
            </span>
          )}
        </div>

        {/* Parts list */}
        <div className="pp-list">
          {CATEGORIES.map(cat => {
            const part = selected[cat]
            return (
              <div key={cat} className="pp-row">
                <span className="pp-cat">{cat}</span>
                <div className="pp-selection">
                  {part
                    ? <><span className="pp-chosen-name">{part.name}</span>
                        <span className="pp-chosen-store">via {part.store}</span></>
                    : <span className="pp-empty-slot">—</span>}
                </div>
                <div className="pp-row-price">
                  {part && <span>${part.price}</span>}
                </div>
                <div className="pp-row-actions">
                  {part && <button className="pp-change-btn" onClick={() => setPicking(cat)}>Change</button>}
                  <button
                    className={part ? 'pp-remove-btn' : 'pp-add-btn'}
                    onClick={() => part ? handleRemove(cat) : setPicking(cat)}
                  >
                    {part ? '×' : '+ Choose'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {total > 0 && (
          <div className="pp-footer">
            <span className="pp-total-label">Estimated Total</span>
            <span className="pp-total">${total.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
