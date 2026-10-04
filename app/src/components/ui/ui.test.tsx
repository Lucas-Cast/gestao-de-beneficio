import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemedTable } from "./themed-table";
import { SearchField } from "./search-field";
import { ThemedText } from "@/components/themed-text";
import { CrudScreenLayout } from "./crud-screen-layout";

test("CRUD page layout renders its configurable slots and primary action", async () => {
  const create = jest.fn();
  await render(
    <CrudScreenLayout
      title="Beneficiários"
      description="Gerencie os cadastros."
      primaryAction={{ label: "Novo beneficiário", onPress: create }}
      toolbar={<SearchField label="Buscar" value="" onChangeText={jest.fn()} />}
      footer={<ThemedText>Carregar mais</ThemedText>}
    >
      <ThemedText>Conteúdo da lista</ThemedText>
    </CrudScreenLayout>,
  );

  expect(screen.getByText("Beneficiários")).toBeTruthy();
  expect(screen.getByText("Gerencie os cadastros.")).toBeTruthy();
  expect(screen.getByText("Buscar")).toBeTruthy();
  expect(screen.getByText("Conteúdo da lista")).toBeTruthy();
  expect(screen.getByText("Carregar mais")).toBeTruthy();

  await fireEvent.press(
    screen.getByRole("button", { name: "Novo beneficiário" }),
  );
  expect(create).toHaveBeenCalledTimes(1);
});

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
