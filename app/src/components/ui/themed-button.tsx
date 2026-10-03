import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type Props = Omit<PressableProps, "children"> & {
  label: string;
  variant?: "primary" | "secondary";
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
};

export function ThemedButton({
  label,
  variant = "primary",
  loading,
  disabled,
  icon,
  className,
  ...props
}: Props) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: Boolean(disabled || loading),
        busy: loading,
      }}
      disabled={disabled || loading}
      className={[
        "min-h-14 flex-row items-center justify-center gap-3 rounded-xl px-5 py-3 active:opacity-80 disabled:opacity-50",
        variant === "primary"
          ? "bg-foreground"
          : "border border-border bg-background2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? colors.textOnForeground
              : colors.textOnBackground2
          }
        />
      ) : (
        icon
      )}
      <ThemedText
        type="smallBold"
        themeColor={
          variant === "primary" ? "textOnForeground" : "textOnBackground2"
        }
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
