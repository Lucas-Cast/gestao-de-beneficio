import type {
  StockMovement,
  StockMovementType,
} from "../types/stock-movement";

const unitSymbols: Record<StockMovement["supply"]["unit"], string> = {
  UNIT: "un.",
  KILOGRAM: "kg",
  GRAM: "g",
  LITER: "L",
  MILLILITER: "mL",
  PACKAGE: "pacote",
};

export function movementTypeLabel(type: StockMovementType) {
  return type === "IN" ? "Entrada" : "Saída";
}

export function movementQuantity(movement: StockMovement) {
  const sign = movement.type === "IN" ? "+" : "−";
  const unit =
    movement.supply.unit === "PACKAGE" && movement.quantity !== 1
      ? "pacotes"
      : unitSymbols[movement.supply.unit];
  return `${sign}${movement.quantity} ${unit}`;
}

export function movementDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
