import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemedTable } from "./themed-table";
import { SearchField } from "./search-field";
import { ThemedText } from "@/components/themed-text";
test("table renders supplied columns and selects a row without domain knowledge", async () => {
  const select = jest.fn();
  await render(
    <ThemedTable
      rows={[{ id: "1", label: "Linha" }]}
      rowKey={(row) => row.id}
      rowLabel={(row) => row.label}
      onRowPress={select}
      columns={[
        {
          key: "label",
          label: "Nome",
          render: (row) => <ThemedText>{row.label}</ThemedText>,
        },
      ]}
    />,
  );
  expect(screen.getByText("Nome")).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Linha"));
  expect(select).toHaveBeenCalledWith({ id: "1", label: "Linha" });
});
test("search field preserves inline errors and delegates clearing", async () => {
  const change = jest.fn();
  await render(
    <SearchField
      label="Buscar"
      value="123"
      onChangeText={change}
      error="Complete o CPF."
    />,
  );
  expect(screen.getByText("Complete o CPF.")).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Limpar busca"));
  expect(change).toHaveBeenCalledWith("");
});
