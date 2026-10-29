import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { readEnv } from './config/env.js';
import { db, checkDatabase } from './infrastructure/db/client.js';
import { logger } from './infrastructure/observability/logger.js';
import { AuthRepository } from './modules/auth/auth.repository.js';
import { AuthService } from './modules/auth/auth.service.js';
const env = readEnv();
const server = createApp({
  checkDatabase,
  auth: {
    service: new AuthService(new AuthRepository(db)),
    origins: env.AUTH_TRUSTED_ORIGINS,
    secure: env.NODE_ENV === 'production',
  },
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
