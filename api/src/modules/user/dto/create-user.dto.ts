import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

import {
  PASSWORD_LOWERCASE_MESSAGE,
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_SPECIAL_CHARACTER_MESSAGE,
  PASSWORD_SPECIAL_CHARACTER_REGEX,
  PASSWORD_UPPERCASE_MESSAGE,
  PASSWORD_UPPERCASE_REGEX,
} from '../validation/password.validation';

export class CreateUserDto {
  @ApiProperty({ example: 'Ana Souza', minLength: 2 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'usuario@exemplo.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'SenhaSegura@123',
    minLength: PASSWORD_MIN_LENGTH,
    writeOnly: true,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE })
  @Matches(PASSWORD_UPPERCASE_REGEX, { message: PASSWORD_UPPERCASE_MESSAGE })
  @Matches(PASSWORD_LOWERCASE_REGEX, { message: PASSWORD_LOWERCASE_MESSAGE })
  @Matches(PASSWORD_SPECIAL_CHARACTER_REGEX, {
    message: PASSWORD_SPECIAL_CHARACTER_MESSAGE,
  })
  password!: string;
}
