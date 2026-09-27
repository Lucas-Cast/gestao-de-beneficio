import { AddressDomain, AddressRecord } from './address.domain';
import { BeneficiarySex } from './beneficiary.validation';

interface BeneficiaryRecord {
  id: string;
  name: string;
  birthDate: Date;
  sex: BeneficiarySex;
  phone: string;
  cpf: string;
  address: AddressRecord;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class BeneficiaryDomain {
  readonly id: string;
  readonly name: string;
  readonly birthDate: string;
  readonly sex: BeneficiarySex;
  readonly phone: string;
  readonly cpf: string;
  readonly address: AddressDomain;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(record: BeneficiaryRecord) {
    this.id = record.id;
    this.name = record.name;
    this.birthDate = record.birthDate.toISOString().slice(0, 10);
    this.sex = record.sex;
    this.phone = record.phone;
    this.cpf = record.cpf;
    this.address = AddressDomain.fromPrisma(record.address);
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
    this.deletedAt = record.deletedAt;
  }

  static fromPrisma(record: BeneficiaryRecord) {
    return new BeneficiaryDomain(record);
  }
  static fromPrismaMany(records: BeneficiaryRecord[]) {
    return records.map((record) => this.fromPrisma(record));
  }
}
