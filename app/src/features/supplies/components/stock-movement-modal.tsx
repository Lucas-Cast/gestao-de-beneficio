import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { TextField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedField } from "@/components/ui/segmented-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { useTheme } from "@/hooks/use-theme";
import { formatSupplyQuantity } from "@/utils/supply-format";

import { useCreateStockMovement } from "../hooks/use-supply-mutations";
import { useSupplySearch } from "../hooks/use-supply-search";
import type { StockMovementFormValues, Supply } from "../types/supply.types";
import { stockMovementSchema } from "../validation/supply.schema";

type Props = { visible: boolean; onClose: () => void };

const movementTypes = [
  { label: "Entrada", value: "IN" },
  { label: "Saída", value: "OUT" },
];

const defaultValues: StockMovementFormValues = {
  supplyId: "",
  type: "IN",
  quantity: "",
  reason: "",
};

export function StockMovementModal({ visible, onClose }: Props) {
  const colors = useTheme();
  const [searchText, setSearchText] = useState("");
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const supplies = useSupplySearch(searchText, "", visible && !selectedSupply);
  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues,
  });

  const resetAndClose = () => {
    form.reset(defaultValues);
    setSearchText("");
    setSelectedSupply(null);
    onClose();
  };
  const movement = useCreateStockMovement(resetAndClose);
  const close = () => {
    if (!movement.loading) resetAndClose();
  };

  const chooseSupply = (supply: Supply) => {
    setSelectedSupply(supply);
    form.setValue("supplyId", supply.id, { shouldValidate: true });
  };

  return (
    <ThemedModal
      visible={visible}
      title="Movimentar estoque"
      onClose={close}
      footer={
        <View className="gap-3 sm:flex-row sm:justify-end">
          <ThemedButton label="Cancelar" variant="secondary" disabled={movement.loading} onPress={close} className="sm:min-w-36" />
          <ThemedButton label="Registrar movimento" loading={movement.loading} onPress={form.handleSubmit(movement.create)} className="sm:min-w-48" />
        </View>
      }
    >
      <View className="gap-5">
        {selectedSupply ? (
          <View className="gap-2">
            <ThemedText type="smallBold" themeColor="textOnBackground2">Mantimento</ThemedText>
            <View className="flex-row items-center justify-between gap-3 rounded-xl border border-border p-4">
              <View className="min-w-0 flex-1 gap-1">
                <ThemedText type="smallBold" themeColor="textOnBackground2">{selectedSupply.name}</ThemedText>
                <ThemedText type="small" themeColor="textMutedOnBackground2">
                  Saldo atual: {formatSupplyQuantity(selectedSupply.currentQuantity, selectedSupply.unit)}
                </ThemedText>
              </View>
              <ThemedButton
                label="Trocar"
                variant="secondary"
                disabled={movement.loading}
                onPress={() => {
                  setSelectedSupply(null);
                  form.setValue("supplyId", "", { shouldValidate: true });
                }}
              />
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <SearchField
              label="Mantimento"
              placeholder="Buscar mantimento"
              value={searchText}
              onChangeText={(value) => setSearchText(value.slice(0, 200))}
            />
            {supplies.loading && supplies.rows.length === 0 ? (
              <ActivityIndicator accessibilityLabel="Carregando mantimentos" color={colors.foregroundStrong} />
            ) : supplies.error && supplies.rows.length === 0 ? (
              <ThemedEmptyState
                title="Não foi possível buscar mantimentos."
                action={{ label: "Tentar novamente", onPress: supplies.retry }}
              />
            ) : supplies.rows.length === 0 ? (
              <ThemedText type="small" themeColor="textMutedOnBackground2">Nenhum mantimento encontrado.</ThemedText>
            ) : (
              <View className="gap-2">
                {supplies.rows.map((supply) => (
                  <Pressable
                    key={supply.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar ${supply.name}`}
                    onPress={() => chooseSupply(supply)}
                    className="min-h-14 justify-center rounded-xl border border-border px-4 py-3 active:bg-backgroundSelected"
                  >
                    <ThemedText type="smallBold" themeColor="textOnBackground2">{supply.name}</ThemedText>
                    <ThemedText type="small" themeColor="textMutedOnBackground2">
                      {formatSupplyQuantity(supply.currentQuantity, supply.unit)} em estoque
                    </ThemedText>
                  </Pressable>
                ))}
                {supplies.hasMore ? (
                  <ThemedButton label={supplies.loadingMore ? "Carregando..." : "Carregar mais"} variant="secondary" loading={supplies.loadingMore} onPress={supplies.loadMore} />
                ) : null}
                {supplies.error ? (
                  <ThemedButton label="Tentar novamente" variant="secondary" onPress={supplies.retry} />
                ) : null}
              </View>
            )}
          </View>
        )}
        {form.formState.errors.supplyId?.message ? (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {form.formState.errors.supplyId.message}
          </ThemedText>
        ) : null}
        <SegmentedField control={form.control} name="type" label="Tipo de movimento" options={movementTypes} disabled={movement.loading} />
        <TextField
          control={form.control}
          name="quantity"
          label="Quantidade"
          placeholder="Informe a quantidade"
          keyboardType="numeric"
          maxLength={10}
          editable={!movement.loading}
        />
        <TextField
          control={form.control}
          name="reason"
          label="Motivo (opcional)"
          placeholder="Ex.: doação recebida"
          multiline
          numberOfLines={3}
          maxLength={2000}
          editable={!movement.loading}
        />
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          Esta movimentação ficará registrada no histórico.
        </ThemedText>
      </View>
    </ThemedModal>
  );
}
