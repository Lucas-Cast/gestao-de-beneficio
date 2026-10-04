import { useRef, useState, type PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

type ScreenProps = PropsWithChildren<{
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

const PULL_TO_RELOAD_THRESHOLD = 96;
const MAX_PULL_INDICATOR_DISTANCE = 72;

export function Screen({ children, refreshing = false, onRefresh }: ScreenProps) {
  const colors = useTheme();
  const scrollOffsetY = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  const startWebPull = (pageX: number, pageY: number) => {
    if (Platform.OS === "web" && onRefresh && scrollOffsetY.current <= 0) {
      touchStart.current = { x: pageX, y: pageY };
    } else {
      touchStart.current = null;
      setPullDistance(0);
    }
  };

  const updateWebPull = (pageX: number, pageY: number) => {
    const start = touchStart.current;
    if (!start || Platform.OS !== "web" || isReloading) return;

    const deltaY = pageY - start.y;
    const deltaX = pageX - start.x;
    if (deltaY > 0 && deltaY > Math.abs(deltaX)) {
      setPullDistance(Math.min(deltaY, MAX_PULL_INDICATOR_DISTANCE));
    } else {
      setPullDistance(0);
    }
  };

  const finishWebPull = (pageX: number, pageY: number) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || Platform.OS !== "web" || scrollOffsetY.current > 0) {
      setPullDistance(0);
      return;
    }

    const deltaY = pageY - start.y;
    const deltaX = pageX - start.x;
    if (
      deltaY >= PULL_TO_RELOAD_THRESHOLD &&
      deltaY > Math.abs(deltaX)
    ) {
      setPullDistance(MAX_PULL_INDICATOR_DISTANCE);
      setIsReloading(true);
      window.setTimeout(() => window.location.reload(), 180);
    } else {
      setPullDistance(0);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="relative flex-1 bg-background1"
    >
      {Platform.OS === "web" &&
        onRefresh &&
        (pullDistance > 0 || isReloading) && (
          <View
            pointerEvents="none"
            className="absolute left-0 right-0 top-2 z-50 items-center"
            style={{
              transform: [
                {
                  translateY: isReloading
                    ? MAX_PULL_INDICATOR_DISTANCE
                    : pullDistance,
                },
              ],
            }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background2 shadow-md">
              <ActivityIndicator
                size="small"
                color={colors.foregroundStrong}
                accessibilityLabel={
                  isReloading
                    ? "Recarregando a página"
                    : "Puxe para atualizar a página"
                }
              />
            </View>
          </View>
        )}
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
        onTouchMove={(event) => {
          const touch = event.nativeEvent.touches[0] ?? event.nativeEvent;
          updateWebPull(touch.pageX, touch.pageY);
        }}
        onTouchEnd={(event) => {
          const touch =
            event.nativeEvent.changedTouches[0] ?? event.nativeEvent;
          finishWebPull(touch.pageX, touch.pageY);
        }}
        onTouchCancel={() => {
          touchStart.current = null;
          setPullDistance(0);
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
