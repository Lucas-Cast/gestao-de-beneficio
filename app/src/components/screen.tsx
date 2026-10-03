import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 bg-background1"
    >
      <ScrollView keyboardShouldPersistTaps="handled" className="flex-1">
        <View className="mx-auto w-full max-w-6xl gap-6 px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-10">
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
