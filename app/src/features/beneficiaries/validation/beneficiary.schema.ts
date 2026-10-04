import { z } from "zod";

import { onlyDigits } from "../utils/beneficiary-format";

const BRAZILIAN_STATES = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT",
  "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO",
  "RR", "SC", "SP", "SE", "TO",
]);

export function isValidCpf(value: string) {
  if (!/^[\d.\s-]+$/.test(value)) return false;
  const digits = onlyDigits(value);
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;

  for (const length of [9, 10]) {
    const sum = Array.from(digits.slice(0, length), Number).reduce(
      (total, digit, index) => total + digit * (length + 1 - index),
      0,
    );
    const remainder = (sum * 10) % 11;
    if (Number(digits[length]) !== (remainder === 10 ? 0 : remainder))
      return false;
  }

  return true;
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value <= new Date().toISOString().slice(0, 10)
  );
}

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${label}.`)
    .max(maxLength, `${label} pode ter no máximo ${maxLength} caracteres.`);

export const beneficiarySchema = z.object({
  name: requiredText("o nome do beneficiário", 200),
  birthDate: z
    .string()
    .refine(
      isValidBirthDate,
      "Informe uma data válida, no formato DD/MM/AAAA, que não esteja no futuro.",
    ),
  sex: z.string().refine((value) => value === "M" || value === "F", {
    error: "Selecione o sexo.",
  }),
  phone: z.string().refine(
    (value) => {
      if (!/^[\d()+\s+-]+$/.test(value)) return false;
      const digits = onlyDigits(value);
      return /^(?:55)?\d{10,11}$/.test(digits);
    },
    "Informe um telefone com DDD, com 10 ou 11 dígitos.",
  ),
  cpf: z.string().refine(isValidCpf, "Informe um CPF válido."),
  address: z.object({
    street: requiredText("a rua", 200),
    number: requiredText("o número do endereço", 30),
    complement: z
      .string()
      .trim()
      .max(200, "O complemento pode ter no máximo 200 caracteres."),
    neighborhood: requiredText("o bairro", 200),
    city: requiredText("a cidade", 200),
    state: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => BRAZILIAN_STATES.has(value), "Informe uma UF válida."),
    postalCode: z
      .string()
      .refine(
        (value) => /^[\d-\s]+$/.test(value) && /^\d{8}$/.test(onlyDigits(value)),
        "O CEP deve conter 8 dígitos.",
      ),
  }),
});

export type BeneficiarySchemaValues = z.infer<typeof beneficiarySchema>;
