import { z } from "zod";
export const MAX_BASKET_QUANTITY = 2147483647;
export const deliverySchema = z.object({
  beneficiaryId: z.string().min(1, "Selecione um beneficiário."),
  basketId: z.string().min(1, "Selecione uma cesta."),
  quantity: z
    .string()
    .refine(
      (value) =>
        /^[1-9]\d*$/.test(value) && Number(value) <= MAX_BASKET_QUANTITY,
      "Informe um número inteiro positivo.",
    ),
  observation: z
    .string()
    .max(2000, "A observação deve ter no máximo 2.000 caracteres."),
});
export type DeliveryForm = z.infer<typeof deliverySchema>;
export function beneficiarySearch(text: string): {
  params: Record<string, string>;
  error?: string;
} {
  const value = text.trim();
  const digits = value.replace(/\D/g, "");
  if (value && /^[\d.\s-]+$/.test(value)) {
    if (digits.length !== 11)
      return { params: {}, error: "Complete os 11 dígitos do CPF." };
    return { params: { cpf: digits } };
  }
  return { params: value ? { search: value } : {} };
}
export function formatCpf(cpf: string) {
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}
export const UNIT_LABELS: Record<string, string> = {
  UNIT: "unidade(s)",
  KILOGRAM: "kg",
  GRAM: "g",
  LITER: "L",
  MILLILITER: "mL",
  PACKAGE: "pacote(s)",
};
