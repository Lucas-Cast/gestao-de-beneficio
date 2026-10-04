import { fireEvent, render, screen } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DateField } from "./date-field";

function BirthDateField() {
  const { control } = useForm<{ birthDate: string }>({
    defaultValues: { birthDate: "2015-06-15" },
  });
  return (
    <DateField
      control={control}
      name="birthDate"
      label="Data de nascimento"
      minDate="2000-01-01"
      maxDate="2025-03-01"
    />
  );
}

test("selecting a year respects the allowed month and day range", async () => {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      SafeAreaProvider,
      {
        initialMetrics: {
          frame: { x: 0, y: 0, width: 360, height: 800 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children,
    );
  await render(<BirthDateField />, { wrapper });

  await fireEvent.press(
    screen.getByRole("button", { name: "Data de nascimento" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Escolher ano, junho de 2015" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Próximos anos" }));
  expect(
    screen.getByRole("button", { name: "Selecionar ano 2026" }).props
      .accessibilityState.disabled,
  ).toBe(true);
  await fireEvent.press(
    screen.getByRole("button", { name: "Selecionar ano 2025" }),
  );

  expect(
    screen.getByRole("button", { name: "Escolher ano, março de 2025" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Selecionar 02/03/2025" }).props
      .accessibilityState.disabled,
  ).toBe(true);
  await fireEvent.press(
    screen.getByRole("button", { name: "Selecionar 01/03/2025" }),
  );
  expect(screen.getByDisplayValue("01/03/2025")).toBeTruthy();
});
