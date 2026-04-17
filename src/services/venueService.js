'use strict';

const { zones, facilities, navigationGraph } = require('../models/venueData');

/**
 * Returns crowd density level for a zone.
 * @param {number} current
 * @param {number} capacity
 * @returns {'low'|'moderate'|'high'|'critical'}
 */
function densityLevel(current, capacity) {
  const ratio = capacity > 0 ? current / capacity : 0;
  if (ratio < 0.4) return 'low';
  if (ratio < 0.65) return 'moderate';
  if (ratio < 0.85) return 'high';
  return 'critical';
}

/**
 * Get all zones enriched with density level and percentage.
 * @returns {Array}
 */
function getAllZones() {
  return zones.map((z) => ({
    ...z,
    densityLevel: densityLevel(z.current, z.capacity),
    occupancyPercent: z.capacity > 0 ? Math.round((z.current / z.capacity) * 100) : 0,
  }));
}

/**
 * Get a single zone by id.
 * @param {string} id
 * @returns {object|null}
 */
function getZone(id) {
  const z = zones.find((z) => z.id === id);
  if (!z) return null;
  return {
    ...z,
    densityLevel: densityLevel(z.current, z.capacity),
    occupancyPercent: z.capacity > 0 ? Math.round((z.current / z.capacity) * 100) : 0,
  };
}

/**
 * Update crowd count for a zone.
 * @param {string} id
 * @param {number} current  - new occupancy count (0 … capacity)
 * @returns {object|null}   - updated zone or null if not found
 */
function updateZoneDensity(id, current) {
  const z = zones.find((z) => z.id === id);
  if (!z) return null;
  z.current = Math.max(0, Math.min(current, z.capacity));
  return getZone(id);
}

/**
 * Get all facilities enriched with zone context.
 * @param {string} [type] - optional filter by type
 * @returns {Array}
 */
function getAllFacilities(type) {
  let list = facilities;
  if (type) list = list.filter((f) => f.type === type);
  return list.map((f) => {
    const zone = zones.find((z) => z.id === f.zoneId) || {};
    return { ...f, zoneName: zone.name || f.zoneId };
  });
}

/**
 * Update wait time and/or open status for a facility.
 * @param {string} facilityId
 * @param {object} updates - { waitMinutes?, isOpen? }
 * @returns {object|null}
 */
function updateFacility(facilityId, updates) {
  const f = facilities.find((f) => f.id === facilityId);
  if (!f) return null;
  if (typeof updates.waitMinutes === 'number') f.waitMinutes = Math.max(0, updates.waitMinutes);
  if (typeof updates.isOpen === 'boolean') f.isOpen = updates.isOpen;
  const zone = zones.find((z) => z.id === f.zoneId) || {};
  return { ...f, zoneName: zone.name || f.zoneId };
}

module.exports = { getAllZones, getZone, updateZoneDensity, getAllFacilities, updateFacility, densityLevel };
