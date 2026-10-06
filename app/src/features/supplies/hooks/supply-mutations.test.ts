import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { api } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";
import { notifications } from "@/services/notifications";

import { useCreateStockMovement, useDeleteSupply, useSaveSupply } from "./use-supply-mutations";

jest.mock("@/services/api/client", () => ({
  api: { post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const post = jest.mocked(api.post);
const patch = jest.mocked(api.patch);
const remove = jest.mocked(api.delete);
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

const values = {
  name: "  Arroz  ",
  description: "  Arroz branco  ",
  unit: "KILOGRAM",
  currentQuantity: "12",
};

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
});

test("creation sends an explicit opening stock, but omits it when blank", async () => {
  post.mockResolvedValue({ data: { id: "supply-id" } });
  const onSuccess = jest.fn();
  const { result } = await renderHook(() => useSaveSupply(), { wrapper });

  await act(() => result.current.save(values, onSuccess));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenNthCalledWith(1, "/supplies", {
    name: "Arroz", description: "Arroz branco", unit: "KILOGRAM", currentQuantity: 12,
  });

  await act(() => result.current.save({ ...values, currentQuantity: "" }, onSuccess));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(2));
  expect(post).toHaveBeenNthCalledWith(2, "/supplies", {
    name: "Arroz", description: "Arroz branco", unit: "KILOGRAM",
  });
  expect(notifications.success).toHaveBeenCalledTimes(2);
});

test("editing never sends stock and invalidates supply reads", async () => {
  patch.mockResolvedValueOnce({ data: { id: "supply-id" } });
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  const onSuccess = jest.fn();
  const { result } = await renderHook(() => useSaveSupply("supply-id"), { wrapper });

  await act(() => result.current.save(values, onSuccess));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(patch).toHaveBeenCalledWith("/supplies/supply-id", {
    name: "Arroz", description: "Arroz branco", unit: "KILOGRAM",
  });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["supplies"] });
  expect(notifications.success).toHaveBeenCalledWith("Mantimento atualizado com sucesso.");
  invalidate.mockRestore();
});

test("delete uses the soft-delete endpoint after confirmation", async () => {
  remove.mockResolvedValueOnce({ data: undefined });
  const onSuccess = jest.fn();
  const { result } = await renderHook(() => useDeleteSupply("supply-id", onSuccess), { wrapper });
  await act(() => result.current.remove());
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(remove).toHaveBeenCalledWith("/supplies/supply-id");
  expect(notifications.success).toHaveBeenCalledTimes(1);
});

test("movement sends only business fields and refreshes the balance", async () => {
  post.mockResolvedValueOnce({ data: {} });
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  const onSuccess = jest.fn();
  const { result } = await renderHook(() => useCreateStockMovement(onSuccess), { wrapper });
  await act(() => result.current.create({ supplyId: "supply-id", type: "OUT", quantity: "3", reason: "  Conferência  " }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledWith("/stock-movements", {
    supplyId: "supply-id", type: "OUT", quantity: 3, reason: "Conferência",
  });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["supplies"] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["api-get", "/supplies/supply-id"] });
  expect(notifications.success).toHaveBeenCalledTimes(1);
  invalidate.mockRestore();
});

test("failed movements keep the form open and show one normalized toast", async () => {
  post.mockRejectedValueOnce(new Error("internal database error"));
  const onSuccess = jest.fn();
  const { result } = await renderHook(() => useCreateStockMovement(onSuccess), { wrapper });
  await act(() => result.current.create({ supplyId: "supply-id", type: "OUT", quantity: "3", reason: "" }));
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(onSuccess).not.toHaveBeenCalled();
  expect(notifications.error).toHaveBeenCalledTimes(1);
  expect(notifications.error).toHaveBeenCalledWith("Ocorreu um erro inesperado.");
});
