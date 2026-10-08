import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formatSupplyQuantity } from "@/utils/supply-format";

import type { Basket } from "../types/delivery.types";

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
          {formatSupplyQuantity(item.quantity * quantity, item.supply.unit)}
          {" de "}
          {item.supply.name}
        </ThemedText>
      ))}
    </View>
  );
}
