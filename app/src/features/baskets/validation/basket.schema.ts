import { z } from "zod";

const MAX_INTEGER_VALUE = 2_147_483_647;

const basketSupplySchema = z.object({
  supplyId: z.uuid("Selecione um mantimento válido."),
  quantity: z
    .string()
    .trim()
    .refine((value) => {
      if (!/^[1-9]\d*$/.test(value)) return false;
      const quantity = Number(value);
      return Number.isSafeInteger(quantity) && quantity <= MAX_INTEGER_VALUE;
    }, "Informe uma quantidade inteira maior que zero."),
});

export const basketSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome da cesta.")
      .max(200, "O nome pode ter no máximo 200 caracteres."),
    description: z
      .string()
      .trim()
      .max(2000, "A descrição pode ter no máximo 2000 caracteres."),
    supplies: z
      .array(basketSupplySchema)
      .min(1, "Adicione pelo menos um mantimento."),
  })
  .superRefine(({ supplies }, context) => {
    const seen = new Set<string>();
    supplies.forEach((item, index) => {
      if (seen.has(item.supplyId))
        context.addIssue({
          code: "custom",
          path: ["supplies", index, "supplyId"],
          message: "Esse mantimento já foi adicionado.",
        });
      seen.add(item.supplyId);
    });
  });
