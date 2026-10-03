import { useCallback } from "react";
import type { AxiosRequestConfig } from "axios";

import { api } from "@/services/api/client";

import { useApiRequest, type ApiNotificationOptions } from "./use-api-request";

export function useApiPost<TBody, TResponse>(
  url: string,
  config?: AxiosRequestConfig,
  notifications?: ApiNotificationOptions,
) {
  const { execute: executeRequest, ...requestState } =
    useApiRequest<TResponse>(notifications);

  const execute = useCallback(
    (body: TBody) =>
      executeRequest(async () => {
        const response = await api.post<TResponse>(url, body, config);
        return response.data;
      }),
    [executeRequest, url, config],
  );

  return {
    ...requestState,
    execute,
  };
}
