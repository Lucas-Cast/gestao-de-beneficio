import { ThemedModal } from "@/components/ui/themed-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import type { Beneficiary, Basket } from "../types/delivery.types";
import type { DeliveryForm } from "../validation/delivery.schema";
export function DeliveryReview({
  values,
  beneficiary,
  basket,
  onClose,
  onConfirm,
}: {
  values: DeliveryForm | null;
  beneficiary: Beneficiary | null;
  basket: Basket | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ThemedModal
      visible={!!values}
      title="Revisar entrega"
      onClose={onClose}
      footer={
        <>
          <ThemedButton label="Confirmar entrega" onPress={onConfirm} />
          <ThemedButton
            label="Voltar e editar"
            variant="secondary"
            onPress={onClose}
          />
        </>
      }
    >
      <ThemedText themeColor="textOnBackground2">
        Beneficiário: {beneficiary?.name}
      </ThemedText>
      <ThemedText themeColor="textOnBackground2">
        Cesta: {basket?.name}
      </ThemedText>
      <ThemedText themeColor="textOnBackground2">
        Quantidade: {values?.quantity}
      </ThemedText>
      <ThemedText themeColor="textOnBackground2">
        Observação: {values?.observation.trim() || "Sem observação"}
      </ThemedText>
      <ThemedText type="small" themeColor="textMutedOnBackground2">
        Esta entrega dará baixa no estoque.
      </ThemedText>
    </ThemedModal>
  );
}
