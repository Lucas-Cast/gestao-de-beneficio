import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { CrudScreenLayout } from "@/components/ui/crud-screen-layout";
import { SearchField } from "@/components/ui/search-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { useTheme } from "@/hooks/use-theme";

import { useBeneficiarySearch } from "../hooks/use-beneficiary-search";
import { useRefreshBeneficiariesOnFocus } from "../hooks/use-refresh-beneficiaries-on-focus";
import { useRestoreBeneficiary } from "../hooks/use-restore-beneficiary";
import {
  formatCpfForDisplay,
  formatDateForDisplay,
} from "../utils/beneficiary-format";

export default function DeletedBeneficiariesScreen() {
  const router = useRouter();
  const colors = useTheme();
  const [search, setSearch] = useState("");
  const beneficiaries = useBeneficiarySearch(search, true);
  useRefreshBeneficiariesOnFocus(true);
  const restoration = useRestoreBeneficiary();

  return (
    <CrudScreenLayout
      title="Beneficiários excluídos"
      description="Consulte os cadastros removidos e restaure quem deve voltar a ficar ativo."
      refreshing={beneficiaries.refreshing}
      onRefresh={beneficiaries.retry}
      primaryAction={{
        label: "Voltar aos beneficiários",
        onPress: () => router.replace("/(app)/beneficiaries"),
      }}
      toolbar={
        <SearchField
          label="Buscar beneficiários excluídos"
          placeholder="Nome ou CPF"
          value={search}
          onChangeText={setSearch}
          error={beneficiaries.validationError}
        />
      }
      footer={
        beneficiaries.hasMore && !beneficiaries.error ? (
          <ThemedButton
            label={
              beneficiaries.loadingMore ? "Carregando..." : "Carregar mais"
            }
            loading={beneficiaries.loadingMore}
            disabled={beneficiaries.loadingMore}
            variant="secondary"
            onPress={beneficiaries.loadMore}
          />
        ) : null
      }
    >
      {beneficiaries.validationError ? (
        <ThemedEmptyState
          title="Busca por CPF incompleta."
          description="Informe os 11 dígitos do CPF ou busque pelo nome."
        />
      ) : beneficiaries.loading && beneficiaries.rows.length === 0 ? (
        <ActivityIndicator
          accessibilityLabel="Carregando beneficiários excluídos"
          color={colors.foregroundStrong}
        />
      ) : beneficiaries.error && beneficiaries.rows.length === 0 ? (
        <ThemedEmptyState
          title="Não foi possível carregar os beneficiários excluídos."
          description="Tente novamente."
          action={{
            label: "Tentar novamente",
            onPress: beneficiaries.retry,
          }}
        />
      ) : beneficiaries.rows.length === 0 ? (
        <ThemedEmptyState
          title="Nenhum beneficiário excluído encontrado."
          description={
            search.trim()
              ? "Revise a busca."
              : "Os beneficiários excluídos aparecerão aqui."
          }
        />
      ) : (
        <View className="gap-3">
          {beneficiaries.rows.map((beneficiary) => (
            <View
              key={beneficiary.id}
              className="gap-4 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
            >
              <View className="min-w-0 flex-1 gap-2">
                <ThemedText type="smallBold" themeColor="textOnBackground2">
                  {beneficiary.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textMutedOnBackground2">
                  CPF: {formatCpfForDisplay(beneficiary.cpf)}
                </ThemedText>
                <ThemedText type="small" themeColor="textMutedOnBackground2">
                  Excluído em:{" "}
                  {formatDateForDisplay(beneficiary.deletedAt ?? "")}
                </ThemedText>
              </View>
              <ThemedButton
                label="Restaurar"
                loading={restoration.restoringId === beneficiary.id}
                disabled={
                  restoration.restoringId !== null &&
                  restoration.restoringId !== beneficiary.id
                }
                variant="secondary"
                onPress={() => restoration.restore(beneficiary.id)}
                className="md:min-w-40"
              />
            </View>
          ))}
          {beneficiaries.error ? (
            <View className="gap-2">
              <ThemedText type="small" themeColor="danger">
                Não foi possível carregar mais resultados.
              </ThemedText>
              <ThemedButton
                label="Tentar novamente"
                variant="secondary"
                onPress={beneficiaries.retry}
                className="self-start"
              />
            </View>
          ) : null}
        </View>
      )}
    </CrudScreenLayout>
  );
}
