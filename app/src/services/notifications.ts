import { AccessibilityInfo } from "react-native";
import Toast from "react-native-toast-message";

function show(type: "error" | "success", message: string) {
  Toast.show({
    type,
    text1: message,
    visibilityTime: type === "error" ? 6000 : 4000,
    onPress: Toast.hide,
  });
  AccessibilityInfo.announceForAccessibility?.(message);
}

export const notifications = {
  error: (message: string) => show("error", message),
  success: (message: string) => show("success", message),
};
