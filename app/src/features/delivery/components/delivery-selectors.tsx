import { useState } from "react";
import { Pressable, View } from "react-native";
import { ThemedModal } from "@/components/ui/themed-modal";
import { SearchField } from "@/components/ui/search-field";
import { ThemedTable } from "@/components/ui/themed-table";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { useSelectorSearch } from "../hooks/use-selector-search";
import { formatCpf } from "../validation/delivery.schema";
import type { Beneficiary, Basket } from "../types/delivery.types";
import { BasketComposition } from "./basket-composition";
type Props<T> = {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
};
export function BeneficiarySelector(props: Props<Beneficiary>) {
  return props.visible ? <Selector {...props} kind="beneficiary" /> : null;
}
export function BasketSelector(props: Props<Basket>) {
  return props.visible ? <Selector {...props} kind="basket" /> : null;
}
function Selector<T extends Beneficiary | Basket>({
  kind,
  visible,
  onClose,
  onSelect,
}: Props<T> & { kind: "beneficiary" | "basket" }) {
  const [text, setText] = useState("");
  const search = useSelectorSearch<T>(kind, text);
  const title =
    kind === "beneficiary" ? "Selecionar beneficiário" : "Selecionar cesta";
  const details = (item: T) =>
    "cpf" in item
      ? formatCpf(item.cpf) +
        " · " +
        item.address.city +
        " / " +
        item.address.neighborhood
      : (item.description ?? "");
  const choose = (item: T) => {
    onSelect(item);
    onClose();
  };
  return (
    <ThemedModal visible={visible} title={title} onClose={onClose}>
      <SearchField
        label={
          kind === "beneficiary" ? "Buscar por nome ou CPF" : "Buscar cesta"
        }
        value={text}
        onChangeText={setText}
        error={search.validationError}
      />
      {!search.validationError && (
        <>
          <View className="hidden md:flex">
            <ThemedTable
              rows={search.rows}
              rowKey={(row) => row.id}
              onRowPress={choose}
              rowLabel={(row) => "Selecionar " + row.name}
              loading={search.loading}
              columns={[
                {
                  key: "name",
                  label: "Nome",
                  render: (row) => (
                    <ThemedText themeColor="textOnBackground2">
                      {row.name}
                    </ThemedText>
                  ),
                },
                {
                  key: "details",
                  label:
                    kind === "beneficiary" ? "CPF e endereço" : "Descrição",
                  render: (row) => (
                    <ThemedText
                      type="small"
                      themeColor="textMutedOnBackground2"
                    >
                      {details(row)}
                    </ThemedText>
                  ),
                },
              ]}
            />
          </View>
          <View className="gap-2 md:hidden">
            {!search.rows.length ? (
              <ThemedEmptyState
                title={
                  search.loading
                    ? "Carregando..."
                    : "Nenhum registro encontrado."
                }
              />
            ) : (
              search.rows.map((row) => (
                <Pressable
                  key={row.id}
                  onPress={() => choose(row)}
                  accessibilityRole="button"
                  accessibilityLabel={"Selecionar " + row.name}
                  className="gap-2 rounded-xl border border-border p-4 active:bg-backgroundSelected"
                >
                  <ThemedText themeColor="textOnBackground2">
                    {row.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textMutedOnBackground2">
                    {details(row)}
                  </ThemedText>
                  {"supplies" in row ? (
                    <BasketComposition basket={row} />
                  ) : null}
                </Pressable>
              ))
            )}
          </View>
          {search.error ? (
            <ThemedButton
              variant="secondary"
              label="Tentar novamente"
              onPress={search.retry}
              disabled={search.loading}
            />
          ) : null}
          {search.hasMore ? (
            <ThemedButton
              variant="secondary"
              label="Carregar mais"
              onPress={search.loadMore}
              loading={search.loading}
            />
          ) : null}
        </>
      )}
    </ThemedModal>
  );
}
