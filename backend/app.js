'use strict';

require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const processRoute = require('./routes/process');
const { notFound, errorHandler } = require('./middleware/error');

/**
 * Build the Express app (separated from `server.js` so tests can import it
 * without binding a port).
 */
function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gateway' }));

  app.use('/api', processRoute);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
