/*
================================================================
  data/templates.js — 6 pre-built hardware bundles (T1–T6)
================================================================
  Each template:
    id      — T1–T6 (shown in the UI)
    name    — display name
    tier    — 'budget' | 'unlimited'
              budget    = any specific price (~$500/$700/$1000)
              unlimited = "absolute best — no limit"
    price   — approx total (string, shown in results)
    wattage — estimated system power draw
    scores  — ideal dimension profile (used by findTemplate in scoring.js)
              These represent what kind of user this template is best for.
    parts   — array of { category, name, price, url }

  TO CHANGE A PART:
    Find the template below and edit the object in its parts[] array.
    Replace the '#' url with a real affiliate or product link.

  TO ADD A TEMPLATE:
    Add a new object to this array with all fields set.
    Set tier and scores{} carefully — scoring.js uses them for matching.
    findTemplate() in scoring.js picks it up automatically.
================================================================
*/

export const TEMPLATES = [

  /* ---- BUDGET TIER (T1, T2, T3) ---- */

  {
    id: 'T1', name: 'Max Gaming', tier: 'budget', price: '$649', wattage: '310W',
    // Ideal for: pure gaming focus, OK with some noise, RGB + glass likely
    scores: { gaming: 85, productivity: 20, airflow: 60, noise: 40, rgb: 60, caseStyle: 70, cableClean: 60 },
    parts: [
      { category: 'CPU',         name: 'AMD Ryzen 5 7600',                   price: '$199', url: '#' },
      { category: 'GPU',         name: 'AMD RX 7700 XT',                     price: '$349', url: '#' },
      { category: 'Motherboard', name: 'MSI B650 Gaming Plus WiFi',          price: '$89',  url: '#' },
      { category: 'RAM',         name: 'G.Skill Ripjaws 16GB DDR5-5200',     price: '$55',  url: '#' },
      { category: 'Storage',     name: 'WD Black SN770 1TB NVMe',            price: '$65',  url: '#' },
      { category: 'Case',        name: 'Lian Li Lancool 216 (mesh + glass)', price: '$79',  url: '#' },
      { category: 'PSU',         name: 'Corsair RM650x (fully modular)',     price: '$79',  url: '#' },
    ],
  },

  {
    id: 'T2', name: 'Max Productivity', tier: 'budget', price: '$720', wattage: '260W',
    // Ideal for: coding/editing focus, quiet operation, solid case no RGB
    scores: { gaming: 20, productivity: 85, airflow: 50, noise: 75, rgb: 20, caseStyle: 30, cableClean: 65 },
    parts: [
      { category: 'CPU',         name: 'AMD Ryzen 7 7700',                  price: '$249', url: '#' },
      { category: 'GPU',         name: 'AMD RX 7600 (light workloads)',      price: '$199', url: '#' },
      { category: 'Motherboard', name: 'ASUS ProArt B650-Creator',          price: '$109', url: '#' },
      { category: 'RAM',         name: 'Corsair Vengeance 32GB DDR5-5600',  price: '$89',  url: '#' },
      { category: 'Storage',     name: 'Samsung 990 Pro 1TB NVMe',          price: '$99',  url: '#' },
      { category: 'Case',        name: 'Fractal Define 7 (solid, quiet)',    price: '$149', url: '#' },
      { category: 'PSU',         name: 'Seasonic Focus GX-650',             price: '$89',  url: '#' },
    ],
  },

  {
    id: 'T3', name: 'Balanced', tier: 'budget', price: '$720', wattage: '320W',
    // Ideal for: mixed use, middle ground on everything
    scores: { gaming: 55, productivity: 55, airflow: 55, noise: 55, rgb: 50, caseStyle: 60, cableClean: 55 },
    parts: [
      { category: 'CPU',         name: 'AMD Ryzen 5 7600X',                price: '$219', url: '#' },
      { category: 'GPU',         name: 'AMD RX 7700 XT',                   price: '$349', url: '#' },
      { category: 'Motherboard', name: 'ASRock B650M Pro RS',              price: '$99',  url: '#' },
      { category: 'RAM',         name: 'G.Skill Flare X5 32GB DDR5-5200',  price: '$89',  url: '#' },
      { category: 'Storage',     name: 'WD Black SN770 1TB NVMe',          price: '$65',  url: '#' },
      { category: 'Case',        name: 'Fractal Pop Air (mesh + glass)',    price: '$89',  url: '#' },
      { category: 'PSU',         name: 'EVGA SuperNOVA 650 G6',            price: '$89',  url: '#' },
    ],
  },

  /* ---- UNLIMITED TIER (T4, T5, T6) ---- */

  {
    id: 'T4', name: 'Best for Gaming', tier: 'unlimited', price: '~$2,400', wattage: '580W',
    // Ideal for: maximum FPS above all else, RGB + glass showcase build
    scores: { gaming: 95, productivity: 30, airflow: 70, noise: 40, rgb: 75, caseStyle: 85, cableClean: 75 },
    parts: [
      { category: 'CPU',         name: 'Intel Core i9-14900K',               price: '$399',   url: '#' },
      { category: 'GPU',         name: 'NVIDIA RTX 4090',                    price: '$1,599', url: '#' },
      { category: 'Motherboard', name: 'ASUS ROG Strix Z790-E Gaming WiFi',  price: '$399',   url: '#' },
      { category: 'RAM',         name: 'Corsair Dominator 32GB DDR5-6400',   price: '$129',   url: '#' },
      { category: 'Storage',     name: 'Samsung 990 Pro 2TB NVMe',           price: '$159',   url: '#' },
      { category: 'Case',        name: 'Lian Li O11 Dynamic EVO (glass)',    price: '$149',   url: '#' },
      { category: 'PSU',         name: 'Corsair HX1000i (fully modular)',    price: '$199',   url: '#' },
    ],
  },

  {
    id: 'T5', name: 'Best for Productivity', tier: 'unlimited', price: '~$2,800', wattage: '620W',
    // Ideal for: max core count, lots of RAM, cable-managed, quiet
    scores: { gaming: 30, productivity: 95, airflow: 60, noise: 78, rgb: 20, caseStyle: 50, cableClean: 88 },
    parts: [
      { category: 'CPU',         name: 'AMD Ryzen 9 7950X',                  price: '$549',   url: '#' },
      { category: 'GPU',         name: 'NVIDIA RTX 4070 Ti Super',           price: '$799',   url: '#' },
      { category: 'Motherboard', name: 'ASUS ProArt X670E-Creator WiFi',     price: '$499',   url: '#' },
      { category: 'RAM',         name: 'G.Skill 64GB DDR5-5600',             price: '$299',   url: '#' },
      { category: 'Storage',     name: 'Samsung 990 Pro 4TB NVMe',           price: '$299',   url: '#' },
      { category: 'Case',        name: 'Fractal Define 7 XL (silent)',        price: '$199',   url: '#' },
      { category: 'PSU',         name: 'Seasonic Prime TX-1000',              price: '$249',   url: '#' },
    ],
  },

  {
    id: 'T6', name: 'Best of All Time', tier: 'unlimited', price: '~$4,800', wattage: '850W',
    // Ideal for: zero compromises — maximum gaming AND maximum productivity
    scores: { gaming: 100, productivity: 100, airflow: 85, noise: 50, rgb: 85, caseStyle: 95, cableClean: 95 },
    parts: [
      { category: 'CPU',         name: 'Intel Core i9-14900KS',              price: '$599',   url: '#' },
      { category: 'GPU',         name: 'NVIDIA RTX 4090',                    price: '$1,599', url: '#' },
      { category: 'Motherboard', name: 'ASUS ROG Maximus Z790 Apex',         price: '$699',   url: '#' },
      { category: 'RAM',         name: 'G.Skill Trident Z5 64GB DDR5-7200',  price: '$399',   url: '#' },
      { category: 'Storage',     name: 'WD Black SN850X 4TB NVMe (x2)',      price: '$699',   url: '#' },
      { category: 'Case',        name: 'Lian Li O11D EVO XL (showcase)',     price: '$249',   url: '#' },
      { category: 'PSU',         name: 'Corsair HX1500i Platinum',           price: '$329',   url: '#' },
    ],
  },
];
