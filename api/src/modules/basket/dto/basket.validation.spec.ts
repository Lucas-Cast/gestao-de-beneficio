import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../../common/validation/create-validation-pipe';
import { CreateBasketDto } from './create-basket.dto';

describe('Basket DTO validation', () => {
  const pipe = createValidationPipe();
  const item = {
    supplyId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    quantity: 2,
  };
  const create = (body: object) =>
    pipe.transform(body, { type: 'body', metatype: CreateBasketDto });

  it('accepts and normalizes a fixed basket definition', async () => {
    expect(await create({ name: ' Cesta ', supplies: [item] })).toMatchObject({
      name: 'Cesta',
      supplies: [item],
    });
  });

  it.each([
    { name: '', supplies: [item] },
    { name: 'Cesta', supplies: [] },
    { name: 'Cesta', supplies: null },
    { name: 'Cesta', supplies: [null] },
    { name: 'Cesta', supplies: [item, item] },
    { name: 'Cesta', supplies: [{ ...item, quantity: 0 }] },
    { name: 'Cesta', supplies: [{ ...item, quantity: 1.5 }] },
    { name: 'Cesta', supplies: [{ ...item, quantity: null }] },
    { name: 'Cesta', supplies: [{ ...item, supplyId: 'invalid' }] },
    { name: 'Cesta', supplies: [item], changedById: 'forged' },
  ])('rejects invalid input %p', async (body) => {
    await expect(create(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
