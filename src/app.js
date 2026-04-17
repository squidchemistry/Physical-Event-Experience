'use strict';

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const zonesRouter = require('./routes/zones');
const facilitiesRouter = require('./routes/facilities');
const navigationRouter = require('./routes/navigation');
const notificationsRouter = require('./routes/notifications');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api/zones', zonesRouter);
  app.use('/api/facilities', facilitiesRouter);
  app.use('/api/navigation', navigationRouter);
  app.use('/api/notifications', notificationsRouter);

  // Catch-all: serve SPA index for any non-API route
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
