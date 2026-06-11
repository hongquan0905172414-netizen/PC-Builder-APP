import { useState, useMemo } from 'react';
import { PARTS } from '../data/parts';

const LABELS = {
  'cpu':         'Choose A CPU',
  'gpu':         'Choose A Video Card',
  'motherboard': 'Choose A Motherboard',
  'memory':      'Choose Memory',
  'storage':     'Choose Storage',
  'case':        'Choose A Case',
  'cpu-cooler':  'Choose A CPU Cooler',
  'psu':         'Choose A Power Supply',
};

const COLUMNS = {
  cpu: [
    { key: 'name',       label: 'Name',         flex: 3 },
    { key: 'cores',      label: 'Cores',        flex: 1 },
    { key: 'threads',    label: 'Threads',      flex: 1 },
    { key: 'baseClock',  label: 'Base',         flex: 1 },
    { key: 'boostClock', label: 'Boost',        flex: 1 },
    { key: 'microarch',  label: 'Architecture', flex: 2 },
    { key: 'tdp',        label: 'TDP',          flex: 1 },
    { key: 'iGPU',       label: 'iGPU',         flex: 1 },
    { key: 'rating',     label: 'Rating',       flex: 2 },
    { key: 'price',      label: 'Price',        flex: 1 },
    { key: '__add',      label: '',             flex: 1 },
  ],
  gpu: [
    { key: 'name',       label: 'Name',         flex: 3 },
    { key: 'vram',       label: 'VRAM',         flex: 1 },
    { key: 'vramType',   label: 'Memory Type',  flex: 2 },
    { key: 'baseClock',  label: 'Base',         flex: 1 },
    { key: 'boostClock', label: 'Boost',        flex: 1 },
    { key: 'tdp',        label: 'TDP',          flex: 1 },
    { key: 'rating',     label: 'Rating',       flex: 2 },
    { key: 'price',      label: 'Price',        flex: 1 },
    { key: '__add',      label: '',             flex: 1 },
  ],
  motherboard: [
    { key: 'name',        label: 'Name',         flex: 3 },
    { key: 'socket',      label: 'Socket',       flex: 1 },
    { key: 'chipset',     label: 'Chipset',      flex: 1 },
    { key: 'formFactor',  label: 'Form Factor',  flex: 1 },
    { key: 'memorySlots', label: 'Mem Slots',    flex: 1 },
    { key: 'maxMemory',   label: 'Max Memory',   flex: 1 },
    { key: 'rating',      label: 'Rating',       flex: 2 },
    { key: 'price',       label: 'Price',        flex: 1 },
    { key: '__add',       label: '',             flex: 1 },
  ],
  memory: [
    { key: 'name',     label: 'Name',     flex: 3 },
    { key: 'speed',    label: 'Speed',    flex: 1 },
    { key: 'capacity', label: 'Capacity', flex: 1 },
    { key: 'latency',  label: 'Latency',  flex: 1 },
    { key: 'type',     label: 'Type',     flex: 1 },
    { key: 'rating',   label: 'Rating',   flex: 2 },
    { key: 'price',    label: 'Price',    flex: 1 },
    { key: '__add',    label: '',         flex: 1 },
  ],
  storage: [
    { key: 'name',       label: 'Name',        flex: 3 },
    { key: 'capacity',   label: 'Capacity',    flex: 1 },
    { key: 'interface',  label: 'Interface',   flex: 1 },
    { key: 'formFactor', label: 'Form Factor', flex: 1 },
    { key: 'readSpeed',  label: 'Read',        flex: 1 },
    { key: 'writeSpeed', label: 'Write',       flex: 1 },
    { key: 'rating',     label: 'Rating',      flex: 2 },
    { key: 'price',      label: 'Price',       flex: 1 },
    { key: '__add',      label: '',            flex: 1 },
  ],
  case: [
    { key: 'name',       label: 'Name',        flex: 3 },
    { key: 'type',       label: 'Form Factor', flex: 1 },
    { key: 'sidePanel',  label: 'Side Panel',  flex: 2 },
    { key: 'color',      label: 'Color',       flex: 1 },
    { key: 'rating',     label: 'Rating',      flex: 2 },
    { key: 'price',      label: 'Price',       flex: 1 },
    { key: '__add',      label: '',            flex: 1 },
  ],
  'cpu-cooler': [
    { key: 'name',       label: 'Name',        flex: 3 },
    { key: 'type',       label: 'Type',        flex: 1 },
    { key: 'fanSize',    label: 'Fan Size',    flex: 1 },
    { key: 'tdpRating',  label: 'TDP Support', flex: 1 },
    { key: 'rating',     label: 'Rating',      flex: 2 },
    { key: 'price',      label: 'Price',       flex: 1 },
    { key: '__add',      label: '',            flex: 1 },
  ],
  psu: [
    { key: 'name',        label: 'Name',       flex: 3 },
    { key: 'wattage',     label: 'Wattage',    flex: 1 },
    { key: 'efficiency',  label: 'Efficiency', flex: 2 },
    { key: 'modularity',  label: 'Modularity', flex: 2 },
    { key: 'rating',      label: 'Rating',     flex: 2 },
    { key: 'price',       label: 'Price',      flex: 1 },
    { key: '__add',       label: '',           flex: 1 },
  ],
};

