import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedCard } from "@/components/ui/themed-card";
import { formatDateTimeForDisplay } from "@/utils/date-format";
import { formatSupplyQuantity } from "@/utils/supply-format";

import type { DeliveryHistoryEntry } from "../types/delivery.types";

type Props = { delivery: DeliveryHistoryEntry };

export function DeliveryHistoryCard({ delivery }: Props) {
  return (
    <ThemedCard>
      <View className="gap-2 sm:flex-row sm:items-start sm:justify-between">
        <View className="min-w-0 flex-1 gap-1">
          <ThemedText type="subtitle" themeColor="textOnBackground2">
            {delivery.beneficiary.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textMutedOnBackground2">
            {delivery.basket.name}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textMutedOnBackground2">
          {formatDateTimeForDisplay(delivery.createdAt)}
        </ThemedText>
      </View>

      <View className="gap-3 sm:flex-row sm:flex-wrap">
        <Detail
          label="Quantidade entregue"
          value={basketCount(delivery.quantity)}
        />
        <Detail label="Entregue por" value={delivery.deliveredBy.name} />
      </View>

      <View className="gap-2">
        <ThemedText type="smallBold" themeColor="textOnBackground2">
          Mantimentos baixados
        </ThemedText>
        <View className="gap-2">
          {delivery.stockMovements.map((movement) => (
            <View
              key={movement.id}
              className="flex-row items-center justify-between gap-3"
            >
              <ThemedText
                type="small"
                themeColor="textMutedOnBackground2"
                className="min-w-0 flex-1"
              >
                {movement.supply.name}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textOnBackground2">
                {formatSupplyQuantity(movement.quantity, movement.supply.unit)}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {delivery.observation ? (
        <Detail label="Observação" value={delivery.observation} />
      ) : null}
    </ThemedCard>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1 gap-1">
      <ThemedText type="smallBold" themeColor="textOnBackground2">
        {label}
      </ThemedText>
      <ThemedText type="small" themeColor="textMutedOnBackground2">
        {value}
      </ThemedText>
    </View>
  );
}

function basketCount(quantity: number) {
  return `${quantity} ${quantity === 1 ? "cesta" : "cestas"}`;
}
