import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, View } from "react-native";

import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { supplyUnitLabel } from "@/utils/supply-format";

import { SupplyPickerModal } from "../components/supply-picker-modal";
import { useCreateBasket } from "../hooks/use-basket-mutations";
import type { BasketFormValues, SupplyOption } from "../types/basket.types";
import { basketSchema } from "../validation/basket.schema";

const defaultValues: BasketFormValues = {
  name: "",
  description: "",
  supplies: [],
};

export default function BasketFormScreen() {
  const router = useRouter();
  const [showSupplyPicker, setShowSupplyPicker] = useState(false);
  const [selectedSupplies, setSelectedSupplies] = useState<
    Record<string, SupplyOption>
  >({});
  const form = useForm<BasketFormValues>({
    resolver: zodResolver(basketSchema),
    defaultValues,
  });
  const supplyRows = useFieldArray({ control: form.control, name: "supplies" });
  const create = useCreateBasket();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/baskets");
  };

  const addSupply = (supply: SupplyOption) => {
    if (supplyRows.fields.some((item) => item.supplyId === supply.id)) return;
    setSelectedSupplies((current) => ({ ...current, [supply.id]: supply }));
    supplyRows.append({ supplyId: supply.id, quantity: "" });
  };

  const removeSupply = (index: number) => {
    const supplyId = supplyRows.fields[index]?.supplyId;
    supplyRows.remove(index);
    if (supplyId)
      setSelectedSupplies((current) => {
        const next = { ...current };
        delete next[supplyId];
        return next;
      });
  };

  const compositionError =
    form.formState.errors.supplies?.root?.message ??
    form.formState.errors.supplies?.message;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <ThemedButton
          label="Voltar"
          variant="secondary"
          disabled={create.loading}
          onPress={goBack}
          className="self-start"
        />
        <ThemedText type="heading">Nova cesta</ThemedText>
        <ThemedCard>
          <View className="gap-5">
            <TextField
              control={form.control}
              name="name"
              label="Nome"
              placeholder="Ex.: Cesta básica"
              autoCapitalize="words"
              maxLength={200}
              editable={!create.loading}
            />
            <TextField
              control={form.control}
              name="description"
              label="Descrição (opcional)"
              placeholder="Descreva esta composição"
              multiline
              numberOfLines={3}
              maxLength={2000}
              editable={!create.loading}
            />

            <View className="gap-3">
              <View className="gap-1">
                <ThemedText type="subtitle" themeColor="textOnBackground2">
                  Composição
                </ThemedText>
                <ThemedText type="small" themeColor="textMutedOnBackground2">
                  Informe a quantidade de cada mantimento por cesta. Isso não
                  movimenta o estoque.
                </ThemedText>
              </View>
              <ThemedButton
                label="Adicionar mantimento"
                variant="secondary"
                disabled={create.loading}
                onPress={() => setShowSupplyPicker(true)}
              />
              {compositionError ? (
                <ThemedText
                  type="small"
                  themeColor="danger"
                  accessibilityLiveRegion="polite"
                >
                  {compositionError}
                </ThemedText>
              ) : null}

              {supplyRows.fields.map((field, index) => {
                const supply = selectedSupplies[field.supplyId];
                return (
                  <View
                    key={field.id}
                    className="gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-end"
                  >
                    <View className="min-w-0 flex-1 gap-1">
                      <ThemedText
                        type="smallBold"
                        themeColor="textOnBackground2"
                      >
                        {supply?.name ?? "Mantimento selecionado"}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        themeColor="textMutedOnBackground2"
                      >
                        Unidade: {supply ? supplyUnitLabel(supply.unit) : "—"}
                      </ThemedText>
                    </View>
                    <View className="min-w-0 flex-1">
                      <TextField
                        control={form.control}
                        name={`supplies.${index}.quantity`}
                        label="Quantidade por cesta"
                        placeholder="Ex.: 2"
                        keyboardType="numeric"
                        maxLength={10}
                        editable={!create.loading}
                      />
                    </View>
                    <ThemedButton
                      label="Remover"
                      variant="secondary"
                      disabled={create.loading}
                      onPress={() => removeSupply(index)}
                      className="sm:min-w-32"
                    />
                  </View>
                );
              })}
            </View>

            <ThemedButton
              label="Cadastrar cesta"
              loading={create.loading}
              disabled={create.loading}
              onPress={form.handleSubmit((values) =>
                create.create(values, () => router.replace("/(app)/baskets")),
              )}
            />
          </View>
        </ThemedCard>
      </Screen>
      <SupplyPickerModal
        visible={showSupplyPicker}
        selectedIds={supplyRows.fields.map((item) => item.supplyId)}
        onSelect={addSupply}
        onClose={() => setShowSupplyPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}
