import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/integration/**'],
    env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**'],
      thresholds: { lines: 60, functions: 60, branches: 60, statements: 60 },
      reporter: ['text', 'lcov'],
    },
  },
});
