import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { api } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";
import { notifications } from "@/services/notifications";

import { useDeleteBeneficiary } from "./use-delete-beneficiary";
import { useSaveBeneficiary } from "./use-save-beneficiary";
import { useRestoreBeneficiary } from "./use-restore-beneficiary";

jest.mock("@/services/api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const post = jest.mocked(api.post);
const patch = jest.mocked(api.patch);
const remove = jest.mocked(api.delete);
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

const values = {
  name: "  Ana Souza  ",
  birthDate: "1990-01-01",
  sex: "F",
  phone: "(91) 98765-4321",
  cpf: "529.982.247-25",
  address: {
    street: " Rua das Flores ",
    number: " 15 ",
    complement: "  ",
    neighborhood: " Centro ",
    city: " Belém ",
    state: "pa",
    postalCode: "66000-000",
  },
};

const beneficiaryResponse = {
  data: {
    id: "beneficiary-id",
    name: "Ana Souza",
    birthDate: "1990-01-01",
    sex: "F",
    phone: "91987654321",
    cpf: "52998224725",
    address: {
      id: "address-id",
      street: "Rua das Flores",
      number: "15",
      complement: null,
      neighborhood: "Centro",
      city: "Belém",
      state: "PA",
      postalCode: "66000000",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
});

test("create normalizes beneficiary and address fields before POST", async () => {
  post.mockResolvedValueOnce(beneficiaryResponse);
  const { result } = await renderHook(() => useSaveBeneficiary(), { wrapper });
  const onSuccess = jest.fn();

  await act(() => result.current.save(values, onSuccess));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

  expect(post).toHaveBeenCalledWith("/beneficiaries", {
    name: "Ana Souza",
    birthDate: "1990-01-01",
    sex: "F",
    phone: "91987654321",
    cpf: "52998224725",
    address: {
      street: "Rua das Flores",
      number: "15",
      complement: null,
      neighborhood: "Centro",
      city: "Belém",
      state: "PA",
      postalCode: "66000000",
    },
  });
  expect(notifications.success).toHaveBeenCalledWith(
    "Beneficiário cadastrado com sucesso.",
  );
});

test("edit sends every editable field through PATCH", async () => {
  patch.mockResolvedValueOnce(beneficiaryResponse);
  const { result } = await renderHook(
    () => useSaveBeneficiary("beneficiary-id"),
    { wrapper },
  );
  const onSuccess = jest.fn();

  await act(() => result.current.save(values, onSuccess));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

  expect(patch).toHaveBeenCalledWith(
    "/beneficiaries/beneficiary-id",
    expect.objectContaining({
      cpf: "52998224725",
      birthDate: "1990-01-01",
      sex: "F",
      phone: "91987654321",
    }),
  );
  expect(notifications.success).toHaveBeenCalledWith(
    "Beneficiário atualizado com sucesso.",
  );
});

test("delete invokes the soft-delete endpoint and reports success", async () => {
  remove.mockResolvedValueOnce({ data: undefined });
  const onSuccess = jest.fn();
  const { result } = await renderHook(
    () => useDeleteBeneficiary("beneficiary-id", onSuccess),
    { wrapper },
  );

  await act(() => result.current.remove());
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

  expect(remove).toHaveBeenCalledWith("/beneficiaries/beneficiary-id");
  expect(notifications.success).toHaveBeenCalledWith(
    "Beneficiário excluído com sucesso.",
  );
});

test("restore calls the restore endpoint and reports success", async () => {
  patch.mockResolvedValueOnce({ data: undefined });
  const { result } = await renderHook(() => useRestoreBeneficiary(), {
    wrapper,
  });

  await act(() => result.current.restore("beneficiary-id"));
  await waitFor(() =>
    expect(patch).toHaveBeenCalledWith("/beneficiaries/beneficiary-id/restore"),
  );
  await waitFor(() =>
    expect(notifications.success).toHaveBeenCalledWith(
      "Beneficiário restaurado com sucesso.",
    ),
  );
  expect(result.current.restoringId).toBeNull();
});
