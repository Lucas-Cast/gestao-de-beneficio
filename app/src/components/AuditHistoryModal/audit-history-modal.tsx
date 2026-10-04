import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import { z } from "zod";

import { ThemedText } from "@/components/themed-text";
import { DateField } from "@/components/ui/date-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { useTheme } from "@/hooks/use-theme";
import { useAuditLogs } from "./hooks/use-audit-logs";
import type {
  AuditEntityType,
  AuditLog,
  AuditLogFilters,
} from "./types/audit";
import {
  auditAction,
  auditChanges,
  auditDate,
  auditEntityPluralLabel,
  auditSubject,
} from "./utils/audit-log";

const dateRangeSchema = z
  .object({ from: z.string(), to: z.string() })
  .superRefine(({ from, to }, context) => {
    if (from && to && from > to)
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "A data final deve ser igual ou posterior à data inicial.",
      });
  });

type DateRange = z.infer<typeof dateRangeSchema>;
const EMPTY_RANGE: DateRange = { from: "", to: "" };

type Props = {
  visible: boolean;
  onClose: () => void;
  entityType: AuditEntityType;
  entityId?: string;
  changedById?: string;
  title?: string;
};

function toDateTime(date: string, endOfDay: boolean) {
  if (!date) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day);
  if (endOfDay) value.setHours(23, 59, 59, 999);
  return value.toISOString();
}

export function AuditHistoryModal({ visible, ...props }: Props) {
  if (!visible) return null;
  return <AuditHistoryContent {...props} />;
}

function AuditHistoryContent({
  onClose,
  entityType,
  entityId,
  changedById,
  title,
}: Omit<Props, "visible">) {
  const colors = useTheme();
  const [appliedRange, setAppliedRange] = useState(EMPTY_RANGE);
  const { control, handleSubmit, reset } = useForm<DateRange>({
    resolver: zodResolver(dateRangeSchema),
    defaultValues: EMPTY_RANGE,
  });
  const selectedRange = useWatch({ control });
  const filters: AuditLogFilters = {
    entityType,
    entityId,
    changedById,
    ...(toDateTime(appliedRange.from, false)
      ? { from: toDateTime(appliedRange.from, false) }
      : {}),
    ...(toDateTime(appliedRange.to, true)
      ? { to: toDateTime(appliedRange.to, true) }
      : {}),
  };
  const history = useAuditLogs(filters);
  const modalTitle =
    title ?? `Histórico de ${auditEntityPluralLabel(entityType)}`;

  const applyRange = handleSubmit((range) => setAppliedRange(range));
  const clearRange = () => {
    reset(EMPTY_RANGE);
    setAppliedRange(EMPTY_RANGE);
  };

  return (
    <ThemedModal visible title={modalTitle} onClose={onClose}>
      <View className="gap-5">
        <View className="gap-3">
          <ThemedText themeColor="textOnBackground2" type="smallBold">
            Filtrar por período
          </ThemedText>
          <View className="gap-3 sm:flex-row">
            <View className="min-w-0 flex-1">
              <DateField
                control={control}
                name="from"
                label="Data inicial"
                maxDate={selectedRange.to || undefined}
              />
            </View>
            <View className="min-w-0 flex-1">
              <DateField
                control={control}
                name="to"
                label="Data final"
                minDate={selectedRange.from || undefined}
              />
            </View>
          </View>
          <View className="gap-2 sm:flex-row sm:justify-end">
            <ThemedButton
              label="Limpar período"
              variant="secondary"
              onPress={clearRange}
              className="sm:min-w-40"
            />
            <ThemedButton
              label="Aplicar período"
              onPress={applyRange}
              className="sm:min-w-40"
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
            accessibilityLabel="Carregando histórico de alterações"
            color={colors.foregroundStrong}
          />
        ) : history.error && history.rows.length === 0 ? (
          <ThemedButton
            label="Tentar novamente"
            variant="secondary"
            onPress={history.refresh}
            className="self-center"
          />
        ) : history.rows.length === 0 ? (
          <ThemedEmptyState title="Nenhuma alteração encontrada neste período." />
        ) : (
          <View>
            {history.rows.map((log) => (
              <AuditEntry key={log.id} log={log} />
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

function AuditEntry({ log }: { log: AuditLog }) {
  const changes = auditChanges(log);
  return (
    <View className="gap-3 border-b border-border py-4 last:border-b-0">
      <View className="gap-1 sm:flex-row sm:items-start sm:justify-between">
        <View className="min-w-0 gap-1">
          <ThemedText type="smallBold" themeColor="textOnBackground2">
            {auditAction(log)} · {auditSubject(log)}
          </ThemedText>
          <ThemedText type="small" themeColor="textMutedOnBackground2">
            Por {log.changedBy.name}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          {auditDate(log)}
        </ThemedText>
      </View>
      {changes.length ? (
        <View className="gap-2">
          {changes.map((change, index) => (
            <View
              key={`${change.label}-${index}`}
              className="gap-1 sm:flex-row sm:gap-2"
            >
              <ThemedText type="smallBold" themeColor="textOnBackground2">
                {change.label}:
              </ThemedText>
              <ThemedText type="small" themeColor="textOnBackground2">
                {change.before === undefined
                  ? change.after
                  : `${change.before} → ${change.after}`}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          Nenhuma alteração nos dados.
        </ThemedText>
      )}
    </View>
  );
}
