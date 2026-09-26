import { useCallback } from 'react';

import { API_ROUTES } from '@/constants/routes';
import { useApiPost } from '@/hooks/api/use-api-post';

import type { RegisterPayload, RegisterResponse } from '../types/auth.types';

export function useRegister() {
  const { execute: executeRequest, ...requestState } = useApiPost<
    RegisterPayload,
    RegisterResponse
  >(API_ROUTES.auth.register);

  const register = useCallback(
    async (payload: RegisterPayload) => executeRequest(payload),
    [executeRequest],
  );

  return {
    ...requestState,
    register,
  };
}
