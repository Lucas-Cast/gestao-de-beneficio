import { useCallback } from 'react';

import { API_ROUTES } from '@/constants/routes';
import { useApiPost } from '@/hooks/api/use-api-post';
import { session } from '@/services/api/session';
import { useUser } from '@/context/user-context';

import type { AuthResponse, RegisterPayload } from '../types/auth.types';

export function useRegister() {
  const { setUser } = useUser();
  const { execute: executeRequest, ...requestState } = useApiPost<
    RegisterPayload,
    AuthResponse
  >(API_ROUTES.auth.register);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await executeRequest(payload);
      await session.setToken(response.token);
      await session.setUser(response);
      setUser({ name: response.name, email: response.email });
      return response;
    },
    [executeRequest, setUser],
  );

  return {
    ...requestState,
    register,
  };
}
