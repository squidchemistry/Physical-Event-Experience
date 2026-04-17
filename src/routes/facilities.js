'use strict';

const express = require('express');
const router = express.Router();
const venueService = require('../services/venueService');

/**
 * GET /api/facilities
 * Query params: type (concessions | restroom | gate | medical)
 */
router.get('/', (req, res) => {
  const { type } = req.query;
  res.json(venueService.getAllFacilities(type));
});

/**
 * PUT /api/facilities/:id
 * Body: { waitMinutes?: number, isOpen?: boolean }
 * Updates wait time or open status for a facility.
 */
router.put('/:id', (req, res) => {
  const { waitMinutes, isOpen } = req.body;
  const updates = {};

  if (waitMinutes !== undefined) {
    if (typeof waitMinutes !== 'number' || !Number.isFinite(waitMinutes)) {
      return res.status(400).json({ error: '"waitMinutes" must be a finite number' });
    }
    updates.waitMinutes = waitMinutes;
  }

  if (isOpen !== undefined) {
    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ error: '"isOpen" must be a boolean' });
    }
    updates.isOpen = isOpen;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Provide at least one of: waitMinutes, isOpen' });
  }

  const updated = venueService.updateFacility(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Facility not found' });

  req.app.get('io').emit('facility:update', updated);
  res.json(updated);
});

module.exports = router;
