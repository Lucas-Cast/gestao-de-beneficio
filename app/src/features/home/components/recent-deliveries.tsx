import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedTable } from "@/components/ui/themed-table";
import { formatTimeForDisplay } from "@/utils/date-format";

import type { HomeRecentDelivery } from "../types/home.types";

type RecentDelivery = HomeRecentDelivery;
function RecentDeliveryRow({ row }: { row: RecentDelivery }) {
  return (
    <View className="flex-row justify-between gap-3 border-b border-border py-4">
      <View className="flex-1">
        <ThemedText themeColor="textOnBackground2">
          {row.beneficiary.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          {row.basket.name} · {row.quantity}{" "}
          {row.quantity === 1 ? "cesta" : "cestas"}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textMutedOnBackground2">
        {formatTimeForDisplay(row.createdAt)}
      </ThemedText>
    </View>
  );
}
export function RecentDeliveries({
  rows,
  loading,
}: {
  rows: readonly RecentDelivery[];
  loading: boolean;
}) {
  return (
    <ThemedCard>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <ThemedText type="heading" themeColor="textOnBackground2">
          Últimas entregas
        </ThemedText>
      </View>
      {loading && rows.length === 0 ? (
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          Carregando entregas…
        </ThemedText>
      ) : rows.length === 0 ? (
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          Nenhuma entrega registrada ainda.
        </ThemedText>
      ) : (
        <>
          <View className="md:hidden">
            {rows.map((row) => (
              <RecentDeliveryRow row={row} key={row.id} />
            ))}
          </View>
          <View className="hidden md:flex">
            <ThemedTable
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: "beneficiary",
                  label: "Beneficiário",
                  render: (row) => (
                    <ThemedText themeColor="textOnBackground2">
                      {row.beneficiary.name}
                    </ThemedText>
                  ),
                },
                {
                  key: "basket",
                  label: "Cesta",
                  render: (row) => (
                    <ThemedText themeColor="textOnBackground2">
                      {row.basket.name}
                    </ThemedText>
                  ),
                },
                {
                  key: "quantity",
                  label: "Quantidade",
                  render: (row) => (
                    <ThemedText themeColor="textOnBackground2">
                      {row.quantity}
                    </ThemedText>
                  ),
                },
                {
                  key: "time",
                  label: "Horário",
                  render: (row) => (
                    <ThemedText themeColor="textOnBackground2">
                      {formatTimeForDisplay(row.createdAt)}
                    </ThemedText>
                  ),
                },
              ]}
            />
          </View>
        </>
      )}
    </ThemedCard>
  );
}
