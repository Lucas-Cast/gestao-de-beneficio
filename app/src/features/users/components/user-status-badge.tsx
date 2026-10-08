import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <View className="self-start rounded-full bg-background3 px-3 py-1">
      <ThemedText type="smallBold" themeColor={isActive ? "success" : "danger"}>
        {isActive ? "Ativo" : "Desativado"}
      </ThemedText>
    </View>
  );
}
