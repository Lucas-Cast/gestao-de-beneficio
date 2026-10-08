import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { useThemePreference } from "@/context/theme-preference-context";
import { useUser } from "@/context/user-context";
import { useRefreshQueries } from "@/hooks/use-refresh-queries";

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useUser();
  const { refreshing, refresh } = useRefreshQueries();
  const { activeScheme, preference, ready, setPreference } =
    useThemePreference();
  const [pending, setPending] = useState(false);
  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ThemedText type="heading">Mais</ThemedText>
      <ThemedCard>
        <ThemedText type="heading" themeColor="textOnBackground2">
          {user?.name}
        </ThemedText>
        <ThemedText themeColor="textMutedOnBackground2">
          {user?.email}
        </ThemedText>
      </ThemedCard>
      <ThemedCard>
        <View className="gap-3">
          <View className="gap-1">
            <ThemedText type="heading" themeColor="textOnBackground2">
              Aparência
            </ThemedText>
            <ThemedText themeColor="textMutedOnBackground2">
              Tema atual: {activeScheme === "dark" ? "escuro" : "claro"}
            </ThemedText>
          </View>
          <ThemedButton
            label={`Ativar tema ${
              activeScheme === "dark" ? "claro" : "escuro"
            }`}
            variant="secondary"
            disabled={!ready}
            onPress={() =>
              void setPreference(activeScheme === "dark" ? "light" : "dark")
            }
          />
          {preference !== "system" ? (
            <ThemedButton
              label="Usar tema do dispositivo"
              variant="secondary"
              disabled={!ready}
              onPress={() => void setPreference("system")}
            />
          ) : null}
        </View>
      </ThemedCard>
      {user?.role === "ADMIN" ? (
        <ThemedCard>
          <ThemedButton
            label="Gerenciar usuários"
            variant="secondary"
            onPress={() => router.push("/users")}
          />
        </ThemedCard>
      ) : null}
      <ThemedButton
        label="Sair da conta"
        loading={pending}
        variant="secondary"
        onPress={() => {
          setPending(true);
          void logout()
            .catch(() => undefined)
            .finally(() => setPending(false));
        }}
      />
    </Screen>
  );
}
