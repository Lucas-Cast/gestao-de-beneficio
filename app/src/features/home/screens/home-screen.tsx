import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { useUser } from "@/context/user-context";
import { useRefreshQueries } from "@/hooks/use-refresh-queries";
import { useHomeOverview } from "../hooks/use-home-overview";
import { HomeIndicators } from "../components/home-indicators";
import { RecentDeliveries } from "../components/recent-deliveries";
import { useRefreshHomeOnFocus } from "../hooks/use-refresh-home-on-focus";
export default function HomeScreen() {
  const { user } = useUser();
  const { refreshing, refresh } = useRefreshQueries();
  const overview = useHomeOverview();
  useRefreshHomeOnFocus();
  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View className="gap-2">
        <ThemedText type="heading">
          Olá, {user?.name.trim().split(/\s+/)[0]}!
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </ThemedText>
      </View>
      <ThemedButton
        label="Registrar entrega"
        onPress={() => router.push("/deliveries/new")}
      />
      <HomeIndicators indicators={overview.indicators} />
      <RecentDeliveries
        rows={overview.recent}
        loading={overview.recentLoading}
      />
    </Screen>
  );
}
