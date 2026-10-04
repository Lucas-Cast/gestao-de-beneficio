import { beneficiarySchema, isValidCpf } from "./beneficiary.schema";

const validBeneficiary = {
  name: "Ana Souza",
  birthDate: "1990-01-01",
  sex: "F",
  phone: "(91) 99999-9999",
  cpf: "529.982.247-25",
  address: {
    street: "Rua das Flores",
    number: "15",
    complement: "",
    neighborhood: "Centro",
    city: "Belém",
    state: "pa",
    postalCode: "66000-000",
  },
};

test("accepts valid beneficiary data and normalizes the state abbreviation", () => {
  const result = beneficiarySchema.safeParse(validBeneficiary);
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.address.state).toBe("PA");
});

test("accepts phone numbers with the optional Brazilian country code", () => {
  expect(
    beneficiarySchema.safeParse({
      ...validBeneficiary,
      phone: "+55 (91) 99999-9999",
    }).success,
  ).toBe(true);
});

test.each([
  { cpf: "111.111.111-11" },
  { cpf: "529.982.247-24" },
  { cpf: "abc529.982.247-25" },
  { birthDate: "2001-02-29" },
  { birthDate: "2999-01-01" },
  { phone: "123456789" },
  { phone: "(91) 9abc5-4321" },
  { address: { ...validBeneficiary.address, state: "XX" } },
  { address: { ...validBeneficiary.address, postalCode: "6600" } },
  { address: { ...validBeneficiary.address, postalCode: "abc66000-000" } },
])("rejects invalid beneficiary fields: %o", (override) => {
  expect(
    beneficiarySchema.safeParse({ ...validBeneficiary, ...override }).success,
  ).toBe(false);
});

test("validates CPF check digits", () => {
  expect(isValidCpf("529.982.247-25")).toBe(true);
  expect(isValidCpf("529.982.247-24")).toBe(false);
});
