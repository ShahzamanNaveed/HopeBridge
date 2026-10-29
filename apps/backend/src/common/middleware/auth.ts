import type { RequestHandler } from 'express';
import type { AuthService } from '../../modules/auth/auth.service.js';
import type { Permission } from '../../modules/auth/authorization.js';
import { sessionToken } from '../utilities/cookies.js';
/** Read-route adapter. Mutations must use service.withAuthorization with their writes
 * inside its callback and pass the unsafe request's CSRF header (or empty string).
 * Record scope/state validation remains mandatory in the consuming domain service. */
export function requirePermission(
  service: AuthService,
  action: Permission,
  branch: (req: Parameters<RequestHandler>[0]) => string | undefined = () =>
    undefined,
): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method))
        throw new Error(
          'Use the transactional authentication port for mutations',
        );
      res.locals.auth = await service.withAuthorization(
        sessionToken(req),
        action,
        branch(req),
        async (_tx, user) => user,
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}
