import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { CrudScreenLayout } from "@/components/ui/crud-screen-layout";
import { SearchField } from "@/components/ui/search-field";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedTable, type TableColumn } from "@/components/ui/themed-table";
import { useTheme } from "@/hooks/use-theme";

import { BeneficiaryDetailsModal } from "../components/beneficiary-details-modal";
import { useBeneficiarySearch } from "../hooks/use-beneficiary-search";
import type { Beneficiary } from "../types/beneficiary.types";
import {
  formatCpfForDisplay,
  formatPhone,
} from "../utils/beneficiary-format";

const columns: readonly TableColumn<Beneficiary>[] = [
  {
    key: "name",
    label: "Nome",
    className: "min-w-48 flex-[1.5]",
    render: (beneficiary) => (
      <ThemedText type="smallBold" themeColor="textOnBackground2">
        {beneficiary.name}
      </ThemedText>
    ),
  },
  {
    key: "cpf",
    label: "CPF",
    className: "min-w-36 flex-1",
    render: (beneficiary) => (
      <ThemedText type="small" themeColor="textOnBackground2">
        {formatCpfForDisplay(beneficiary.cpf)}
      </ThemedText>
    ),
  },
  {
    key: "phone",
    label: "Telefone",
    className: "min-w-40 flex-1",
    render: (beneficiary) => (
      <ThemedText type="small" themeColor="textOnBackground2">
        {formatPhone(beneficiary.phone)}
      </ThemedText>
    ),
  },
  {
    key: "city",
    label: "Cidade",
    className: "min-w-40 flex-1",
    render: (beneficiary) => (
      <ThemedText type="small" themeColor="textOnBackground2">
        {beneficiary.address.city} - {beneficiary.address.state}
      </ThemedText>
    ),
  },
];

export default function BeneficiariesScreen() {
  const router = useRouter();
  const colors = useTheme();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const beneficiaries = useBeneficiarySearch(search);

  const openEdit = (id: string) => {
    router.push({ pathname: "/beneficiaries/[id]/edit", params: { id } });
  };

  return (
    <>
      <CrudScreenLayout
        title="Beneficiários"
        description="Consulte e mantenha os cadastros da instituição."
        primaryAction={{
          label: "Novo beneficiário",
          onPress: () => router.push("/beneficiaries/new"),
        }}
        toolbar={
          <View className="gap-3 sm:flex-row sm:items-end">
            <View className="min-w-0 flex-1">
              <SearchField
                label="Buscar beneficiários"
                placeholder="Nome ou CPF"
                value={search}
                onChangeText={setSearch}
                error={beneficiaries.validationError}
              />
            </View>
            <ThemedButton
              label="Ver excluídos"
              variant="secondary"
              onPress={() => router.push("/beneficiaries/deleted")}
              className="sm:min-w-40"
            />
          </View>
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
            accessibilityLabel="Carregando beneficiários"
            color={colors.foregroundStrong}
          />
        ) : beneficiaries.error && beneficiaries.rows.length === 0 ? (
          <ThemedEmptyState
            title="Não foi possível carregar os beneficiários."
            description="Tente novamente."
            action={{ label: "Tentar novamente", onPress: beneficiaries.retry }}
          />
        ) : beneficiaries.rows.length === 0 ? (
          <ThemedEmptyState
            title="Nenhum beneficiário encontrado."
            description={
              search.trim()
                ? "Revise a busca ou cadastre um novo beneficiário."
                : "Cadastre o primeiro beneficiário da instituição."
            }
            action={{
              label: "Novo beneficiário",
              onPress: () => router.push("/beneficiaries/new"),
            }}
          />
        ) : (
          <View className="gap-3">
            <View className="hidden md:flex">
              <ThemedTable
                rows={beneficiaries.rows}
                columns={columns}
                rowKey={(beneficiary) => beneficiary.id}
                rowLabel={(beneficiary) =>
                  `Abrir ${beneficiary.name}, CPF ${formatCpfForDisplay(beneficiary.cpf)}`
                }
                onRowPress={(beneficiary) => setSelectedId(beneficiary.id)}
                loading={beneficiaries.loadingMore}
              />
            </View>
            <View className="gap-3 md:hidden">
              {beneficiaries.rows.map((beneficiary) => (
                <Pressable
                  key={beneficiary.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${beneficiary.name}, CPF ${formatCpfForDisplay(beneficiary.cpf)}`}
                  onPress={() => setSelectedId(beneficiary.id)}
                  className="gap-3 rounded-xl border border-border p-4 active:bg-backgroundSelected"
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <ThemedText
                      type="smallBold"
                      themeColor="textOnBackground2"
                      className="min-w-0 flex-1"
                    >
                      {beneficiary.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textMutedOnBackground2">
                      Ver detalhes
                    </ThemedText>
                  </View>
                  <View className="gap-1">
                    <ThemedText type="small" themeColor="textOnBackground2">
                      CPF: {formatCpfForDisplay(beneficiary.cpf)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textMutedOnBackground2">
                      {formatPhone(beneficiary.phone)} · {beneficiary.address.city} - {beneficiary.address.state}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
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

      <BeneficiaryDetailsModal
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={openEdit}
      />
    </>
  );
}
