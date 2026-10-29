import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    // Real Argon2id and migration/concurrency checks need headroom on developer machines.
    testTimeout: 15000,
    include: ['tests/integration/**/*.test.ts'],
    env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
  },
});
