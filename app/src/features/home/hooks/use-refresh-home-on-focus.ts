import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "@/constants/routes";

export function useRefreshHomeOnFocus() {
  const queryClient = useQueryClient();
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }

      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["api-get", API_ROUTES.basketDeliveries.stats],
          refetchType: "active",
        }),
        queryClient.invalidateQueries({
          queryKey: ["api-get", API_ROUTES.basketDeliveries.collection],
          refetchType: "active",
        }),
      ]);
    }, [queryClient]),
  );
}
