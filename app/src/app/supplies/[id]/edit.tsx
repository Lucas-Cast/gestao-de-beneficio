import { useLocalSearchParams } from "expo-router";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import SupplyFormScreen from "@/features/supplies/screens/supply-form-screen";

export default function EditSupplyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AuthGuard>
      <SupplyFormScreen supplyId={id} />
    </AuthGuard>
  );
}
