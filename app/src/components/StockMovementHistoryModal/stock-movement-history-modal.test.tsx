import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { api } from "@/services/api/client";

import { StockMovementHistoryModal } from "./stock-movement-history-modal";

jest.mock("@/services/api/client", () => ({ api: { get: jest.fn() } }));

const get = jest.mocked(api.get);
const movement = {
  id: "movement-id",
  type: "IN" as const,
  quantity: 3,
  reason: "Doação recebida",
  basketDeliveryId: null,
  createdAt: "2026-10-01T12:00:00.000Z",
  supply: { id: "supply-id", name: "Arroz", unit: "KILOGRAM" as const },
  performedBy: { id: "user-id", name: "Ana Souza" },
};

function renderHistory(supplyId?: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { gcTime: 0 },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      SafeAreaProvider,
      {
        initialMetrics: {
          frame: { x: 0, y: 0, width: 360, height: 800 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      createElement(QueryClientProvider, { client }, children),
    );

  return render(
    <StockMovementHistoryModal
      visible
      onClose={jest.fn()}
      supplyId={supplyId}
    />,
    { wrapper },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  get.mockImplementation(async (_url, config) => {
    const params = config?.params as { page?: number } | undefined;
    const page = Number(params?.page ?? 1);
    return {
      data: {
        data: page === 1 ? [movement] : [],
        total: 1,
        page,
        pageSize: 20,
      },
    };
  });
});

test("shows movement quantity, reason, actor and date with optional supply filter", async () => {
  await renderHistory("supply-id");

  expect(await screen.findByText("Entrada · +3 kg")).toBeTruthy();
  expect(screen.getByText("Arroz · Por Ana Souza")).toBeTruthy();
  expect(screen.getByText("Motivo: Doação recebida")).toBeTruthy();
  expect(get).toHaveBeenCalledWith(
    "/stock-movements",
    expect.objectContaining({
      params: expect.objectContaining({ supplyId: "supply-id", page: 1 }),
      signal: expect.any(Object),
    }),
  );
});

test("applies the movement type filter", async () => {
  await renderHistory();
  await screen.findByText("Entrada · +3 kg");

  await fireEvent.press(screen.getByRole("radio", { name: "Saída" }));
  await fireEvent.press(screen.getByRole("button", { name: "Aplicar filtros" }));

  await waitFor(() =>
    expect(get).toHaveBeenLastCalledWith(
      "/stock-movements",
      expect.objectContaining({
        params: expect.objectContaining({ type: "OUT", page: 1 }),
      }),
    ),
  );
});
