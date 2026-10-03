import DeliveryScreen from "@/features/delivery/screens/delivery-screen";
import { AuthGuard } from "@/features/auth/components/auth-guard";
export default function NewDeliveryRoute() {
  return (
    <AuthGuard>
      <DeliveryScreen />
    </AuthGuard>
  );
}
