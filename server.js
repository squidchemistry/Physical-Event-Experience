'use strict';

const { createAppWithSocket } = require('./src/app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const { httpServer } = createAppWithSocket();

const server = httpServer.listen(PORT, HOST, () => {
  console.log(`Physical Event Experience server running on http://${HOST}:${PORT}`);
});

// Graceful shutdown – allow in-flight requests to finish before exiting.
function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully…`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force exit if still open after 10 seconds.
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
