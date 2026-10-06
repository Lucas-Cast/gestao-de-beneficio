import { z } from "zod";

import { SUPPLY_UNITS } from "../types/supply.types";

export const MAX_STOCK_QUANTITY = 2_147_483_647;

function validWholeNumber(value: string, allowEmpty: boolean) {
  if (allowEmpty && value === "") return true;
  return /^(0|[1-9]\d*)$/.test(value) && Number(value) <= MAX_STOCK_QUANTITY;
}

export const supplySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do mantimento.").max(200, "O nome pode ter no máximo 200 caracteres."),
  description: z.string().trim().max(2000, "A descrição pode ter no máximo 2000 caracteres."),
  unit: z.string().refine((value) => SUPPLY_UNITS.some((unit) => unit === value), "Selecione uma unidade de medida válida."),
  currentQuantity: z.string().trim().refine(
    (value) => validWholeNumber(value, true),
    "Informe um saldo inicial inteiro maior ou igual a zero.",
  ),
});

export const stockMovementSchema = z.object({
  supplyId: z.uuid({ error: "Selecione um mantimento." }),
  type: z.string().refine((value) => value === "IN" || value === "OUT", "Selecione entrada ou saída."),
  quantity: z.string().trim().refine(
    (value) => validWholeNumber(value, false) && value !== "0",
    "Informe uma quantidade inteira maior que zero.",
  ),
  reason: z.string().trim().max(2000, "O motivo pode ter no máximo 2000 caracteres."),
});