const FILTER_DEFS = {
  cpu: [
    { label: 'Manufacturer', field: 'manufacturer' },
    { label: 'Socket',       field: 'socket' },
    { label: 'Series',       field: 'series' },
    { label: 'Core Count',   field: 'cores' },
    { label: 'Architecture', field: 'microarch' },
  ],
  gpu: [
    { label: 'Manufacturer', field: 'manufacturer' },
    { label: 'VRAM',         field: 'vram' },
    { label: 'Series',       field: 'series' },
  ],
  motherboard: [
    { label: 'Manufacturer', field: 'manufacturer' },
    { label: 'Socket',       field: 'socket' },
    { label: 'Chipset',      field: 'chipset' },
    { label: 'Form Factor',  field: 'formFactor' },
  ],
  memory: [
    { label: 'Manufacturer', field: 'manufacturer' },
    { label: 'Type',         field: 'type' },
    { label: 'Capacity',     field: 'capacity' },
    { label: 'Speed',        field: 'speed' },
  ],
  storage: [
    { label: 'Manufacturer', field: 'manufacturer' },
    { label: 'Interface',    field: 'interface' },
    { label: 'Form Factor',  field: 'formFactor' },
  ],
  case: [
    { label: 'Manufacturer', field: 'manufacturer' },
    { label: 'Form Factor',  field: 'type' },
    { label: 'Side Panel',   field: 'sidePanel' },
  ],
  'cpu-cooler': [
    { label: 'Manufacturer', field: 'manufacturer' },
    { label: 'Cooler Type',  field: 'type' },
    { label: 'Fan Size',     field: 'fanSize' },
  ],
  psu: [
    { label: 'Manufacturer', field: 'manufacturer' },
    { label: 'Wattage',      field: 'wattage' },
    { label: 'Efficiency',   field: 'efficiency' },
    { label: 'Modularity',   field: 'modularity' },
  ],
};

function Stars({ rating, count }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="picker-stars">
      {Array.from({ length: full  }).map((_, i) => <span key={'f'+i} className="picker-star-on">★</span>)}
      {half && <span className="picker-star-on" style={{ opacity: 0.5 }}>★</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={'e'+i} className="picker-star-off">★</span>)}
      <span className="picker-rating-count">({count?.toLocaleString()})</span>
    </div>
  );
}

