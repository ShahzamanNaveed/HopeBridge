import { errorResponseSchema, type ApiResponse } from '@shiplens/contracts';
export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    signal,
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = errorResponseSchema.safeParse(body);
    throw new Error(
      error.success ? error.data.error.message : 'Request failed',
    );
  }
  return (body as ApiResponse<T>).data;
}
