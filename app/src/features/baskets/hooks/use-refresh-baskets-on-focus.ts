import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { BASKETS_QUERY_KEY } from "./use-basket-search";

export function useRefreshBasketsOnFocus(deleted = false) {
  const queryClient = useQueryClient();
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: [...BASKETS_QUERY_KEY, deleted ? "deleted" : "active"],
        refetchType: "active",
      });
    }, [deleted, queryClient]),
  );
}
