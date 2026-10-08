import { View } from "react-native";

import { ThemedButton } from "@/components/ui/themed-button";

import type { ManagedUser } from "../types/user.types";

type Props = {
  user: ManagedUser;
  currentUserEmail?: string;
  loading: boolean;
  onActivate: (user: ManagedUser) => void;
  onConfirmAction: (user: ManagedUser, action: "deactivate" | "delete") => void;
};

export function UserRowActions({
  user,
  currentUserEmail,
  loading,
  onActivate,
  onConfirmAction,
}: Props) {
  if (user.email === currentUserEmail) {
    return (
      <ThemedButton
        label="Você"
        variant="secondary"
        disabled
        className="min-h-10 self-start sm:min-w-20"
      />
    );
  }

  if (!user.isActive) {
    return (
      <View className="flex-row flex-wrap gap-2">
        <ThemedButton
          label={`Ativar ${user.name}`}
          onPress={() => onActivate(user)}
          loading={loading}
          className="min-h-10 sm:min-w-24"
        />
        <ThemedButton
          label={`Excluir ${user.name}`}
          variant="secondary"
          onPress={() => onConfirmAction(user, "delete")}
          disabled={loading}
          className="min-h-10 border-danger sm:min-w-24"
        />
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      <ThemedButton
        label={`Desativar ${user.name}`}
        variant="secondary"
        onPress={() => onConfirmAction(user, "deactivate")}
        disabled={loading}
        className="min-h-10 sm:min-w-28"
      />
      <ThemedButton
        label={`Excluir ${user.name}`}
        variant="secondary"
        onPress={() => onConfirmAction(user, "delete")}
        disabled={loading}
        className="min-h-10 border-danger sm:min-w-24"
      />
    </View>
  );
}
