import { useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "@/constants/routes";
import { useApiRequest } from "@/hooks/api/use-api-request";
import { api } from "@/services/api/client";
import { notifications } from "@/services/notifications";

import { USERS_QUERY_KEY } from "./use-user-search";

export function useUserActions() {
  const queryClient = useQueryClient();
  const statusRequest = useApiRequest<void>();
  const deleteRequest = useApiRequest<void>();

  const refreshUsers = () =>
    void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });

  const setActive = (id: string, isActive: boolean, onSuccess?: () => void) => {
    statusRequest.run(
      async () => {
        await api.patch(API_ROUTES.users.status(id), { isActive });
      },
      {
        onSuccess: () => {
          notifications.success(
            isActive
              ? "Usuário ativado com sucesso."
              : "Usuário desativado com sucesso.",
          );
          refreshUsers();
          onSuccess?.();
        },
      },
    );
  };

  const remove = (id: string, onSuccess?: () => void) => {
    deleteRequest.run(
      async () => {
        await api.delete(API_ROUTES.users.byId(id));
      },
      {
        onSuccess: () => {
          notifications.success("Usuário excluído com sucesso.");
          refreshUsers();
          onSuccess?.();
        },
      },
    );
  };

  return {
    setActive,
    remove,
    loading: statusRequest.loading || deleteRequest.loading,
  };
}
