import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "@/constants/routes";
import { useApiRequest } from "@/hooks/api/use-api-request";
import { api } from "@/services/api/client";

import { BENEFICIARIES_QUERY_KEY } from "./use-beneficiary-search";

export function useRestoreBeneficiary() {
  const queryClient = useQueryClient();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const request = useApiRequest<void>({
    successMessage: "Beneficiário restaurado com sucesso.",
  });

  const restore = (id: string) => {
    setRestoringId(id);
    request.run(
      async () => {
        await api.patch(API_ROUTES.beneficiaries.restore(id));
      },
      {
        onSuccess: () => {
          setRestoringId(null);
          void queryClient.invalidateQueries({
            queryKey: BENEFICIARIES_QUERY_KEY,
          });
        },
        onError: () => setRestoringId(null),
      },
    );
  };

  return { restore, restoringId };
}
