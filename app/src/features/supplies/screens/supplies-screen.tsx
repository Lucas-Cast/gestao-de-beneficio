import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { StockMovementHistoryModal } from "@/components/StockMovementHistoryModal";
import { CrudScreenLayout } from "@/components/ui/crud-screen-layout";
import { SearchField } from "@/components/ui/search-field";
import { SelectFieldInput } from "@/components/ui/select-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedTable, type TableColumn } from "@/components/ui/themed-table";
import { useTheme } from "@/hooks/use-theme";

import { StockMovementModal } from "../components/stock-movement-modal";
import { SupplyDetailsModal } from "../components/supply-details-modal";
import { SUPPLY_UNIT_OPTIONS, formatSupplyQuantity, unitLabel } from "../constants/supply-units";
import { useRefreshSuppliesOnFocus } from "../hooks/use-refresh-supplies-on-focus";
import { useSupplySearch } from "../hooks/use-supply-search";
import type { Supply, SupplyUnit } from "../types/supply.types";

const unitFilterOptions = [
  { value: "", label: "Todas as unidades" },
  ...SUPPLY_UNIT_OPTIONS,
];

const columns: readonly TableColumn<Supply>[] = [
  {
    key: "name",
    label: "Mantimento",
    className: "min-w-40 flex-[1.5]",
    render: (supply) => (
      <ThemedText type="smallBold" themeColor="textOnBackground2">
        {supply.name}
      </ThemedText>
    ),
  },
  {
    key: "unit",
    label: "Unidade",
    className: "min-w-32 flex-1",
    render: (supply) => (
      <ThemedText type="small" themeColor="textOnBackground2">
        {unitLabel(supply.unit)}
      </ThemedText>
    ),
  },
  {
    key: "balance",
    label: "Saldo atual",
    className: "min-w-32 flex-1",
    render: (supply) => (
      <ThemedText type="small" themeColor="textOnBackground2">
        {formatSupplyQuantity(supply.currentQuantity, supply.unit)}
      </ThemedText>
    ),
  },
  {
    key: "description",
    label: "Descrição",
    className: "min-w-40 flex-1",
    render: (supply) => (
      <ThemedText type="small" themeColor="textMutedOnBackground2">
        {supply.description || "Não informada"}
      </ThemedText>
    ),
  },
];

export default function SuppliesScreen() {
  const router = useRouter();
  const colors = useTheme();
  const [search, setSearch] = useState("");
  const [unit, setUnit] = useState<SupplyUnit | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMovement, setShowMovement] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySupplyId, setHistorySupplyId] = useState<string>();
  const supplies = useSupplySearch(search, unit);
  useRefreshSuppliesOnFocus();

  return (
    <>
      <CrudScreenLayout
        title="Mantimentos"
        description="Gerencie itens e saldos do estoque."
        refreshing={supplies.refreshing}
        onRefresh={supplies.retry}
        primaryAction={{
          label: "Novo mantimento",
          onPress: () => router.push("/supplies/new"),
        }}
        toolbar={
          <View className="gap-3 md:flex-row md:items-end">
            <View className="min-w-0 flex-1">
              <SearchField
                label="Buscar mantimentos"
                placeholder="Nome do mantimento"
                value={search}
                onChangeText={(value) => setSearch(value.slice(0, 200))}
              />
            </View>
            <View className="min-w-0 flex-1">
              <SelectFieldInput
                label="Unidade de medida"
                value={unit}
                options={unitFilterOptions}
                onValueChange={(value) => setUnit(value as SupplyUnit | "")}
              />
            </View>
            <ThemedButton
              label="Movimentar estoque"
              variant="secondary"
              onPress={() => setShowMovement(true)}
              className="md:min-w-48"
            />
            <ThemedButton
              label="Histórico de movimentações"
              variant="secondary"
              onPress={() => {
                setHistorySupplyId(undefined);
                setShowHistory(true);
              }}
              className="md:min-w-56"
            />
          </View>
        }
        footer={
          supplies.hasMore && !supplies.error ? (
            <ThemedButton
              label={supplies.loadingMore ? "Carregando..." : "Carregar mais"}
              loading={supplies.loadingMore}
              disabled={supplies.loadingMore}
              variant="secondary"
              onPress={supplies.loadMore}
            />
          ) : null
        }
      >
        {supplies.loading && supplies.rows.length === 0 ? (
          <ActivityIndicator accessibilityLabel="Carregando mantimentos" color={colors.foregroundStrong} />
        ) : supplies.error && supplies.rows.length === 0 ? (
          <ThemedEmptyState
            title="Não foi possível carregar os mantimentos."
            description="Tente novamente."
            action={{ label: "Tentar novamente", onPress: supplies.retry }}
          />
        ) : supplies.rows.length === 0 ? (
          <ThemedEmptyState
            title="Nenhum mantimento encontrado."
            description={search || unit ? "Revise os filtros da busca." : "Cadastre o primeiro mantimento da instituição."}
            action={{ label: "Novo mantimento", onPress: () => router.push("/supplies/new") }}
          />
        ) : (
          <View className="gap-3">
            <View className="hidden md:flex">
              <ThemedTable
                rows={supplies.rows}
                columns={columns}
                rowKey={(supply) => supply.id}
                rowLabel={(supply) => `Abrir ${supply.name}`}
                onRowPress={(supply) => setSelectedId(supply.id)}
                loading={supplies.loadingMore}
              />
            </View>
            <View className="gap-3 md:hidden">
              {supplies.rows.map((supply) => (
                <Pressable
                  key={supply.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${supply.name}`}
                  onPress={() => setSelectedId(supply.id)}
                  className="gap-2 rounded-xl border border-border p-4 active:bg-backgroundSelected"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <ThemedText type="smallBold" themeColor="textOnBackground2" className="min-w-0 flex-1">
                      {supply.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textMutedOnBackground2">Ver detalhes</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textOnBackground2">
                    {formatSupplyQuantity(supply.currentQuantity, supply.unit)} · {unitLabel(supply.unit)}
                  </ThemedText>
                  {supply.description ? (
                    <ThemedText type="small" themeColor="textMutedOnBackground2">
                      {supply.description}
                    </ThemedText>
                  ) : null}
                </Pressable>
              ))}
            </View>
            {supplies.error ? (
              <ThemedButton label="Tentar novamente" variant="secondary" onPress={supplies.retry} className="self-start" />
            ) : null}
          </View>
        )}
      </CrudScreenLayout>

      <SupplyDetailsModal
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={(id) => {
          setSelectedId(null);
          router.push({ pathname: "/supplies/[id]/edit", params: { id } });
        }}
        onViewHistory={(id) => {
          setSelectedId(null);
          setHistorySupplyId(id);
          setShowHistory(true);
        }}
      />
      <StockMovementModal visible={showMovement} onClose={() => setShowMovement(false)} />
      <StockMovementHistoryModal
        visible={showHistory}
        supplyId={historySupplyId}
        onClose={() => setShowHistory(false)}
        title={
          historySupplyId
            ? `Movimentações de ${supplies.rows.find((item) => item.id === historySupplyId)?.name ?? "mantimento"}`
            : undefined
        }
      />
    </>
  );
}
