import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { CrudScreenLayout } from "@/components/ui/crud-screen-layout";
import { SearchField } from "@/components/ui/search-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { useTheme } from "@/hooks/use-theme";
import { formatDateForDisplay } from "@/utils/date-format";

import { useBasketSearch } from "../hooks/use-basket-search";
import { useRefreshBasketsOnFocus } from "../hooks/use-refresh-baskets-on-focus";
import { useRestoreBasket } from "../hooks/use-basket-mutations";
import type { Basket } from "../types/basket.types";
import { basketSupplyCount } from "../utils/basket-format";

export default function DeletedBasketsScreen() {
  const router = useRouter();
  const colors = useTheme();
  const [search, setSearch] = useState("");
  const [selectedBasket, setSelectedBasket] = useState<Basket | null>(null);
  const baskets = useBasketSearch(search, true);
  const restoration = useRestoreBasket();
  useRefreshBasketsOnFocus(true);

  const deletedSupplies =
    selectedBasket?.supplies.filter((item) => item.supply.deletedAt !== null) ??
    [];

  return (
    <>
      <CrudScreenLayout
        title="Cestas excluídas"
        description="Consulte as cestas removidas e restaure as que devem voltar a ficar disponíveis."
        refreshing={baskets.refreshing}
        onRefresh={baskets.retry}
        primaryAction={{
          label: "Voltar às cestas",
          onPress: () => router.replace("/(app)/baskets"),
        }}
        toolbar={
          <SearchField
            label="Buscar cestas excluídas"
            placeholder="Nome da cesta"
            value={search}
            onChangeText={(value) => setSearch(value.slice(0, 200))}
          />
        }
        footer={
          baskets.hasMore && !baskets.error ? (
            <ThemedButton
              label={baskets.loadingMore ? "Carregando..." : "Carregar mais"}
              variant="secondary"
              loading={baskets.loadingMore}
              disabled={baskets.loadingMore}
              onPress={baskets.loadMore}
            />
          ) : null
        }
      >
        {baskets.loading && baskets.rows.length === 0 ? (
          <ActivityIndicator
            accessibilityLabel="Carregando cestas excluídas"
            color={colors.foregroundStrong}
          />
        ) : baskets.error && baskets.rows.length === 0 ? (
          <ThemedEmptyState
            title="Não foi possível carregar as cestas excluídas."
            description="Tente novamente."
            action={{ label: "Tentar novamente", onPress: baskets.retry }}
          />
        ) : baskets.rows.length === 0 ? (
          <ThemedEmptyState
            title="Nenhuma cesta excluída encontrada."
            description={
              search.trim()
                ? "Revise a busca."
                : "As cestas excluídas aparecerão aqui."
            }
          />
        ) : (
          <View className="gap-3">
            {baskets.rows.map((basket) => (
              <View
                key={basket.id}
                className="gap-4 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <View className="min-w-0 flex-1 gap-2">
                  <ThemedText type="smallBold" themeColor="textOnBackground2">
                    {basket.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMutedOnBackground2">
                    {basketSupplyCount(basket.supplies.length)} · Excluída em:{" "}
                    {formatDateForDisplay(
                      basket.deletedAt ?? "",
                      "Data indisponível",
                    )}
                  </ThemedText>
                  {basket.description ? (
                    <ThemedText
                      type="small"
                      themeColor="textMutedOnBackground2"
                    >
                      {basket.description}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedButton
                  label="Restaurar"
                  variant="secondary"
                  onPress={() => setSelectedBasket(basket)}
                  className="md:min-w-40"
                />
              </View>
            ))}
            {baskets.error ? (
              <ThemedButton
                label="Tentar novamente"
                variant="secondary"
                onPress={baskets.retry}
                className="self-start"
              />
            ) : null}
          </View>
        )}
      </CrudScreenLayout>

      <ThemedModal
        visible={Boolean(selectedBasket)}
        title="Restaurar cesta?"
        onClose={() => {
          if (!restoration.loading) setSelectedBasket(null);
        }}
        footer={
          <View className="gap-3 sm:flex-row sm:justify-end">
            <ThemedButton
              label="Cancelar"
              variant="secondary"
              disabled={restoration.loading}
              onPress={() => setSelectedBasket(null)}
              className="sm:min-w-36"
            />
            <ThemedButton
              label="Restaurar cesta"
              loading={restoration.restoringId === selectedBasket?.id}
              disabled={restoration.loading || deletedSupplies.length > 0}
              onPress={() => {
                if (!selectedBasket) return;
                restoration.restore(selectedBasket.id, () =>
                  setSelectedBasket(null),
                );
              }}
              className="sm:min-w-40"
            />
          </View>
        }
      >
        <View className="gap-3">
          <ThemedText themeColor="textOnBackground2">
            Deseja restaurar {selectedBasket?.name ?? "esta cesta"} e sua
            composição?
          </ThemedText>
          {deletedSupplies.length > 0 ? (
            <View className="gap-2">
              <ThemedText themeColor="danger">
                Esta cesta contém mantimentos excluídos. Restaure-os antes de
                restaurar a cesta.
              </ThemedText>
              {deletedSupplies.map((item) => (
                <ThemedText
                  key={item.id}
                  type="small"
                  themeColor="textMutedOnBackground2"
                >
                  {item.supply.name}
                </ThemedText>
              ))}
            </View>
          ) : (
            <ThemedText themeColor="textMutedOnBackground2">
              Os registros de auditoria e as entregas anteriores serão
              preservados.
            </ThemedText>
          )}
        </View>
      </ThemedModal>
    </>
  );
}
