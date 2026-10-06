import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from "react-native";

import { Screen } from "@/components/screen";
import { TextField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { SelectField } from "@/components/ui/select-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { API_ROUTES } from "@/constants/routes";
import { useApiGet } from "@/hooks/api/use-api-get";
import { useTheme } from "@/hooks/use-theme";

import { SUPPLY_UNIT_OPTIONS } from "../constants/supply-units";
import { useSaveSupply } from "../hooks/use-supply-mutations";
import type { Supply, SupplyFormValues } from "../types/supply.types";
import { supplySchema } from "../validation/supply.schema";

const defaultValues: SupplyFormValues = {
  name: "",
  description: "",
  unit: "",
  currentQuantity: "",
};

type Props = { supplyId?: string };

export default function SupplyFormScreen({ supplyId }: Props) {
  const router = useRouter();
  const colors = useTheme();
  const hydratedId = useRef<string | null>(null);
  const isEditing = Boolean(supplyId);
  const details = useApiGet<Supply>(
    supplyId ? API_ROUTES.supplies.byId(supplyId) : API_ROUTES.supplies.collection,
    { enabled: isEditing },
  );
  const form = useForm<SupplyFormValues>({ resolver: zodResolver(supplySchema), defaultValues });
  const resetForm = form.reset;
  const save = useSaveSupply(supplyId);

  useEffect(() => {
    if (!details.data || details.data.id === hydratedId.current) return;
    hydratedId.current = details.data.id;
    resetForm({
      name: details.data.name,
      description: details.data.description ?? "",
      unit: details.data.unit,
      currentQuantity: "",
    });
  }, [details.data, resetForm]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/supplies");
  };

  if (isEditing && !details.data && details.loading) {
    return (
      <Screen>
        <ThemedText type="heading">Editar mantimento</ThemedText>
        <ActivityIndicator accessibilityLabel="Carregando mantimento" color={colors.foregroundStrong} />
      </Screen>
    );
  }

  if (isEditing && !details.data) {
    return (
      <Screen>
        <ThemedButton label="Voltar" variant="secondary" onPress={goBack} />
        <ThemedCard>
          <ThemedEmptyState
            title="Não foi possível carregar o mantimento."
            action={{ label: "Tentar novamente", onPress: () => { void details.refetch().catch(() => undefined); } }}
          />
        </ThemedCard>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <ThemedButton label="Voltar" variant="secondary" disabled={save.loading} onPress={goBack} className="self-start" />
        <ThemedText type="heading">{isEditing ? "Editar mantimento" : "Novo mantimento"}</ThemedText>
        <ThemedCard>
          <View className="gap-5">
            <TextField
              control={form.control}
              name="name"
              label="Nome"
              placeholder="Nome do mantimento"
              autoCapitalize="words"
              maxLength={200}
              editable={!save.loading}
            />
            <TextField
              control={form.control}
              name="description"
              label="Descrição (opcional)"
              placeholder="Descreva o mantimento"
              multiline
              numberOfLines={3}
              maxLength={2000}
              editable={!save.loading}
            />
            <SelectField
              control={form.control}
              name="unit"
              label="Unidade de medida"
              options={SUPPLY_UNIT_OPTIONS}
              disabled={save.loading}
            />
            {!isEditing ? (
              <View className="gap-2">
                <TextField
                  control={form.control}
                  name="currentQuantity"
                  label="Saldo inicial (opcional)"
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!save.loading}
                />
                <ThemedText type="small" themeColor="textMutedOnBackground2">
                  Se não informado, começa em zero.
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="small" themeColor="textMutedOnBackground2">
                Para alterar o saldo, use Movimentar estoque na aba Mantimentos.
              </ThemedText>
            )}
            <ThemedButton
              label={isEditing ? "Salvar alterações" : "Salvar mantimento"}
              loading={save.loading}
              onPress={form.handleSubmit((values) => save.save(values, goBack))}
            />
          </View>
        </ThemedCard>
      </Screen>
    </KeyboardAvoidingView>
  );
}
