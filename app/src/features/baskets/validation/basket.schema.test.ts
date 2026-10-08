import { basketSchema } from "./basket.schema";

const supplyId = "7c1fa355-dced-424b-a1e4-df60f9d77051";
const validBasket = {
  name: "Cesta básica",
  description: "",
  supplies: [{ supplyId, quantity: "2" }],
};

test("validates basket name and requires at least one supply", () => {
  expect(basketSchema.safeParse(validBasket).success).toBe(true);
  expect(basketSchema.safeParse({ ...validBasket, name: " " }).success).toBe(
    false,
  );
  const empty = basketSchema.safeParse({ ...validBasket, supplies: [] });
  expect(empty.success).toBe(false);
  if (!empty.success)
    expect(empty.error.issues[0].message).toBe(
      "Adicione pelo menos um mantimento.",
    );
});

test("requires each basket quantity to be a positive whole number", () => {
  for (const quantity of ["", "0", "-1", "1.5", "2147483648", "abc"]) {
    const result = basketSchema.safeParse({
      ...validBasket,
      supplies: [{ supplyId, quantity }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Informe uma quantidade inteira maior que zero.",
      );
      expect(result.error.issues[0].message).not.toContain("2.147");
    }
  }
});

test("rejects duplicate supplies and invalid identifiers", () => {
  expect(
    basketSchema.safeParse({
      ...validBasket,
      supplies: [
        { supplyId, quantity: "2" },
        { supplyId, quantity: "3" },
      ],
    }).success,
  ).toBe(false);
  expect(
    basketSchema.safeParse({
      ...validBasket,
      supplies: [{ supplyId: "invalid", quantity: "2" }],
    }).success,
  ).toBe(false);
});
