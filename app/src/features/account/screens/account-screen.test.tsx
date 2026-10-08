import { fireEvent, render, screen } from "@testing-library/react-native";

import { useUser } from "@/context/user-context";

import AccountScreen from "./account-screen";

const mockPush = jest.fn();
const mockUseUser = jest.mocked(useUser);

jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/context/user-context", () => ({ useUser: jest.fn() }));
jest.mock("@/context/theme-preference-context", () => ({
  useThemePreference: () => ({
    activeScheme: "dark",
    preference: "system",
    ready: true,
    setPreference: jest.fn(),
  }),
}));
jest.mock("@/hooks/use-refresh-queries", () => ({
  useRefreshQueries: () => ({ refreshing: false, refresh: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

async function setup(role: "ADMIN" | "COMMON") {
  mockUseUser.mockReturnValue({
    user: { name: "Lucas", email: "lucas@example.org", role },
    isLoading: false,
    isAuthenticated: true,
    setUser: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
  });
  return render(<AccountScreen />);
}

test("shows user management only to administrators and removes the stock shortcut", async () => {
  await setup("ADMIN");
  await fireEvent.press(
    screen.getByRole("button", { name: "Gerenciar usuários" }),
  );
  expect(mockPush).toHaveBeenCalledWith("/users");
  expect(screen.queryByText(/Estoque/)).toBeNull();
});

test("does not show the user management entry to common accounts", async () => {
  await setup("COMMON");
  expect(screen.queryByText("Gerenciar usuários")).toBeNull();
});
