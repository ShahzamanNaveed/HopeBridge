import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { readEnv } from '../src/config/env.js';
import { HttpError } from '../src/common/errors/http-error.js';
import { errorHandler } from '../src/common/middleware/error-handler.js';
import express from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from '../src/infrastructure/observability/logger.js';
const app = createApp({ checkDatabase: async () => {} });
describe('HTTP foundation', () => {
  it('reports a connected database and security headers', async () => {
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.data).toEqual({ status: 'ok', database: 'up' });
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-request-id']).toBeTruthy();
    expect(r.headers['x-powered-by']).toBeUndefined();
  });
  it('fails readiness when PostgreSQL fails without leaking details', async () => {
    const r = await request(
      createApp({
        checkDatabase: async () => {
          throw new Error('secret connection');
        },
      }),
    ).get('/health');
    expect(r.status).toBe(503);
    expect(r.body.data.database).toBe('down');
    expect(r.text).not.toContain('secret');
  });
  it('exposes only a versioned foundation endpoint', async () => {
    expect((await request(app).get('/api/v1')).body.data.stage).toBe(
      'foundation',
    );
    const r = await request(app).get('/api/v1/unknown');
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe('NOT_FOUND');
    expect(r.body.error.requestId).toBe(r.headers['x-request-id']);
  });
  it('rejects malformed and oversized JSON', async () => {
    expect(
      (
        await request(app)
          .post('/api/v1')
          .set('Content-Type', 'application/json')
          .send('{')
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/v1')
          .send({ value: 'x'.repeat(110000) })
      ).status,
    ).toBe(413);
  });
  it('limits API requests while preserving readiness', async () => {
    const limited = createApp({
      checkDatabase: async () => {},
      rateLimitMax: 1,
    });
    await request(limited).get('/api/v1');
    const r = await request(limited).get('/api/v1');
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe('RATE_LIMITED');
    expect((await request(limited).get('/health')).status).toBe(200);
  });
  it('returns 404 outside known routes', async () => {
    expect((await request(app).get('/missing')).status).toBe(404);
  });
  it('masks unexpected errors', async () => {
    const broken = express();
    broken.use(pinoHttp({ logger }));
    broken.get('/', () => {
      throw new Error('private');
    });
    broken.use(errorHandler);
    const r = await request(broken).get('/');
    expect(r.status).toBe(500);
    expect(r.text).not.toContain('private');
  });
  it('preserves explicit safe errors', () => {
    const error = new HttpError(403, 'FORBIDDEN', 'Forbidden');
    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });
});
describe('environment validation', () => {
  it('accepts PostgreSQL and defaults', () => {
    expect(readEnv({ DATABASE_URL: 'postgresql://localhost/db' }).PORT).toBe(
      3000,
    );
  });
  it('rejects missing database, invalid scheme, port and mode', () => {
    for (const input of [
      {},
      { DATABASE_URL: 'https://example.com' },
      { DATABASE_URL: 'postgres://localhost/db', PORT: '0' },
      { DATABASE_URL: 'postgres://localhost/db', NODE_ENV: 'invalid' },
    ])
      expect(() => readEnv(input)).toThrow();
  });
});
