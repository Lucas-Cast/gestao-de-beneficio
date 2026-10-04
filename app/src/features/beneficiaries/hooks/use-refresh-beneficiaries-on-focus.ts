import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { BENEFICIARIES_QUERY_KEY } from "./use-beneficiary-search";

/** Screens stay mounted in mobile navigation, so revisit should revalidate their list. */
export function useRefreshBeneficiariesOnFocus(deleted = false) {
  const queryClient = useQueryClient();
  const hasFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // The query already fetches when the screen first mounts.
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: [...BENEFICIARIES_QUERY_KEY, deleted ? "deleted" : "active"],
        refetchType: "active",
      });
    }, [deleted, queryClient]),
  );
}
