import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  loginRequestSchema,
  firstLoginPasswordChangeSchema,
  changePasswordSchema,
  credentialResetParamsSchema,
  credentialResetResponseSchema,
} from '@shiplens/contracts';
import type { AuthService } from './auth.service.js';
import { HttpError } from '../../common/errors/http-error.js';
import { trustedOrigin } from '../../common/middleware/csrf.js';
import {
  clearSessionCookie,
  sessionToken,
  setSessionCookie,
} from '../../common/utilities/cookies.js';

export function authRouter(
  service: AuthService,
  origins: readonly string[],
  secure: boolean,
  loginLimit = 10,
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    next();
  });
  router.use(trustedOrigin(origins));
  const throttle = rateLimit({
    windowMs: 15 * 60000,
    limit: loginLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new HttpError(429, 'RATE_LIMITED', 'Too many requests')),
  });
  router.post('/login', throttle, async (req, res) => {
    const input = loginRequestSchema.safeParse(req.body);
    if (!input.success)
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Check the submitted fields',
      );
    const { token, ...data } = await service.login(
      input.data.email,
      input.data.password,
    );
    setSessionCookie(res, token, secure);
    res.json({ data });
  });
  router.get('/me', async (req, res) =>
    res.json({ data: await service.me(sessionToken(req)) }),
  );
  router.post('/logout', async (req, res) => {
    try {
      await service.logout(sessionToken(req), req.get('X-CSRF-Token'));
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 401) throw error;
    }
    clearSessionCookie(res, secure);
    res.json({ data: { success: true } });
  });
  for (const [route, schema, first] of [
    ['/first-login-password', firstLoginPasswordChangeSchema, true],
    ['/change-password', changePasswordSchema, false],
  ] as const)
    router.post(route, throttle, async (req, res) => {
      const input = schema.safeParse(req.body);
      if (!input.success)
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Check the submitted fields',
        );
      const { token, ...data } = await service.changePassword(
        sessionToken(req),
        req.get('X-CSRF-Token'),
        input.data,
        first,
      );
      setSessionCookie(res, token, secure);
      res.json({ data });
    });
  router.post('/staff/:id/reset-credential', throttle, async (req, res) => {
    const id = credentialResetParamsSchema.safeParse(req.params);
    if (!id.success)
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid identifier');
    res.json({
      data: credentialResetResponseSchema.parse(
        await service.resetCredential(
          sessionToken(req),
          req.get('X-CSRF-Token'),
          id.data.id,
        ),
      ),
    });
  });
  return router;
}
