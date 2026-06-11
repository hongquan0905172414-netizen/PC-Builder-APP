/*
  lib/prices.js — Simulated retailer price engine
  In a real app, replace initPrices / tickPrices with API calls.
*/

const RETAILERS = ['Amazon', 'Newegg', 'Best Buy']

function parseCents(priceStr) {
  return Math.round(parseFloat(priceStr.replace(/[$,]/g, '')) * 100)
}

/** Format cents as a dollar string: 34900 → "$349" */
export function fmt(cents) {
  return '$' + Math.round(cents / 100).toLocaleString('en-US')
}

/** Build initial retailer prices for all parts from their base prices */
export function initPrices(parts) {
  const result = {}
  for (const part of parts) {
    const base = parseCents(part.price)
    result[part.category] = {
      Amazon:    Math.round(base * (0.97 + Math.random() * 0.06)),
      Newegg:    Math.round(base * (0.91 + Math.random() * 0.10)),
      'Best Buy': Math.round(base * (0.98 + Math.random() * 0.08)),
    }
  }
  return result
}

/** Slightly fluctuate every price by ±1.5% to simulate live updates */
export function tickPrices(current) {
  const next = {}
  for (const [cat, retailers] of Object.entries(current)) {
    next[cat] = {}
    for (const [name, cents] of Object.entries(retailers)) {
      const factor = 1 + (Math.random() - 0.5) * 0.03
      next[cat][name] = Math.max(100, Math.round(cents * factor))
    }
  }
  return next
}

/** Returns the retailer name with the lowest price for a given part */
export function cheapestFor(categoryPrices) {
  return Object.entries(categoryPrices).sort(([, a], [, b]) => a - b)[0][0]
}

export { RETAILERS }
