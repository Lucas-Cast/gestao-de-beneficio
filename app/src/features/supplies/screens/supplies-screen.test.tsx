import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { api } from "@/services/api/client";

import SuppliesScreen from "./supplies-screen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), delete: jest.fn() },
}));

const get = jest.mocked(api.get);
const remove = jest.mocked(api.delete);
const supply = {
  id: "7c1fa355-dced-424b-a1e4-df60f9d77051",
  name: "Arroz",
  description: "Arroz branco",
  unit: "KILOGRAM" as const,
  currentQuantity: 12,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
};

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
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
  return render(<SuppliesScreen />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  get.mockImplementation(async (url) => {
    if (url === "/stock-movements") {
      return {
        data: {
          data: [
            {
              id: "movement-id",
              type: "IN",
              quantity: 3,
              reason: null,
              basketDeliveryId: null,
              createdAt: "2026-10-01T12:00:00.000Z",
              supply: { id: supply.id, name: supply.name, unit: supply.unit },
              performedBy: { id: "user-id", name: "Ana Souza" },
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        },
      };
    }
    return {
      data: url === "/supplies"
        ? { data: [supply], total: 1, page: 1, pageSize: 20 }
        : supply,
    };
  });
  remove.mockResolvedValue({ data: undefined });
});

test("opens details from a plain row and navigates to catalog edit", async () => {
  await renderScreen();
  await screen.findAllByText("Arroz");
  expect(screen.queryByText("Ações")).toBeNull();

  await fireEvent.press(screen.getAllByRole("button", { name: "Abrir Arroz" })[0]);
  expect(await screen.findByRole("button", { name: "Editar" })).toBeTruthy();
  expect(screen.getAllByText("Arroz branco").length).toBeGreaterThan(1);
  expect(screen.getAllByText("12 kg").length).toBeGreaterThan(1);
  await fireEvent.press(screen.getByRole("button", { name: "Editar" }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: "/supplies/[id]/edit",
    params: { id: supply.id },
  });
});

test("requires confirmation before soft-deleting", async () => {
  await renderScreen();
  await screen.findAllByText("Arroz");
  await fireEvent.press(screen.getAllByRole("button", { name: "Abrir Arroz" })[0]);
  await fireEvent.press(await screen.findByRole("button", { name: "Excluir" }));
  expect(await screen.findByText("Excluir mantimento?")).toBeTruthy();
  expect(remove).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.getByText("Detalhes do mantimento")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
  await fireEvent.press(screen.getByRole("button", { name: "Excluir mantimento" }));
  await waitFor(() => expect(remove).toHaveBeenCalledWith(`/supplies/${supply.id}`));
});

test("unit filter is sent to the supplies endpoint", async () => {
  await renderScreen();
  await screen.findAllByText("Arroz");
  await fireEvent.press(screen.getByRole("button", { name: "Unidade de medida" }));
  await fireEvent.press(screen.getByRole("radio", { name: "Quilograma (kg)" }));
  await waitFor(() => expect(get).toHaveBeenCalledWith(
    "/supplies",
    expect.objectContaining({ params: expect.objectContaining({ unit: "KILOGRAM" }) }),
  ));
});

test("opens movement history filtered to the selected supply", async () => {
  await renderScreen();
  await screen.findAllByText("Arroz");
  await fireEvent.press(screen.getAllByRole("button", { name: "Abrir Arroz" })[0]);
  await fireEvent.press(await screen.findByRole("button", { name: "Movimentações" }));

  expect(await screen.findByText("Entrada · +3 kg")).toBeTruthy();
  expect(get).toHaveBeenCalledWith(
    "/stock-movements",
    expect.objectContaining({
      params: expect.objectContaining({ supplyId: supply.id }),
    }),
  );
});

test("shows loading and empty states while fetching the catalog", async () => {
  let resolveRequest!: (value: { data: unknown }) => void;
  get.mockImplementationOnce(() => new Promise((resolve) => {
    resolveRequest = resolve as typeof resolveRequest;
  }));

  await renderScreen();
  expect(screen.getByLabelText("Carregando mantimentos")).toBeTruthy();

  resolveRequest({ data: { data: [], total: 0, page: 1, pageSize: 20 } });
  expect(await screen.findByText("Nenhum mantimento encontrado.")).toBeTruthy();
});

test("offers a retry after the catalog request fails", async () => {
  get.mockRejectedValueOnce(new Error("Falha na consulta"));

  await renderScreen();
  expect(await screen.findByText("Não foi possível carregar os mantimentos.")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

  expect(await screen.findAllByText("Arroz")).toBeTruthy();
});
