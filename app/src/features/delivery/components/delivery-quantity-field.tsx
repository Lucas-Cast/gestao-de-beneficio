import { View } from "react-native";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { TextField } from "@/components/text-field";
import { ThemedButton } from "@/components/ui/themed-button";
import {
  MAX_BASKET_QUANTITY,
  type DeliveryForm,
} from "../validation/delivery.schema";
export function DeliveryQuantityField({
  control,
  setValue,
  disabled,
}: {
  control: Control<DeliveryForm>;
  setValue: UseFormSetValue<DeliveryForm>;
  disabled: boolean;
}) {
  const value = useWatch({ control, name: "quantity" });
  const count = Number(value);
  const change = (delta: number) =>
    setValue(
      "quantity",
      String(
        Math.min(
          MAX_BASKET_QUANTITY,
          Math.max(1, (Number.isFinite(count) ? count : 1) + delta),
        ),
      ),
      { shouldValidate: true },
    );
  return (
    <View className="gap-3">
      <TextField
        control={control}
        name="quantity"
        label="Quantidade de cestas"
        keyboardType="number-pad"
        editable={!disabled}
      />
      <View className="flex-row gap-3">
        <ThemedButton
          label="Diminuir quantidade"
          variant="secondary"
          disabled={disabled || count <= 1}
          onPress={() => change(-1)}
          className="flex-1"
        />
        <ThemedButton
          label="Aumentar quantidade"
          variant="secondary"
          disabled={disabled || count >= MAX_BASKET_QUANTITY}
          onPress={() => change(1)}
          className="flex-1"
        />
      </View>
    </View>
  );
}
