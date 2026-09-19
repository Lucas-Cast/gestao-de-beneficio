import { useCallback } from 'react';
import type { AxiosRequestConfig } from 'axios';

import { api } from '@/services/api/client';

import { useApiRequest } from './use-api-request';

export function useApiDelete<TResponse = void>(
  url: string,
  config?: AxiosRequestConfig,
) {
  const { execute: executeRequest, ...requestState } = useApiRequest<TResponse>();

  const execute = useCallback(
    () =>
      executeRequest(async () => {
        const response = await api.delete<TResponse>(url, config);
        return response.data;
      }),
    [executeRequest, url, config],
  );

  return {
    ...requestState,
    execute,
  };
}
