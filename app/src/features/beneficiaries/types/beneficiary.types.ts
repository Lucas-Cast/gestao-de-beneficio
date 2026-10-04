export type BeneficiarySex = "M" | "F";

export type BeneficiaryAddress = {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  createdAt: string;
  updatedAt: string;
};

export type Beneficiary = {
  id: string;
  name: string;
  birthDate: string;
  sex: BeneficiarySex;
  phone: string;
  cpf: string;
  address: BeneficiaryAddress;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BeneficiaryPage = {
  data: Beneficiary[];
  total: number;
  page: number;
  pageSize: number;
};

export type BeneficiaryFormValues = {
  name: string;
  birthDate: string;
  sex: string;
  phone: string;
  cpf: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
  };
};
