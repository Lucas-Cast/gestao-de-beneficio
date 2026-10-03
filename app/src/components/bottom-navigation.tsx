import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { ThemedText } from "@/components/themed-text";
export default function BottomNavigation() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.foregroundStrong,
        tabBarInactiveTintColor: colors.textMutedOnBackground2,
        tabBarHideOnKeyboard: true,
        tabBarLabel: ({ color, children }) => (
          <ThemedText type="small" style={{ color }}>
            {children}
          </ThemedText>
        ),
        sceneStyle: { backgroundColor: colors.background1 },
        tabBarStyle: {
          backgroundColor: colors.background2,
          borderTopColor: colors.border,
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
          width: "100%",
          maxWidth: 1152,
          alignSelf: "center",
        },
      }}
    >
      {(
        [
          { name: "index", title: "Início", icon: "home-outline" },
          { name: "deliveries", title: "Entregas", icon: "hand-heart-outline" },
          {
            name: "beneficiaries",
            title: "Beneficiários",
            icon: "account-group-outline",
          },
          { name: "more", title: "Mais", icon: "dots-horizontal" },
        ] as const
      ).map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name={tab.icon} color={color} size={24} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
