import { useCallback, useEffect } from 'react';
import type { AxiosRequestConfig } from 'axios';

import { api } from '@/services/api/client';

import { useApiRequest } from './use-api-request';

type UseApiGetOptions = {
  config?: AxiosRequestConfig;
  enabled?: boolean;
};

export function useApiGet<TResponse>(
  url: string,
  options: UseApiGetOptions = {},
) {
  const { config, enabled = true } = options;
  const { execute: executeRequest, ...requestState } = useApiRequest<TResponse>();

  const refetch = useCallback(
    () =>
      executeRequest(async () => {
        const response = await api.get<TResponse>(url, config);
        return response.data;
      }),
    [executeRequest, url, config],
  );

  useEffect(() => {
    if (enabled) {
      void refetch().catch(() => undefined);
    }
  }, [enabled, refetch]);

  return {
    ...requestState,
    refetch,
  };
}
