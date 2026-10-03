import { useCallback } from "react";

import { API_ROUTES } from "@/constants/routes";
import { useApiPost } from "@/hooks/api/use-api-post";
import { session } from "@/services/api/session";
import { useUser } from "@/context/user-context";
import { notifications } from "@/services/notifications";

import type { AuthResponse, LoginPayload } from "../types/auth.types";

export function useLogin() {
  const { setUser } = useUser();
  const { execute: executeRequest, ...requestState } = useApiPost<
    LoginPayload,
    AuthResponse
  >(API_ROUTES.auth.login);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await executeRequest(payload);
      try {
        await session.setToken(response.token);
        await session.setUser(response);
      } catch (error) {
        await session.clear().catch(() => undefined);
        notifications.error(
          "Não foi possível salvar sua sessão. Tente novamente.",
        );
        throw error;
      }
      setUser({ name: response.name, email: response.email });
      notifications.success("Você entrou na sua conta.");
      return response;
    },
    [executeRequest, setUser],
  );

  return {
    ...requestState,
    login,
  };
}
