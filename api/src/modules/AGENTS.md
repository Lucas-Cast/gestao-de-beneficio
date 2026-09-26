# Convenções para módulos

Cada recurso deve ficar em `src/modules/<recurso>` e possuir, no mínimo:

- `<recurso>.module.ts`, `<recurso>.controller.ts` e `<recurso>.repository.ts`;
- `domain/<recurso>.domain.ts` para representar a entidade de domínio e converter os tipos retornados pelo Prisma;
- `dto/create-<recurso>.dto.ts` e `dto/update-<recurso>.dto.ts` para contratos HTTP.

Quando a regra de negócio precisar ser dividida entre mais de um serviço, use a pasta `service/`. Ela deve conter o serviço principal (`<recurso>.service.ts`) e os serviços de apoio, como `hash.service.ts`.

## Responsabilidades

- O controller expõe rotas REST, usa DTOs concretos, documenta os endpoints com Swagger e não acessa o banco diretamente.
- Os services em `service/` coordenam casos de uso, transações e conversões entre Prisma e domínio. Extraia lógicas reutilizáveis para serviços de apoio injetáveis.
- Cada service pode injetar e chamar diretamente apenas o repository do próprio módulo. Para consultar ou alterar dados pertencentes a outro módulo, deve chamar o service desse módulo — nunca injetar o repository alheio. Quando a operação fizer parte de uma transação coordenada, passe o `Prisma.TransactionClient` ao método público apropriado do service proprietário; o repository continua encapsulado no módulo.
- O repository é a única camada que consulta o Prisma, por meio de `DatabaseService`.
- A entidade em `domain` deve ter métodos estáticos `fromPrisma` e `fromPrismaMany`. Nunca exponha dados sensíveis, como hashes de senha.
- DTOs devem usar `class-validator` e decoradores do Swagger. O DTO de atualização deve estender `PartialType` do DTO de criação.

## Regras puras e erros

- Coloque no domínio cálculos e invariantes que dependam apenas dos dados recebidos. Domínio não deve importar NestJS, Prisma, repositories ou realizar I/O.
- Represente falhas de regras de negócio com erros tipados de domínio. No limite do service, converta esses erros por meio de um mapper compartilhado para as exceções HTTP nativas do NestJS, com status e mensagens em português adequados.
- Converta erros conhecidos do Prisma no limite do service usando um mapper compartilhado. Não exponha códigos, mensagens ou detalhes internos do banco; erros desconhecidos devem continuar como erros internos.
- Use `ValidationPipe.exceptionFactory` para converter erros de validação em mensagens em português.
- Um filtro global de exceções deve padronizar o corpo das respostas HTTP, preservar status e mensagens das `HttpException` conhecidas e retornar uma mensagem genérica em português para falhas inesperadas, sem vazar detalhes internos.
- A verificação de regras baseada em estado mutável, como saldo suficiente, não pode depender apenas de uma validação no domínio. Reforce-a com uma operação atômica no banco dentro da transação.

## Idioma das respostas

- Todas as mensagens de erro retornadas pela API devem estar em português do Brasil, incluindo erros de validação, autenticação, autorização, regras de negócio e recursos não encontrados.
- Configure mensagens explícitas nos validadores e exceções; não deixe mensagens padrão em inglês chegarem ao cliente.
- Não exponha mensagens internas do Prisma, stack traces, nomes de tabelas ou detalhes técnicos em respostas HTTP. Registre detalhes internos nos logs e retorne uma mensagem segura em português.
- Mantenha códigos, nomes de campos, enums e identificadores técnicos em inglês quando fizerem parte do contrato da API; esta regra se aplica ao texto legível por pessoas.

## Dados e exclusão lógica

- Para entidades com `deletedAt`, o repository deve excluir registros apagados das consultas normais usando `deletedAt: null`.
- A remoção deve preencher `deletedAt` com a data atual, sem apagar a linha fisicamente.

## Qualidade

- Importe o módulo novo em `AppModule`.
- Adicione testes para regras de negócio relevantes.
- Rode a geração do Prisma, typecheck, lint e testes depois da alteração.

## Testes de integração

- Todos os testes de integração da API devem usar Testcontainers para iniciar um PostgreSQL descartável; não dependa de um banco de desenvolvimento ou serviço compartilhado.
- Cada suíte de integração inicia seu container antes de configurar Prisma/Nest, usa a URL dinâmica do container, aplica as migrations com `prisma migrate deploy` e encerra conexões e container no teardown, inclusive após falha.
- Use uma imagem PostgreSQL com a mesma versão principal da produção. Configure a suíte para não compartilhar estado entre testes; suítes podem executar em paralelo porque cada uma tem seu próprio banco efêmero.
- O runner de integração deve falhar claramente se Docker ou o runtime de containers não estiver disponível. Nunca use credenciais ou URLs de produção nos testes.
