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

import DeletedBeneficiariesScreen from "./deleted-beneficiaries-screen";

const mockReplace = jest.fn();
let mockFocus: (() => void) | undefined;

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    mockFocus = callback;
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), patch: jest.fn() },
}));

const mockGet = jest.mocked(api.get);
const mockPatch = jest.mocked(api.patch);
const deletedBeneficiary = {
  id: "beneficiary-deleted",
  name: "Ana Souza",
  birthDate: "1990-01-01",
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
  updatedAt: "2026-09-20T00:00:00.000Z",
  deletedAt: "2026-09-20T00:00:00.000Z",
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
  return render(<DeletedBeneficiariesScreen />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFocus = undefined;
  mockGet.mockResolvedValue({
    data: {
      data: [deletedBeneficiary],
      total: 1,
      page: 1,
      pageSize: 20,
    },
  });
  mockPatch.mockResolvedValue({ data: undefined });
});

test("shows deleted beneficiaries and restores the selected record", async () => {
  mockGet.mockResolvedValue({
    data: { data: [], total: 0, page: 1, pageSize: 20 },
  });
  mockGet.mockResolvedValueOnce({
    data: { data: [deletedBeneficiary], total: 1, page: 1, pageSize: 20 },
  });
  await renderScreen();

  expect(await screen.findByText("Ana Souza")).toBeTruthy();
  expect(screen.getByText("Excluído em: 20/09/2026")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Restaurar" }));

  await waitFor(() =>
    expect(mockPatch).toHaveBeenCalledWith(
      "/beneficiaries/beneficiary-deleted/restore",
    ),
  );
  expect(
    await screen.findByText("Nenhum beneficiário excluído encontrado."),
  ).toBeTruthy();
  expect(mockGet.mock.calls[0][0]).toBe("/beneficiaries/deleted");
});

test("returns to the active beneficiaries screen", async () => {
  await renderScreen();
  await screen.findByText("Ana Souza");
  await fireEvent.press(
    screen.getByRole("button", { name: "Voltar aos beneficiários" }),
  );
  expect(mockReplace).toHaveBeenCalledWith("/(app)/beneficiaries");
});

test("refreshes deleted beneficiaries when the screen regains focus", async () => {
  await renderScreen();
  await screen.findByText("Ana Souza");
  expect(mockGet).toHaveBeenCalledTimes(1);

  await act(() => mockFocus?.());

  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  expect(mockGet.mock.calls[1][0]).toBe("/beneficiaries/deleted");
});

test("pulling down reloads the deleted list", async () => {
  await renderScreen();
  await screen.findByText("Ana Souza");

  mockGet.mockResolvedValue({
    data: { data: [], total: 0, page: 1, pageSize: 20 },
  });

  await act(() =>
    screen.getByTestId("screen-scroll-view").props.refreshControl.props.onRefresh(),
  );

  expect(
    await screen.findByText("Nenhum beneficiário excluído encontrado."),
  ).toBeTruthy();
  expect(mockGet).toHaveBeenCalledTimes(2);
});
