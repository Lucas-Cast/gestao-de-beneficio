import "@/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "nativewind";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppThemeProvider } from "@/components/app-theme-provider";
import { AppToastHost } from "@/components/app-toast-host";
import { Colors } from "@/constants/theme";
import { ThemePreferenceProvider } from "@/context/theme-preference-context";
import { UserProvider } from "@/context/user-context";
import { queryClient } from "@/services/api/query-client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <RootLayoutContent />
    </ThemePreferenceProvider>
  );
}

function RootLayoutContent() {
  const { colorScheme } = useColorScheme();
  const navigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <ThemeProvider
            value={{
              ...navigationTheme,
              colors: {
                ...navigationTheme.colors,
                background: colors.background1,
                card: colors.background2,
                border: colors.border,
                text: colors.text,
                primary: colors.foregroundStrong,
              },
            }}
          >
            <AppThemeProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="deliveries/new" />
                <Stack.Screen name="beneficiaries/new" />
                <Stack.Screen name="beneficiaries/deleted" />
                <Stack.Screen name="beneficiaries/[id]/edit" />
              </Stack>
              <AnimatedSplashOverlay />
              <AppToastHost />
            </AppThemeProvider>
          </ThemeProvider>
        </UserProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
