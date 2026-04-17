'use strict';

const { createAppWithSocket } = require('./src/app');

const PORT = process.env.PORT || 3000;
const { httpServer } = createAppWithSocket();

httpServer.listen(PORT, () => {
  console.log(`Physical Event Experience server running on http://localhost:${PORT}`);
});
