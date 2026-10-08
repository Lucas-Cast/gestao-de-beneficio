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

import BasketFormScreen from "./basket-form-screen";

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    canGoBack: () => true,
    back: mockBack,
    replace: mockReplace,
  }),
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = jest.mocked(api.get);
const mockPost = jest.mocked(api.post);
const supply = {
  id: "7c1fa355-dced-424b-a1e4-df60f9d77051",
  name: "Arroz",
  description: null,
  unit: "KILOGRAM",
  currentQuantity: 15,
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
  return render(<BasketFormScreen />, { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({
    data: { data: [supply], total: 1, page: 1, pageSize: 20 },
  });
  mockPost.mockResolvedValue({ data: { id: "basket-1" } });
});

test("creates a basket with selected supply and a positive whole quantity", async () => {
  await renderScreen();
  await fireEvent.changeText(screen.getByLabelText("Nome"), " Cesta básica ");
  await fireEvent.changeText(
    screen.getByLabelText("Descrição (opcional)"),
    "Itens essenciais",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Adicionar mantimento" }),
  );
  await fireEvent.press(
    await screen.findByRole("button", { name: /Arroz, kg/ }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Concluir seleção" }),
  );
  await fireEvent.changeText(
    screen.getByLabelText("Quantidade por cesta"),
    "2",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Cadastrar cesta" }),
  );

  await waitFor(() =>
    expect(mockPost).toHaveBeenCalledWith("/baskets", {
      name: "Cesta básica",
      description: "Itens essenciais",
      supplies: [
        { supplyId: "7c1fa355-dced-424b-a1e4-df60f9d77051", quantity: 2 },
      ],
    }),
  );
  expect(mockReplace).toHaveBeenCalledWith("/(app)/baskets");
});

test("keeps Zod field errors inline and does not submit an empty composition", async () => {
  await renderScreen();
  await fireEvent.press(
    screen.getByRole("button", { name: "Cadastrar cesta" }),
  );

  expect(await screen.findByText("Informe o nome da cesta.")).toBeTruthy();
  expect(screen.getByText("Adicione pelo menos um mantimento.")).toBeTruthy();
  expect(mockPost).not.toHaveBeenCalled();
});
