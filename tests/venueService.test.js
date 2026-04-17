'use strict';

const { densityLevel, getAllZones, getZone, updateZoneDensity, getAllFacilities, updateFacility } = require('../src/services/venueService');

// Reset zone state before each test to avoid cross-test pollution.
// The venueData module is a mutable singleton so we reset via updateZoneDensity.
beforeEach(() => {
  getAllZones().forEach((z) => updateZoneDensity(z.id, 0));
});

// ── densityLevel ──────────────────────────────────────────────────────────────

describe('densityLevel()', () => {
  test('returns "low" when occupancy < 40%', () => {
    expect(densityLevel(100, 500)).toBe('low');
    expect(densityLevel(0, 500)).toBe('low');
    expect(densityLevel(199, 500)).toBe('low');
  });

  test('returns "moderate" when occupancy is 40-64%', () => {
    expect(densityLevel(200, 500)).toBe('moderate');
    expect(densityLevel(300, 500)).toBe('moderate');
    expect(densityLevel(324, 500)).toBe('moderate');
  });

  test('returns "high" when occupancy is 65-84%', () => {
    expect(densityLevel(325, 500)).toBe('high');
    expect(densityLevel(420, 500)).toBe('high');
  });

  test('returns "critical" when occupancy >= 85%', () => {
    expect(densityLevel(425, 500)).toBe('critical');
    expect(densityLevel(500, 500)).toBe('critical');
  });

  test('handles capacity = 0 gracefully', () => {
    expect(densityLevel(0, 0)).toBe('low');
  });
});

// ── getAllZones ───────────────────────────────────────────────────────────────

describe('getAllZones()', () => {
  test('returns an array of zones with enriched fields', () => {
    const zones = getAllZones();
    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThan(0);
    zones.forEach((z) => {
      expect(z).toHaveProperty('id');
      expect(z).toHaveProperty('densityLevel');
      expect(z).toHaveProperty('occupancyPercent');
    });
  });
});

// ── getZone ───────────────────────────────────────────────────────────────────

describe('getZone()', () => {
  test('returns enriched zone for valid id', () => {
    const zone = getZone('A1');
    expect(zone).not.toBeNull();
    expect(zone.id).toBe('A1');
    expect(zone).toHaveProperty('densityLevel');
    expect(zone).toHaveProperty('occupancyPercent');
  });

  test('returns null for unknown id', () => {
    expect(getZone('ZZZZ')).toBeNull();
  });
});

// ── updateZoneDensity ────────────────────────────────────────────────────────

describe('updateZoneDensity()', () => {
  test('updates crowd count and reflects new density level', () => {
    const zone = getZone('B1');          // capacity 1000
    const updated = updateZoneDensity('B1', 700);
    expect(updated).not.toBeNull();
    expect(updated.current).toBe(700);
    expect(updated.densityLevel).toBe('high');
    expect(updated.occupancyPercent).toBe(70);
  });

  test('clamps current to capacity', () => {
    const zone = getZone('A1');          // capacity 500
    const updated = updateZoneDensity('A1', 9999);
    expect(updated.current).toBe(zone.capacity);
  });

  test('clamps current to 0 for negative values', () => {
    const updated = updateZoneDensity('A1', -50);
    expect(updated.current).toBe(0);
  });

  test('returns null for unknown zone id', () => {
    expect(updateZoneDensity('ZZZZ', 100)).toBeNull();
  });
});

// ── getAllFacilities ──────────────────────────────────────────────────────────

describe('getAllFacilities()', () => {
  test('returns all facilities when no type filter', () => {
    const all = getAllFacilities();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
  });

  test('filters by type correctly', () => {
    const concessions = getAllFacilities('concessions');
    concessions.forEach((f) => expect(f.type).toBe('concessions'));

    const restrooms = getAllFacilities('restroom');
    restrooms.forEach((f) => expect(f.type).toBe('restroom'));
  });

  test('enriches facilities with zoneName', () => {
    const facilities = getAllFacilities();
    facilities.forEach((f) => expect(f).toHaveProperty('zoneName'));
  });
});

// ── updateFacility ────────────────────────────────────────────────────────────

describe('updateFacility()', () => {
  test('updates waitMinutes', () => {
    const updated = updateFacility('F01', { waitMinutes: 12 });
    expect(updated).not.toBeNull();
    expect(updated.waitMinutes).toBe(12);
  });

  test('clamps waitMinutes to 0 for negative values', () => {
    const updated = updateFacility('F01', { waitMinutes: -5 });
    expect(updated.waitMinutes).toBe(0);
  });

  test('updates isOpen status', () => {
    const updated = updateFacility('F02', { isOpen: false });
    expect(updated.isOpen).toBe(false);
  });

  test('returns null for unknown facility id', () => {
    expect(updateFacility('ZZZZ', { waitMinutes: 10 })).toBeNull();
  });
});
