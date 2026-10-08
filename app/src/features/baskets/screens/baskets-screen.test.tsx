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

import BasketsScreen from "./baskets-screen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), delete: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const mockGet = jest.mocked(api.get);
const mockDelete = jest.mocked(api.delete);
const basket = {
  id: "basket-1",
  name: "Cesta básica",
  description: "Itens essenciais",
  availableBasketCount: 3,
  supplies: [
    {
      id: "item-1",
      quantity: 2,
      deletedAt: null,
      supply: {
        id: "supply-1",
        name: "Arroz",
        description: null,
        unit: "KILOGRAM",
        currentQuantity: 20,
        deletedAt: null,
      },
    },
  ],
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  deletedAt: null,
};

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
  return render(<BasketsScreen />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation(async (url) => ({
    data:
      url === "/baskets"
        ? { data: [basket], total: 1, page: 1, pageSize: 20 }
        : basket,
  }));
  mockDelete.mockResolvedValue({ data: undefined });
});

test("opens basket details and soft-deletes only after confirmation", async () => {
  await renderScreen();
  await fireEvent.press(
    (await screen.findAllByRole("button", { name: "Abrir Cesta básica" }))[0],
  );
  expect(await screen.findByText("Composição · 1 mantimento")).toBeTruthy();
  expect(screen.getByText("Disponibilidade estimada")).toBeTruthy();
  expect(screen.getByText("3 cestas")).toBeTruthy();
  expect(screen.getByText("2 kg")).toBeTruthy();

  await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
  expect(await screen.findByText("Excluir cesta?")).toBeTruthy();
  expect(mockDelete).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(await screen.findByText("Detalhes da cesta")).toBeTruthy();

  await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
  await fireEvent.press(screen.getByRole("button", { name: "Excluir cesta" }));
  await waitFor(() =>
    expect(mockDelete).toHaveBeenCalledWith("/baskets/basket-1"),
  );
  await waitFor(() =>
    expect(screen.queryByText("Detalhes da cesta")).toBeNull(),
  );
});

test("navigates to create and deleted basket screens", async () => {
  await renderScreen();
  await screen.findAllByRole("button", { name: "Abrir Cesta básica" });
  await fireEvent.press(screen.getByRole("button", { name: "Nova cesta" }));
  expect(mockPush).toHaveBeenCalledWith("/baskets/new");
  await fireEvent.press(screen.getByRole("button", { name: "Ver excluídas" }));
  expect(mockPush).toHaveBeenCalledWith("/baskets/deleted");
});

test("opens the shared audit history filtered to baskets", async () => {
  await renderScreen();
  await screen.findAllByRole("button", { name: "Abrir Cesta básica" });
  await fireEvent.press(screen.getByRole("button", { name: "Ver histórico" }));
  expect(await screen.findByText("Histórico de cestas")).toBeTruthy();
  expect(mockGet).toHaveBeenCalledWith(
    "/audit-logs",
    expect.objectContaining({
      params: { entityType: "BASKET", page: 1, pageSize: 20 },
    }),
  );
});
