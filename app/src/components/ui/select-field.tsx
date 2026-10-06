import { forwardRef, useState } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Pressable, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ThemedModal } from "./themed-modal";

export type SelectOption = { label: string; value: string };

type SelectFieldInputProps = {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
};

/** Presentational select. Filtering and option loading belong to its caller. */
export const SelectFieldInput = forwardRef<View, SelectFieldInputProps>(function SelectFieldInput({
  label,
  value,
  options,
  onValueChange,
  onBlur,
  placeholder = "Selecione uma opção",
  disabled,
  error,
}: SelectFieldInputProps, ref) {
  const [open, setOpen] = useState(false);
  const colors = useTheme();
  const selected = options.find((option) => option.value === value);
  const close = () => {
    setOpen(false);
    onBlur?.();
  };

  return (
    <View className="w-full gap-2">
      <ThemedText type="smallBold" themeColor="textOnBackground2">
        {label}
      </ThemedText>
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityHint={error}
        accessibilityState={{ disabled: Boolean(disabled), expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={[
          "min-h-14 flex-row items-center justify-between rounded-xl border bg-background2 px-4 py-3 active:bg-backgroundSelected disabled:opacity-50",
          error ? "border-danger" : "border-border",
        ].join(" ")}
      >
        <ThemedText themeColor={selected ? "textOnBackground2" : "textMutedOnBackground2"}>
          {selected?.label ?? placeholder}
        </ThemedText>
        <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textMutedOnBackground2} />
      </Pressable>
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
      <ThemedModal visible={open} title={label} onClose={close}>
        <View className="gap-2">
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: value === option.value }}
              onPress={() => {
                onValueChange(option.value);
                close();
              }}
              className={[
                "min-h-12 justify-center rounded-xl border px-4 py-3 active:bg-backgroundSelected",
                value === option.value ? "border-foreground bg-backgroundSelected" : "border-border",
              ].join(" ")}
            >
              <ThemedText themeColor="textOnBackground2">{option.label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedModal>
    </View>
  );
});

SelectFieldInput.displayName = "SelectFieldInput";

type SelectFieldProps<TFieldValues extends FieldValues> = Omit<
  SelectFieldInputProps,
  "value" | "onValueChange" | "onBlur" | "error"
> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
};

export function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  ...props
}: SelectFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <SelectFieldInput
          ref={field.ref}
          {...props}
          value={String(field.value ?? "")}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
