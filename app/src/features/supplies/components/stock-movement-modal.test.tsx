import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { api } from "@/services/api/client";
import { notifications } from "@/services/notifications";

import { StockMovementModal } from "./stock-movement-modal";

jest.mock("@/services/api/client", () => ({ api: { get: jest.fn(), post: jest.fn() } }));

const get = jest.mocked(api.get);
const post = jest.mocked(api.post);
const supply = {
  id: "7c1fa355-dced-424b-a1e4-df60f9d77051",
  name: "Arroz",
  description: null,
  unit: "KILOGRAM",
  currentQuantity: 12,
};

async function renderModal() {
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
  const onClose = jest.fn();
  const rendered = await render(<StockMovementModal visible onClose={onClose} />, { wrapper });
  return { onClose, ...rendered };
}

beforeEach(() => {
  jest.clearAllMocks();
  get.mockResolvedValue({ data: { data: [supply], total: 1, page: 1, pageSize: 20 } });
  post.mockResolvedValue({ data: {} });
});

test("invalid movement stays inline and a valid movement posts once", async () => {
  const { onClose } = await renderModal();
  await screen.findByRole("button", { name: "Selecionar Arroz" });

  await fireEvent.press(screen.getByRole("button", { name: "Registrar movimento" }));
  expect(await screen.findByText("Selecione um mantimento.")).toBeTruthy();
  expect(screen.getByText("Informe uma quantidade inteira maior que zero.")).toBeTruthy();
  expect(notifications.error).not.toHaveBeenCalled();
  expect(post).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole("button", { name: "Selecionar Arroz" }));
  await fireEvent.changeText(screen.getByLabelText("Quantidade"), "3");
  await fireEvent.press(screen.getByRole("radio", { name: "Saída" }));
  await fireEvent.press(screen.getByRole("button", { name: "Registrar movimento" }));

  await waitFor(() => expect(post).toHaveBeenCalledWith("/stock-movements", {
    supplyId: supply.id, type: "OUT", quantity: 3, reason: null,
  }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(post).toHaveBeenCalledTimes(1);
  expect(notifications.success).toHaveBeenCalledTimes(1);
});
