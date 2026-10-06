import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { SelectOption } from "./select-field";

type SegmentedFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  options: readonly SelectOption[];
  disabled?: boolean;
};

export function SegmentedField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  disabled,
}: SegmentedFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View className="gap-2">
          <ThemedText type="smallBold" themeColor="textOnBackground2">{label}</ThemedText>
          <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row gap-2">
            {options.map((option) => {
              const active = option.value === field.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: active, disabled: Boolean(disabled) }}
                  disabled={disabled}
                  onPress={() => {
                    field.onChange(option.value);
                    field.onBlur();
                  }}
                  className={[
                    "min-h-12 min-w-0 flex-1 items-center justify-center rounded-xl border px-3 py-2 disabled:opacity-50",
                    active ? "border-foreground bg-foreground" : "border-border bg-background2",
                  ].join(" ")}
                >
                  <ThemedText type="smallBold" themeColor={active ? "textOnForeground" : "textOnBackground2"}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          {fieldState.error?.message ? (
            <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
              {fieldState.error.message}
            </ThemedText>
          ) : null}
        </View>
      )}
    />
  );
}
