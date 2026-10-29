import express from 'express';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { rateLimit } from 'express-rate-limit';
import { healthSchema } from '@shiplens/contracts';
import { logger } from './infrastructure/observability/logger.js';
import { HttpError } from './common/errors/http-error.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.router.js';
import type { AuthService } from './modules/auth/auth.service.js';
export function createApp(options: {
  checkDatabase: () => Promise<void>;
  frontendPath?: string;
  rateLimitMax?: number;
  auth?: {
    service: AuthService;
    origins: readonly string[];
    secure: boolean;
    loginLimit?: number;
  };
}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader('X-Request-ID', id);
        return id;
      },
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: String(req.url).split('?')[0],
        }),
      },
    }),
  );
  app.get('/health', async (_req, res) => {
    try {
      await options.checkDatabase();
      res.json({ data: healthSchema.parse({ status: 'ok', database: 'up' }) });
    } catch {
      res.status(503).json({
        data: healthSchema.parse({ status: 'unavailable', database: 'down' }),
      });
    }
  });
  app.use(
    '/api',
    rateLimit({
      windowMs: 60_000,
      limit: options.rateLimitMax ?? 100,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (req, res) =>
        res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            requestId: String(req.id),
          },
        }),
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  if (options.auth)
    app.use(
      '/api/v1/auth',
      authRouter(
        options.auth.service,
        options.auth.origins,
        options.auth.secure,
        options.auth.loginLimit,
      ),
    );
  app.get('/api/v1', (_req, res) =>
    res.json({
      data: { name: 'ShipLens', version: 'v1', stage: 'foundation' },
    }),
  );
  app.use('/api', (_req, _res, next) =>
    next(new HttpError(404, 'NOT_FOUND', 'API route not found')),
  );
  if (options.frontendPath) {
    app.use(express.static(options.frontendPath));
    app.get('/{*path}', (req, res, next) => {
      if (path.extname(req.path) || !req.accepts('html')) return next();
      res.sendFile(path.join(options.frontendPath!, 'index.html'));
    });
  }
  app.use((_req, _res, next) =>
    next(new HttpError(404, 'NOT_FOUND', 'Route not found')),
  );
  app.use(errorHandler);
  return app;
}
