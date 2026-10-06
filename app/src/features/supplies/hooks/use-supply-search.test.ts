import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { api } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";

import { useSupplySearch } from "./use-supply-search";

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

test("loads successive supply pages and passes TanStack's cancellation signal", async () => {
  get
    .mockResolvedValueOnce({ data: { data: [{ id: "a", name: "Arroz" }], total: 2, page: 1, pageSize: 20 } })
    .mockResolvedValueOnce({ data: { data: [{ id: "b", name: "Feijão" }], total: 2, page: 2, pageSize: 20 } });

  const { result } = await renderHook(() => useSupplySearch(""), { wrapper });
  await waitFor(() => expect(result.current.rows).toHaveLength(1));
  expect(get.mock.calls[0][1]).toEqual(expect.objectContaining({
    params: { page: 1, pageSize: 20 },
    signal: expect.any(Object),
  }));

  await act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.rows).toHaveLength(2));
  expect(get.mock.calls[1][1]?.params).toEqual({ page: 2, pageSize: 20 });
  expect(result.current.hasMore).toBe(false);
});

test("debounces text and combines it with the unit filter", async () => {
  get.mockResolvedValue({ data: { data: [], total: 0, page: 1, pageSize: 20 } });
  const { rerender } = await renderHook(
    ({ text, unit }: { text: string; unit: "" | "KILOGRAM" }) => useSupplySearch(text, unit),
    { initialProps: { text: "", unit: "" }, wrapper },
  );
  await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
  await rerender({ text: "Arroz", unit: "KILOGRAM" });
  expect(get).toHaveBeenCalledTimes(1);
  await act(() => jest.advanceTimersByTime(300));
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  expect(get.mock.calls[1][1]?.params).toEqual({
    search: "Arroz", unit: "KILOGRAM", page: 1, pageSize: 20,
  });
});

test("disabled selector search waits until it is opened", async () => {
  get.mockResolvedValue({ data: { data: [], total: 0, page: 1, pageSize: 20 } });
  const { rerender } = await renderHook(
    ({ enabled }: { enabled: boolean }) => useSupplySearch("", "", enabled),
    { initialProps: { enabled: false }, wrapper },
  );
  expect(get).not.toHaveBeenCalled();
  await rerender({ enabled: true });
  await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
});
