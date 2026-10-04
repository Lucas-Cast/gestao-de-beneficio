import { useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "@/constants/routes";
import { useApiRequest } from "@/hooks/api/use-api-request";
import { api } from "@/services/api/client";

import { BENEFICIARIES_QUERY_KEY } from "./use-beneficiary-search";

export function useDeleteBeneficiary(id: string, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const request = useApiRequest<void>({
    successMessage: "Beneficiário excluído com sucesso.",
  });

  const remove = () => {
    request.run(
      async () => {
        await api.delete(API_ROUTES.beneficiaries.byId(id));
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: BENEFICIARIES_QUERY_KEY,
          });
          onSuccess();
        },
      },
    );
  };

  return { ...request, remove };
}
