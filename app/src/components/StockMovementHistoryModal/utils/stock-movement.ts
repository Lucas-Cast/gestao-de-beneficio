import { formatSupplyQuantity } from "@/utils/supply-format";

import type {
  StockMovement,
  StockMovementType,
} from "../types/stock-movement";

export function movementTypeLabel(type: StockMovementType) {
  return type === "IN" ? "Entrada" : "Saída";
}

export function movementQuantity(movement: StockMovement) {
  const sign = movement.type === "IN" ? "+" : "−";
  return `${sign}${formatSupplyQuantity(
    movement.quantity,
    movement.supply.unit,
  )}`;
}

export function movementDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
