import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Pressable as MockPressable, Text as MockText } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api } from "@/services/api/client";
import { queryClient } from "@/services/api/query-client";
import { notifications } from "@/services/notifications";
import DeliveryScreen from "./delivery-screen";
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
}));
jest.mock("@/services/api/client", () => ({ api: { post: jest.fn() } }));
jest.mock("../components/delivery-selectors", () => ({
  BeneficiarySelector: ({ visible, onSelect, onClose }: any) =>
    visible ? (
      <MockPressable
        accessibilityRole="button"
        onPress={() => {
          onSelect({
            id: "beneficiary",
            name: "Ana",
            cpf: "12345678909",
            address: { city: "Belém", neighborhood: "Centro" },
          });
          onClose();
        }}
      >
        <MockText>Escolher Ana</MockText>
      </MockPressable>
    ) : null,
  BasketSelector: ({ visible, onSelect, onClose }: any) =>
    visible ? (
      <MockPressable
        accessibilityRole="button"
        onPress={() => {
          onSelect({
            id: "basket",
            name: "Padrão",
            supplies: [
              {
                id: "item",
                quantity: 2,
                supply: { id: "supply", name: "Feijão", unit: "KILOGRAM" },
              },
            ],
          });
          onClose();
        }}
      >
        <MockText>Escolher padrão</MockText>
      </MockPressable>
    ) : null,
}));
const post = jest.mocked(api.post);
async function mount() {
  await render(
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <DeliveryScreen />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
}
async function select() {
  await fireEvent.press(screen.getByLabelText("Selecionar beneficiário"));
  await fireEvent.press(screen.getByText("Escolher Ana"));
  await fireEvent.press(screen.getByLabelText("Selecionar cesta"));
  await fireEvent.press(screen.getByText("Escolher padrão"));
}
beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
});
test("invalid submit stays inline, never requests or toasts", async () => {
  await mount();
  await fireEvent.press(screen.getByText("Revisar entrega"));
  expect(await screen.findByText("Selecione um beneficiário.")).toBeTruthy();
  expect(screen.getByText("Selecione uma cesta.")).toBeTruthy();
  expect(post).not.toHaveBeenCalled();
  expect(notifications.error).not.toHaveBeenCalled();
});
test("review does not send, editing preserves values, confirmation sends exactly one correct POST", async () => {
  let resolve!: (value: unknown) => void;
  post.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await mount();
  await select();
  await fireEvent.changeText(
    screen.getByLabelText("Quantidade de cestas"),
    "2",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Observação (opcional)"),
    "  Teste  ",
  );
  await fireEvent.press(screen.getByText("Revisar entrega"));
  expect(
    await screen.findByText("Esta entrega dará baixa no estoque."),
  ).toBeTruthy();
  expect(post).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText("Voltar e editar"));
  expect(screen.getByLabelText("Quantidade de cestas").props.value).toBe("2");
  expect(screen.getByLabelText("Observação (opcional)").props.value).toBe(
    "  Teste  ",
  );
  await fireEvent.press(screen.getByText("Revisar entrega"));
  await fireEvent.press(screen.getByText("Confirmar entrega"));
  expect(post).toHaveBeenCalledTimes(1);
  expect(post.mock.calls[0][1]).toEqual({
    beneficiaryId: "beneficiary",
    basketId: "basket",
    quantity: 2,
    observation: "Teste",
  });
  expect(screen.queryByText("Confirmar entrega")).toBeNull();
  expect(notifications.success).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText("Registrando..."));
  expect(post).toHaveBeenCalledTimes(1);
  await act(() =>
    resolve({
      data: {
        id: "delivery",
        quantity: 2,
        observation: "Teste",
        createdAt: "2026-10-03T12:00:00Z",
      },
    }),
  );
  expect(await screen.findByText("Resumo da entrega")).toBeTruthy();
  expect(notifications.success).toHaveBeenCalledTimes(1);
});
test("failure preserves selections and quantity; uncertain outcome emits only one safe toast", async () => {
  post.mockRejectedValue(new Error("transport internals"));
  await mount();
  await select();
  await fireEvent.changeText(
    screen.getByLabelText("Quantidade de cestas"),
    "3",
  );
  await fireEvent.press(screen.getByText("Revisar entrega"));
  await fireEvent.press(screen.getByText("Confirmar entrega"));
  await waitFor(() => expect(notifications.error).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText("Quantidade de cestas").props.value).toBe("3");
  expect(screen.getByText("Ana")).toBeTruthy();
  expect(notifications.error).toHaveBeenCalledWith(
    expect.stringContaining("Verifique se a entrega foi registrada"),
  );
  expect(post).toHaveBeenCalledTimes(1);
});
