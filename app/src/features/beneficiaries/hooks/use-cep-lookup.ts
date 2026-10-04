import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { notifications } from "@/services/notifications";

import { lookupAddressByCep } from "../services/viacep.service";

const CEP_NOT_FOUND_MESSAGE =
  "CEP não encontrado. Preencha os dados do endereço manualmente.";

export function useCepLookup(postalCode: string) {
  const enabled = /^\d{8}$/.test(postalCode);
  const lastNotifiedCep = useRef("");
  const query = useQuery({
    queryKey: ["beneficiaries", "cep-lookup", postalCode],
    enabled,
    queryFn: ({ signal }) => lookupAddressByCep(postalCode, signal),
    staleTime: 0,
    gcTime: 0,
    meta: {
      errorMessage:
        "Não foi possível consultar o CEP. Preencha o endereço manualmente.",
    },
  });

  useEffect(() => {
    if (!enabled) {
      lastNotifiedCep.current = "";
      return;
    }

    if (
      query.isSuccess &&
      query.data === null &&
      lastNotifiedCep.current !== postalCode
    ) {
      lastNotifiedCep.current = postalCode;
      notifications.error(CEP_NOT_FOUND_MESSAGE);
    }
  }, [enabled, postalCode, query.data, query.isSuccess]);

  return query;
}
