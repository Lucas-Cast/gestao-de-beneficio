import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Controller,
  useWatch,
  useForm,
  type Control,
  type FieldPath,
} from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { TextField, TextFieldInput } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { DateField } from "@/components/ui/date-field";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { API_ROUTES } from "@/constants/routes";
import { useApiGet } from "@/hooks/api/use-api-get";
import { useTheme } from "@/hooks/use-theme";

import { useSaveBeneficiary } from "../hooks/use-save-beneficiary";
import { useCepLookup } from "../hooks/use-cep-lookup";
import type {
  Beneficiary,
  BeneficiaryFormValues,
} from "../types/beneficiary.types";
import { beneficiarySchema } from "../validation/beneficiary.schema";
import {
  formatCpf,
  formatPhoneInput,
  formatPostalCodeInput,
  onlyDigits,
} from "../utils/beneficiary-format";

const DEFAULT_VALUES: BeneficiaryFormValues = {
  name: "",
  birthDate: "",
  sex: "",
  phone: "",
  cpf: "",
  address: {
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
  },
};

type Props = { beneficiaryId?: string };

export default function BeneficiaryFormScreen({ beneficiaryId }: Props) {
  const router = useRouter();
  const colors = useTheme();
  const isEditing = Boolean(beneficiaryId);
  const details = useApiGet<Beneficiary>(
    beneficiaryId
      ? API_ROUTES.beneficiaries.byId(beneficiaryId)
      : API_ROUTES.beneficiaries.collection,
    { enabled: isEditing },
  );
  const form = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: DEFAULT_VALUES,
  });
  const resetForm = form.reset;
  const setValue = form.setValue;
  const currentPostalCode = useWatch({
    control: form.control,
    name: "address.postalCode",
  });
  const postalCodeDigits = onlyDigits(currentPostalCode ?? "");
  const cepLookup = useCepLookup(postalCodeDigits);
  const lookedUpAddress =
    cepLookup.data?.postalCode === postalCodeDigits
      ? cepLookup.data.address
      : null;
  const save = useSaveBeneficiary(beneficiaryId);

  useEffect(() => {
    if (details.data && beneficiaryId)
      resetForm(toFormValues(details.data));
  }, [beneficiaryId, details.data, resetForm]);

  useEffect(() => {
    if (!lookedUpAddress) return;

    const addressFields = [
      ["address.street", lookedUpAddress.street],
      ["address.neighborhood", lookedUpAddress.neighborhood],
      ["address.city", lookedUpAddress.city],
      ["address.state", lookedUpAddress.state],
    ] as const;

    for (const [name, value] of addressFields) {
      setValue(name, value, { shouldDirty: true, shouldValidate: true });
    }
  }, [lookedUpAddress, setValue]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/beneficiaries");
  };

  const onSubmit = form.handleSubmit((values) =>
    save.save(values, goBack),
  );

  if (isEditing && !details.data && details.loading) {
    return (
      <Screen>
        <ThemedText type="heading">Editar beneficiário</ThemedText>
        <ActivityIndicator
          accessibilityLabel="Carregando beneficiário"
          color={colors.foregroundStrong}
        />
      </Screen>
    );
  }

  if (isEditing && !details.data) {
    return (
      <Screen>
        <ThemedButton label="Voltar" variant="secondary" onPress={goBack} />
        <ThemedCard>
          <ThemedEmptyState
            title="Não foi possível carregar o beneficiário."
            description="Verifique sua conexão ou tente novamente."
            action={{
              label: "Tentar novamente",
              onPress: () => {
                void details.refetch().catch(() => undefined);
              },
            }}
          />
        </ThemedCard>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <ThemedButton
          label="Voltar"
          variant="secondary"
          disabled={save.loading}
          onPress={goBack}
          className="self-start"
        />
        <ThemedText type="heading">
          {isEditing ? "Editar beneficiário" : "Novo beneficiário"}
        </ThemedText>

        <ThemedCard>
          <View className="gap-6">
            <View className="gap-4">
              <ThemedText type="subtitle" themeColor="textOnBackground2">
                Dados pessoais
              </ThemedText>
              <TextField
                control={form.control}
                name="name"
                label="Nome completo"
                placeholder="Nome do beneficiário"
                editable={!save.loading}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <View className="gap-4 md:flex-row">
                <View className="min-w-0 flex-1">
                  <MaskedTextField
                    control={form.control}
                    name="cpf"
                    label="CPF"
                    placeholder="000.000.000-00"
                    format={formatCpf}
                    editable={!save.loading}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <DateField
                    control={form.control}
                    name="birthDate"
                    maxDate={new Date().toISOString().slice(0, 10)}
                    label="Data de nascimento"
                    disabled={save.loading}
                  />
                </View>
              </View>
              <View className="gap-4 md:flex-row">
                <View className="min-w-0 flex-1">
                  <SexField control={form.control} disabled={save.loading} />
                </View>
                <View className="min-w-0 flex-1">
                  <MaskedTextField
                    control={form.control}
                    name="phone"
                    label="Telefone"
                    placeholder="(00) 00000-0000"
                    format={formatPhoneInput}
                    editable={!save.loading}
                    keyboardType="phone-pad"
                    maxLength={19}
                  />
                </View>
              </View>
            </View>

            <View className="gap-6 border-t border-border pt-5">
              <ThemedText type="subtitle" themeColor="textOnBackground2">
                Endereço
              </ThemedText>
              <View className="gap-4">
                <View className="gap-4 md:flex-row">
                  <View className="min-w-0 flex-1">
                    <MaskedTextField
                      control={form.control}
                      name="address.postalCode"
                      label="CEP"
                      placeholder="00000-000"
                      format={formatPostalCodeInput}
                      editable={!save.loading}
                      keyboardType="numeric"
                      maxLength={9}
                    />
                    {postalCodeDigits.length === 8 && cepLookup.isFetching ? (
                      <View className="mt-2 flex-row items-center gap-2">
                        <ActivityIndicator
                          accessibilityLabel="Consultando CEP"
                          size="small"
                          color={colors.foregroundStrong}
                        />
                        <ThemedText type="small" themeColor="textMutedOnBackground2">
                          Consultando endereço...
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View className="gap-4 md:flex-row">
                  <View className="min-w-0 flex-1">
                    <TextField
                      control={form.control}
                      name="address.street"
                      label="Rua"
                      editable={!save.loading && !lookedUpAddress?.street}
                      className={lookedUpAddress?.street ? "opacity-60" : undefined}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <View className="gap-4 md:flex-row">
                  <View className="min-w-0 flex-1">
                    <TextField
                      control={form.control}
                      name="address.number"
                      label="Número"
                      editable={!save.loading}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <TextField
                      control={form.control}
                      name="address.complement"
                      label="Complemento (opcional)"
                      editable={!save.loading}
                    />
                  </View>
                </View>
                <View className="gap-4 md:flex-row">
                  <View className="min-w-0 flex-1">
                    <TextField
                      control={form.control}
                      name="address.neighborhood"
                      label="Bairro"
                      editable={!save.loading && !lookedUpAddress?.neighborhood}
                      className={
                        lookedUpAddress?.neighborhood ? "opacity-60" : undefined
                      }
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <TextField
                      control={form.control}
                      name="address.city"
                      label="Cidade"
                      editable={!save.loading && !lookedUpAddress?.city}
                      className={lookedUpAddress?.city ? "opacity-60" : undefined}
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <MaskedTextField
                      control={form.control}
                      name="address.state"
                      label="Estado (UF)"
                      placeholder="PA"
                      format={(value) =>
                        value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2)
                      }
                      editable={!save.loading && !lookedUpAddress?.state}
                      autoCapitalize="characters"
                      maxLength={2}
                      className={lookedUpAddress?.state ? "opacity-60" : undefined}
                    />
                  </View>
                </View>
              </View>
            </View>

            <ThemedButton
              label={
                save.loading
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar alterações"
                    : "Salvar beneficiário"
              }
              loading={save.loading}
              onPress={onSubmit}
            />
          </View>
        </ThemedCard>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function toFormValues(beneficiary: Beneficiary): BeneficiaryFormValues {
  return {
    name: beneficiary.name,
    birthDate: beneficiary.birthDate.slice(0, 10),
    sex: beneficiary.sex,
    phone: formatPhoneInput(beneficiary.phone),
    cpf: formatCpf(beneficiary.cpf),
    address: {
      street: beneficiary.address.street,
      number: beneficiary.address.number,
      complement: beneficiary.address.complement ?? "",
      neighborhood: beneficiary.address.neighborhood,
      city: beneficiary.address.city,
      state: beneficiary.address.state,
      postalCode: formatPostalCodeInput(beneficiary.address.postalCode),
    },
  };
}

type MaskedTextFieldProps = {
  control: Control<BeneficiaryFormValues>;
  name: FieldPath<BeneficiaryFormValues>;
  label: string;
  placeholder?: string;
  format: (value: string) => string;
  editable: boolean;
  keyboardType?: "numeric" | "phone-pad";
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  className?: string;
};

function MaskedTextField({
  control,
  name,
  label,
  placeholder,
  format,
  ...inputProps
}: MaskedTextFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextFieldInput
          ref={field.ref}
          label={label}
          value={String(field.value ?? "")}
          onChangeText={(value) => field.onChange(format(value))}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          placeholder={placeholder}
          {...inputProps}
        />
      )}
    />
  );
}

