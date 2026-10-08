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

import DeliveriesScreen from "./deliveries-screen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: mockPush },
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/services/api/client", () => ({ api: { get: jest.fn() } }));

const mockGet = jest.mocked(api.get);

function makeDelivery(id: string, beneficiaryName: string, supplyName: string) {
  return {
    id,
    quantity: 2,
    observation: "Entrega prioritária.",
    createdAt: "2026-10-07T15:30:00.000Z",
    beneficiary: {
      id: `beneficiary-${id}`,
      name: beneficiaryName,
      cpf: "12345678901",
    },
    basket: {
      id: `basket-${id}`,
      name: "Cesta básica",
      description: null,
      deletedAt: null,
    },
    deliveredBy: {
      id: "operator-1",
      name: "Lucas",
      email: "lucas@test.invalid",
    },
    stockMovements: [
      {
        id: `movement-${id}`,
        type: "OUT" as const,
        quantity: 4,
        reason: "Entrega de cesta.",
        supply: { id: `supply-${id}`, name: supplyName, unit: "KILOGRAM" },
        performedBy: { id: "operator-1", name: "Lucas" },
      },
    ],
  };
}

const firstDelivery = makeDelivery("delivery-1", "Ana Souza", "Feijão");
const secondDelivery = makeDelivery("delivery-2", "João Lima", "Arroz");

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
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      createElement(QueryClientProvider, { client }, children),
    );
  return render(<DeliveriesScreen />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation(async (_url, config) => {
    const page = Number(config?.params?.page ?? 1);
    return {
      data: {
        data: page === 1 ? [firstDelivery] : [secondDelivery],
        total: 2,
        page,
        pageSize: 20,
      },
    };
  });
});

test("shows delivery history and loads additional pages", async () => {
  await renderScreen();

  expect(await screen.findByText("Ana Souza")).toBeTruthy();
  expect(screen.getByText("Feijão")).toBeTruthy();
  expect(screen.getByText("4 kg")).toBeTruthy();
  expect(screen.getByText("Entrega prioritária.")).toBeTruthy();
  expect(mockGet).toHaveBeenCalledWith(
    "/basket-deliveries",
    expect.objectContaining({
      params: { page: 1, pageSize: 20 },
      signal: expect.anything(),
    }),
  );

  await fireEvent.press(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findByText("João Lima")).toBeTruthy();
  await waitFor(() =>
    expect(mockGet).toHaveBeenCalledWith(
      "/basket-deliveries",
      expect.objectContaining({
        params: { page: 2, pageSize: 20 },
        signal: expect.anything(),
      }),
    ),
  );
});

test("register action navigates to the delivery form", async () => {
  await renderScreen();
  await fireEvent.press(
    screen.getByRole("button", { name: "Registrar entrega" }),
  );
  expect(mockPush).toHaveBeenCalledWith("/deliveries/new");
});
