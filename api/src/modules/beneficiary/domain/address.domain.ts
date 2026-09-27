export interface AddressRecord {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressDomain {
  readonly id: string;
  readonly street: string;
  readonly number: string;
  readonly complement: string | null;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(record: AddressRecord) {
    this.id = record.id;
    this.street = record.street;
    this.number = record.number;
    this.complement = record.complement;
    this.neighborhood = record.neighborhood;
    this.city = record.city;
    this.state = record.state;
    this.postalCode = record.postalCode;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }

  static fromPrisma(record: AddressRecord) {
    return new AddressDomain(record);
  }
  static fromPrismaMany(records: AddressRecord[]) {
    return records.map((record) => this.fromPrisma(record));
  }
}
