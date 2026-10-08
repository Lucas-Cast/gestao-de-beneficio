import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";

import { API_ROUTES } from "@/constants/routes";
import { api } from "@/services/api/client";

import { useHomeOverview } from "./use-home-overview";

jest.mock("@/services/api/client", () => ({ api: { get: jest.fn() } }));

const mockGet = jest.mocked(api.get);
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } },
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  mockGet.mockImplementation(async (url) => {
    if (url === API_ROUTES.basketDeliveries.stats) {
      return {
        data: {
          basketsDeliveredToday: 12,
          beneficiariesAttendedToday: 10,
          basketsDeliveredThisMonth: 148,
        },
      };
    }

    return {
      data: {
        data: [
          {
            id: "delivery-1",
            quantity: 2,
            createdAt: "2026-10-08T13:45:00.000Z",
            beneficiary: { name: "Ana Souza" },
            basket: { name: "Cesta padrão" },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 3,
      },
    };
  });
});

test("loads real home stats and the latest deliveries from the API", async () => {
  const { result } = await renderHook(() => useHomeOverview(), { wrapper });

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.indicators.map((item) => item.value)).toEqual([
    12, 10, 148,
  ]);
  expect(result.current.recent).toMatchObject([
    {
      id: "delivery-1",
      beneficiary: { name: "Ana Souza" },
      basket: { name: "Cesta padrão" },
    },
  ]);
  expect(mockGet).toHaveBeenCalledWith(
    API_ROUTES.basketDeliveries.stats,
    expect.objectContaining({
      params: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      signal: expect.anything(),
    }),
  );
  expect(mockGet).toHaveBeenCalledWith(
    API_ROUTES.basketDeliveries.collection,
    expect.objectContaining({
      params: { page: 1, pageSize: 3 },
      signal: expect.anything(),
    }),
  );
});
