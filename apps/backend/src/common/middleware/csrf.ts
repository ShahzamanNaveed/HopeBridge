import type { RequestHandler } from 'express';
import { HttpError } from '../errors/http-error.js';
export function trustedOrigin(origins: readonly string[]): RequestHandler {
  return (req, _res, next) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      (!req.headers.origin || !origins.includes(req.headers.origin))
    )
      return next(new HttpError(403, 'ORIGIN_REJECTED', 'Request rejected'));
    next();
  };
}
