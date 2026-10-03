import { Stack } from "expo-router";
import { AuthGuard } from "@/features/auth/components/auth-guard";

export default function AuthLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </AuthGuard>
  );
}
