import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { readEnv } from './config/env.js';
import { db, checkDatabase } from './infrastructure/db/client.js';
import { logger } from './infrastructure/observability/logger.js';
const env = readEnv();
const server = createApp({
  checkDatabase,
  ...(env.NODE_ENV === 'production'
    ? {
        frontendPath: fileURLToPath(
          new URL('../../frontend/dist/', import.meta.url),
        ),
      }
    : {}),
}).listen(env.PORT, () =>
  logger.info({ port: env.PORT }, 'ShipLens listening'),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10_000);
    timeout.unref();
    server.close(() => {
      void db.$disconnect().then(() => process.exit(0));
    });
  });
