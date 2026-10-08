import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { api } from "@/services/api/client";

import DeletedBasketsScreen from "./deleted-baskets-screen";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), patch: jest.fn() },
}));

const mockGet = jest.mocked(api.get);
const mockPatch = jest.mocked(api.patch);
const deletedBasket = {
  id: "basket-deleted",
  name: "Cesta antiga",
  description: null,
  availableBasketCount: 0,
  supplies: [
    {
      id: "item-deleted",
      quantity: 2,
      deletedAt: "2026-10-01T00:00:00.000Z",
      supply: {
        id: "supply-active",
        name: "Feijão",
        description: null,
        unit: "KILOGRAM",
        currentQuantity: 10,
        deletedAt: null,
      },
    },
  ],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  deletedAt: "2026-10-01T00:00:00.000Z",
};
let showBasket = true;

function renderScreen() {
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
  return render(<DeletedBasketsScreen />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  showBasket = true;
  mockGet.mockImplementation(async () => ({
    data: {
      data: showBasket ? [deletedBasket] : [],
      total: showBasket ? 1 : 0,
      page: 1,
      pageSize: 20,
    },
  }));
  mockPatch.mockImplementation(async () => {
    showBasket = false;
    return { data: deletedBasket };
  });
});

test("requires confirmation and restores the selected basket", async () => {
  await renderScreen();
  expect(await screen.findByText("Cesta antiga")).toBeTruthy();
  expect(screen.getByText(/Excluída em:.*01\/10\/2026/)).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Restaurar" }));
  expect(await screen.findByText("Restaurar cesta?")).toBeTruthy();
  expect(mockPatch).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByText("Restaurar cesta?")).toBeNull();

  await fireEvent.press(screen.getByRole("button", { name: "Restaurar" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Restaurar cesta" }),
  );
  await waitFor(() =>
    expect(mockPatch).toHaveBeenCalledWith("/baskets/basket-deleted/restore"),
  );
  expect(
    await screen.findByText("Nenhuma cesta excluída encontrada."),
  ).toBeTruthy();
});

test("blocks restore and explains when a basket references a deleted supply", async () => {
  mockGet.mockResolvedValue({
    data: {
      data: [
        {
          ...deletedBasket,
          supplies: deletedBasket.supplies.map((item) => ({
            ...item,
            supply: { ...item.supply, deletedAt: "2026-09-20T00:00:00.000Z" },
          })),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    },
  });
  await renderScreen();
  await screen.findByText("Cesta antiga");
  await fireEvent.press(screen.getByRole("button", { name: "Restaurar" }));
  expect(
    await screen.findByText(
      "Esta cesta contém mantimentos excluídos e não pode ser restaurada.",
    ),
  ).toBeTruthy();
  expect(
    screen.getByText("Cesta não pode ser restaurada"),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Restaurar cesta" }).props
      .accessibilityState.disabled,
  ).toBe(true);
  expect(mockPatch).not.toHaveBeenCalled();
});

test("returns to the active baskets tab", async () => {
  await renderScreen();
  await screen.findByText("Cesta antiga");
  await fireEvent.press(
    screen.getByRole("button", { name: "Voltar às cestas" }),
  );
  expect(mockReplace).toHaveBeenCalledWith("/(app)/baskets");
});
