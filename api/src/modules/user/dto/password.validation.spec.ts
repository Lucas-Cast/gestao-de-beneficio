import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateUserDto } from './create-user.dto';
import { LoginUserDto } from './login-user.dto';

const invalidPasswords = ['abc12345', 'ABC12345', 'Abcdefgh', 'Ab1!'];
const validPassword = 'SenhaSegura@123';

const createDto = (password: string) =>
  plainToInstance(CreateUserDto, {
    name: 'Ana Souza',
    email: 'usuario@exemplo.com',
    password,
  });

const loginDto = (password: string) =>
  plainToInstance(LoginUserDto, {
    email: 'usuario@exemplo.com',
    password,
  });

describe('password validation', () => {
  it.each(invalidPasswords)(
    'rejects weak passwords on create: %s',
    async (password) => {
      const errors = await validate(createDto(password));

      expect(
        errors.find((error) => error.property === 'password'),
      ).toBeDefined();
    },
  );

  it.each(invalidPasswords)(
    'does not enforce password format on login: %s',
    async (password) => {
      const errors = await validate(loginDto(password));

      expect(
        errors.find((error) => error.property === 'password'),
      ).toBeUndefined();
    },
  );

  it('accepts a strong password on create', async () => {
    const errors = await validate(createDto(validPassword));

    expect(
      errors.find((error) => error.property === 'password'),
    ).toBeUndefined();
  });
});
