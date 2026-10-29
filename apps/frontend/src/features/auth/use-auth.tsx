import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  sessionResponseSchema,
  type LoginRequest,
  type ChangePasswordRequest,
  type SessionResponse,
} from '@shiplens/contracts';
import { ApiError, apiRequest } from '../../services/api-client';

export function useAuth() {
  const client = useQueryClient();
  const discardProtectedQueries = async () => {
    const predicate = (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[0] !== 'auth';
    await client.cancelQueries({ predicate });
    client.removeQueries({ predicate });
  };
  const session = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async ({ signal }) => {
      try {
        const next = sessionResponseSchema.parse(
          await apiRequest('/auth/me', { signal }),
        );
        const previous = client.getQueryData<SessionResponse | null>([
          'auth',
          'session',
        ]);
        const scope = (value: SessionResponse) =>
          [
            value.user.id,
            value.user.role,
            value.user.status,
            value.user.branch?.id,
            value.user.mustChangePassword,
            value.user.restricted,
          ].join(':');
        if (previous && scope(previous) !== scope(next))
          await discardProtectedQueries();
        return next;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          error.code !== 'TEMPORARY_PASSWORD_EXPIRED'
        ) {
          await discardProtectedQueries();
          return null;
        }
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
    refetchInterval: 60000,
  });
  useEffect(() => {
    const expire = () => {
      void client.cancelQueries();
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
      client.setQueryData(['auth', 'session'], null);
    };
    window.addEventListener('auth:expired', expire);
    return () => window.removeEventListener('auth:expired', expire);
  }, [client]);
  const accept = async (data: SessionResponse) => {
    await client.cancelQueries();
    client.removeQueries({
      predicate: (query) => query.queryKey[0] !== 'auth',
    });
    client.setQueryData(['auth', 'session'], data);
  };
  const login = useMutation({
    mutationFn: async (body: LoginRequest) =>
      sessionResponseSchema.parse(
        await apiRequest('/auth/login', { method: 'POST', body }),
      ),
    onSuccess: accept,
  });
  const change = useMutation({
    mutationFn: async ({
      body,
      first,
    }: {
      body: ChangePasswordRequest;
      first: boolean;
    }) =>
      sessionResponseSchema.parse(
        await apiRequest(
          first ? '/auth/first-login-password' : '/auth/change-password',
          { method: 'POST', body, csrfToken: session.data?.csrfToken },
        ),
      ),
    onSuccess: accept,
  });
  const logout = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          csrfToken: session.data?.csrfToken,
        });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
    },
    onSuccess: async () => {
      await client.cancelQueries();
      client.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      });
      client.setQueryData(['auth', 'session'], null);
    },
  });
  return { session, login, change, logout };
}
