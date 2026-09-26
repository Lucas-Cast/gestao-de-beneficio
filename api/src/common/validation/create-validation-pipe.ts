import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

const defaults: Record<string, string> = {
  whitelistValidation: 'Este campo não é permitido.',
  unknownValue: 'Dados inválidos.',
  isString: 'O valor deve ser um texto.',
  isEmail: 'Informe um e-mail válido.',
  minLength: 'O texto não possui o tamanho mínimo necessário.',
  isNotEmpty: 'Este campo é obrigatório.',
};

function messages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.entries(error.constraints ?? {}).map(([rule, message]) => {
      // Existing validators may use class-validator's default English messages.
      const isDefault =
        message.startsWith(error.property) || rule === 'unknownValue';
      return rule === 'whitelistValidation'
        ? `${error.property}: ${defaults.whitelistValidation}`
        : isDefault && defaults[rule]
          ? `${error.property}: ${defaults[rule]}`
          : message;
    }),
    ...messages(error.children ?? []),
  ]);
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new BadRequestException(messages(errors)),
  });
}
