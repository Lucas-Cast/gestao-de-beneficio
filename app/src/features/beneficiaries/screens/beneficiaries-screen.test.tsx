import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { api } from "@/services/api/client";

import BeneficiariesScreen from "./beneficiaries-screen";

const mockPush = jest.fn();
let mockFocus: (() => void) | undefined;

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    mockFocus = callback;
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/services/api/client", () => ({
  api: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = jest.mocked(api.get);
const mockDelete = jest.mocked(api.delete);
const beneficiary = {
  id: "beneficiary-1",
  name: "Ana Souza",
  birthDate: "1990-01-01T00:00:00.000Z",
  sex: "F" as const,
  phone: "91987654321",
  cpf: "52998224725",
  address: {
    id: "address-1",
    street: "Rua das Flores",
    number: "15",
    complement: null,
    neighborhood: "Centro",
    city: "Belém",
    state: "PA",
    postalCode: "66000000",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
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
  return render(<BeneficiariesScreen />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFocus = undefined;
  mockGet.mockImplementation(async (url) => ({
    data:
      url === "/beneficiaries"
        ? { data: [beneficiary], total: 1, page: 1, pageSize: 20 }
        : url === "/audit-logs"
          ? { data: [], total: 0, page: 1, pageSize: 20 }
          : beneficiary,
  }));
  mockDelete.mockResolvedValue({ data: undefined });
});

test("opens beneficiary details and navigates to edit", async () => {
  await renderScreen();

  await screen.findAllByText("Ana Souza");
  await fireEvent.press(
    screen.getAllByRole("button", { name: /Abrir Ana Souza/ })[0],
  );

  expect(await screen.findByText("Dados pessoais")).toBeTruthy();
  expect(screen.getByText("Rua das Flores")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Editar" }));

  expect(mockPush).toHaveBeenCalledWith({
    pathname: "/beneficiaries/[id]/edit",
    params: { id: "beneficiary-1" },
  });
  expect(screen.queryByText("Dados pessoais")).toBeNull();
});

test("asks for confirmation before soft-deleting and keeps the modal on cancel", async () => {
  await renderScreen();

  await screen.findAllByText("Ana Souza");
  await fireEvent.press(
    screen.getAllByRole("button", { name: /Abrir Ana Souza/ })[0],
  );
  await fireEvent.press(await screen.findByRole("button", { name: "Excluir" }));

  expect(await screen.findByText("Excluir beneficiário?")).toBeTruthy();
  expect(mockDelete).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(await screen.findByText("Dados pessoais")).toBeTruthy();

  await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
  await fireEvent.press(await screen.findByRole("button", { name: "Excluir" }));

  await waitFor(() =>
    expect(mockDelete).toHaveBeenCalledWith("/beneficiaries/beneficiary-1"),
  );
  await waitFor(() => expect(screen.queryByText("Dados pessoais")).toBeNull());
});

test("new beneficiary action opens the create route", async () => {
  await renderScreen();
  await screen.findAllByText("Ana Souza");
  await fireEvent.press(
    screen.getByRole("button", { name: "Novo beneficiário" }),
  );
  expect(mockPush).toHaveBeenCalledWith("/beneficiaries/new");
});

test("opens the deleted-beneficiaries screen", async () => {
  await renderScreen();
  await screen.findAllByText("Ana Souza");
  await fireEvent.press(screen.getByRole("button", { name: "Ver excluídos" }));
  expect(mockPush).toHaveBeenCalledWith("/beneficiaries/deleted");
});

test("opens the shared beneficiary audit modal", async () => {
  await renderScreen();
  await screen.findAllByText("Ana Souza");
  await fireEvent.press(screen.getByRole("button", { name: "Ver histórico" }));
  expect(await screen.findByText("Histórico de beneficiários")).toBeTruthy();
  expect(mockGet).toHaveBeenCalledWith(
    "/audit-logs",
    expect.objectContaining({
      params: { entityType: "BENEFICIARY", page: 1, pageSize: 20 },
    }),
  );
});

test("refreshes the active list when the screen regains focus", async () => {
  await renderScreen();
  await screen.findAllByText("Ana Souza");
  expect(mockGet).toHaveBeenCalledTimes(1);

  await act(() => mockFocus?.());

  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  expect(mockGet.mock.calls[1][0]).toBe("/beneficiaries");
});

test("pulling down reloads changes made on another device", async () => {
  await renderScreen();
  await screen.findAllByText("Ana Souza");

  mockGet.mockResolvedValue({
    data: { data: [], total: 0, page: 1, pageSize: 20 },
  });

  await act(() =>
    screen
      .getByTestId("screen-scroll-view")
      .props.refreshControl.props.onRefresh(),
  );

  expect(
    await screen.findByText("Nenhum beneficiário encontrado."),
  ).toBeTruthy();
  expect(mockGet).toHaveBeenCalledTimes(2);
});
