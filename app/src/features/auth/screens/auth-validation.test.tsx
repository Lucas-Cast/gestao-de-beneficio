import { render, screen, fireEvent } from "@testing-library/react-native";
import { notifications } from "@/services/notifications";
import LoginScreen from "./login-screen";
import RegisterScreen from "./register-screen";
const mockLogin = jest.fn();
const mockRegister = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));
jest.mock("../hooks/use-login", () => ({
  useLogin: () => ({ login: mockLogin, loading: false }),
}));
jest.mock("../hooks/use-register", () => ({
  useRegister: () => ({ register: mockRegister, loading: false }),
}));
beforeEach(() => jest.clearAllMocks());
test("login field errors remain inline and do not emit toasts or requests", async () => {
  await render(<LoginScreen />);
  await fireEvent.press(screen.getByText("Entrar", { exact: true }));
  expect(await screen.findByText("Informe seu e-mail.")).toBeTruthy();
  expect(screen.getByLabelText("E-mail").props["aria-invalid"]).toBe(true);
  expect(mockLogin).not.toHaveBeenCalled();
  expect(notifications.error).not.toHaveBeenCalled();
});
test("registration field errors remain inline and do not emit toasts or requests", async () => {
  await render(<RegisterScreen />);
  await fireEvent.press(screen.getByText("Criar conta"));
  expect(screen.getByLabelText("Nome completo").props["aria-invalid"]).toBe(
    true,
  );
  expect(
    screen.getByLabelText("Confirme sua senha").props["aria-invalid"],
  ).toBe(true);
  expect(mockRegister).not.toHaveBeenCalled();
  expect(notifications.error).not.toHaveBeenCalled();
});
