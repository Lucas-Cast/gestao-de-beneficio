import type { ReactNode } from "react";
import { View } from "react-native";

import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";

export type CrudPrimaryAction = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export type CrudScreenLayoutProps = {
  title: string;
  description?: string;
  primaryAction?: CrudPrimaryAction;
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/** Shared CRUD page presentation; data and feature behavior stay with callers. */
export function CrudScreenLayout({
  title,
  description,
  primaryAction,
  toolbar,
  children,
  footer,
}: CrudScreenLayoutProps) {
  return (
    <Screen>
      <View className="gap-5">
        <View className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <View className="min-w-0 flex-1 gap-1">
            <ThemedText type="heading">{title}</ThemedText>
            {description ? (
              <ThemedText themeColor="textSecondary">
                {description}
              </ThemedText>
            ) : null}
          </View>
          {primaryAction ? (
            <ThemedButton
              label={primaryAction.label}
              onPress={primaryAction.onPress}
              loading={primaryAction.loading}
              disabled={primaryAction.disabled}
              className="sm:min-w-48"
            />
          ) : null}
        </View>

        {toolbar ? <View className="gap-3">{toolbar}</View> : null}

        <ThemedCard>{children}</ThemedCard>

        {footer ? <View className="items-center">{footer}</View> : null}
      </View>
    </Screen>
  );
}
