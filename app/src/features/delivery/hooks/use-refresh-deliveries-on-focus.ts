import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { DELIVERY_HISTORY_QUERY_KEY } from "./use-delivery-history";

export function useRefreshDeliveriesOnFocus() {
  const queryClient = useQueryClient();
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: DELIVERY_HISTORY_QUERY_KEY,
        refetchType: "active",
      });
    }, [queryClient]),
  );
}