function fmtPrice(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function cellValue(part, key) {
  switch (key) {
    case 'price':      return fmtPrice(part.price);
    case 'baseClock':  return part.baseClock + (part.manufacturer === 'AMD' || part.series?.includes('Ryzen') || part.series?.includes('Core') ? ' GHz' : ' MHz');
    case 'boostClock': return part.boostClock + (part.chipset ? ' MHz' : ' GHz');
    case 'tdp':        return part.tdp + 'W';
    case 'tdpRating':  return part.tdpRating + 'W';
    case 'cores':      return String(part.cores);
    case 'threads':    return String(part.threads);
    case 'vram':       return part.vram + ' GB';
    case 'capacity':   return typeof part.capacity === 'number' ? part.capacity + ' GB' : part.capacity;
    case 'speed':      return part.speed + ' MHz';
    case 'latency':    return 'CL' + part.latency;
    case 'memorySlots': return part.memorySlots + ' slots';
    case 'maxMemory':  return part.maxMemory + ' GB';
    case 'readSpeed':  return part.readSpeed + ' MB/s';
    case 'writeSpeed': return part.writeSpeed + ' MB/s';
    case 'fanSize':    return part.fanSize + ' mm';
    case 'wattage':    return part.wattage + 'W';
    default:           return String(part[key] ?? '—');
  }
}

function cpuCellValue(part, key) {
  if (key === 'baseClock')  return part.baseClock + ' GHz';
  if (key === 'boostClock') return part.boostClock + ' GHz';
  return cellValue(part, key);
}

function gpuCellValue(part, key) {
  if (key === 'baseClock')  return part.baseClock + ' MHz';
  if (key === 'boostClock') return part.boostClock + ' MHz';
  return cellValue(part, key);
}

function getColValue(partType, part, key) {
  if (partType === 'cpu') return cpuCellValue(part, key);
  if (partType === 'gpu') return gpuCellValue(part, key);
  return cellValue(part, key);
}

function gridTemplate(cols) {
  return cols.map((c) => c.flex + 'fr').join(' ');
}

export default function PartPicker({ partType, onAdd, onClose }) {
  const data    = PARTS[partType] ?? [];
  const cols    = COLUMNS[partType] ?? [];
  const filters = FILTER_DEFS[partType] ?? [];

  const maxPrice = useMemo(
    () => Math.ceil(Math.max(...data.map((p) => p.price)) / 10000) * 10000,
    [data]
  );

  const [priceMax,    setPriceMax]    = useState(maxPrice);
  const [checkboxes,  setCheckboxes]  = useState({});
  const [search,      setSearch]      = useState('');
  const [sortKey,     setSortKey]     = useState('price');
  const [sortAsc,     setSortAsc]     = useState(true);

  const filterOptions = useMemo(() => {
    const out = {};
    filters.forEach(({ field }) => {
      const vals = [...new Set(data.map((p) => p[field]))].sort((a, b) =>
        typeof a === 'number' ? a - b : String(a).localeCompare(String(b))
      );
      out[field] = vals;
    });
    return out;
  }, [data, filters]);

  function toggleCheck(field, val) {
    setCheckboxes((prev) => {
      const cur = prev[field] ?? [];
      const has = cur.includes(val);
      return { ...prev, [field]: has ? cur.filter((v) => v !== val) : [...cur, val] };
    });
  }

  const filtered = useMemo(() => {
    let list = data;

    list = list.filter((p) => p.price <= priceMax);

    filters.forEach(({ field }) => {
      const active = checkboxes[field] ?? [];
      if (active.length > 0) {
        list = list.filter((p) => active.includes(p[field]));
      }
    });

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === '__add' || sortKey === 'rating') {
        av = a.rating; bv = b.rating;
      }
      if (typeof av === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? av - bv : bv - av;
    });

    return list;
  }, [data, priceMax, checkboxes, search, sortKey, sortAsc, filters]);

  function handleSort(key) {
    if (key === '__add') return;
    if (key === sortKey) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const gridStyle = { gridTemplateColumns: gridTemplate(cols) };

  return (
    <div className="picker">

      <div className="picker-banner">
        <button className="picker-back-btn" onClick={onClose}>← Back</button>
        <div className="picker-banner-title">{LABELS[partType] ?? 'Choose A Part'}</div>
      </div>

      <div className="picker-body">

        <aside className="picker-sidebar">

          <div className="picker-filter-section">
            <div className="picker-filter-title">Price</div>
            <input
              className="picker-price-range"
              type="range"
              min={0}
              max={maxPrice}
              step={1000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              style={{
                background: `linear-gradient(90deg, var(--color-accent) ${Math.round((priceMax / maxPrice) * 100)}%, var(--color-surface) ${Math.round((priceMax / maxPrice) * 100)}%)`,
              }}
            />
            <div className="picker-price-labels">
              <span>$0</span>
              <span>{fmtPrice(priceMax)}</span>
            </div>
          </div>

          {filters.map(({ label, field }) => (
            <div key={field} className="picker-filter-section">
              <div className="picker-filter-title">{label}</div>
              {(filterOptions[field] ?? []).map((val) => {
                const checked = (checkboxes[field] ?? []).includes(val);
                return (
                  <label key={String(val)} className="picker-checkbox-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCheck(field, val)}
                    />
                    {typeof val === 'number' && field === 'vram' ? val + ' GB'
                      : typeof val === 'number' && field === 'capacity' ? val + ' GB'
                      : typeof val === 'number' && field === 'fanSize' ? val + ' mm'
                      : typeof val === 'number' && field === 'wattage' ? val + 'W'
                      : typeof val === 'number' && field === 'cores' ? val + ' Cores'
                      : String(val)}
                  </label>
                );
              })}
            </div>
          ))}

        </aside>

        <div className="picker-main">

          <div className="picker-search-row">
            <input
              className="picker-search"
              type="text"
              placeholder={`Search ${LABELS[partType] ?? 'parts'}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="picker-count">{filtered.length} Compatible Products</span>
          </div>

          <div className="picker-table-wrap">

            <div className="picker-thead" style={gridStyle}>
              {cols.map((col) => (
                <div
                  key={col.key}
                  className={`picker-th${sortKey === col.key ? ' picker-th--active' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && col.key !== '__add' && (
                    <span>{sortAsc ? ' ↑' : ' ↓'}</span>
                  )}
                </div>
              ))}
            </div>

            {filtered.map((part) => (
              <div key={part.id} className="picker-row" style={gridStyle}>
                {cols.map((col) => {
                  if (col.key === '__add') {
                    return (
                      <div key="__add" className="picker-cell">
                        <button
                          className="picker-add-btn"
                          onClick={() => onAdd({ ...part, cents: part.price })}
                        >
                          Add
                        </button>
                      </div>
                    );
                  }
                  if (col.key === 'rating') {
                    return (
                      <div key="rating" className="picker-cell">
                        <Stars rating={part.rating} count={part.ratingCount} />
                      </div>
                    );
                  }
                  if (col.key === 'price') {
                    return (
                      <div key="price" className="picker-cell picker-price-cell">
                        {fmtPrice(part.price)}
                      </div>
                    );
                  }
                  if (col.key === 'name') {
                    return (
                      <div key="name" className="picker-cell">
                        <span className="picker-cell--muted">{part.manufacturer} </span>
                        {part.name}
                      </div>
                    );
                  }
                  return (
                    <div key={col.key} className="picker-cell">
                      {getColValue(partType, part, col.key)}
                    </div>
                  );
                })}
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
