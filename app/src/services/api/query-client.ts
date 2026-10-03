import { QueryCache, QueryClient } from "@tanstack/react-query";

import { toApiError } from "@/services/api/errors";
import { notifications } from "@/services/notifications";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const normalized = toApiError(error);
      if (normalized.code === "ERR_CANCELED") return;

      const customMessage = query.meta?.errorMessage;
      notifications.error(
        typeof customMessage === "function"
          ? customMessage(normalized)
          : typeof customMessage === "string"
            ? customMessage
            : normalized.message,
      );
    },
  }),
  defaultOptions: {
    queries: {
      // Keep only active queries in memory; do not persist or reuse old results.
      gcTime: 0,
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Authentication responses must not remain in an inactive mutation cache.
      gcTime: 0,
      retry: false,
    },
  },
});
