# Convenções para módulos

Cada recurso deve ficar em `src/modules/<recurso>` e possuir, no mínimo:

- `<recurso>.module.ts`, `<recurso>.controller.ts` e `<recurso>.repository.ts`;
- `domain/<recurso>.domain.ts` para representar a entidade de domínio e converter os tipos retornados pelo Prisma;
- `dto/create-<recurso>.dto.ts` e `dto/update-<recurso>.dto.ts` para contratos HTTP.

Quando a regra de negócio precisar ser dividida entre mais de um serviço, use a pasta `service/`. Ela deve conter o serviço principal (`<recurso>.service.ts`) e os serviços de apoio, como `hash.service.ts`.

## Responsabilidades

- O controller expõe rotas REST, usa DTOs concretos, documenta os endpoints com Swagger e não acessa o banco diretamente.
- Os services em `service/` concentram regras de negócio, erros HTTP e conversões entre Prisma e domínio. Extraia lógicas reutilizáveis para serviços de apoio injetáveis.
- O repository é a única camada que consulta o Prisma, por meio de `DatabaseService`.
- A entidade em `domain` deve ter métodos estáticos `fromPrisma` e `fromPrismaMany`. Nunca exponha dados sensíveis, como hashes de senha.
- DTOs devem usar `class-validator` e decoradores do Swagger. O DTO de atualização deve estender `PartialType` do DTO de criação.

## Dados e exclusão lógica

- Para entidades com `isDeleted`, o repository deve excluir registros apagados das consultas normais.
- A remoção deve atualizar `isDeleted` para `true`, sem apagar a linha fisicamente.

## Qualidade

- Importe o módulo novo em `AppModule`.
- Adicione testes para regras de negócio relevantes.
- Rode a geração do Prisma, typecheck, lint e testes depois da alteração.
