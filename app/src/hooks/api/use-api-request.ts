import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

import { ApiRequestError, toApiError } from "@/services/api/errors";
import { notifications } from "@/services/notifications";

type RequestFunction<TResponse> = () => Promise<TResponse>;
type RequestOperation<TResponse> = {
  request: RequestFunction<TResponse>;
  id: number;
};

export type ApiRequestCallbacks<TResponse> = {
  onSuccess?: (data: TResponse) => void;
  onError?: (error: ApiRequestError) => void;
};

export type ApiNotificationOptions = {
  successMessage?: string;
  errorMessage?: string | ((error: ApiRequestError) => string);
};

export function useApiRequest<TResponse>({
  successMessage,
  errorMessage,
}: ApiNotificationOptions = {}) {
  const latestRequest = useRef(0);
  const { mutate, mutateAsync, data, isPending, error, reset } = useMutation<
    TResponse,
    ApiRequestError,
    RequestOperation<TResponse>
  >({
    mutationFn: async ({ request }) => {
      try {
        return await request();
      } catch (requestError) {
        throw toApiError(requestError);
      }
    },
    onSuccess: (_data, operation) => {
      if (operation.id !== latestRequest.current) return;
      if (successMessage) notifications.success(successMessage);
    },
    onError: (requestError, operation) => {
      if (operation.id !== latestRequest.current) return;
      if (requestError.code === "ERR_CANCELED") return;
      notifications.error(
        typeof errorMessage === "function"
          ? errorMessage(requestError)
          : (errorMessage ?? requestError.message),
      );
    },
  });

  const execute = useCallback(
    (request: RequestFunction<TResponse>) => {
      const id = ++latestRequest.current;
      return mutateAsync({ request, id });
    },
    [mutateAsync],
  );

  const run = useCallback(
    (
      request: RequestFunction<TResponse>,
      callbacks: ApiRequestCallbacks<TResponse> = {},
    ) => {
      const id = ++latestRequest.current;
      mutate(
        { request, id },
        {
          onSuccess: (response) => {
            if (id === latestRequest.current) callbacks.onSuccess?.(response);
          },
          onError: (requestError) => {
            if (id === latestRequest.current)
              callbacks.onError?.(requestError);
          },
        },
      );
    },
    [mutate],
  );

  return {
    data: data ?? null,
    loading: isPending,
    error,
    execute,
    run,
    reset,
  };
}
