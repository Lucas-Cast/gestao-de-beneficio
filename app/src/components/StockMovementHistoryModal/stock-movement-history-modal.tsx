import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import { z } from "zod";

import { ThemedText } from "@/components/themed-text";
import { DateField } from "@/components/ui/date-field";
import { SegmentedField } from "@/components/ui/segmented-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { useTheme } from "@/hooks/use-theme";

import { useStockMovements } from "./hooks/use-stock-movements";
import type {
  StockMovement,
  StockMovementFilters,
  StockMovementType,
} from "./types/stock-movement";
import {
  movementDate,
  movementQuantity,
  movementTypeLabel,
} from "./utils/stock-movement";

const filterSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    type: z.string(),
  })
  .superRefine(({ from, to }, context) => {
    if (from && to && from > to)
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "A data final deve ser igual ou posterior à data inicial.",
      });
  });

type FilterForm = z.infer<typeof filterSchema>;
const EMPTY_FORM: FilterForm = { from: "", to: "", type: "" };
const movementTypeOptions = [
  { label: "Todos", value: "" },
  { label: "Entrada", value: "IN" },
  { label: "Saída", value: "OUT" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  supplyId?: string;
  title?: string;
};

function toDateTime(date: string, endOfDay: boolean) {
  if (!date) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day);
  if (endOfDay) value.setHours(23, 59, 59, 999);
  return value.toISOString();
}

export function StockMovementHistoryModal({ visible, ...props }: Props) {
  if (!visible) return null;
  return <StockMovementHistoryContent {...props} />;
}

function StockMovementHistoryContent({
  onClose,
  supplyId,
  title,
}: Omit<Props, "visible">) {
  const colors = useTheme();
  const [applied, setApplied] = useState<FilterForm>(EMPTY_FORM);
  const form = useForm<FilterForm>({
    resolver: zodResolver(filterSchema),
    defaultValues: EMPTY_FORM,
  });
  const filters: StockMovementFilters = {
    ...(supplyId ? { supplyId } : {}),
    ...(applied.type ? { type: applied.type as StockMovementType } : {}),
    ...(toDateTime(applied.from, false)
      ? { from: toDateTime(applied.from, false) }
      : {}),
    ...(toDateTime(applied.to, true)
      ? { to: toDateTime(applied.to, true) }
      : {}),
  };
  const history = useStockMovements(filters);

  const applyFilters = form.handleSubmit(setApplied);
  const clearFilters = () => {
    form.reset(EMPTY_FORM);
    setApplied(EMPTY_FORM);
  };

  return (
    <ThemedModal
      visible
      title={title ?? (supplyId ? "Movimentações do mantimento" : "Histórico de movimentações")}
      onClose={onClose}
    >
      <View className="gap-5">
        <View className="gap-3">
          <ThemedText type="smallBold" themeColor="textOnBackground2">
            Filtrar histórico
          </ThemedText>
          <View className="gap-3 sm:flex-row">
            <View className="min-w-0 flex-1">
              <DateField
                control={form.control}
                name="from"
                label="Data inicial"
                maxDate={form.watch("to") || undefined}
              />
            </View>
            <View className="min-w-0 flex-1">
              <DateField
                control={form.control}
                name="to"
                label="Data final"
                minDate={form.watch("from") || undefined}
              />
            </View>
          </View>
          <SegmentedField
            control={form.control}
            name="type"
            label="Tipo de movimentação"
            options={movementTypeOptions}
          />
          <View className="gap-2 sm:flex-row sm:justify-end">
            <ThemedButton
              label="Limpar filtros"
              variant="secondary"
              onPress={clearFilters}
              className="sm:min-w-36"
            />
            <ThemedButton
              label="Aplicar filtros"
              onPress={applyFilters}
              className="sm:min-w-36"
            />
            <ThemedButton
              label="Atualizar histórico"
              variant="secondary"
              loading={history.refreshing}
              disabled={history.refreshing}
              onPress={history.refresh}
              className="sm:min-w-40"
            />
          </View>
        </View>

        {history.loading && history.rows.length === 0 ? (
          <ActivityIndicator
            accessibilityLabel="Carregando movimentações"
            color={colors.foregroundStrong}
          />
        ) : history.error && history.rows.length === 0 ? (
          <ThemedEmptyState
            title="Não foi possível carregar as movimentações."
            action={{ label: "Tentar novamente", onPress: history.refresh }}
          />
        ) : history.rows.length === 0 ? (
          <ThemedEmptyState title="Nenhuma movimentação encontrada com esses filtros." />
        ) : (
          <View>
            {history.rows.map((movement) => (
              <MovementEntry key={movement.id} movement={movement} />
            ))}
            {history.error ? (
              <ThemedButton
                label="Tentar novamente"
                variant="secondary"
                onPress={history.refresh}
                className="self-start"
              />
            ) : null}
          </View>
        )}

        {history.hasMore && !history.error ? (
          <ThemedButton
            label={history.loadingMore ? "Carregando..." : "Carregar mais"}
            variant="secondary"
            loading={history.loadingMore}
            onPress={history.loadMore}
            className="self-center"
          />
        ) : null}
      </View>
    </ThemedModal>
  );
}

function MovementEntry({ movement }: { movement: StockMovement }) {
  const isEntry = movement.type === "IN";
  return (
    <View className="gap-2 border-b border-border py-4 last:border-b-0">
      <View className="gap-1 sm:flex-row sm:items-start sm:justify-between">
        <View className="min-w-0 gap-1">
          <ThemedText type="smallBold" themeColor="textOnBackground2">
            {movementTypeLabel(movement.type)} · {movementQuantity(movement)}
          </ThemedText>
          <ThemedText type="small" themeColor="textMutedOnBackground2">
            {movement.supply.name} · Por {movement.performedBy.name}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          {movementDate(movement.createdAt)}
        </ThemedText>
      </View>
      {movement.reason ? (
        <ThemedText type="small" themeColor="textOnBackground2">
          Motivo: {movement.reason}
        </ThemedText>
      ) : null}
      {movement.basketDeliveryId ? (
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          Movimento relacionado a uma entrega de cesta.
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor={isEntry ? "success" : "warning"}>
        {isEntry ? "Aumentou o estoque" : "Reduziu o estoque"}
      </ThemedText>
    </View>
  );
}
