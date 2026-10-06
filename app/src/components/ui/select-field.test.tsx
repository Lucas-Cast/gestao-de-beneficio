import { fireEvent, render, screen } from "@testing-library/react-native";
import { useForm } from "react-hook-form";

import { ThemedText } from "@/components/themed-text";
import { SelectField, SelectFieldInput } from "./select-field";

const options = [
  { value: "UNIT", label: "Unidade" },
  { value: "KILOGRAM", label: "Quilograma (kg)" },
];

test("select shows options and reports the chosen value", async () => {
  const change = jest.fn();
  await render(
    <SelectFieldInput
      label="Unidade de medida"
      value=""
      options={options}
      onValueChange={change}
      error="Selecione uma unidade."
    />,
  );

  expect(screen.getByText("Selecione uma unidade.")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Unidade de medida" }));
  await fireEvent.press(screen.getByRole("radio", { name: "Quilograma (kg)" }));
  expect(change).toHaveBeenCalledWith("KILOGRAM");
});

test("disabled select does not open its options", async () => {
  await render(
    <SelectFieldInput
      label="Unidade de medida"
      value="UNIT"
      options={options}
      onValueChange={jest.fn()}
      disabled
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Unidade de medida" }));
  expect(screen.queryByRole("radio", { name: "Quilograma (kg)" })).toBeNull();
});

test("select field updates React Hook Form state", async () => {
  function Form() {
    const form = useForm<{ unit: string }>({ defaultValues: { unit: "" } });
    return (
      <>
        <SelectField control={form.control} name="unit" label="Unidade de medida" options={options} />
        <ThemedText>Selecionado: {form.watch("unit")}</ThemedText>
      </>
    );
  }

  await render(<Form />);
  await fireEvent.press(screen.getByRole("button", { name: "Unidade de medida" }));
  await fireEvent.press(screen.getByRole("radio", { name: "Quilograma (kg)" }));
  expect(screen.getByText("Selecionado: KILOGRAM")).toBeTruthy();
});
