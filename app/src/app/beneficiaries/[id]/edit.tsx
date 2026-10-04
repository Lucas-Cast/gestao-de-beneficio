import { useLocalSearchParams } from "expo-router";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import BeneficiaryFormScreen from "@/features/beneficiaries/screens/beneficiary-form-screen";

export default function EditBeneficiaryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <AuthGuard>
      <BeneficiaryFormScreen beneficiaryId={id} />
    </AuthGuard>
  );
}
