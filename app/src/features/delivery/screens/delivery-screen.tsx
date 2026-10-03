import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/text-field";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { useCreateDelivery } from "../hooks/use-create-delivery";
import {
  deliverySchema,
  type DeliveryForm,
} from "../validation/delivery.schema";
import type { Basket, Beneficiary, Delivery } from "../types/delivery.types";
import {
  BasketSelector,
  BeneficiarySelector,
} from "../components/delivery-selectors";
import { BasketComposition } from "../components/basket-composition";
import { DeliveryQuantityField } from "../components/delivery-quantity-field";
import { DeliveryReview } from "../components/delivery-review";
import { DeliverySummary } from "../components/delivery-summary";
const defaults: DeliveryForm = {
  beneficiaryId: "",
  basketId: "",
  quantity: "1",
  observation: "",
};
export default function DeliveryScreen() {
  const form = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema),
    defaultValues: defaults,
  });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [basket, setBasket] = useState<Basket | null>(null);
  const [selector, setSelector] = useState<"beneficiary" | "basket" | null>(
    null,
  );
  const [review, setReview] = useState<DeliveryForm | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const request = useCreateDelivery();
  const pending = useRef(false);
  const closeSelector = useCallback(() => setSelector(null), []);
  const closeReview = useCallback(() => setReview(null), []);
  const confirm = async () => {
    if (!review || pending.current) return;
    pending.current = true;
    const values = review;
    setReview(null);
    try {
      const response = await request.create({
        beneficiaryId: values.beneficiaryId,
        basketId: values.basketId,
        quantity: Number(values.quantity),
        ...(values.observation.trim()
          ? { observation: values.observation.trim() }
          : {}),
      });
      if (response) setDelivery(response);
    } catch {
      /* Request hook owns the operation toast; preserve form for correction. */
    } finally {
      pending.current = false;
    }
  };
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <ThemedButton
          variant="secondary"
          label="Voltar"
          disabled={request.loading}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
        <ThemedText type="heading">Registrar entrega</ThemedText>
        {delivery ? (
          <DeliverySummary
            delivery={delivery}
            beneficiary={beneficiary?.name ?? ""}
            basket={basket?.name ?? ""}
            onAgain={() => {
              setDelivery(null);
              setBeneficiary(null);
              setBasket(null);
              form.reset(defaults);
              request.reset();
            }}
          />
        ) : (
          <View className="gap-5 lg:flex-row">
            <ThemedCard className="w-full min-w-0 shrink-0 lg:w-auto lg:flex-1">
              <View className="gap-5">
                {(["beneficiaryId", "basketId"] as const).map((name) => (
                  <Controller
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field, fieldState }) => (
                      <View className="gap-2">
                        <ThemedText
                          type="smallBold"
                          themeColor="textOnBackground2"
                        >
                          {name === "beneficiaryId" ? "Beneficiário" : "Cesta"}
                        </ThemedText>
                        <Pressable
                          ref={field.ref}
                          accessibilityRole="button"
                          aria-invalid={!!fieldState.error}
                          accessibilityLabel={
                            name === "beneficiaryId"
                              ? "Selecionar beneficiário"
                              : "Selecionar cesta"
                          }
                          accessibilityHint={fieldState.error?.message}
                          disabled={request.loading}
                          onBlur={field.onBlur}
                          onPress={() =>
                            setSelector(
                              name === "beneficiaryId"
                                ? "beneficiary"
                                : "basket",
                            )
                          }
                          className={
                            "min-h-14 justify-center rounded-xl border p-4 " +
                            (fieldState.error
                              ? "border-danger"
                              : "border-border")
                          }
                        >
                          <ThemedText themeColor="textOnBackground2">
                            {name === "beneficiaryId"
                              ? (beneficiary?.name ??
                                "Selecione um beneficiário")
                              : (basket?.name ?? "Selecione uma cesta")}
                          </ThemedText>
                        </Pressable>
                        {fieldState.error ? (
                          <ThemedText type="small" themeColor="danger">
                            {fieldState.error.message}
                          </ThemedText>
                        ) : null}
                      </View>
                    )}
                  />
                ))}
                <DeliveryQuantityField
                  control={form.control}
                  setValue={form.setValue}
                  disabled={request.loading}
                />
                <TextField
                  control={form.control}
                  name="observation"
                  label="Observação (opcional)"
                  multiline
                  numberOfLines={4}
                  editable={!request.loading}
                  placeholder="Alguma informação sobre esta entrega?"
                />
                <ThemedButton
                  label={request.loading ? "Registrando..." : "Revisar entrega"}
                  loading={request.loading}
                  onPress={form.handleSubmit((values) => setReview(values))}
                />
              </View>
            </ThemedCard>
            <ThemedCard className="w-full min-w-0 shrink-0 lg:w-auto lg:flex-1">
              <ThemedText type="heading" themeColor="textOnBackground2">
                Itens da entrega
              </ThemedText>
              {basket ? (
                <BasketComposition
                  basket={basket}
                  quantity={
                    deliverySchema.shape.quantity.safeParse(quantity).success
                      ? Number(quantity)
                      : 1
                  }
                />
              ) : (
                <ThemedText themeColor="textMutedOnBackground2">
                  Selecione uma cesta para conferir sua composição.
                </ThemedText>
              )}
              <ThemedText type="small" themeColor="textMutedOnBackground2">
                A disponibilidade será verificada ao confirmar a entrega.
              </ThemedText>
            </ThemedCard>
          </View>
        )}
        <BeneficiarySelector
          visible={selector === "beneficiary"}
          onClose={closeSelector}
          onSelect={(item) => {
            setBeneficiary(item);
            form.setValue("beneficiaryId", item.id, { shouldValidate: true });
          }}
        />
        <BasketSelector
          visible={selector === "basket"}
          onClose={closeSelector}
          onSelect={(item) => {
            setBasket(item);
            form.setValue("basketId", item.id, { shouldValidate: true });
          }}
        />
        <DeliveryReview
          values={review}
          beneficiary={beneficiary}
          basket={basket}
          onClose={closeReview}
          onConfirm={() => void confirm()}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