function SexField({
  control,
  disabled,
}: {
  control: Control<BeneficiaryFormValues>;
  disabled: boolean;
}) {
  const options = [
    { value: "F", label: "Feminino" },
    { value: "M", label: "Masculino" },
  ];

  return (
    <Controller
      control={control}
      name="sex"
      render={({ field, fieldState }) => (
        <View className="gap-2">
          <ThemedText type="smallBold" themeColor="textOnBackground2">
            Sexo
          </ThemedText>
          <View
            role="radiogroup"
            aria-label="Sexo"
            className="min-h-14 flex-row gap-2"
          >
            {options.map((option, index) => {
              const selected = field.value === option.value;
              return (
                <Pressable
                  key={option.value}
                  ref={index === 0 ? field.ref : undefined}
                  role="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: selected, disabled }}
                  aria-checked={selected}
                  disabled={disabled}
                  onBlur={field.onBlur}
                  onPress={() => field.onChange(option.value)}
                  className={[
                    "min-h-14 flex-1 items-center justify-center rounded-xl border px-3",
                    selected
                      ? "border-foreground bg-backgroundSelected"
                      : "border-border bg-background2",
                    disabled ? "opacity-50" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <ThemedText
                    type="smallBold"
                    themeColor="textOnBackground2"
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          {fieldState.error ? (
            <ThemedText type="small" themeColor="danger">
              {fieldState.error.message}
            </ThemedText>
          ) : null}
        </View>
      )}
    />
  );
}
