'use strict';

const { createApp } = require('./app');
const config = require('./config');

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[gateway] listening on http://localhost:${config.port}`);
  console.log(`[gateway] engine: ${config.engineUrl}`);
  console.log(
    `[gateway] S2AG key: ${config.s2ag.apiKey ? 'configured' : 'NOT set (unauthenticated)'}`
  );
});
