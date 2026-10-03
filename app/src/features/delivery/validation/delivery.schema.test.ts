import {
  beneficiarySearch,
  deliverySchema,
  formatCpf,
} from "./delivery.schema";
const valid = {
  beneficiaryId: "beneficiary",
  basketId: "basket",
  quantity: "1",
  observation: "",
};
describe("delivery rules", () => {
  test.each(["0", "-1", "1.2", "2147483648", "abc", ""])(
    "rejects quantity %s",
    (quantity) => {
      expect(deliverySchema.safeParse({ ...valid, quantity }).success).toBe(
        false,
      );
    },
  );
  test.each(["1", "2", "2147483647"])("accepts quantity %s", (quantity) => {
    expect(deliverySchema.safeParse({ ...valid, quantity }).success).toBe(true);
  });
  test("requires both selections and limits observations", () => {
    expect(
      deliverySchema.safeParse({ ...valid, beneficiaryId: "" }).success,
    ).toBe(false);
    expect(deliverySchema.safeParse({ ...valid, basketId: "" }).success).toBe(
      false,
    );
    expect(
      deliverySchema.safeParse({ ...valid, observation: "a".repeat(2000) })
        .success,
    ).toBe(true);
    expect(
      deliverySchema.safeParse({ ...valid, observation: "a".repeat(2001) })
        .success,
    ).toBe(false);
  });
  test("uses exact CPF and name filters, keeping partial CPF local", () => {
    expect(beneficiarySearch("Ana Souza").params).toEqual({
      search: "Ana Souza",
    });
    expect(beneficiarySearch("123.456.789-09").params).toEqual({
      cpf: "12345678909",
    });
    expect(beneficiarySearch("12345678909").params).toEqual({
      cpf: "12345678909",
    });
    expect(beneficiarySearch("123").error).toBe(
      "Complete os 11 dígitos do CPF.",
    );
    expect(beneficiarySearch("").params).toEqual({});
    expect(formatCpf("12345678909")).toBe("123.456.789-09");
  });
});
