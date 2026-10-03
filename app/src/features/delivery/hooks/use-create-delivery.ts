import { useCallback, useRef } from "react";
import { API_ROUTES } from "@/constants/routes";
import { useApiPost } from "@/hooks/api/use-api-post";
import type { ApiRequestError } from "@/services/api/errors";
import type { Delivery, DeliveryPayload } from "../types/delivery.types";
export function deliveryErrorMessage(error: ApiRequestError) {
  return !error.status
    ? "Não foi possível confirmar o registro. Verifique se a entrega foi registrada antes de tentar novamente."
    : error.message;
}
export function useCreateDelivery() {
  const lock = useRef(false);
  const { execute, ...state } = useApiPost<DeliveryPayload, Delivery>(
    API_ROUTES.basketDeliveries.collection,
    undefined,
    {
      successMessage: "Entrega registrada com sucesso.",
      errorMessage: deliveryErrorMessage,
    },
  );
  const create = useCallback(
    async (payload: DeliveryPayload) => {
      if (lock.current) return undefined;
      lock.current = true;
      try {
        return await execute(payload);
      } finally {
        lock.current = false;
      }
    },
    [execute],
  );
  return { ...state, create };
}
