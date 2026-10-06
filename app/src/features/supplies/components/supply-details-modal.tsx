import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { API_ROUTES } from "@/constants/routes";
import { useApiGet } from "@/hooks/api/use-api-get";
import { useTheme } from "@/hooks/use-theme";

import { formatSupplyQuantity, unitLabel } from "../constants/supply-units";
import { useDeleteSupply } from "../hooks/use-supply-mutations";
import type { Supply } from "../types/supply.types";

type Props = {
  id: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onViewHistory: (id: string) => void;
};

export function SupplyDetailsModal({
  id,
  onClose,
  onEdit,
  onViewHistory,
}: Props) {
  const colors = useTheme();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const details = useApiGet<Supply>(API_ROUTES.supplies.byId(id ?? ""), {
    enabled: Boolean(id),
  });
  const deletion = useDeleteSupply(id ?? "", () => {
    setConfirmingDelete(false);
    onClose();
  });

  const close = () => {
    if (deletion.loading) return;
    setConfirmingDelete(false);
    onClose();
  };

  return (
    <ThemedModal
      visible={Boolean(id)}
      title={confirmingDelete ? "Excluir mantimento?" : "Detalhes do mantimento"}
      onClose={close}
      footer={
        confirmingDelete ? (
          <View className="gap-3 sm:flex-row sm:justify-end">
            <ThemedButton label="Cancelar" variant="secondary" disabled={deletion.loading} onPress={() => setConfirmingDelete(false)} className="sm:min-w-40" />
            <ThemedButton label="Excluir mantimento" loading={deletion.loading} onPress={deletion.remove} className="sm:min-w-40" />
          </View>
        ) : details.data ? (
          <View className="gap-3 sm:flex-row sm:justify-end">
            <ThemedButton label="Fechar" variant="secondary" onPress={close} className="sm:min-w-32" />
            <ThemedButton label="Movimentações" variant="secondary" onPress={() => onViewHistory(details.data!.id)} className="sm:min-w-40" />
            <ThemedButton label="Editar" variant="secondary" onPress={() => onEdit(details.data!.id)} className="sm:min-w-32" />
            <ThemedButton label="Excluir" variant="secondary" onPress={() => setConfirmingDelete(true)} className="border-danger sm:min-w-32" />
          </View>
        ) : null
      }
    >
      {confirmingDelete ? (
        <View className="gap-3">
          <ThemedText themeColor="textOnBackground2">
            Tem certeza de que deseja excluir {details.data?.name ?? "este mantimento"}?
          </ThemedText>
          <ThemedText themeColor="textMutedOnBackground2">
            O histórico será preservado. O mantimento não poderá participar de novas movimentações ou entregas.
          </ThemedText>
        </View>
      ) : details.loading && !details.data ? (
        <ActivityIndicator accessibilityLabel="Carregando mantimento" color={colors.foregroundStrong} />
      ) : details.error || !details.data ? (
        <ThemedEmptyState
          title="Não foi possível carregar o mantimento."
          description="Feche esta janela e tente novamente."
          action={{ label: "Tentar novamente", onPress: () => { void details.refetch().catch(() => undefined); } }}
        />
      ) : (
        <View className="gap-5">
          <Detail label="Mantimento" value={details.data.name} />
          <Detail label="Descrição" value={details.data.description || "Não informada"} />
          <Detail label="Unidade de medida" value={unitLabel(details.data.unit)} />
          <Detail label="Saldo atual" value={formatSupplyQuantity(details.data.currentQuantity, details.data.unit)} />
        </View>
      )}
    </ThemedModal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <ThemedText type="smallBold" themeColor="textOnBackground2">{label}</ThemedText>
      <ThemedText themeColor="textMutedOnBackground2">{value}</ThemedText>
    </View>
  );
}
