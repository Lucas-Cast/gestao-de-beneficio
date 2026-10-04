import type { PropsWithChildren } from "react";
import { Platform, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

type ScreenProps = PropsWithChildren<{
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({ children, refreshing = false, onRefresh }: ScreenProps) {
  const colors = useTheme();

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 bg-background1"
    >
      <ScrollView
        testID="screen-scroll-view"
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        refreshControl={
          onRefresh && Platform.OS !== "web" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.foregroundStrong}
              colors={[colors.foregroundStrong]}
            />
          ) : undefined
        }
      >
        <View className="mx-auto w-full max-w-6xl gap-6 px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-10">
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
