import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import {
  adminIdSchema,
  staffListSchema,
  branchListSchema,
  auditListSchema,
  staffCreateSchema,
  staffUpdateSchema,
  branchCreateSchema,
  branchUpdateSchema,
  branchTransitionSchema,
  leadAssignSchema,
} from '@shiplens/contracts';
import { trustedOrigin } from '../../common/middleware/csrf.js';
import { sessionToken } from '../../common/utilities/cookies.js';
import { HttpError } from '../../common/errors/http-error.js';
import { AdminService } from './admin.service.js';
import { AdminRepository } from './admin.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { BranchesRepository } from '../branches/branches.repository.js';
import { AuditRepository } from '../audit/audit.repository.js';
import type { AuthService } from '../auth/auth.service.js';
export function adminRouter(auth: AuthService, origins: readonly string[]) {
  const service = new AdminService(auth, {
    users: new UsersRepository(),
    branches: new BranchesRepository(),
    audit: new AuditRepository(),
    overview: new AdminRepository(),
  });
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    next();
  });
  router.use(trustedOrigin(origins));
  const throttle = rateLimit({
    windowMs: 15 * 60000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new HttpError(429, 'RATE_LIMITED', 'Too many requests')),
  });
  const parse = <T extends z.ZodType>(
    schema: T,
    value: unknown,
  ): z.output<T> => {
    const result = schema.safeParse(value);
    if (!result.success)
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Check the submitted fields',
      );
    return result.data;
  };
  const csrf = (value: string | undefined) => value ?? '';
  router.get('/overview', async (req, res) =>
    res.json({ data: await service.overview(sessionToken(req)) }),
  );
  router.get('/staff', async (req, res) =>
    res.json({
      data: await service.staffList(
        sessionToken(req),
        parse(staffListSchema, req.query),
      ),
    }),
  );
  router.get('/staff/:id', async (req, res) =>
    res.json({
      data: await service.staffDetail(
        sessionToken(req),
        parse(adminIdSchema, req.params).id,
      ),
    }),
  );
  router.post('/staff', throttle, async (req, res) =>
    res.status(201).json({
      data: await service.createStaff(
        sessionToken(req),
        csrf(req.get('X-CSRF-Token')),
        parse(staffCreateSchema, req.body),
      ),
    }),
  );
  router.post('/staff/:id/update', throttle, async (req, res) =>
    res.json({
      data: await service.updateStaff(
        sessionToken(req),
        csrf(req.get('X-CSRF-Token')),
        parse(adminIdSchema, req.params).id,
        parse(staffUpdateSchema, req.body),
      ),
    }),
  );
  router.get('/cities', async (req, res) =>
    res.json({ data: await service.cities(sessionToken(req)) }),
  );
  router.get('/branches', async (req, res) =>
    res.json({
      data: await service.branchList(
        sessionToken(req),
        parse(branchListSchema, req.query),
      ),
    }),
  );
  router.get('/branches/:id', async (req, res) =>
    res.json({
      data: await service.branchDetail(
        sessionToken(req),
        parse(adminIdSchema, req.params).id,
      ),
    }),
  );
  router.post('/branches', async (req, res) =>
    res.status(201).json({
      data: await service.createBranch(
        sessionToken(req),
        csrf(req.get('X-CSRF-Token')),
        parse(branchCreateSchema, req.body),
      ),
    }),
  );
  router.post('/branches/:id/update', async (req, res) =>
    res.json({
      data: await service.updateBranch(
        sessionToken(req),
        csrf(req.get('X-CSRF-Token')),
        parse(adminIdSchema, req.params).id,
        parse(branchUpdateSchema, req.body),
      ),
    }),
  );
  router.post('/branches/:id/status', async (req, res) =>
    res.json({
      data: await service.transition(
        sessionToken(req),
        csrf(req.get('X-CSRF-Token')),
        parse(adminIdSchema, req.params).id,
        parse(branchTransitionSchema, req.body),
      ),
    }),
  );
  router.post('/branches/:id/lead', async (req, res) =>
    res.json({
      data: await service.assign(
        sessionToken(req),
        csrf(req.get('X-CSRF-Token')),
        parse(adminIdSchema, req.params).id,
        parse(leadAssignSchema, req.body),
      ),
    }),
  );
  router.get('/audit', async (req, res) =>
    res.json({
      data: await service.auditList(
        sessionToken(req),
        parse(auditListSchema, req.query),
      ),
    }),
  );
  router.get('/audit/:id', async (req, res) =>
    res.json({
      data: await service.auditDetail(
        sessionToken(req),
        parse(adminIdSchema, req.params).id,
      ),
    }),
  );
  return router;
}
