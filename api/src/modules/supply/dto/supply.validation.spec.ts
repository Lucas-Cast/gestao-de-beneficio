import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../../../common/validation/create-validation-pipe';
import { CreateSupplyDto } from './create-supply.dto';
import { UpdateSupplyDto } from './update-supply.dto';
import { CreateStockMovementDto } from '../../stock-movement/dto/create-stock-movement.dto';

describe('Inventory DTO validation', () => {
  const pipe = createValidationPipe();
  it('omits the opening balance so the database can apply its default', async () => {
    const dto = await pipe.transform(
      { name: ' Arroz ', unit: 'UNIT' },
      { type: 'body', metatype: CreateSupplyDto },
    );
    expect(dto.name).toBe('Arroz');
    expect(dto.currentQuantity).toBeUndefined();
  });
  it.each([
    { name: '', unit: 'UNIT' },
    { name: 'Arroz', unit: 'INVALID' },
    { name: 'Arroz', unit: 'UNIT', currentQuantity: -1 },
    { name: 'Arroz', unit: 'UNIT', currentQuantity: 1.5 },
    { name: 'Arroz', unit: 'UNIT', currentQuantity: null },
  ])('rejects invalid supply input %p', async (body) => {
    await expect(
      pipe.transform(body, { type: 'body', metatype: CreateSupplyDto }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('forbids modifying quantity and localizes whitelist errors', async () => {
    try {
      await pipe.transform(
        { currentQuantity: 1 },
        { type: 'body', metatype: UpdateSupplyDto },
      );
      throw new Error('Expected validation failure');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: ['currentQuantity: Este campo não é permitido.'],
      });
    }
  });
  it('rejects forged movement actor/delivery and non-positive movement quantities', async () => {
    await expect(
      pipe.transform(
        {
          supplyId: 'a',
          type: 'IN',
          quantity: 0,
          performedById: 'a',
          basketDeliveryId: 'b',
        },
        { type: 'body', metatype: CreateStockMovementDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
