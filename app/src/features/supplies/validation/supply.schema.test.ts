import { stockMovementSchema, supplySchema } from "./supply.schema";

const supply = {
  name: "Arroz",
  description: "",
  unit: "KILOGRAM",
  currentQuantity: "",
};

const movement = {
  supplyId: "7c1fa355-dced-424b-a1e4-df60f9d77051",
  type: "OUT",
  quantity: "1",
  reason: "",
};

test("supply accepts omitted opening stock and zero, but rejects fractions and overflow", () => {
  expect(supplySchema.safeParse(supply).success).toBe(true);
  expect(supplySchema.safeParse({ ...supply, currentQuantity: "0" }).success).toBe(true);
  for (const currentQuantity of ["-1", "1.5", "2147483648", "abc"]) {
    const result = supplySchema.safeParse({ ...supply, currentQuantity });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Informe um saldo inicial inteiro maior ou igual a zero.",
      );
    }
  }
});

test("supply requires a name and a supported unit", () => {
  expect(supplySchema.safeParse({ ...supply, name: " " }).success).toBe(false);
  expect(supplySchema.safeParse({ ...supply, unit: "BOX" }).success).toBe(false);
});

test("movement requires an identified supply and a positive whole quantity", () => {
  expect(stockMovementSchema.safeParse(movement).success).toBe(true);
  expect(stockMovementSchema.safeParse({ ...movement, supplyId: "" }).success).toBe(false);
  for (const quantity of ["0", "-1", "1.5", "2147483648"]) {
    expect(stockMovementSchema.safeParse({ ...movement, quantity }).success).toBe(false);
  }
});
