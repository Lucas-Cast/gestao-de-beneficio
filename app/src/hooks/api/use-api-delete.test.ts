import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { api } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";
import { notifications } from "@/services/notifications";

import { useApiDelete } from "./use-api-delete";

jest.mock("@/services/api/client", () => ({ api: { delete: jest.fn() } }));

const remove = jest.mocked(api.delete);
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
});

test("DELETE uses mutation state and reset without retaining old data", async () => {
  remove.mockResolvedValueOnce({ data: { id: "removed" } });
  const { result } = await renderHook(
    () => useApiDelete<{ id: string }>("/items/removed"),
    { wrapper },
  );

  await act(async () => {
    await expect(result.current.execute()).resolves.toEqual({ id: "removed" });
  });
  await waitFor(() => expect(result.current.data).toEqual({ id: "removed" }));
  expect(remove).toHaveBeenCalledWith("/items/removed", undefined);

  await act(() => result.current.reset());
  await waitFor(() => expect(result.current.data).toBeNull());
  expect(result.current.error).toBeNull();
});

test("DELETE normalizes failures and notifies only once", async () => {
  remove.mockRejectedValueOnce(new Error("database internals"));
  const { result } = await renderHook(() => useApiDelete("/items/missing"), {
    wrapper,
  });

  await act(async () => {
    await expect(result.current.execute()).rejects.toThrow(
      "Ocorreu um erro inesperado.",
    );
  });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(notifications.error).toHaveBeenCalledTimes(1);
  expect(notifications.error).toHaveBeenCalledWith(
    "Ocorreu um erro inesperado.",
  );
});
