import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { USERS_QUERY_KEY } from "./use-user-search";

export function useRefreshUsersOnFocus() {
  const queryClient = useQueryClient();
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEY,
        refetchType: "active",
      });
    }, [queryClient]),
  );
}
