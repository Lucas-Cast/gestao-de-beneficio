import BottomNavigation from "@/components/bottom-navigation";
import { AuthGuard } from "@/features/auth/components/auth-guard";
export default function AppLayout() {
  return (
    <AuthGuard>
      <BottomNavigation />
    </AuthGuard>
  );
}
