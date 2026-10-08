import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "@/constants/routes";
import { useApiRequest } from "@/hooks/api/use-api-request";
import { api } from "@/services/api/client";

import type { Basket, BasketFormValues } from "../types/basket.types";
import { BASKETS_QUERY_KEY } from "./use-basket-search";

function invalidateBasketData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: BASKETS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
}

export function useCreateBasket() {
  const queryClient = useQueryClient();
  const request = useApiRequest<Basket>({
    successMessage: "Cesta cadastrada com sucesso.",
  });

  const create = (values: BasketFormValues, onSuccess: () => void) => {
    request.run(
      async () => {
        const response = await api.post<Basket>(API_ROUTES.baskets.collection, {
          name: values.name.trim(),
          description: values.description.trim() || null,
          supplies: values.supplies.map((item) => ({
            supplyId: item.supplyId,
            quantity: Number(item.quantity.trim()),
          })),
        });
        return response.data;
      },
      {
        onSuccess: () => {
          invalidateBasketData(queryClient);
          onSuccess();
        },
      },
    );
  };

  return { ...request, create };
}

export function useDeleteBasket(id: string, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const request = useApiRequest<void>({
    successMessage: "Cesta excluída com sucesso.",
  });

  const remove = () => {
    request.run(
      async () => {
        await api.delete(API_ROUTES.baskets.byId(id));
      },
      {
        onSuccess: () => {
          invalidateBasketData(queryClient);
          onSuccess();
        },
      },
    );
  };

  return { ...request, remove };
}

export function useRestoreBasket() {
  const queryClient = useQueryClient();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const request = useApiRequest<Basket>({
    successMessage: "Cesta restaurada com sucesso.",
  });

  const restore = (id: string, onSuccess: () => void) => {
    setRestoringId(id);
    request.run(
      async () => {
        const response = await api.patch<Basket>(
          API_ROUTES.baskets.restore(id),
        );
        return response.data;
      },
      {
        onSuccess: () => {
          setRestoringId(null);
          invalidateBasketData(queryClient);
          onSuccess();
        },
        onError: () => setRestoringId(null),
      },
    );
  };

  return { ...request, restoringId, restore };
}
