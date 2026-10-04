import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const THEME_PREFERENCE_KEY = "gestao-beneficio.theme";

export type ThemePreference = "system" | "light" | "dark";

function getWebStorage(): Storage | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return window.localStorage;
}

function parsePreference(value: string | null): ThemePreference | null {
  return value === "system" || value === "light" || value === "dark"
    ? value
    : null;
}

export const themePreferenceStorage = {
  async get(): Promise<ThemePreference | null> {
    const webStorage = getWebStorage();
    const value = webStorage
      ? webStorage.getItem(THEME_PREFERENCE_KEY)
      : await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);

    return parsePreference(value);
  },

  async set(preference: ThemePreference): Promise<void> {
    const webStorage = getWebStorage();
    if (webStorage) {
      webStorage.setItem(THEME_PREFERENCE_KEY, preference);
      return;
    }

    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
  },
};
