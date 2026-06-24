import { describe, it, expect } from 'vitest';
import { checkCompatibility } from '../lib/compatibility/engine.js';

describe('compatibility engine — known failing combinations', () => {
  it('fails a DDR4 kit on a DDR5-only board (rule 2: ram-type)', () => {
    const result = checkCompatibility({
      ram: 'ddr4-16gb-corsair',
      motherboard: 'msi-b650-tomahawk', // DDR5 only
    });
    expect(result.compatible).toBe(false);
    expect(result.conflicts.some((c) => c.id === 'ram-type')).toBe(true);
  });

  it('fails a DDR4 kit on the other DDR5 board too', () => {
    const result = checkCompatibility({
      ram: 'ddr4-16gb-corsair',
      motherboard: 'asus-z790-hero', // DDR5 only
    });
    expect(result.compatible).toBe(false);
    expect(result.conflicts.some((c) => c.id === 'ram-type')).toBe(true);
  });

  it('fails RTX 4090 (357mm) in the NR200 (330mm max) — rule 5: gpu-length', () => {
    const result = checkCompatibility({
      gpu: 'rtx-4090',
      case: 'nr200',
    });
    expect(result.compatible).toBe(false);
    expect(result.conflicts.some((c) => c.id === 'gpu-length')).toBe(true);
  });

  it('fails an ATX PSU in the SFX-only NR200 — rule 9: psu-form-factor', () => {
    const result = checkCompatibility({
      psu: 'corsair-rm850x', // ATX
      case: 'nr200', // SFX/SFX-L only
    });
    expect(result.compatible).toBe(false);
    expect(result.conflicts.some((c) => c.id === 'psu-form-factor')).toBe(true);
  });

  it('fails RTX 4090 + i9-14900K on a 650W PSU — rule 10: psu-wattage', () => {
    const result = checkCompatibility({
      cpu: 'i9-14900k',
      gpu: 'rtx-4090',
      psu: 'corsair-rm650x', // 650W
    });
    expect(result.compatible).toBe(false);
    const wattageCheck = result.conflicts.find((c) => c.id === 'psu-wattage');
    expect(wattageCheck).toBeDefined();
    // 253 (cpu) + 450 (gpu) + 75 (overhead) = 778, but 4090 recommends 850
    expect(wattageCheck.message).toMatch(/778/);
    expect(wattageCheck.message).toMatch(/850/);
  });

  it('fails the NH-D15 air cooler (165mm) in the NR200 (155mm max) — rule 6 air: cooler-fit', () => {
    const result = checkCompatibility({
      cooling: 'noctua-nh-d15',
      case: 'nr200',
    });
    expect(result.compatible).toBe(false);
    expect(result.conflicts.some((c) => c.id === 'cooler-fit')).toBe(true);
  });

  it('fails a 360mm AIO in the NR200 (no 360mm mount) — rule 6 aio: cooler-fit', () => {
    const result = checkCompatibility({
      cooling: 'corsair-h150i-elite', // 360mm radiator
      case: 'nr200', // only supports 240/280
    });
    expect(result.compatible).toBe(false);
    expect(result.conflicts.some((c) => c.id === 'cooler-fit')).toBe(true);
  });
});

describe('compatibility engine — known passing build', () => {
  it('passes a fully valid high-end build with no conflicts', () => {
    const result = checkCompatibility({
      cpu: 'i9-14900k',
      motherboard: 'asus-z790-hero',
      gpu: 'rtx-4090',
      ram: 'ddr5-32gb-corsair',
      storage: 'samsung-990-pro-1tb',
      case: 'lian-li-o11',
      cooling: 'corsair-h150i-elite', // 360mm AIO, O11 EVO supports 360
      psu: 'corsair-rm1000x',
    });

    expect(result.compatible).toBe(true);
    expect(result.conflicts).toHaveLength(0);
    // Expected to have warnings: 12VHPWR adapter note + >200W cooler caution —
    // warnings don't block compatibility.
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('compatibility engine — partial builds', () => {
  it('skips checks whose required parts are missing instead of erroring', () => {
    expect(() => checkCompatibility({ cpu: 'i9-14900k' })).not.toThrow();
    const result = checkCompatibility({ cpu: 'i9-14900k' });
    expect(result.compatible).toBe(true);
    expect(result.checks).toHaveLength(0);
  });

  it('ignores unknown part IDs instead of throwing', () => {
    expect(() => checkCompatibility({ cpu: 'not-a-real-part' })).not.toThrow();
  });
});
