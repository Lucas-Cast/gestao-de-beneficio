import { useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { ThemedModal } from "@/components/ui/themed-modal";
import { API_ROUTES } from "@/constants/routes";
import { useApiGet } from "@/hooks/api/use-api-get";
import { useTheme } from "@/hooks/use-theme";
import { formatDateForDisplay } from "@/utils/date-format";

import { useDeleteBeneficiary } from "../hooks/use-delete-beneficiary";
import type { Beneficiary } from "../types/beneficiary.types";
import {
  formatCpfForDisplay,
  formatPhone,
} from "../utils/beneficiary-format";

type Props = {
  id: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
};

export function BeneficiaryDetailsModal({ id, onClose, onEdit }: Props) {
  const colors = useTheme();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const details = useApiGet<Beneficiary>(
    API_ROUTES.beneficiaries.byId(id ?? ""),
    { enabled: Boolean(id) },
  );
  const deletion = useDeleteBeneficiary(id ?? "", () => {
    setConfirmingDelete(false);
    onClose();
  });

  const close = () => {
    if (deletion.loading) return;
    setConfirmingDelete(false);
    onClose();
  };

  return (
    <ThemedModal
      visible={Boolean(id)}
      title={confirmingDelete ? "Excluir beneficiário?" : "Beneficiário"}
      onClose={close}
      footer={
        confirmingDelete ? (
          <View className="gap-3 sm:flex-row sm:justify-end">
            <ThemedButton
              label="Cancelar"
              variant="secondary"
              disabled={deletion.loading}
              onPress={() => setConfirmingDelete(false)}
              className="sm:min-w-40"
            />
            <ThemedButton
              label="Excluir"
              loading={deletion.loading}
              onPress={deletion.remove}
              className="sm:min-w-40"
            />
          </View>
        ) : details.data ? (
          <View className="gap-3 sm:flex-row sm:justify-end">
            <ThemedButton
              label="Editar"
              variant="secondary"
              onPress={() => {
                const beneficiaryId = details.data?.id;
                if (!beneficiaryId) return;
                onClose();
                onEdit(beneficiaryId);
              }}
              className="sm:min-w-40"
            />
            <ThemedButton
              label="Excluir"
              variant="secondary"
              onPress={() => setConfirmingDelete(true)}
              className="border-danger sm:min-w-40"
            />
          </View>
        ) : null
      }
    >
      {confirmingDelete ? (
        <View className="gap-3">
          <ThemedText themeColor="textOnBackground2">
            Tem certeza de que deseja excluir{" "}
            {details.data?.name ?? "este beneficiário"}?
          </ThemedText>
          <ThemedText themeColor="textMutedOnBackground2">
            As entregas anteriores serão mantidas. Este beneficiário não poderá
            ser selecionado em novas entregas.
          </ThemedText>
        </View>
      ) : details.loading && !details.data ? (
        <ActivityIndicator
          accessibilityLabel="Carregando beneficiário"
          color={colors.foregroundStrong}
        />
      ) : details.error || !details.data ? (
        <ThemedEmptyState
          title="Não foi possível carregar os dados do beneficiário."
          description="Feche esta janela e tente novamente."
          action={{
            label: "Tentar novamente",
            onPress: () => {
              void details.refetch().catch(() => undefined);
            },
          }}
        />
      ) : (
        <BeneficiaryDetails beneficiary={details.data} />
      )}
    </ThemedModal>
  );
}

function BeneficiaryDetails({ beneficiary }: { beneficiary: Beneficiary }) {
  return (
    <View className="gap-5">
      <DetailSection title="Dados pessoais">
        <Detail label="Nome completo" value={beneficiary.name} />
        <Detail label="CPF" value={formatCpfForDisplay(beneficiary.cpf)} />
        <Detail
          label="Data de nascimento"
          value={formatDateForDisplay(beneficiary.birthDate)}
        />
        <Detail
          label="Sexo"
          value={beneficiary.sex === "F" ? "Feminino" : "Masculino"}
        />
        <Detail label="Telefone" value={formatPhone(beneficiary.phone)} />
      </DetailSection>

      <DetailSection title="Endereço">
        <Detail label="Rua" value={beneficiary.address.street} />
        <Detail label="Número" value={beneficiary.address.number} />
        <Detail
          label="Complemento"
          value={beneficiary.address.complement ?? "Não informado"}
        />
        <Detail label="Bairro" value={beneficiary.address.neighborhood} />
        <Detail
          label="Cidade"
          value={`${beneficiary.address.city} - ${beneficiary.address.state}`}
        />
        <Detail label="CEP" value={beneficiary.address.postalCode} />
      </DetailSection>
    </View>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-3">
      <ThemedText type="subtitle" themeColor="textOnBackground2">
        {title}
      </ThemedText>
      <View className="gap-3">{children}</View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1 sm:flex-row sm:items-center sm:justify-between">
      <ThemedText type="small" themeColor="textMutedOnBackground2">
        {label}
      </ThemedText>
      <ThemedText
        type="smallBold"
        themeColor="textOnBackground2"
        className="sm:text-right"
      >
        {value}
      </ThemedText>
    </View>
  );
}
