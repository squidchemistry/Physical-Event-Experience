'use strict';

const express = require('express');
const router = express.Router();
const venueService = require('../services/venueService');

/**
 * GET /api/zones
 * Returns all zones with current crowd density data.
 */
router.get('/', (_req, res) => {
  res.json(venueService.getAllZones());
});

/**
 * GET /api/zones/:id
 * Returns a single zone.
 */
router.get('/:id', (req, res) => {
  const zone = venueService.getZone(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });
  res.json(zone);
});

/**
 * PUT /api/zones/:id/density
 * Body: { current: <number> }
 * Updates crowd count for a zone and emits a real-time socket event.
 */
router.put('/:id/density', (req, res) => {
  const { current } = req.body;
  if (typeof current !== 'number' || !Number.isFinite(current)) {
    return res.status(400).json({ error: '"current" must be a finite number' });
  }

  const updated = venueService.updateZoneDensity(req.params.id, current);
  if (!updated) return res.status(404).json({ error: 'Zone not found' });

  // Broadcast to all connected clients
  req.app.get('io').emit('zone:update', updated);
  res.json(updated);
});

module.exports = router;
