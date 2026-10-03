import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/themed-text";
import { router } from "expo-router";
import type { Delivery } from "../types/delivery.types";
export function DeliverySummary({
  delivery,
  beneficiary,
  basket,
  onAgain,
}: {
  delivery: Delivery;
  beneficiary: string;
  basket: string;
  onAgain: () => void;
}) {
  return (
    <ThemedCard>
      <ThemedText type="heading" themeColor="textOnBackground2">
        Resumo da entrega
      </ThemedText>
      <ThemedText themeColor="textOnBackground2">{beneficiary}</ThemedText>
      <ThemedText themeColor="textOnBackground2">
        {delivery.quantity} cesta(s) · {basket}
      </ThemedText>
      <ThemedText type="small" themeColor="textMutedOnBackground2">
        {new Date(delivery.createdAt).toLocaleString("pt-BR")}
      </ThemedText>
      <ThemedText themeColor="textOnBackground2">
        {delivery.observation || "Sem observação"}
      </ThemedText>
      <ThemedButton label="Registrar outra entrega" onPress={onAgain} />
      <ThemedButton
        label="Voltar ao início"
        variant="secondary"
        onPress={() => router.replace("/")}
      />
    </ThemedCard>
  );
}
