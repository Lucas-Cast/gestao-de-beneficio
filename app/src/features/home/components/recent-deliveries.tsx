import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedTable } from "@/components/ui/themed-table";
type RecentDelivery = {
  id: string;
  name: string;
  basket: string;
  quantity: number;
  time: string;
};
function RecentDeliveryRow({ row }: { row: RecentDelivery }) {
  return (
    <View className="flex-row justify-between gap-3 border-b border-border py-4">
      <View className="flex-1">
        <ThemedText themeColor="textOnBackground2">{row.name}</ThemedText>
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          {row.basket} · {row.quantity} cesta(s)
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textMutedOnBackground2">
        {row.time}
      </ThemedText>
    </View>
  );
}
export function RecentDeliveries({
  rows,
}: {
  rows: readonly RecentDelivery[];
}) {
  return (
    <ThemedCard>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <ThemedText type="heading" themeColor="textOnBackground2">
          Últimas entregas
        </ThemedText>
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          Demonstração
        </ThemedText>
      </View>
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
              key: "name",
              label: "Beneficiário",
              render: (row) => (
                <ThemedText themeColor="textOnBackground2">
                  {row.name}
                </ThemedText>
              ),
            },
            {
              key: "basket",
              label: "Cesta",
              render: (row) => (
                <ThemedText themeColor="textOnBackground2">
                  {row.basket}
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
                  {row.time}
                </ThemedText>
              ),
            },
          ]}
        />
      </View>
    </ThemedCard>
  );
}
