import { useCallback, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

/** Refreshes active TanStack Query data and exposes a controlled refresh state. */
export function useRefreshQueries(queryKey?: QueryKey) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        ...(queryKey ? { queryKey } : {}),
        refetchType: "active",
      });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, queryKey]);

  return { refreshing, refresh };
}
