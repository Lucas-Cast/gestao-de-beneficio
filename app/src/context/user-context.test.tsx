import { act, renderHook, waitFor } from "@testing-library/react-native";
import { session } from "@/services/api/session";
import { notifications } from "@/services/notifications";
import { UserProvider, useUser } from "./user-context";
jest.mock("@/services/api/session", () => ({
  session: { getToken: jest.fn(), getUser: jest.fn(), clear: jest.fn() },
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(session.getToken).mockResolvedValue("token");
  jest.mocked(session.getUser).mockResolvedValue({
    name: "Ana",
    email: "ana@exemplo.com",
    role: "COMMON",
  });
  jest.mocked(session.clear).mockResolvedValue();
});
test("restores persisted user and logout clears session and context with one toast", async () => {
  const { result } = await renderHook(useUser, { wrapper: UserProvider });
  await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  expect(result.current.user?.name).toBe("Ana");
  await act(() => result.current.logout());
  expect(session.clear).toHaveBeenCalledTimes(1);
  expect(result.current.user).toBeNull();
  expect(notifications.success).toHaveBeenCalledWith("Você saiu da conta.");
});
test("failed logout keeps the user and reports one Portuguese toast", async () => {
  jest.mocked(session.clear).mockRejectedValue(new Error("storage internal"));
  const { result } = await renderHook(useUser, { wrapper: UserProvider });
  await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
  await act(async () => {
    await result.current.logout().catch(() => undefined);
  });
  expect(result.current.isAuthenticated).toBe(true);
  expect(notifications.error).toHaveBeenCalledTimes(1);
  expect(notifications.success).not.toHaveBeenCalled();
});
