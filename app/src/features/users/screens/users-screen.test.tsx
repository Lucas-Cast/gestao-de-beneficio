import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useUser } from "@/context/user-context";
import { api } from "@/services/api/client";

import UsersScreen from "./users-screen";

jest.mock("expo-router", () => ({
  Redirect: () => null,
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/context/user-context", () => ({ useUser: jest.fn() }));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockGet = jest.mocked(api.get);
const mockPatch = jest.mocked(api.patch);
const mockDelete = jest.mocked(api.delete);

const accounts = [
  {
    id: "admin-id",
    name: "Lucas Admin",
    email: "admin@example.org",
    role: "ADMIN" as const,
    isActive: true,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "inactive-id",
    name: "Ana Souza",
    email: "ana@example.org",
    role: "COMMON" as const,
    isActive: false,
    createdAt: "2026-10-02T10:00:00.000Z",
    updatedAt: "2026-10-02T10:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "active-id",
    name: "Rafael Costa",
    email: "rafael@example.org",
    role: "COMMON" as const,
    isActive: true,
    createdAt: "2026-10-03T10:00:00.000Z",
    updatedAt: "2026-10-03T10:00:00.000Z",
    deletedAt: null,
  },
];

async function renderScreen(role: "ADMIN" | "COMMON" = "ADMIN") {
  jest.mocked(useUser).mockReturnValue({
    user: { name: "Lucas Admin", email: "admin@example.org", role },
    isLoading: false,
    isAuthenticated: true,
    setUser: jest.fn(),
    logout: jest.fn(),
  });
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
  return render(<UsersScreen />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({
    data: { data: accounts, total: accounts.length, page: 1, pageSize: 20 },
  });
  mockPatch.mockResolvedValue({ data: accounts[1] });
  mockDelete.mockResolvedValue({ data: undefined });
});

test("administrators can see users and the current account has no destructive action", async () => {
  await renderScreen();

  expect(await screen.findByText("Usuários")).toBeTruthy();
  expect(await screen.findAllByText("Ana Souza")).not.toHaveLength(0);
  expect(screen.getAllByText("Desativado").length).toBeGreaterThan(0);
  expect(
    screen.queryByRole("button", { name: "Excluir Lucas Admin" }),
  ).toBeNull();
  expect(mockGet).toHaveBeenCalledWith(
    "/users",
    expect.objectContaining({
      params: { page: 1, pageSize: 20 },
    }),
  );
});

test("activates an inactive account immediately", async () => {
  await renderScreen();
  await screen.findAllByText("Ana Souza");

  await fireEvent.press(
    screen.getAllByRole("button", { name: "Ativar Ana Souza" })[0],
  );

  await waitFor(() =>
    expect(mockPatch).toHaveBeenCalledWith("/users/inactive-id/status", {
      isActive: true,
    }),
  );
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
});

test("asks for confirmation before deactivating an active account", async () => {
  await renderScreen();
  await screen.findAllByText("Rafael Costa");

  await fireEvent.press(
    screen.getAllByRole("button", { name: "Desativar Rafael Costa" })[0],
  );
  expect(await screen.findByText("Desativar usuário?")).toBeTruthy();
  expect(mockPatch).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole("button", { name: "Desativar" }));
  await waitFor(() =>
    expect(mockPatch).toHaveBeenCalledWith("/users/active-id/status", {
      isActive: false,
    }),
  );
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
});

test("asks for confirmation before soft-deleting an account", async () => {
  await renderScreen();
  await screen.findAllByText("Ana Souza");

  await fireEvent.press(
    screen.getAllByRole("button", { name: "Excluir Ana Souza" })[0],
  );
  expect(await screen.findByText("Excluir usuário?")).toBeTruthy();
  expect(mockDelete).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByText("Excluir usuário?")).toBeNull();

  await fireEvent.press(
    screen.getAllByRole("button", { name: "Excluir Ana Souza" })[0],
  );
  await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
  await waitFor(() =>
    expect(mockDelete).toHaveBeenCalledWith("/users/inactive-id"),
  );
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
});

test("does not render user management for common users", async () => {
  await renderScreen("COMMON");
  expect(screen.queryByText("Usuários")).toBeNull();
  expect(mockGet).not.toHaveBeenCalled();
});
