import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  colorScheme as nativeWindColorScheme,
  useColorScheme,
} from "nativewind";

import { notifications } from "@/services/notifications";
import {
  themePreferenceStorage,
  type ThemePreference,
} from "@/services/theme-preference";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  activeScheme: "light" | "dark";
  ready: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const { colorScheme } = useColorScheme();

  const [preference, setPreferenceState] =
    useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void themePreferenceStorage
      .get()
      .then((savedPreference) => {
        if (!mounted || !savedPreference) return;
        setPreferenceState(savedPreference);
        nativeWindColorScheme.set(savedPreference);
      })
      .catch(() => {
        if (!mounted) return;
        setPreferenceState("system");
        nativeWindColorScheme.set("system");
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    nativeWindColorScheme.set(nextPreference);
    setPreferenceState(nextPreference);

    try {
      await themePreferenceStorage.set(nextPreference);
    } catch {
      notifications.error("Não foi possível salvar sua preferência de tema.");
    }
  }, []);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      preference,
      activeScheme: colorScheme === "dark" ? "dark" : "light",
      ready,
      setPreference,
    }),
    [preference, colorScheme, ready, setPreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error(
      "useThemePreference deve ser usado dentro de ThemePreferenceProvider.",
    );
  }
  return context;
}
