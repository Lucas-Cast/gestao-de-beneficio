import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosRequestConfig } from "axios";

import { api } from "@/services/api/client";
import { ApiRequestError, toApiError } from "@/services/api/errors";

import type { ApiNotificationOptions } from "./use-api-request";

type UseApiGetOptions = {
  config?: AxiosRequestConfig;
  enabled?: boolean;
} & Pick<ApiNotificationOptions, "errorMessage">;

export function useApiGet<TResponse>(
  url: string,
  { config, enabled = true, errorMessage }: UseApiGetOptions = {},
) {
  const client = useQueryClient();
  const queryKey = ["api-get", url, config?.params ?? null] as const;
  const query = useQuery<TResponse, ApiRequestError>({
    queryKey,
    enabled,
    meta: { errorMessage },
    queryFn: async ({ signal }) => {
      try {
        const response = await api.get<TResponse>(url, { ...config, signal });
        return response.data;
      } catch (error) {
        throw toApiError(error);
      }
    },
  });

  return {
    data: query.data ?? null,
    loading: query.isFetching,
    error: query.error,
    refetch: async () => {
      const result = await query.refetch();
      if (result.error) throw result.error;
      return result.data as TResponse;
    },
    cancel: () => client.cancelQueries({ queryKey, exact: true }),
    reset: () => client.resetQueries({ queryKey, exact: true }),
  };
}
