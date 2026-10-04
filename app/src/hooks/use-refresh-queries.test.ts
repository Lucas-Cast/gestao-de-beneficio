import { act, renderHook } from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { queryClient } from "@/services/api/query-client";

import { useRefreshQueries } from "./use-refresh-queries";

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("refreshes active queries and clears its loading state", async () => {
  const invalidateQueries = jest
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
  const { result } = await renderHook(() => useRefreshQueries(), { wrapper });

  await act(async () => {
    await result.current.refresh();
  });

  expect(invalidateQueries).toHaveBeenCalledWith({ refetchType: "active" });
  expect(result.current.refreshing).toBe(false);
});

test("limits refresh to the supplied query-key prefix", async () => {
  const invalidateQueries = jest
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
  const { result } = await renderHook(
    () => useRefreshQueries(["selector-search"]),
    { wrapper },
  );

  await act(async () => {
    await result.current.refresh();
  });

  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ["selector-search"],
    refetchType: "active",
  });
});
