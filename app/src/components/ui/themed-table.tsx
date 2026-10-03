import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ThemedEmptyState } from "./themed-empty-state";

export type TableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
};
type Props<T> = {
  rows: readonly T[];
  columns: readonly TableColumn<T>[];
  rowKey: (row: T) => string;
  onRowPress?: (row: T) => void;
  rowLabel?: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
};

export function ThemedTable<T>({
  rows,
  columns,
  rowKey,
  onRowPress,
  rowLabel,
  loading,
  emptyTitle = "Nenhum registro encontrado.",
}: Props<T>) {
  const colors = useTheme();
  if (loading && !rows.length)
    return (
      <ActivityIndicator
        accessibilityLabel="Carregando registros"
        color={colors.foregroundStrong}
      />
    );
  if (!rows.length) return <ThemedEmptyState title={emptyTitle} />;
  return (
    <View role="table" className="w-full gap-1">
      <View
        role="row"
        className="flex-row gap-4 border-b border-border px-3 py-3"
      >
        {columns.map((column) => (
          <View
            role="columnheader"
            key={column.key}
            className={column.className ?? "min-w-0 flex-1"}
          >
            <ThemedText type="smallBold" themeColor="textMutedOnBackground2">
              {column.label}
            </ThemedText>
          </View>
        ))}
      </View>
      {rows.map((row) => (
        <Pressable
          key={rowKey(row)}
          role={onRowPress ? "button" : "row"}
          accessibilityLabel={rowLabel?.(row)}
          disabled={!onRowPress}
          onPress={() => onRowPress?.(row)}
          className="flex-row items-center gap-4 rounded-xl px-3 py-4 active:bg-backgroundSelected"
        >
          {columns.map((column) => (
            <View
              key={column.key}
              className={column.className ?? "min-w-0 flex-1"}
            >
              {column.render(row)}
            </View>
          ))}
        </Pressable>
      ))}
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Carregando mais registros"
          color={colors.foregroundStrong}
        />
      ) : null}
    </View>
  );
}
