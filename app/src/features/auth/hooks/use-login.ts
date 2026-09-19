import { useCallback } from 'react';

import { API_ROUTES } from '@/constants/routes';
import { useApiPost } from '@/hooks/api/use-api-post';
import { session } from '@/services/api/session';

import type { AuthResponse, LoginPayload } from '../types/auth.types';

export function useLogin() {
  const { execute: executeRequest, ...requestState } = useApiPost<
    LoginPayload,
    AuthResponse
  >(API_ROUTES.auth.login);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await executeRequest(payload);
      await session.setToken(response.token);
      return response;
    },
    [executeRequest],
  );

  return {
    ...requestState,
    login,
  };
}
