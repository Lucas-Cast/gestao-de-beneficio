import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { api } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";
import { notifications } from "@/services/notifications";

import { useBeneficiarySearch } from "./use-beneficiary-search";

jest.mock("@/services/api/client", () => ({ api: { get: jest.fn() } }));

const get = jest.mocked(api.get);
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
  jest.useFakeTimers();
});

afterEach(() => jest.useRealTimers());

test("lists beneficiaries and loads another page on request", async () => {
  get
    .mockResolvedValueOnce({
      data: {
        data: [{ id: "a", name: "Ana" }],
        total: 2,
        page: 1,
        pageSize: 20,
      },
    })
    .mockResolvedValueOnce({
      data: {
        data: [{ id: "b", name: "Bia" }],
        total: 2,
        page: 2,
        pageSize: 20,
      },
    });

  const { result } = await renderHook(() => useBeneficiarySearch(""), {
    wrapper,
  });

  await waitFor(() =>
    expect(result.current.rows).toEqual([{ id: "a", name: "Ana" }]),
  );
  expect(get.mock.calls[0][1]?.params).toEqual({ page: 1, pageSize: 20 });

  await act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.rows).toHaveLength(2));
  expect(get.mock.calls[1][1]?.params).toEqual({ page: 2, pageSize: 20 });
  expect(result.current.hasMore).toBe(false);
});

test("uses the deleted-beneficiaries endpoint for the deleted view", async () => {
  get.mockResolvedValueOnce({
    data: { data: [], total: 0, page: 1, pageSize: 20 },
  });

  await renderHook(() => useBeneficiarySearch("", true), { wrapper });

  await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
  expect(get.mock.calls[0][0]).toBe("/beneficiaries/deleted");
});

test("debounces name searches and sends an exact normalized CPF filter", async () => {
  get.mockResolvedValue({
    data: { data: [], total: 0, page: 1, pageSize: 20 },
  });
  const { rerender } = await renderHook(
    ({ text }: { text: string }) => useBeneficiarySearch(text),
    { initialProps: { text: "" }, wrapper },
  );

  await rerender({ text: "Ana Souza" });
  expect(get).toHaveBeenCalledTimes(1);
  await act(() => jest.advanceTimersByTime(300));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  expect(get.mock.calls[1][1]?.params).toEqual({
    search: "Ana Souza",
    page: 1,
    pageSize: 20,
  });

  await rerender({ text: "529.982.247-25" });
  await act(() => jest.advanceTimersByTime(300));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(3));
  expect(get.mock.calls[2][1]?.params).toEqual({
    cpf: "52998224725",
    page: 1,
    pageSize: 20,
  });
});

test("partial CPF stays inline and makes no request or error toast", async () => {
  const { result } = await renderHook(() => useBeneficiarySearch("529.982"), {
    wrapper,
  });

  expect(result.current.validationError).toBe("Complete os 11 dígitos do CPF.");
  expect(get).not.toHaveBeenCalled();
  expect(notifications.error).not.toHaveBeenCalled();
});

test("failed list reads notify once and can be retried", async () => {
  get
    .mockRejectedValueOnce(new Error("private database details"))
    .mockResolvedValueOnce({
      data: { data: [], total: 0, page: 1, pageSize: 20 },
    });

  const { result } = await renderHook(() => useBeneficiarySearch(""), {
    wrapper,
  });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(notifications.error).toHaveBeenCalledTimes(1);
  expect(notifications.error).toHaveBeenCalledWith(
    "Ocorreu um erro inesperado.",
  );

  await act(() => result.current.retry());
  await waitFor(() => expect(result.current.error).toBeNull());
  expect(notifications.error).toHaveBeenCalledTimes(1);
});
