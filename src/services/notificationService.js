'use strict';

const { notifications } = require('../models/venueData');

const MAX_NOTIFICATIONS = 200;
let nextId = 1;

/**
 * Notification severity levels.
 */
const SEVERITY = Object.freeze(
  Object.fromEntries(['info', 'warning', 'critical'].map((s) => [s, s]))
);

/**
 * Add a new notification.
 * @param {object} params
 * @param {string} params.message
 * @param {'info'|'warning'|'critical'} [params.severity='info']
 * @param {string} [params.zoneId]          - optional associated zone
 * @param {string} [params.facilityId]      - optional associated facility
 * @returns {object} created notification
 */
function addNotification({ message, severity = 'info', zoneId, facilityId } = {}) {
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('Notification message is required');
  }
  if (!SEVERITY[severity]) {
    throw new Error(`Invalid severity "${severity}". Must be one of: ${Object.keys(SEVERITY).join(', ')}`);
  }

  const notification = {
    id: nextId++,
    message: message.trim(),
    severity,
    zoneId: zoneId || null,
    facilityId: facilityId || null,
    timestamp: new Date().toISOString(),
  };

  notifications.unshift(notification);
  if (notifications.length > MAX_NOTIFICATIONS) notifications.splice(MAX_NOTIFICATIONS);
  return notification;
}

/**
 * Get recent notifications, newest first.
 * @param {number} [limit=50]
 * @returns {object[]}
 */
function getNotifications(limit = 50) {
  return notifications.slice(0, Math.min(limit, MAX_NOTIFICATIONS));
}

module.exports = { addNotification, getNotifications, SEVERITY };
