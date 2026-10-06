import { AuthGuard } from "@/features/auth/components/auth-guard";
import SupplyFormScreen from "@/features/supplies/screens/supply-form-screen";

export default function NewSupplyRoute() {
  return (
    <AuthGuard>
      <SupplyFormScreen />
    </AuthGuard>
  );
}
