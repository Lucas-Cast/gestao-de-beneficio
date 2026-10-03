import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import { ApiRequestError, toApiError } from "@/services/api/errors";
import { notifications } from "@/services/notifications";

type RequestFunction<TResponse> = () => Promise<TResponse>;

export type ApiNotificationOptions = {
  successMessage?: string;
  errorMessage?: string | ((error: ApiRequestError) => string);
};

export function useApiRequest<TResponse>({
  successMessage,
  errorMessage,
}: ApiNotificationOptions = {}) {
  const { mutateAsync, data, isPending, error, reset } = useMutation<
    TResponse,
    ApiRequestError,
    RequestFunction<TResponse>
  >({
    mutationFn: async (request) => {
      try {
        return await request();
      } catch (requestError) {
        throw toApiError(requestError);
      }
    },
  });

  const execute = useCallback(
    (request: RequestFunction<TResponse>) =>
      mutateAsync(request, {
        onSuccess: () => {
          if (successMessage) notifications.success(successMessage);
        },
        onError: (requestError) => {
          if (requestError.code === "ERR_CANCELED") return;
          notifications.error(
            typeof errorMessage === "function"
              ? errorMessage(requestError)
              : (errorMessage ?? requestError.message),
          );
        },
      }),
    [errorMessage, mutateAsync, successMessage],
  );

  return {
    data: data ?? null,
    loading: isPending,
    error,
    execute,
    reset,
  };
}
