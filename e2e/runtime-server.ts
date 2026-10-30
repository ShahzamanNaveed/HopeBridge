// Real application/services against the fixture's guarded disposable database.
// Larger test-only counters prevent navigation/viewport sweeps consuming production limits.
import { createApp } from '../apps/backend/src/app.js';
import {
  db,
  checkDatabase,
} from '../apps/backend/src/infrastructure/db/client.js';
import { readEnv } from '../apps/backend/src/config/env.js';
import { AuthRepository } from '../apps/backend/src/modules/auth/auth.repository.js';
import { AuthService } from '../apps/backend/src/modules/auth/auth.service.js';
const env = readEnv();
if (
  env.NODE_ENV !== 'test' ||
  !/^\/hopebridge_e2e_auth_[a-f0-9]{32}$/.test(
    new URL(env.DATABASE_URL).pathname,
  )
)
  throw new Error(
    'Browser fixture requires its disposable authentication database',
  );
const server = createApp({
  checkDatabase,
  rateLimitMax: 10000,
  auth: {
    service: new AuthService(new AuthRepository(db)),
    origins: env.AUTH_TRUSTED_ORIGINS,
    secure: false,
    loginLimit: 1000,
  },
}).listen(env.PORT);
process.on('SIGTERM', () => {
  server.close(() => {
    void db.$disconnect().then(() => process.exit(0));
  });
});
