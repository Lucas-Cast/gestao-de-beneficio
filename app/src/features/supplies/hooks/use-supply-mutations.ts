import { useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "@/constants/routes";
import { useApiRequest } from "@/hooks/api/use-api-request";
import { api } from "@/services/api/client";

import { SUPPLIES_QUERY_KEY } from "./use-supply-search";
import type { StockMovementFormValues, Supply, SupplyFormValues } from "../types/supply.types";

export function useSaveSupply(id?: string) {
  const queryClient = useQueryClient();
  const request = useApiRequest<Supply>({
    successMessage: id
      ? "Mantimento atualizado com sucesso."
      : "Mantimento cadastrado com sucesso.",
  });

  const save = (values: SupplyFormValues, onSuccess: () => void) => {
    request.run(
      async () => {
        const catalog = {
          name: values.name.trim(),
          description: values.description.trim() || null,
          unit: values.unit,
        };
        const response = id
          ? await api.patch<Supply>(API_ROUTES.supplies.byId(id), catalog)
          : await api.post<Supply>(API_ROUTES.supplies.collection, {
              ...catalog,
              ...(values.currentQuantity.trim()
                ? { currentQuantity: Number(values.currentQuantity.trim()) }
                : {}),
            });
        return response.data;
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: SUPPLIES_QUERY_KEY });
          if (id)
            void queryClient.invalidateQueries({
              queryKey: ["api-get", API_ROUTES.supplies.byId(id)],
            });
          onSuccess();
        },
      },
    );
  };

  return { ...request, save };
}

export function useDeleteSupply(id: string, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const request = useApiRequest<void>({ successMessage: "Mantimento excluído com sucesso." });

  const remove = () => {
    request.run(
      async () => {
        await api.delete(API_ROUTES.supplies.byId(id));
      },
      {
        onSuccess: () => {
          onSuccess();
          void queryClient.invalidateQueries({ queryKey: SUPPLIES_QUERY_KEY });
        },
      },
    );
  };

  return { ...request, remove };
}

export function useCreateStockMovement(onSuccess: () => void) {
  const queryClient = useQueryClient();
  const request = useApiRequest<void>({ successMessage: "Movimentação registrada com sucesso." });

  const create = (values: StockMovementFormValues) => {
    request.run(
      async () => {
        await api.post(API_ROUTES.stockMovements.collection, {
          supplyId: values.supplyId,
          type: values.type,
          quantity: Number(values.quantity.trim()),
          reason: values.reason.trim() || null,
        });
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: SUPPLIES_QUERY_KEY });
          void queryClient.invalidateQueries({
            queryKey: ["api-get", API_ROUTES.supplies.byId(values.supplyId)],
          });
          onSuccess();
        },
      },
    );
  };

  return { ...request, create };
}
