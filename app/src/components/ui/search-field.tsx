import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, View } from "react-native";

import { TextFieldInput } from "@/components/text-field";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  error?: string;
};

export function SearchField({
  label,
  placeholder,
  value,
  onChangeText,
  onSubmit,
  error,
}: Props) {
  const colors = useTheme();
  return (
    <View className="relative">
      <TextFieldInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        placeholder={placeholder ?? label}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        className="pr-14"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? "Limpar busca" : "Buscar"}
        onPress={() => (value ? onChangeText("") : onSubmit?.())}
        className="absolute right-1 top-8 h-12 w-12 items-center justify-center"
      >
        <MaterialCommunityIcons
          name={value ? "close" : "magnify"}
          size={22}
          color={colors.textMutedOnBackground2}
        />
      </Pressable>
    </View>
  );
}
