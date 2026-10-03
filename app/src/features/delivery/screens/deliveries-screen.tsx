import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
export default function DeliveriesScreen() {
  return (
    <Screen>
      <ThemedText type="heading">Entregas</ThemedText>
      <ThemedButton
        label="Registrar entrega"
        onPress={() => router.push("/deliveries/new")}
      />
      <ThemedCard>
        <ThemedEmptyState
          title="Histórico de entregas ainda não disponível."
          description="Você já pode registrar uma nova entrega. O histórico será disponibilizado em uma próxima etapa."
        />
      </ThemedCard>
    </Screen>
  );
}
