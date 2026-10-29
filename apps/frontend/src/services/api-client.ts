import { errorResponseSchema, type ApiResponse } from '@shiplens/contracts';
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}
export async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    csrfToken?: string;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method: options.method ?? 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(options.csrfToken ? { 'X-CSRF-Token': options.csrfToken } : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('NETWORK_ERROR', 0);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('INTERNAL_ERROR', response.status);
  }
  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(body);
    if (
      response.status === 401 &&
      path !== '/auth/login' &&
      path !== '/auth/me'
    )
      window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(
      parsed.success ? parsed.data.error.code : 'INTERNAL_ERROR',
      response.status,
    );
  }
  return (body as ApiResponse<T>).data;
}
export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(path, { signal });
}
