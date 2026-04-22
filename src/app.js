'use strict';

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const zonesRouter = require('./routes/zones');
const facilitiesRouter = require('./routes/facilities');
const navigationRouter = require('./routes/navigation');
const notificationsRouter = require('./routes/notifications');

// Global rate limiter – covers all routes including the SPA catch-all.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 300,             // max 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});

function createApp() {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc:  ["'self'"],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
    })
  );
  app.use(globalLimiter);
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Health-check endpoint – used by container orchestrators and load balancers.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/zones', zonesRouter);
  app.use('/api/facilities', facilitiesRouter);
  app.use('/api/navigation', navigationRouter);
  app.use('/api/notifications', notificationsRouter);

  // Catch-all: serve SPA index for any non-API route.
  // Express 5 requires the named wildcard parameter syntax '/{*splat}'.
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  return app;
}

function createAppWithSocket() {
  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });

  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
  });

  return { app, httpServer, io };
}

module.exports = { createApp, createAppWithSocket };
