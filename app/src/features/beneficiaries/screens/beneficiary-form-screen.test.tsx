import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createElement, type ReactNode } from "react";

import { api } from "@/services/api/client";
import { notifications } from "@/services/notifications";

import BeneficiaryFormScreen from "./beneficiary-form-screen";

jest.mock("expo-router", () => ({
  useRouter: () => ({ canGoBack: () => true, back: jest.fn() }),
}));
jest.mock("@/services/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = jest.mocked(api.get);
const mockPost = jest.mocked(api.post);
const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;
const existingBeneficiary = {
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

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = mockFetch;
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ erro: true }),
  });
  mockGet.mockResolvedValue({ data: existingBeneficiary });
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

function renderFormScreen(beneficiaryId?: string) {
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

  return render(<BeneficiaryFormScreen beneficiaryId={beneficiaryId} />, {
    wrapper,
  });
}

test("keeps business fields editable and changes birth date through the calendar", async () => {
  await renderFormScreen("beneficiary-1");

  const cpf = await screen.findByLabelText("CPF");
  expect(cpf.props.editable).toBe(true);
  await fireEvent.changeText(cpf, "111.444.777-35");
  expect(screen.getByLabelText("CPF").props.value).toBe("111.444.777-35");

  await fireEvent.press(
    screen.getByRole("button", { name: "Data de nascimento" }),
  );
  await fireEvent.press(await screen.findByLabelText("Selecionar 02/01/1990"));
  expect(screen.getByDisplayValue("02/01/1990")).toBeTruthy();

  for (const label of [
    "Nome completo",
    "Telefone",
    "Rua",
    "Número",
    "Complemento (opcional)",
    "Bairro",
    "Cidade",
    "Estado (UF)",
    "CEP",
  ]) {
    expect(screen.getByLabelText(label).props.editable).toBe(true);
  }
  expect(
    screen
      .getAllByLabelText(
        /^(CEP|Rua|Número|Complemento \(opcional\)|Bairro|Cidade|Estado \(UF\))$/,
      )
      .map((field) => field.props.accessibilityLabel),
  ).toEqual([
    "CEP",
    "Rua",
    "Número",
    "Complemento (opcional)",
    "Bairro",
    "Cidade",
    "Estado (UF)",
  ]);
  expect(screen.getByRole("radio", { name: "Feminino" }).props.disabled).not.toBe(
    true,
  );
});

test("looks up the prefilled CEP when editing a beneficiary", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      cep: "66000-000",
      logradouro: "Avenida Presidente Vargas",
      bairro: "Campina",
      localidade: "Belém",
      uf: "PA",
    }),
  });
  await renderFormScreen("beneficiary-1");

  await waitFor(() =>
    expect(screen.getByLabelText("Rua").props.value).toBe(
      "Avenida Presidente Vargas",
    ),
  );
  expect(screen.getByLabelText("CEP").props.value).toBe("66000-000");
  for (const label of ["Rua", "Bairro", "Cidade", "Estado (UF)"])
    expect(screen.getByLabelText(label).props.editable).toBe(false);
  expect(mockFetch).toHaveBeenCalledWith(
    "https://viacep.com.br/ws/66000000/json/",
    expect.anything(),
  );
});

test("fills and locks address fields returned by ViaCEP", async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      cep: "66000-000",
      logradouro: "Avenida Presidente Vargas",
      complemento: "Edifício exemplo",
      bairro: "Campina",
      localidade: "Belém",
      uf: "PA",
    }),
  });
  await renderFormScreen();

  await fireEvent.changeText(screen.getByLabelText("CEP"), "66000000");

  await waitFor(() =>
    expect(screen.getByLabelText("Rua").props.value).toBe(
      "Avenida Presidente Vargas",
    ),
  );
  for (const label of ["Rua", "Bairro", "Cidade", "Estado (UF)"])
    expect(screen.getByLabelText(label).props.editable).toBe(false);
  for (const label of ["Número", "Complemento (opcional)"])
    expect(screen.getByLabelText(label).props.editable).toBe(true);
  expect(screen.getByLabelText("Complemento (opcional)").props.value).toBe("");
  expect(screen.getByDisplayValue("Belém")).toBeTruthy();
  expect(mockFetch).toHaveBeenCalledWith(
    "https://viacep.com.br/ws/66000000/json/",
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
});

test("keeps address fields editable when ViaCEP does not find the postal code", async () => {
  await renderFormScreen();

  await fireEvent.changeText(screen.getByLabelText("CEP"), "99999999");

  await waitFor(() =>
    expect(notifications.error).toHaveBeenCalledWith(
      "CEP não encontrado. Preencha os dados do endereço manualmente.",
    ),
  );
  for (const label of [
    "Rua",
    "Complemento (opcional)",
    "Bairro",
    "Cidade",
    "Estado (UF)",
  ]) {
    expect(screen.getByLabelText(label).props.editable).toBe(true);
    expect(screen.getByLabelText(label).props.value).toBe("");
  }
  expect(screen.getByLabelText("Número").props.editable).toBe(true);
});

test("shows form validation beside fields without sending a toast", async () => {
  await renderFormScreen();
  await fireEvent.press(
    screen.getByRole("button", { name: "Salvar beneficiário" }),
  );

  expect(await screen.findByText("Informe o nome do beneficiário.")).toBeTruthy();
  expect(notifications.error).not.toHaveBeenCalled();
  expect(notifications.success).not.toHaveBeenCalled();
});

test("preserves entered values and toasts a duplicate-CPF API error", async () => {
  mockPost.mockRejectedValue({
    isAxiosError: true,
    response: { status: 409, data: { message: "CPF já cadastrado." } },
  } as never);
  await renderFormScreen();

  const fields = [
    ["Nome completo", "Ana Souza"],
    ["CPF", "529.982.247-25"],
    ["Telefone", "(91) 99999-9999"],
    ["Rua", "Rua das Flores"],
    ["Número", "15"],
    ["Bairro", "Centro"],
    ["Cidade", "Belém"],
    ["Estado (UF)", "PA"],
    ["CEP", "66000-000"],
  ];
  for (const [label, value] of fields)
    await fireEvent.changeText(screen.getByLabelText(label), value);
  await fireEvent.press(screen.getByRole("radio", { name: "Feminino" }));

  const today = new Date().toISOString().slice(0, 10);
  const todayDisplay = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(`${today}T00:00:00.000Z`));
  await fireEvent.press(
    screen.getByRole("button", { name: "Data de nascimento" }),
  );
  await fireEvent.press(
    await screen.findByLabelText(`Selecionar ${todayDisplay}`),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Salvar beneficiário" }),
  );

  await waitFor(() =>
    expect(notifications.error).toHaveBeenCalledWith("CPF já cadastrado."),
  );
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(screen.getByDisplayValue("Ana Souza")).toBeTruthy();
  expect(screen.getByDisplayValue("529.982.247-25")).toBeTruthy();
  expect(screen.getByDisplayValue(todayDisplay)).toBeTruthy();
});
