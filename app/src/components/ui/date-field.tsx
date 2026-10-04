import { useMemo, useState } from "react";
import {
  Controller,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from "react-hook-form";
import { Pressable, View } from "react-native";

import { TextFieldInput } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { ThemedModal } from "@/components/ui/themed-modal";

type DateFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
};

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function formatDateForDisplay(value: string) {
  const date = parseDate(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function DateField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  control,
  name,
  label,
  minDate,
  maxDate,
  placeholder = "DD/MM/AAAA",
  disabled,
}: DateFieldProps<TFieldValues, TName>) {
  const [visible, setVisible] = useState(false);
  const [month, setMonth] = useState(() =>
    parseDate(maxDate ?? todayDate()),
  );

  return (
    <Controller<TFieldValues, TName>
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = String(field.value ?? "");

        return (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityHint={fieldState.error?.message}
              accessibilityState={{ disabled: Boolean(disabled) }}
              disabled={disabled}
              onPress={() => {
                if (disabled) return;
                setMonth(parseDate(selected || maxDate || todayDate()));
                setVisible(true);
              }}
              onBlur={field.onBlur}
              className={disabled ? "opacity-50" : undefined}
            >
              <TextFieldInput
                ref={field.ref}
                label={label}
                value={selected ? formatDateForDisplay(selected) : ""}
                error={fieldState.error?.message}
                placeholder={placeholder}
                editable={false}
                showSoftInputOnFocus={false}
                accessible={false}
              />
            </Pressable>
            <CalendarModal
              visible={visible}
              label={label}
              month={month}
              selected={selected}
              minDate={minDate}
              maxDate={maxDate}
              onClose={() => setVisible(false)}
              onMonthChange={setMonth}
              onSelect={(date) => {
                field.onChange(date);
                field.onBlur();
                setVisible(false);
              }}
            />
          </>
        );
      }}
    />
  );
}

type CalendarModalProps = {
  visible: boolean;
  label: string;
  month: Date;
  selected: string;
  minDate?: string;
  maxDate?: string;
  onClose: () => void;
  onMonthChange: (month: Date) => void;
  onSelect: (date: string) => void;
};

function CalendarModal({
  visible,
  label,
  month,
  selected,
  minDate,
  maxDate,
  onClose,
  onMonthChange,
  onSelect,
}: CalendarModalProps) {
  const weeks = useMemo(() => {
    const startOffset = month.getUTCDay();
    return Array.from({ length: 6 }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const day = weekIndex * 7 + dayIndex - startOffset + 1;
        return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day));
      }),
    );
  }, [month]);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(month);
  const firstMonth = minDate ? monthKey(parseDate(minDate)) : undefined;
  const lastMonth = maxDate ? monthKey(parseDate(maxDate)) : undefined;
  const canGoBackward = !firstMonth || monthKey(month) > firstMonth;
  const canGoForward = !lastMonth || monthKey(month) < lastMonth;

  return (
    <ThemedModal visible={visible} title={label} onClose={onClose}>
      <View className="gap-4">
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
            accessibilityState={{ disabled: !canGoBackward }}
            disabled={!canGoBackward}
            onPress={() =>
              onMonthChange(
                new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)),
              )
            }
            className="h-11 w-11 items-center justify-center rounded-full active:bg-backgroundSelected disabled:opacity-40"
          >
            <ThemedText type="heading" themeColor="textOnBackground2">
              ‹
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold" themeColor="textOnBackground2">
            {monthLabel}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
            accessibilityState={{ disabled: !canGoForward }}
            disabled={!canGoForward}
            onPress={() =>
              onMonthChange(
                new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)),
              )
            }
            className="h-11 w-11 items-center justify-center rounded-full active:bg-backgroundSelected disabled:opacity-40"
          >
            <ThemedText type="heading" themeColor="textOnBackground2">
              ›
            </ThemedText>
          </Pressable>
        </View>

        <View className="flex-row">
          {WEEKDAYS.map((weekday, index) => (
            <View key={`${weekday}-${index}`} className="flex-1 items-center py-2">
              <ThemedText
                type="smallBold"
                themeColor="textMutedOnBackground2"
                accessibilityLabel={
                  [
                    "Domingo",
                    "Segunda-feira",
                    "Terça-feira",
                    "Quarta-feira",
                    "Quinta-feira",
                    "Sexta-feira",
                    "Sábado",
                  ][index]
                }
              >
                {weekday}
              </ThemedText>
            </View>
          ))}
        </View>

        <View className="gap-1">
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} className="flex-row">
              {week.map((date) => {
                const isoDate = date.toISOString().slice(0, 10);
                const sameMonth = date.getUTCMonth() === month.getUTCMonth();
                const isSelected = isoDate === selected;
                const outsideRange =
                  (minDate !== undefined && isoDate < minDate) ||
                  (maxDate !== undefined && isoDate > maxDate);
                const isDisabled = !sameMonth || outsideRange;

                return (
                  <Pressable
                    key={isoDate}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar ${formatDateForDisplay(isoDate)}`}
                    accessibilityState={{
                      disabled: isDisabled,
                      selected: isSelected,
                    }}
                    disabled={isDisabled}
                    onPress={() => onSelect(isoDate)}
                    className={[
                      "m-0.5 h-11 flex-1 items-center justify-center rounded-full active:bg-backgroundSelected",
                      isSelected ? "bg-foreground" : "",
                      isDisabled ? "opacity-30" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <ThemedText
                      type="small"
                      themeColor={isSelected ? "textOnForeground" : "textOnBackground2"}
                    >
                      {date.getUTCDate()}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </ThemedModal>
  );
}
