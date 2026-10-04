import { useRef, type PropsWithChildren } from "react";
import { Platform, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

type ScreenProps = PropsWithChildren<{
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({ children, refreshing = false, onRefresh }: ScreenProps) {
  const colors = useTheme();
  const scrollOffsetY = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const startWebPull = (pageX: number, pageY: number) => {
    if (Platform.OS === "web" && onRefresh && scrollOffsetY.current <= 0) {
      touchStart.current = { x: pageX, y: pageY };
    } else {
      touchStart.current = null;
    }
  };

  const finishWebPull = (pageX: number, pageY: number) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || Platform.OS !== "web" || scrollOffsetY.current > 0) return;

    const deltaY = pageY - start.y;
    const deltaX = pageX - start.x;
    if (deltaY >= 96 && deltaY > Math.abs(deltaX)) {
      window.location.reload();
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 bg-background1"
    >
      <ScrollView
        testID="screen-scroll-view"
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        onScroll={(event) => {
          if (Platform.OS === "web") {
            scrollOffsetY.current = event.nativeEvent.contentOffset.y;
          }
        }}
        scrollEventThrottle={16}
        onTouchStart={(event) => {
          const touch = event.nativeEvent.touches[0] ?? event.nativeEvent;
          startWebPull(touch.pageX, touch.pageY);
        }}
        onTouchEnd={(event) => {
          const touch =
            event.nativeEvent.changedTouches[0] ?? event.nativeEvent;
          finishWebPull(touch.pageX, touch.pageY);
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
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
