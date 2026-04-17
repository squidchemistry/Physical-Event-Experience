'use strict';

const { addNotification, getNotifications } = require('../src/services/notificationService');
const { notifications } = require('../src/models/venueData');

// Clear notifications before each test
beforeEach(() => {
  notifications.length = 0;
});

describe('addNotification()', () => {
  test('creates a notification with required fields', () => {
    const n = addNotification({ message: 'Gate A2 now open' });
    expect(n).toHaveProperty('id');
    expect(n.message).toBe('Gate A2 now open');
    expect(n.severity).toBe('info');
    expect(n).toHaveProperty('timestamp');
  });

  test('respects explicit severity', () => {
    const n = addNotification({ message: 'Overcrowding alert', severity: 'critical' });
    expect(n.severity).toBe('critical');
  });

  test('accepts optional zoneId and facilityId', () => {
    const n = addNotification({ message: 'Concessions closed', zoneId: 'B1', facilityId: 'F01' });
    expect(n.zoneId).toBe('B1');
    expect(n.facilityId).toBe('F01');
  });

  test('throws on missing message', () => {
    expect(() => addNotification({})).toThrow();
    expect(() => addNotification({ message: '   ' })).toThrow();
  });

  test('throws on invalid severity', () => {
    expect(() => addNotification({ message: 'Test', severity: 'unknown' })).toThrow();
  });

  test('stores notification in shared array', () => {
    addNotification({ message: 'Test alert' });
    expect(notifications.length).toBe(1);
    expect(notifications[0].message).toBe('Test alert');
  });

  test('increments id across calls', () => {
    const a = addNotification({ message: 'First' });
    const b = addNotification({ message: 'Second' });
    expect(b.id).toBeGreaterThan(a.id);
  });
});

describe('getNotifications()', () => {
  beforeEach(() => {
    addNotification({ message: 'Alert 1', severity: 'info' });
    addNotification({ message: 'Alert 2', severity: 'warning' });
    addNotification({ message: 'Alert 3', severity: 'critical' });
  });

  test('returns most recent notifications first', () => {
    const list = getNotifications();
    expect(list[0].message).toBe('Alert 3');
  });

  test('respects limit parameter', () => {
    const list = getNotifications(2);
    expect(list.length).toBe(2);
  });

  test('returns at most 50 by default', () => {
    const list = getNotifications();
    expect(list.length).toBeLessThanOrEqual(50);
  });
});
