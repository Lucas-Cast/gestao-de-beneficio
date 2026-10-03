import { AccessibilityInfo } from "react-native";
import Toast from "react-native-toast-message";
import { notifications } from "./notifications";
jest.unmock("@/services/notifications");
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));
test("toasts have configured durations, accessible announcements and dismissal", () => {
  const announce = jest
    .spyOn(AccessibilityInfo, "announceForAccessibility")
    .mockImplementation(() => undefined);
  notifications.error("Não foi possível registrar.");
  expect(Toast.show).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: "error",
      text1: "Não foi possível registrar.",
      visibilityTime: 6000,
    }),
  );
  notifications.success("Entrega registrada com sucesso.");
  expect(Toast.show).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: "success",
      visibilityTime: 4000,
      onPress: Toast.hide,
    }),
  );
  expect(announce).toHaveBeenLastCalledWith("Entrega registrada com sucesso.");
  announce.mockRestore();
});
