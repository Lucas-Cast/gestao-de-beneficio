import { AuthGuard } from "@/features/auth/components/auth-guard";
import BeneficiaryFormScreen from "@/features/beneficiaries/screens/beneficiary-form-screen";

export default function NewBeneficiaryRoute() {
  return (
    <AuthGuard>
      <BeneficiaryFormScreen />
    </AuthGuard>
  );
}
