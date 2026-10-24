import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../errors/http-error.js';
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const malformed =
    error instanceof SyntaxError && 'status' in error && error.status === 400;
  const oversized =
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large';
  const status =
    error instanceof HttpError
      ? error.status
      : malformed
        ? 400
        : oversized
          ? 413
          : 500;
  if (status >= 500) req.log.error({ requestId: req.id }, 'Request failed');
  res.status(status).json({
    error: {
      code:
        error instanceof HttpError
          ? error.code
          : malformed
            ? 'INVALID_JSON'
            : oversized
              ? 'PAYLOAD_TOO_LARGE'
              : 'INTERNAL_ERROR',
      message:
        error instanceof HttpError
          ? error.message
          : status === 500
            ? 'An unexpected error occurred'
            : 'Invalid request body',
      requestId: String(req.id),
    },
  });
};
