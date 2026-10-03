import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import type { Basket } from "../types/delivery.types";
import { UNIT_LABELS } from "../validation/delivery.schema";
export function BasketComposition({
  basket,
  quantity = 1,
}: {
  basket: Basket;
  quantity?: number;
}) {
  return (
    <View className="gap-2">
      <ThemedText type="smallBold" themeColor="textOnBackground2">
        Composição da cesta
      </ThemedText>
      {basket.supplies.map((item) => (
        <ThemedText
          key={item.id}
          type="small"
          themeColor="textMutedOnBackground2"
        >
          {item.quantity * quantity}{" "}
          {UNIT_LABELS[item.supply.unit] ?? item.supply.unit} de{" "}
          {item.supply.name}
        </ThemedText>
      ))}
    </View>
  );
}
