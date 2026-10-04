import { AuthGuard } from "@/features/auth/components/auth-guard";
import DeletedBeneficiariesScreen from "@/features/beneficiaries/screens/deleted-beneficiaries-screen";

export default function DeletedBeneficiariesRoute() {
  return (
    <AuthGuard>
      <DeletedBeneficiariesScreen />
    </AuthGuard>
  );
}
