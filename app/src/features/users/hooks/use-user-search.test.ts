import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";

import { api } from "@/services/api/client";

import { useUserSearch } from "./use-user-search";

jest.mock("@/services/api/client", () => ({ api: { get: jest.fn() } }));

const mockGet = jest.mocked(api.get);

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "UsersQueryClientProvider";
  return Wrapper;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("loads paginated user rows and requests the next page", async () => {
  mockGet
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "user-1",
            name: "Ana",
            email: "ana@example.org",
            role: "COMMON",
            isActive: true,
          },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      },
    })
    .mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "user-2",
            name: "Bia",
            email: "bia@example.org",
            role: "COMMON",
            isActive: false,
          },
        ],
        total: 2,
        page: 2,
        pageSize: 20,
      },
    });

  const { result } = await renderHook(() => useUserSearch("", "", true), {
    wrapper: createWrapper(),
  });
  await waitFor(() => expect(result.current.rows).toHaveLength(1));
  expect(mockGet.mock.calls[0][1]?.params).toEqual({ page: 1, pageSize: 20 });

  await act(async () => result.current.loadMore());
  await waitFor(() => expect(result.current.rows).toHaveLength(2));
  expect(mockGet.mock.calls[1][1]?.params).toEqual({ page: 2, pageSize: 20 });
  expect(result.current.hasMore).toBe(false);
});

test("sends search and status filters and skips the request when disabled", async () => {
  mockGet.mockResolvedValue({
    data: { data: [], total: 0, page: 1, pageSize: 20 },
  });

  await renderHook(() => useUserSearch("ana", "INACTIVE", true), {
    wrapper: createWrapper(),
  });
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
  expect(mockGet.mock.calls[0][1]?.params).toEqual({
    search: "ana",
    status: "INACTIVE",
    page: 1,
    pageSize: 20,
  });

  await renderHook(() => useUserSearch("", "", false), {
    wrapper: createWrapper(),
  });
  expect(mockGet).toHaveBeenCalledTimes(1);
});
