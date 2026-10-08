import type { SelectOption } from "@/components/ui/select-field";
import { SUPPLY_UNITS, type SupplyUnit } from "@/constants/supply-units";
import { supplyUnitName } from "@/utils/supply-format";

export const SUPPLY_UNIT_OPTIONS: readonly SelectOption[] = SUPPLY_UNITS.map(
  (value: SupplyUnit) => ({ value, label: supplyUnitName(value) }),
);
