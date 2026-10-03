import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedCard } from "@/components/ui/themed-card";
type Props = { indicators: readonly { label: string; value: number }[] };
export function HomeIndicators({ indicators }: Props) {
  return (
    <View className="gap-3">
      <ThemedText type="small">Dados demonstrativos</ThemedText>
      <View className="flex-row flex-wrap gap-3">
        {indicators.map((item, index) => (
          <ThemedCard
            key={item.label}
            className={index === 2 ? "w-full md:flex-1" : "min-w-0 flex-1"}
          >
            <ThemedText type="metric" themeColor="textOnBackground2">
              {item.value}
            </ThemedText>
            <ThemedText type="small" themeColor="textMutedOnBackground2">
              {item.label}
            </ThemedText>
          </ThemedCard>
        ))}
      </View>
    </View>
  );
}
