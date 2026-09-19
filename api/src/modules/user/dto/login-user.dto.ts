import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
export class LoginUserDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() email!: string;
  @ApiProperty({ example: 'senha-segura-123', minLength: 8, writeOnly: true })
  @IsString() @MinLength(8) password!: string;
}
