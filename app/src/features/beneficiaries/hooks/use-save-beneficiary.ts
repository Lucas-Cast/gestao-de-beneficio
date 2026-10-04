import { useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "@/constants/routes";
import { useApiRequest } from "@/hooks/api/use-api-request";
import { api } from "@/services/api/client";

import { BENEFICIARIES_QUERY_KEY } from "./use-beneficiary-search";
import type {
  Beneficiary,
  BeneficiaryFormValues,
  BeneficiarySex,
} from "../types/beneficiary.types";
import { onlyDigits } from "../utils/beneficiary-format";

function toPayload(values: BeneficiaryFormValues) {
  return {
    name: values.name.trim(),
    birthDate: values.birthDate,
    sex: values.sex as BeneficiarySex,
    phone: onlyDigits(values.phone),
    cpf: onlyDigits(values.cpf),
    address: {
      street: values.address.street.trim(),
      number: values.address.number.trim(),
      complement: values.address.complement.trim() || null,
      neighborhood: values.address.neighborhood.trim(),
      city: values.address.city.trim(),
      state: values.address.state.trim().toUpperCase(),
      postalCode: onlyDigits(values.address.postalCode),
    },
  };
}

export function useSaveBeneficiary(id?: string) {
  const queryClient = useQueryClient();
  const request = useApiRequest<Beneficiary>({
    successMessage: id
      ? "Beneficiário atualizado com sucesso."
      : "Beneficiário cadastrado com sucesso.",
  });

  const save = (values: BeneficiaryFormValues, onSuccess: () => void) => {
    request.run(
      async () => {
        const response = id
          ? await api.patch<Beneficiary>(
              API_ROUTES.beneficiaries.byId(id),
              toPayload(values),
            )
          : await api.post<Beneficiary>(
              API_ROUTES.beneficiaries.collection,
              toPayload(values),
            );
        return response.data;
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: BENEFICIARIES_QUERY_KEY,
          });
          if (id) {
            void queryClient.invalidateQueries({
              queryKey: ["api-get", API_ROUTES.beneficiaries.byId(id)],
            });
          }
          onSuccess();
        },
      },
    );
  };

  return { ...request, save };
}
