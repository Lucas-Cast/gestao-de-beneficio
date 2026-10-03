import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "./themed-button";

type Props = {
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
};

export function ThemedEmptyState({ title, description, action }: Props) {
  return (
    <View className="items-center gap-4 py-8">
      <ThemedText
        themeColor="textOnBackground2"
        type="heading"
        className="text-center"
      >
        {title}
      </ThemedText>
      {description ? (
        <ThemedText themeColor="textMutedOnBackground2" className="text-center">
          {description}
        </ThemedText>
      ) : null}
      {action ? (
        <ThemedButton label={action.label} onPress={action.onPress} />
      ) : null}
    </View>
  );
}
