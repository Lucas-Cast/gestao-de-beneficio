import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";

import { CrudScreenLayout } from "@/components/ui/crud-screen-layout";
import { SearchField } from "@/components/ui/search-field";
import { SelectFieldInput } from "@/components/ui/select-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { ThemedTable, type TableColumn } from "@/components/ui/themed-table";
import { ThemedText } from "@/components/themed-text";
import { useUser } from "@/context/user-context";
import { useRefreshQueries } from "@/hooks/use-refresh-queries";
import { useTheme } from "@/hooks/use-theme";

import { UserRowActions } from "../components/user-row-actions";
import { UserStatusBadge } from "../components/user-status-badge";
import { useRefreshUsersOnFocus } from "../hooks/use-refresh-users-on-focus";
import { useUserActions } from "../hooks/use-user-actions";
import { USERS_QUERY_KEY, useUserSearch } from "../hooks/use-user-search";
import type { ManagedUser, ManagedUserStatus } from "../types/user.types";

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "INACTIVE", label: "Desativados" },
] as const;

type PendingAction = {
  user: ManagedUser;
  action: "deactivate" | "delete";
};

export default function UsersScreen() {
  const { user } = useUser();
  const colors = useTheme();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ManagedUserStatus>("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const users = useUserSearch(search, status, user?.role === "ADMIN");
  const actions = useUserActions();
  const { refreshing, refresh } = useRefreshQueries(USERS_QUERY_KEY);
  useRefreshUsersOnFocus();

  const closeConfirmation = () => {
    if (!actions.loading) setPendingAction(null);
  };

  const columns = useMemo<readonly TableColumn<ManagedUser>[]>(
    () => [
      {
        key: "name",
        label: "Nome",
        className: "min-w-40 flex-[1.2]",
        render: (managedUser) => (
          <View className="gap-1">
            <ThemedText type="smallBold" themeColor="textOnBackground2">
              {managedUser.name}
            </ThemedText>
            {managedUser.email === user?.email ? (
              <ThemedText type="small" themeColor="textMutedOnBackground2">
                Você
              </ThemedText>
            ) : null}
          </View>
        ),
      },
      {
        key: "email",
        label: "E-mail",
        className: "min-w-52 flex-[1.5]",
        render: (managedUser) => (
          <ThemedText type="small" themeColor="textOnBackground2">
            {managedUser.email}
          </ThemedText>
        ),
      },
      {
        key: "role",
        label: "Perfil",
        className: "min-w-32 flex-1",
        render: (managedUser) => (
          <ThemedText type="small" themeColor="textOnBackground2">
            {managedUser.role === "ADMIN" ? "Administrador" : "Comum"}
          </ThemedText>
        ),
      },
      {
        key: "status",
        label: "Status",
        className: "min-w-32 flex-1",
        render: (managedUser) => (
          <UserStatusBadge isActive={managedUser.isActive} />
        ),
      },
      {
        key: "actions",
        label: "Ações",
        className: "min-w-[250px] flex-[1.4]",
        render: (managedUser) => (
          <UserRowActions
            user={managedUser}
            currentUserEmail={user?.email}
            loading={actions.loading}
            onActivate={(target) => actions.setActive(target.id, true)}
            onConfirmAction={(target, action) =>
              setPendingAction({ user: target, action })
            }
          />
        ),
      },
    ],
    [actions, user?.email],
  );

  if (user?.role !== "ADMIN") return <Redirect href="/" />;

  const confirmAction = () => {
    if (!pendingAction) return;
    const close = () => setPendingAction(null);
    if (pendingAction.action === "delete") {
      actions.remove(pendingAction.user.id, close);
      return;
    }
    actions.setActive(pendingAction.user.id, false, close);
  };

  return (
    <>
      <CrudScreenLayout
        title="Usuários"
        description="Gerencie o acesso da equipe à plataforma."
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        toolbar={
          <View className="gap-3 md:flex-row md:items-end">
            <View className="min-w-0 flex-1">
              <SearchField
                label="Buscar usuários"
                placeholder="Nome ou e-mail"
                value={search}
                onChangeText={(value) => setSearch(value.slice(0, 200))}
              />
            </View>
            <View className="min-w-0 md:w-64">
              <SelectFieldInput
                label="Status"
                value={status}
                options={statusOptions}
                onValueChange={(value) => setStatus(value as ManagedUserStatus)}
              />
            </View>
          </View>
        }
        footer={
          users.hasMore && !users.error ? (
            <ThemedButton
              label={users.loadingMore ? "Carregando..." : "Carregar mais"}
              variant="secondary"
              loading={users.loadingMore}
              disabled={users.loadingMore}
              onPress={users.loadMore}
            />
          ) : null
        }
      >
        {users.loading && users.rows.length === 0 ? (
          <ActivityIndicator
            accessibilityLabel="Carregando usuários"
            color={colors.foregroundStrong}
          />
        ) : users.error && users.rows.length === 0 ? (
          <ThemedEmptyState
            title="Não foi possível carregar os usuários."
            description="Tente novamente."
            action={{ label: "Tentar novamente", onPress: users.retry }}
          />
        ) : users.rows.length === 0 ? (
          <ThemedEmptyState
            title="Nenhum usuário encontrado."
            description={
              search.trim() || status
                ? "Altere a busca ou o filtro de status."
                : "Os usuários cadastrados aparecerão aqui."
            }
          />
        ) : (
          <View className="gap-4">
            <ThemedText type="small" themeColor="textMutedOnBackground2">
              {users.total} {users.total === 1 ? "usuário" : "usuários"}
            </ThemedText>
            <View className="hidden md:flex">
              <ThemedTable
                rows={users.rows}
                columns={columns}
                rowKey={(managedUser) => managedUser.id}
              />
            </View>
            <View className="gap-3 md:hidden">
              {users.rows.map((managedUser) => (
                <View
                  key={managedUser.id}
                  className="gap-4 rounded-xl border border-border bg-background2 p-4"
                >
                  <View className="gap-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <ThemedText
                        type="smallBold"
                        themeColor="textOnBackground2"
                      >
                        {managedUser.name}
                      </ThemedText>
                      {managedUser.email === user.email ? (
                        <ThemedText
                          type="small"
                          themeColor="textMutedOnBackground2"
                        >
                          Você
                        </ThemedText>
                      ) : null}
                    </View>
                    <ThemedText
                      type="small"
                      themeColor="textMutedOnBackground2"
                    >
                      {managedUser.email}
                    </ThemedText>
                  </View>
                  <View className="flex-row flex-wrap items-center gap-3">
                    <ThemedText type="small" themeColor="textOnBackground2">
                      {managedUser.role === "ADMIN" ? "Administrador" : "Comum"}
                    </ThemedText>
                    <UserStatusBadge isActive={managedUser.isActive} />
                  </View>
                  <UserRowActions
                    user={managedUser}
                    currentUserEmail={user.email}
                    loading={actions.loading}
                    onActivate={(target) => actions.setActive(target.id, true)}
                    onConfirmAction={(target, action) =>
                      setPendingAction({ user: target, action })
                    }
                  />
                </View>
              ))}
            </View>
            {users.error ? (
              <ThemedButton
                label="Tentar novamente"
                variant="secondary"
                onPress={users.retry}
                className="self-start"
              />
            ) : null}
          </View>
        )}
      </CrudScreenLayout>

      <ThemedModal
        visible={Boolean(pendingAction)}
        title={
          pendingAction?.action === "delete"
            ? "Excluir usuário?"
            : "Desativar usuário?"
        }
        onClose={closeConfirmation}
        footer={
          <View className="gap-3 sm:flex-row sm:justify-end">
            <ThemedButton
              label="Cancelar"
              variant="secondary"
              disabled={actions.loading}
              onPress={closeConfirmation}
              className="sm:min-w-36"
            />
            <ThemedButton
              label={
                pendingAction?.action === "delete" ? "Excluir" : "Desativar"
              }
              loading={actions.loading}
              onPress={confirmAction}
              className={
                pendingAction?.action === "delete"
                  ? "border-danger sm:min-w-36"
                  : "sm:min-w-36"
              }
            />
          </View>
        }
      >
        <ThemedText themeColor="textOnBackground2">
          {pendingAction?.action === "delete"
            ? `Deseja excluir ${pendingAction.user.name}? A conta será removida da lista e não poderá mais acessar o sistema.`
            : `Deseja desativar ${pendingAction?.user.name}? A pessoa não poderá entrar até que um administrador a ative novamente.`}
        </ThemedText>
      </ThemedModal>
    </>
  );
}
