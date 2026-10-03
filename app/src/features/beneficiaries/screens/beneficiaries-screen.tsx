import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
export default function BeneficiariesScreen() {
  return (
    <Screen>
      <ThemedText type="heading">Beneficiários</ThemedText>
      <ThemedCard>
        <ThemedEmptyState
          title="Em breve"
          description="O gerenciamento de beneficiários será disponibilizado em uma próxima etapa. No registro de entrega, você já pode buscar os beneficiários cadastrados."
        />
      </ThemedCard>
    </Screen>
  );
}
