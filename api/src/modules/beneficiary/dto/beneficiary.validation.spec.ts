import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../../common/validation/create-validation-pipe';
import { isValidBirthDate, isValidCpf } from '../domain/beneficiary.validation';
import { CreateBeneficiaryDto } from './create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './update-beneficiary.dto';

const valid = {
  name: ' Ana ',
  birthDate: '1990-01-01',
  sex: 'F',
  phone: '(91) 99999-9999',
  cpf: '529.982.247-25',
  address: {
    street: 'Rua',
    number: '15',
    neighborhood: 'Centro',
    city: 'Belém',
    state: 'pa',
    postalCode: '66000-000',
  },
};

describe('Beneficiary validation', () => {
  const pipe = createValidationPipe();
  const create = (body: object) =>
    pipe.transform(body, { type: 'body', metatype: CreateBeneficiaryDto });
  const update = (body: object) =>
    pipe.transform(body, { type: 'body', metatype: UpdateBeneficiaryDto });

  it('normalizes formatting and accepts a date without a time component', async () => {
    expect(await create(valid)).toMatchObject({
      name: 'Ana',
      cpf: '52998224725',
      phone: '91999999999',
      birthDate: '1990-01-01',
      address: { state: 'PA', postalCode: '66000000' },
    });
  });

  it.each([
    { name: ' ' },
    { name: null },
    { sex: 'X' },
    { cpf: '11111111111' },
    { cpf: '52998224724' },
    { birthDate: '2001-02-29' },
    { birthDate: '2999-01-01' },
    { birthDate: '1990-01-01T00:00:00Z' },
    { phone: '123' },
    { address: null },
    { address: [] },
    { address: {} },
    { changedById: 'forged' },
  ])('rejects invalid input %p', async (changes) => {
    await expect(create({ ...valid, ...changes })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it.each([
    { state: 'XX' },
    { postalCode: '123' },
    { street: ' ' },
    { number: null },
  ])('validates address fields %p', async (changes) => {
    await expect(
      create({ ...valid, address: { ...valid.address, ...changes } }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('supports a partial nested address, clearing complement, and omitting address', async () => {
    expect(
      await update({ address: { city: 'Ananindeua', complement: null } }),
    ).toMatchObject({ address: { city: 'Ananindeua', complement: null } });
    expect((await update({ name: 'Outra' })).address).toBeUndefined();
  });

  it.each([
    { name: null },
    { cpf: null },
    { address: null },
    { address: { city: null } },
    { addressId: 'forged' },
    { deletedAt: '2026-01-01' },
  ])('rejects invalid partial updates %p', async (body) => {
    await expect(update(body)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates CPF check digits and calendar dates', () => {
    expect(isValidCpf('11144477735')).toBe(true);
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidBirthDate('2000-02-29', new Date('2026-01-01'))).toBe(true);
    expect(isValidBirthDate('1900-02-29', new Date('2026-01-01'))).toBe(false);
    expect(isValidBirthDate('2026-01-02', new Date('2026-01-01'))).toBe(false);
  });
});
