import { useEffect, useRef, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppThemeProvider } from "@/components/app-theme-provider";
import { AppToastHost } from "@/components/app-toast-host";
import { ThemedText } from "@/components/themed-text";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function ThemedModal({
  visible,
  title,
  onClose,
  children,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();
  const dialog = useRef<View>(null);
  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const previous = document.activeElement as HTMLElement | null;
    const getFocusable = () =>
      Array.from(
        (
          dialog.current as unknown as HTMLElement
        )?.querySelectorAll<HTMLElement>(
          'input, textarea, button, [tabindex="0"]',
        ) ?? [],
      ).filter(
        (node) =>
          !node.hasAttribute("disabled") && node.getClientRects().length > 0,
      );
    const timer = setTimeout(() => getFocusable()[0]?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const items = getFocusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <AppThemeProvider>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 items-center justify-end md:justify-center md:p-8"
        >
          <Pressable
            onPress={onClose}
            accessibilityLabel="Fechar janela"
            className="absolute inset-0 bg-background1 opacity-80"
          />
          <View
            ref={dialog}
            role="dialog"
            accessibilityViewIsModal
            accessibilityLabel={title}
            className="max-h-[85%] w-full max-w-3xl rounded-t-3xl border border-border bg-background2 md:rounded-3xl"
          >
            <View className="flex-row items-center justify-between gap-4 border-b border-border p-5">
              <ThemedText
                type="heading"
                themeColor="textOnBackground2"
                className="flex-1"
              >
                {title}
              </ThemedText>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={`Fechar ${title}`}
                className="h-11 w-11 items-center justify-center"
              >
                <ThemedText themeColor="textOnBackground2" type="heading">
                  ×
                </ThemedText>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" className="shrink">
              <View
                className="gap-5 p-5"
                style={
                  footer
                    ? undefined
                    : { paddingBottom: Math.max(20, insets.bottom + 12) }
                }
              >
                {children}
              </View>
            </ScrollView>
            {footer ? (
              <View
                className="gap-3 border-t border-border p-5"
                style={{ paddingBottom: Math.max(20, insets.bottom + 12) }}
              >
                {footer}
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
        <AppToastHost />
      </AppThemeProvider>
    </Modal>
  );
}
