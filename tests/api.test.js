'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { getAllZones, updateZoneDensity } = require('../src/services/venueService');
const { notifications } = require('../src/models/venueData');

// The REST tests use a plain Express app (no Socket.IO server).
// We mock the 'io' object to capture emitted events.
let app;
const emitted = [];

beforeAll(() => {
  app = createApp();
  // Provide a mock Socket.IO instance
  app.set('io', {
    emit: (event, data) => emitted.push({ event, data }),
  });
});

beforeEach(() => {
  emitted.length = 0;
  getAllZones().forEach((z) => updateZoneDensity(z.id, 0));
  notifications.length = 0;
});

// ── GET /api/zones ────────────────────────────────────────────────────────────

describe('GET /api/zones', () => {
  test('returns 200 with array of zones', async () => {
    const res = await request(app).get('/api/zones');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('densityLevel');
  });
});

describe('GET /api/zones/:id', () => {
  test('returns 200 for valid zone id', async () => {
    const res = await request(app).get('/api/zones/A1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('A1');
  });

  test('returns 404 for unknown zone id', async () => {
    const res = await request(app).get('/api/zones/ZZZZ');
    expect(res.status).toBe(404);
  });
});

// ── PUT /api/zones/:id/density ────────────────────────────────────────────────

describe('PUT /api/zones/:id/density', () => {
  test('updates zone and emits socket event', async () => {
    const res = await request(app)
      .put('/api/zones/B1/density')
      .send({ current: 750 });
    expect(res.status).toBe(200);
    expect(res.body.current).toBe(750);
    expect(emitted.some((e) => e.event === 'zone:update')).toBe(true);
  });

  test('returns 400 for missing current field', async () => {
    const res = await request(app).put('/api/zones/A1/density').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for non-numeric current', async () => {
    const res = await request(app)
      .put('/api/zones/A1/density')
      .send({ current: 'lots' });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/facilities ───────────────────────────────────────────────────────

describe('GET /api/facilities', () => {
  test('returns all facilities', async () => {
    const res = await request(app).get('/api/facilities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('filters by type query param', async () => {
    const res = await request(app).get('/api/facilities?type=concessions');
    expect(res.status).toBe(200);
    res.body.forEach((f) => expect(f.type).toBe('concessions'));
  });
});

// ── PUT /api/facilities/:id ───────────────────────────────────────────────────

describe('PUT /api/facilities/:id', () => {
  test('updates waitMinutes and emits socket event', async () => {
    const res = await request(app)
      .put('/api/facilities/F01')
      .send({ waitMinutes: 8 });
    expect(res.status).toBe(200);
    expect(res.body.waitMinutes).toBe(8);
    expect(emitted.some((e) => e.event === 'facility:update')).toBe(true);
  });

  test('updates isOpen status', async () => {
    const res = await request(app)
      .put('/api/facilities/F01')
      .send({ isOpen: false });
    expect(res.status).toBe(200);
    expect(res.body.isOpen).toBe(false);
  });

  test('returns 400 when no update fields provided', async () => {
    const res = await request(app).put('/api/facilities/F01').send({});
    expect(res.status).toBe(400);
  });

  test('returns 404 for unknown facility', async () => {
    const res = await request(app)
      .put('/api/facilities/ZZZZ')
      .send({ waitMinutes: 5 });
    expect(res.status).toBe(404);
  });
});

// ── GET /api/navigation/:from/:to ─────────────────────────────────────────────

describe('GET /api/navigation/:from/:to', () => {
  test('returns route between two valid zones', async () => {
    const res = await request(app).get('/api/navigation/A1/D1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.path)).toBe(true);
    expect(res.body.path[0]).toBe('A1');
    expect(res.body.path[res.body.path.length - 1]).toBe('D1');
  });

  test('returns 400 for unknown from-zone', async () => {
    const res = await request(app).get('/api/navigation/ZZZZ/A1');
    expect(res.status).toBe(400);
  });

  test('returns 400 for unknown to-zone', async () => {
    const res = await request(app).get('/api/navigation/A1/ZZZZ');
    expect(res.status).toBe(400);
  });
});

// ── POST /api/notifications ────────────────────────────────────────────────────

describe('POST /api/notifications', () => {
  test('creates notification and emits socket event', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ message: 'Section B temporarily closed', severity: 'warning' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Section B temporarily closed');
    expect(emitted.some((e) => e.event === 'notification:new')).toBe(true);
  });

  test('returns 400 for missing message', async () => {
    const res = await request(app).post('/api/notifications').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid severity', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ message: 'Test', severity: 'unknown' });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/notifications ────────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  test('returns list of notifications', async () => {
    await request(app).post('/api/notifications').send({ message: 'Test notif 1' });
    await request(app).post('/api/notifications').send({ message: 'Test notif 2' });

    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

// ── GET /api/health ───────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
  });
});
