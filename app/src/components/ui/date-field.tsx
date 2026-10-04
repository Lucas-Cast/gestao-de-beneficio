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
const YEARS_PER_PAGE = 12;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function createMonth(year: number, monthIndex: number) {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function firstDayOfMonth(date: Date) {
  return createMonth(date.getUTCFullYear(), date.getUTCMonth());
}

function firstYearOnPage(year: number) {
  return Math.floor((year - 1) / YEARS_PER_PAGE) * YEARS_PER_PAGE + 1;
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
    firstDayOfMonth(parseDate(maxDate ?? todayDate())),
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
                setMonth(
                  firstDayOfMonth(
                    parseDate(selected || maxDate || todayDate()),
                  ),
                );
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
            {visible ? (
              <CalendarModal
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
            ) : null}
          </>
        );
      }}
    />
  );
}

type CalendarModalProps = {
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
  label,
  month,
  selected,
  minDate,
  maxDate,
  onClose,
  onMonthChange,
  onSelect,
}: CalendarModalProps) {
  const [selectingYear, setSelectingYear] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(() =>
    firstYearOnPage(month.getUTCFullYear()),
  );
  const weeks = useMemo(() => {
    const startOffset = month.getUTCDay();
    return Array.from({ length: 6 }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const day = weekIndex * 7 + dayIndex - startOffset + 1;
        const date = createMonth(month.getUTCFullYear(), month.getUTCMonth());
        date.setUTCDate(day);
        return date;
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
  const firstYear = minDate ? parseDate(minDate).getUTCFullYear() : 1;
  const lastYear = maxDate ? parseDate(maxDate).getUTCFullYear() : 9999;
  const canGoBackward = selectingYear
    ? yearPageStart > firstYear
    : !firstMonth || monthKey(month) > firstMonth;
  const canGoForward = selectingYear
    ? yearPageStart + YEARS_PER_PAGE <= lastYear
    : !lastMonth || monthKey(month) < lastMonth;

  const selectYear = (year: number) => {
    const requested = createMonth(year, month.getUTCMonth());
    const lower = minDate ? firstDayOfMonth(parseDate(minDate)) : undefined;
    const upper = maxDate ? firstDayOfMonth(parseDate(maxDate)) : undefined;
    const next =
      lower && monthKey(requested) < monthKey(lower)
        ? lower
        : upper && monthKey(requested) > monthKey(upper)
          ? upper
          : requested;
    onMonthChange(next);
    setSelectingYear(false);
  };

  return (
    <ThemedModal visible title={label} onClose={onClose}>
      <View className="gap-4">
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              selectingYear ? "Anos anteriores" : "Mês anterior"
            }
            accessibilityState={{ disabled: !canGoBackward }}
            disabled={!canGoBackward}
            onPress={() => {
              if (selectingYear)
                setYearPageStart((start) => start - YEARS_PER_PAGE);
              else
                onMonthChange(
                  createMonth(month.getUTCFullYear(), month.getUTCMonth() - 1),
                );
            }}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-backgroundSelected disabled:opacity-40"
          >
            <ThemedText type="heading" themeColor="textOnBackground2">
              ‹
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              selectingYear
                ? "Voltar ao calendário"
                : `Escolher ano, ${monthLabel}`
            }
            accessibilityHint={
              selectingYear ? undefined : "Abre a seleção de ano"
            }
            onPress={() => {
              if (!selectingYear)
                setYearPageStart(firstYearOnPage(month.getUTCFullYear()));
              setSelectingYear(!selectingYear);
            }}
            className="min-h-11 flex-1 items-center justify-center rounded-xl active:bg-backgroundSelected"
          >
            <ThemedText type="smallBold" themeColor="textOnBackground2">
              {selectingYear
                ? `${yearPageStart}–${yearPageStart + YEARS_PER_PAGE - 1}`
                : monthLabel}
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={selectingYear ? "Próximos anos" : "Próximo mês"}
            accessibilityState={{ disabled: !canGoForward }}
            disabled={!canGoForward}
            onPress={() => {
              if (selectingYear)
                setYearPageStart((start) => start + YEARS_PER_PAGE);
              else
                onMonthChange(
                  createMonth(month.getUTCFullYear(), month.getUTCMonth() + 1),
                );
            }}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-backgroundSelected disabled:opacity-40"
          >
            <ThemedText type="heading" themeColor="textOnBackground2">
              ›
            </ThemedText>
          </Pressable>
        </View>

        {selectingYear ? (
          <View className="gap-2">
            {Array.from({ length: YEARS_PER_PAGE / 3 }, (_, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-2">
                {Array.from({ length: 3 }, (_, columnIndex) => {
                  const year = yearPageStart + rowIndex * 3 + columnIndex;
                  const isSelected = year === month.getUTCFullYear();
                  const isDisabled = year < firstYear || year > lastYear;
                  return (
                    <Pressable
                      key={year}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar ano ${year}`}
                      accessibilityState={{
                        selected: isSelected,
                        disabled: isDisabled,
                      }}
                      disabled={isDisabled}
                      onPress={() => selectYear(year)}
                      className={[
                        "h-12 flex-1 items-center justify-center rounded-xl active:bg-backgroundSelected",
                        isSelected ? "bg-foreground" : "",
                        isDisabled ? "opacity-30" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <ThemedText
                        type="smallBold"
                        themeColor={
                          isSelected ? "textOnForeground" : "textOnBackground2"
                        }
                      >
                        {year}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <>
            <View className="flex-row">
              {WEEKDAYS.map((weekday, index) => (
                <View
                  key={`${weekday}-${index}`}
                  className="flex-1 items-center py-2"
                >
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
                    const sameMonth =
                      date.getUTCMonth() === month.getUTCMonth();
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
                          themeColor={
                            isSelected
                              ? "textOnForeground"
                              : "textOnBackground2"
                          }
                        >
                          {date.getUTCDate()}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ThemedModal>
  );
}
