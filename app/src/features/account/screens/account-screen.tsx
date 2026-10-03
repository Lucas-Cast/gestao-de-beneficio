import { useState } from "react";
import { View } from "react-native";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { useUser } from "@/context/user-context";
export default function AccountScreen() {
  const { user, logout } = useUser();
  const [pending, setPending] = useState(false);
  return (
    <Screen>
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
          {["Cestas", "Estoque"].map((label) => (
            <ThemedButton
              key={label}
              label={label + " · Em breve"}
              disabled
              variant="secondary"
            />
          ))}
        </View>
      </ThemedCard>
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
