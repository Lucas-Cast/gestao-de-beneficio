import { Pressable, View } from "react-native";
import Toast, { type ToastConfig } from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";

const config: ToastConfig = Object.fromEntries(
  (["error", "success"] as const).map((type) => [
    type,
    ({
      text1,
      hide,
      isVisible,
    }: {
      text1?: string;
      hide: () => void;
      isVisible: boolean;
    }) => (
      <Pressable
        accessibilityRole="alert"
        aria-hidden={!isVisible}
        accessibilityElementsHidden={!isVisible}
        importantForAccessibility={isVisible ? "yes" : "no-hide-descendants"}
        accessibilityLabel={text1}
        accessibilityHint="Toque para fechar a mensagem."
        onPress={hide}
        className="w-11/12 max-w-xl flex-row items-center gap-3 rounded-2xl border border-border bg-background2 p-4 shadow-lg"
      >
        <View
          className={[
            "h-10 w-1 rounded-full",
            type === "error" ? "bg-danger" : "bg-success",
          ].join(" ")}
        />
        <ThemedText themeColor="textOnBackground2" className="flex-1">
          {text1}
        </ThemedText>
        <ThemedText themeColor="textMutedOnBackground2">×</ThemedText>
      </Pressable>
    ),
  ]),
);

export function AppToastHost() {
  const insets = useSafeAreaInsets();
  return <Toast config={config} position="top" topOffset={insets.top + 12} />;
}
