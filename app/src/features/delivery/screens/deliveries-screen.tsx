import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";

import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedEmptyState } from "@/components/ui/themed-empty-state";
import { SearchField } from "@/components/ui/search-field";
import { useTheme } from "@/hooks/use-theme";
import { useRefreshQueries } from "@/hooks/use-refresh-queries";

import { DeliveryHistoryCard } from "../components/delivery-history-card";
import {
  DELIVERY_HISTORY_QUERY_KEY,
  useDeliveryHistory,
} from "../hooks/use-delivery-history";
import { useRefreshDeliveriesOnFocus } from "../hooks/use-refresh-deliveries-on-focus";

export default function DeliveriesScreen() {
  const colors = useTheme();
  const [search, setSearch] = useState("");
  const history = useDeliveryHistory(search);
  const { refreshing, refresh } = useRefreshQueries(
    DELIVERY_HISTORY_QUERY_KEY,
  );
  useRefreshDeliveriesOnFocus();

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ThemedText type="heading">Entregas</ThemedText>
      <ThemedButton
        label="Registrar entrega"
        onPress={() => router.push("/deliveries/new")}
      />
      <ThemedText type="subtitle" themeColor="textOnBackground2">
        Histórico de entregas
      </ThemedText>
      <SearchField
        label="Buscar no histórico"
        placeholder="Beneficiário, cesta ou operador"
        value={search}
        onChangeText={(value) => setSearch(value.slice(0, 200))}
      />

      {history.loading && history.rows.length === 0 ? (
        <ActivityIndicator
          accessibilityLabel="Carregando histórico de entregas"
          color={colors.foregroundStrong}
        />
      ) : history.error && history.rows.length === 0 ? (
        <ThemedEmptyState
          title="Histórico indisponível no momento."
          action={{ label: "Tentar novamente", onPress: history.retry }}
        />
      ) : history.rows.length === 0 ? (
        <ThemedEmptyState
          title="Nenhuma entrega encontrada."
          description={
            search.trim()
              ? "Tente buscar por outro beneficiário, cesta ou operador."
              : "As entregas registradas aparecerão aqui."
          }
        />
      ) : (
        <View className="gap-4">
          {history.rows.map((delivery) => (
            <DeliveryHistoryCard key={delivery.id} delivery={delivery} />
          ))}
          {history.error ? (
            <ThemedButton
              label="Tentar novamente"
              variant="secondary"
              onPress={history.retry}
              className="self-start"
            />
          ) : null}
          {history.hasMore ? (
            <ThemedButton
              label={history.loadingMore ? "Carregando..." : "Carregar mais"}
              variant="secondary"
              loading={history.loadingMore}
              onPress={history.loadMore}
              className="self-start"
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}
