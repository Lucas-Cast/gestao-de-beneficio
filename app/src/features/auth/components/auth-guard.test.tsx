import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { useUser } from "@/context/user-context";
import { AuthGuard } from "./auth-guard";
const mockReplace = jest.fn();
let mockSegments = ["deliveries", "new"];
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockSegments,
}));
jest.mock("@/context/user-context", () => ({ useUser: jest.fn() }));
const user = jest.mocked(useUser);
beforeEach(() => {
  jest.clearAllMocks();
  mockSegments = ["deliveries", "new"];
});
test("unauthenticated delivery access redirects to login", async () => {
  user.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
  } as ReturnType<typeof useUser>);
  await render(
    <AuthGuard>
      <Text>Entrega privada</Text>
    </AuthGuard>,
  );
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByText("Entrega privada")).toBeNull();
});
test("authenticated operators can access delivery routes", async () => {
  user.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
  } as ReturnType<typeof useUser>);
  await render(
    <AuthGuard>
      <Text>Entrega privada</Text>
    </AuthGuard>,
  );
  expect(screen.getByText("Entrega privada")).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});
test("authenticated users leaving auth group are sent home", async () => {
  mockSegments = ["(auth)", "login"];
  user.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
  } as ReturnType<typeof useUser>);
  await render(
    <AuthGuard>
      <Text>Login</Text>
    </AuthGuard>,
  );
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
});
