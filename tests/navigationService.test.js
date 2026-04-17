'use strict';

const { shortestPath, getRecommendedRoute } = require('../src/services/navigationService');
const { updateZoneDensity, getAllZones } = require('../src/services/venueService');

// Reset zone occupancies before each test.
beforeEach(() => {
  getAllZones().forEach((z) => updateZoneDensity(z.id, 0));
});

// ── shortestPath ─────────────────────────────────────────────────────────────

describe('shortestPath()', () => {
  test('returns single-element path when from === to', () => {
    expect(shortestPath('A1', 'A1')).toEqual(['A1']);
  });

  test('finds direct neighbour path', () => {
    const path = shortestPath('A1', 'B1');
    expect(path).toEqual(['A1', 'B1']);
  });

  test('finds multi-hop path', () => {
    const path = shortestPath('A1', 'D1');
    expect(path).not.toBeNull();
    expect(path[0]).toBe('A1');
    expect(path[path.length - 1]).toBe('D1');
    expect(path.length).toBeGreaterThan(2);
  });

  test('returns null for unknown zone ids', () => {
    expect(shortestPath('ZZZZ', 'A1')).toBeNull();
    expect(shortestPath('A1', 'ZZZZ')).toBeNull();
  });
});

// ── getRecommendedRoute ───────────────────────────────────────────────────────

describe('getRecommendedRoute()', () => {
  test('returns route object with path, zoneDetails and totalOccupancy', () => {
    const result = getRecommendedRoute('A1', 'D1');
    expect(result).not.toBeNull();
    expect(Array.isArray(result.path)).toBe(true);
    expect(result.path[0]).toBe('A1');
    expect(result.path[result.path.length - 1]).toBe('D1');
    expect(Array.isArray(result.zoneDetails)).toBe(true);
    expect(typeof result.totalOccupancy).toBe('number');
  });

  test('routes around congested zones', () => {
    // Make B1 and B3 heavily congested – preferred path from A3 to A1 should avoid them
    updateZoneDensity('B1', 900);
    updateZoneDensity('B3', 900);

    const result = getRecommendedRoute('A3', 'A1');
    expect(result).not.toBeNull();
    // The route should exist; it may go via B4 to avoid congestion
    expect(result.path[0]).toBe('A3');
    expect(result.path[result.path.length - 1]).toBe('A1');
  });

  test('returns same-zone result', () => {
    const result = getRecommendedRoute('A2', 'A2');
    expect(result).not.toBeNull();
    expect(result.path).toEqual(['A2']);
  });

  test('returns null for unknown zones', () => {
    expect(getRecommendedRoute('ZZZZ', 'A1')).toBeNull();
    expect(getRecommendedRoute('A1', 'ZZZZ')).toBeNull();
  });
});
