'use strict';

const express = require('express');
const router = express.Router();
const { getRecommendedRoute } = require('../services/navigationService');
const { zones } = require('../models/venueData');

const validZoneIds = new Set(zones.map((z) => z.id));

/**
 * GET /api/navigation/:from/:to
 * Returns the recommended (least-congested) route between two zones.
 */
router.get('/:from/:to', (req, res) => {
  const { from, to } = req.params;

  if (!validZoneIds.has(from)) {
    return res.status(400).json({ error: `Unknown zone id: "${from}"` });
  }
  if (!validZoneIds.has(to)) {
    return res.status(400).json({ error: `Unknown zone id: "${to}"` });
  }

  const result = getRecommendedRoute(from, to);
  if (!result) {
    return res.status(404).json({ error: 'No route found between the specified zones' });
  }

  res.json(result);
});

module.exports = router;
