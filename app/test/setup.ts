jest.mock("@/services/notifications", () => ({
  notifications: { error: jest.fn(), success: jest.fn() },
}));
jest.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    foregroundStrong: "#FF6E32",
    textOnForeground: "#0A1529",
  }),
}));
jest.mock("@expo/vector-icons", () => ({ MaterialCommunityIcons: "Icon" }));
jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => "Icon");
jest.mock("@/components/app-toast-host", () => ({ AppToastHost: () => null }));
