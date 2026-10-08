import { ActivityIndicator, Pressable, View } from "react-native";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { SearchField } from "@/components/ui/search-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { useTheme } from "@/hooks/use-theme";
import { supplyUnitLabel } from "@/utils/supply-format";

import { useSupplyPickerSearch } from "../hooks/use-supply-picker-search";
import type { SupplyOption } from "../types/basket.types";

type Props = {
  visible: boolean;
  selectedIds: readonly string[];
  onSelect: (supply: SupplyOption) => void;
  onClose: () => void;
};

export function SupplyPickerModal({
  visible,
  selectedIds,
  onSelect,
  onClose,
}: Props) {
  const colors = useTheme();
  const [search, setSearch] = useState("");
  const supplies = useSupplyPickerSearch(search, visible);

  return (
    <ThemedModal
      visible={visible}
      title="Adicionar mantimento"
      onClose={onClose}
    >
      <View className="gap-4">
        <SearchField
          label="Buscar mantimentos"
          placeholder="Nome do mantimento"
          value={search}
          onChangeText={(value) => setSearch(value.slice(0, 200))}
        />

        {supplies.loading && supplies.rows.length === 0 ? (
          <ActivityIndicator
            accessibilityLabel="Carregando mantimentos"
            color={colors.foregroundStrong}
          />
        ) : supplies.error && supplies.rows.length === 0 ? (
          <ThemedEmptyState
            title="Não foi possível carregar os mantimentos."
            description="Tente novamente."
            action={{ label: "Tentar novamente", onPress: supplies.retry }}
          />
        ) : supplies.rows.length === 0 ? (
          <ThemedEmptyState title="Nenhum mantimento encontrado." />
        ) : (
          <View className="gap-2">
            {supplies.rows.map((supply) => {
              const selected = selectedIds.includes(supply.id);
              const unitLabel = supplyUnitLabel(supply.unit);
              const actionLabel = selected
                ? "já adicionado"
                : "adicionar à cesta";
              return (
                <Pressable
                  key={supply.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${supply.name}, ${unitLabel}, ${actionLabel}`}
                  accessibilityState={{ disabled: selected }}
                  disabled={selected}
                  onPress={() => onSelect(supply)}
                  className="gap-1 rounded-xl border border-border p-4 active:bg-backgroundSelected disabled:opacity-50"
                >
                  <ThemedText type="smallBold" themeColor="textOnBackground2">
                    {supply.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMutedOnBackground2">
                    Unidade: {unitLabel}
                  </ThemedText>
                  {selected ? (
                    <ThemedText
                      type="small"
                      themeColor="textMutedOnBackground2"
                    >
                      Já adicionado
                    </ThemedText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {supplies.error && supplies.rows.length > 0 ? (
          <ThemedButton
            label="Tentar novamente"
            variant="secondary"
            onPress={supplies.retry}
          />
        ) : null}
        {supplies.hasMore ? (
          <ThemedButton
            label="Carregar mais"
            variant="secondary"
            loading={supplies.loading}
            disabled={supplies.loading}
            onPress={supplies.loadMore}
          />
        ) : null}
        <ThemedButton
          label="Concluir seleção"
          variant="secondary"
          onPress={onClose}
        />
      </View>
    </ThemedModal>
  );
}
