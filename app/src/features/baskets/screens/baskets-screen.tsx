import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter } from "expo-router";

import { AuditHistoryModal } from "@/components/AuditHistoryModal";
import { ThemedText } from "@/components/themed-text";
import { CrudScreenLayout } from "@/components/ui/crud-screen-layout";
import { SearchField } from "@/components/ui/search-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedTable, type TableColumn } from "@/components/ui/themed-table";
import { useTheme } from "@/hooks/use-theme";

import { BasketDetailsModal } from "../components/basket-details-modal";
import { useBasketSearch } from "../hooks/use-basket-search";
import { useRefreshBasketsOnFocus } from "../hooks/use-refresh-baskets-on-focus";
import type { Basket } from "../types/basket.types";
import { basketSupplyCount } from "../utils/basket-format";

const columns: readonly TableColumn<Basket>[] = [
  {
    key: "name",
    label: "Nome",
    className: "min-w-40 flex-[1.5]",
    render: (basket) => (
      <ThemedText type="smallBold" themeColor="textOnBackground2">
        {basket.name}
      </ThemedText>
    ),
  },
  {
    key: "description",
    label: "Descrição",
    className: "min-w-48 flex-[2]",
    render: (basket) => (
      <ThemedText type="small" themeColor="textMutedOnBackground2">
        {basket.description || "Não informada"}
      </ThemedText>
    ),
  },
  {
    key: "supplies",
    label: "Mantimentos",
    className: "min-w-36 flex-1",
    render: (basket) => (
      <ThemedText type="small" themeColor="textOnBackground2">
        {basketSupplyCount(basket.supplies.length)}
      </ThemedText>
    ),
  },
];

export default function BasketsScreen() {
  const router = useRouter();
  const colors = useTheme();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const baskets = useBasketSearch(search);
  useRefreshBasketsOnFocus();

  return (
    <>
      <CrudScreenLayout
        title="Cestas"
        description="Consulte as composições fixas usadas nas entregas."
        refreshing={baskets.refreshing}
        onRefresh={baskets.retry}
        primaryAction={{
          label: "Nova cesta",
          onPress: () => router.push("/baskets/new"),
        }}
        toolbar={
          <View className="gap-3 sm:flex-row sm:items-end">
            <View className="min-w-0 flex-1">
              <SearchField
                label="Buscar cestas"
                placeholder="Nome da cesta"
                value={search}
                onChangeText={(value) => setSearch(value.slice(0, 200))}
              />
            </View>
            <ThemedButton
              label="Ver excluídas"
              variant="secondary"
              onPress={() => router.push("/baskets/deleted")}
              className="sm:min-w-40"
            />
            <ThemedButton
              label="Ver histórico"
              variant="secondary"
              onPress={() => setShowAudit(true)}
              className="sm:min-w-40"
            />
          </View>
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
            accessibilityLabel="Carregando cestas"
            color={colors.foregroundStrong}
          />
        ) : baskets.error && baskets.rows.length === 0 ? (
          <ThemedEmptyState
            title="Não foi possível carregar as cestas."
            description="Tente novamente."
            action={{ label: "Tentar novamente", onPress: baskets.retry }}
          />
        ) : baskets.rows.length === 0 ? (
          <ThemedEmptyState
            title="Nenhuma cesta encontrada."
            description={
              search.trim()
                ? "Revise a busca."
                : "Cadastre a primeira composição da instituição."
            }
            action={{
              label: "Nova cesta",
              onPress: () => router.push("/baskets/new"),
            }}
          />
        ) : (
          <View className="gap-3">
            <View className="hidden md:flex">
              <ThemedTable
                rows={baskets.rows}
                columns={columns}
                rowKey={(basket) => basket.id}
                rowLabel={(basket) => `Abrir ${basket.name}`}
                onRowPress={(basket) => setSelectedId(basket.id)}
                loading={baskets.loadingMore}
              />
            </View>
            <View className="gap-3 md:hidden">
              {baskets.rows.map((basket) => (
                <Pressable
                  key={basket.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${basket.name}`}
                  onPress={() => setSelectedId(basket.id)}
                  className="gap-2 rounded-xl border border-border p-4 active:bg-backgroundSelected"
                >
                  <ThemedText type="smallBold" themeColor="textOnBackground2">
                    {basket.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMutedOnBackground2">
                    {basketSupplyCount(basket.supplies.length)}
                  </ThemedText>
                  {basket.description ? (
                    <ThemedText
                      type="small"
                      themeColor="textMutedOnBackground2"
                    >
                      {basket.description}
                    </ThemedText>
                  ) : null}
                </Pressable>
              ))}
            </View>
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
      <BasketDetailsModal id={selectedId} onClose={() => setSelectedId(null)} />
      <AuditHistoryModal
        visible={showAudit}
        onClose={() => setShowAudit(false)}
        entityType="BASKET"
      />
    </>
  );
}
