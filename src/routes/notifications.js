'use strict';

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

/**
 * GET /api/notifications
 * Query params: limit (default 50)
 */
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  res.json(notificationService.getNotifications(limit));
});

/**
 * POST /api/notifications
 * Body: { message: string, severity?: 'info'|'warning'|'critical', zoneId?, facilityId? }
 */
router.post('/', (req, res) => {
  try {
    const { message, severity, zoneId, facilityId } = req.body;
    const notification = notificationService.addNotification({ message, severity, zoneId, facilityId });
    req.app.get('io').emit('notification:new', notification);
    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
