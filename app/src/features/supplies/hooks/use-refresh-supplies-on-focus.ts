import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { SUPPLIES_QUERY_KEY } from "./use-supply-search";

export function useRefreshSuppliesOnFocus() {
  const queryClient = useQueryClient();
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: SUPPLIES_QUERY_KEY,
        refetchType: "active",
      });
    }, [queryClient]),
  );
}
