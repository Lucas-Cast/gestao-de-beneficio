import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { API_ROUTES } from "@/constants/routes";
import { useApiGet } from "@/hooks/api/use-api-get";
import { useTheme } from "@/hooks/use-theme";
import { formatSupplyQuantity } from "@/utils/supply-format";

import { useDeleteBasket } from "../hooks/use-basket-mutations";
import type { Basket } from "../types/basket.types";
import { basketSupplyCount } from "../utils/basket-format";

type Props = { id: string | null; onClose: () => void };

export function BasketDetailsModal({ id, onClose }: Props) {
  const colors = useTheme();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const details = useApiGet<Basket>(API_ROUTES.baskets.byId(id ?? ""), {
    enabled: Boolean(id),
  });
  const deletion = useDeleteBasket(id ?? "", () => {
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
      title={confirmingDelete ? "Excluir cesta?" : "Detalhes da cesta"}
      onClose={close}
      footer={
        confirmingDelete ? (
          <View className="gap-3 sm:flex-row sm:justify-end">
            <ThemedButton
              label="Cancelar"
              variant="secondary"
              disabled={deletion.loading}
              onPress={() => setConfirmingDelete(false)}
              className="sm:min-w-40"
            />
            <ThemedButton
              label="Excluir cesta"
              loading={deletion.loading}
              disabled={deletion.loading}
              onPress={deletion.remove}
              className="border-danger sm:min-w-40"
            />
          </View>
        ) : details.data ? (
          <View className="gap-3 sm:flex-row sm:justify-end">
            <ThemedButton
              label="Fechar"
              variant="secondary"
              onPress={close}
              className="sm:min-w-32"
            />
            <ThemedButton
              label="Excluir"
              variant="secondary"
              onPress={() => setConfirmingDelete(true)}
              className="border-danger sm:min-w-32"
            />
          </View>
        ) : null
      }
    >
      {confirmingDelete ? (
        <View className="gap-3">
          <ThemedText themeColor="textOnBackground2">
            Tem certeza de que deseja excluir{" "}
            {details.data?.name ?? "esta cesta"}?
          </ThemedText>
          <ThemedText themeColor="textMutedOnBackground2">
            A composição será preservada para restauração. Entregas e
            movimentações anteriores continuarão no histórico.
          </ThemedText>
        </View>
      ) : details.loading && !details.data ? (
        <ActivityIndicator
          accessibilityLabel="Carregando cesta"
          color={colors.foregroundStrong}
        />
      ) : details.error || !details.data ? (
        <ThemedEmptyState
          title="Não foi possível carregar a cesta."
          description="Feche esta janela e tente novamente."
          action={{
            label: "Tentar novamente",
            onPress: () => void details.refetch().catch(() => undefined),
          }}
        />
      ) : (
        <View className="gap-5">
          <Detail label="Nome" value={details.data.name} />
          <Detail
            label="Descrição"
            value={details.data.description || "Não informada"}
          />
          <Detail
            label="Disponibilidade estimada"
            value={`${details.data.availableBasketCount} ${
              details.data.availableBasketCount === 1 ? "cesta" : "cestas"
            }`}
          />
          <ThemedText type="small" themeColor="textMutedOnBackground2">
            Estimativa baseada no estoque atual; pode mudar antes da entrega.
          </ThemedText>
          <View className="gap-3">
            <ThemedText type="smallBold" themeColor="textOnBackground2">
              Composição · {basketSupplyCount(details.data.supplies.length)}
            </ThemedText>
            {details.data.supplies.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center justify-between gap-3 border-b border-border pb-3"
              >
                <ThemedText
                  type="small"
                  themeColor="textOnBackground2"
                  className="min-w-0 flex-1"
                >
                  {item.supply.name}
                </ThemedText>
                <ThemedText type="smallBold" themeColor="textOnBackground2">
                  {formatSupplyQuantity(item.quantity, item.supply.unit)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}
    </ThemedModal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <ThemedText type="smallBold" themeColor="textOnBackground2">
        {label}
      </ThemedText>
      <ThemedText themeColor="textMutedOnBackground2">{value}</ThemedText>
    </View>
  );
}
