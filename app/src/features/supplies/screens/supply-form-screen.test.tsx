import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { api } from "@/services/api/client";
import { notifications } from "@/services/notifications";

import SupplyFormScreen from "./supply-form-screen";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ canGoBack: () => true, back: mockBack, replace: jest.fn() }),
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const get = jest.mocked(api.get);
const post = jest.mocked(api.post);
const patch = jest.mocked(api.patch);
const supply = {
  id: "7c1fa355-dced-424b-a1e4-df60f9d77051",
  name: "Arroz",
  description: "Arroz branco",
  unit: "KILOGRAM",
  currentQuantity: 12,
};

function renderScreen(id?: string) {
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
  return render(<SupplyFormScreen supplyId={id} />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  get.mockResolvedValue({ data: supply });
  post.mockResolvedValue({ data: supply });
  patch.mockResolvedValue({ data: supply });
});

test("create keeps field validation inline and submits normalized catalog data", async () => {
  await renderScreen();
  await fireEvent.press(screen.getByRole("button", { name: "Salvar mantimento" }));
  expect(screen.getByText("Informe o nome do mantimento.")).toBeTruthy();
  expect(screen.getByText("Selecione uma unidade de medida válida.")).toBeTruthy();
  expect(post).not.toHaveBeenCalled();
  expect(notifications.error).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByLabelText("Nome"), "  Arroz  ");
  await fireEvent.changeText(screen.getByLabelText("Descrição (opcional)"), "  Arroz branco  ");
  await fireEvent.changeText(screen.getByLabelText("Saldo inicial (opcional)"), "12");
  await fireEvent.press(screen.getByRole("button", { name: "Unidade de medida" }));
  await fireEvent.press(screen.getByRole("radio", { name: "Quilograma (kg)" }));
  await fireEvent.press(screen.getByRole("button", { name: "Salvar mantimento" }));

  await waitFor(() => expect(post).toHaveBeenCalledWith("/supplies", {
    name: "Arroz", description: "Arroz branco", unit: "KILOGRAM", currentQuantity: 12,
  }));
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  expect(notifications.success).toHaveBeenCalledTimes(1);
});

test("editing omits opening stock and preserves the loaded catalog fields", async () => {
  await renderScreen(supply.id);
  await screen.findByDisplayValue("Arroz");
  expect(screen.queryByLabelText("Saldo inicial (opcional)")).toBeNull();
  await fireEvent.changeText(screen.getByLabelText("Nome"), "Arroz integral");
  await fireEvent.press(screen.getByRole("button", { name: "Salvar alterações" }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith(`/supplies/${supply.id}`, {
    name: "Arroz integral", description: "Arroz branco", unit: "KILOGRAM",
  }));
});
