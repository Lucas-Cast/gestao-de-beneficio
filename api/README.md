<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Organização das regras de negócio

- O domínio concentra regras puras da entidade, cálculos e invariantes que não dependem de banco de dados, rede ou outros serviços. Entidades de domínio podem ter comportamento; não devem ser apenas cópias dos modelos do Prisma.
- O service coordena os casos de uso: consulta apenas seu próprio repository, chama services de outros módulos quando necessário, aplica as regras do domínio e controla transações que envolvem múltiplas operações.
- O repository é a única camada que acessa o Prisma e o banco de dados. Quando uma operação estiver dentro de uma transação iniciada pelo service, o service passa o cliente transacional aos métodos do repository para que todas as gravações participem da mesma transação.
- Regras que dependem do estado atual do banco, especialmente concorrência e saldo de estoque, também precisam ser garantidas pela operação atômica no banco. Uma validação anterior no domínio não substitui essa proteção.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

Integration tests use `@testcontainers/postgresql`: each suite starts its own disposable PostgreSQL 18 container, applies all migrations, boots Nest, and closes the application and container on teardown. Docker must be available to the Node process. Tests set both `DATABASE_URL` and `DIRECT_URL` to the container URI and never fall back to `.env` database connections. The PostgreSQL image is pinned by digest in `test/helpers/integration-app.ts`; keep its major version aligned with production when upgrading. Use Node.js 22.22 or later.

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Inventory API

All inventory endpoints require a JWT for an active user. Manual movements are available to authenticated active users, including `COMMON`. The actor is always obtained from the JWT-authenticated user; request bodies cannot set actor IDs or attach manual movements to a delivery.

| Endpoint | Behavior |
| --- | --- |
| `POST /supplies` | Create a supply with optional opening `currentQuantity` (database default: zero). |
| `GET /supplies` | Paginated catalog; filters: `search`, `unit`. |
| `GET /supplies/:id` | Read an active supply. |
| `PATCH /supplies/:id` | Update `name`, `description`, or `unit`; quantity updates are rejected. |
| `DELETE /supplies/:id` | Soft delete a supply and preserve its history. |
| `POST /stock-movements` | Record a manual `IN` or `OUT` and atomically update its supply balance. |
| `GET /stock-movements` | Paginated audit history; filters: `supplyId`, `type`, `performedById`, `basketDeliveryId`, `from`, `to`. |
| `POST /basket-deliveries` | Deliver a basket definition, decrement all required supplies, and link the resulting `OUT` movements in one transaction. |

List endpoints accept `page` (default 1) and `pageSize` (default 20, maximum 100) and return `{ data, total, page, pageSize }`. Dates in movement filters are inclusive; results are ordered by `createdAt` and `id`, descending. Stock and basket item quantities are whole JSON integers, stored as PostgreSQL `INTEGER` and returned as JSON numbers. The chosen `unit` determines what one unit represents: for example, `2` with `KILOGRAM` or `1500` with `GRAM`.

Basket delivery accepts `basketId`, `beneficiaryId`, optional integer `quantity` (default 1), and optional `observation`. Create these referenced records using the beneficiary and basket APIs below. Deliveries and movements have no update/delete endpoints. Supply opening balances do not create movements, so summing movement history alone does not reconstruct a nonzero opening balance.

The delivery-to-movement relation is introduced by `20260926140000_link_delivery_stock_movements`; `20260926150000_use_integer_stock_quantities` converts inventory amounts to whole units. The latter migration stops if existing stock, basket, or movement values have fractions, so they can be reviewed rather than rounded silently. Apply pending migrations with `npm run prisma:deploy` before running the updated API. Existing movements retain a null delivery reference.

## Beneficiary, basket, and audit API

These endpoints require an active JWT-authenticated user of either role. All errors are returned in Brazilian Portuguese.

| Endpoint | Behavior |
| --- | --- |
| `POST /beneficiaries` | Create a beneficiary and nested `address`. |
| `GET /beneficiaries` | Paginated active records; filters: name `search`, exact `cpf`. |
| `GET /beneficiaries/:id` | Return a beneficiary with its complete address. |
| `PATCH /beneficiaries/:id` | Partially update beneficiary fields and/or address fields. |
| `DELETE /beneficiaries/:id` | Soft delete the beneficiary, preserving the address and deliveries. |
| `POST /baskets` | Create a named basket with non-empty `supplies: [{ supplyId, quantity }]`. |
| `GET /baskets` | Paginated active basket definitions; filter: name `search`. |
| `GET /baskets/:id` | Return the basket's active items with complete nested supplies. |
| `DELETE /baskets/:id` | Soft delete the basket and its active items atomically. |

Both lists follow the inventory pagination contract and ordering. Basket names may repeat; basket composition is fixed and there is no update endpoint. Quantities are positive integers, supply IDs cannot repeat within one basket, and all references must be active at creation. Creating or deleting a basket definition does not change stock. Existing deliveries and their movement history remain intact after soft deletion.

Beneficiary dates use `YYYY-MM-DD` and cannot be in the future. CPF check digits are validated, CPF/phone/CEP formatting is removed before persistence, and UF is normalized to uppercase. A CPF remains reserved after soft deletion. Omitted fields are preserved on PATCH; `address.complement` may be cleared with `null`, while required fields reject `null`.

The reusable audit service writes one `AuditLog` per successful beneficiary create/update/delete or basket create/delete in the caller's transaction. The entity type and ID identify an aggregate without a foreign key to it; the actor has a restrictive foreign key to `User`. Creation records the initial state, updates record only changed fields, and basket deletion includes the removed active composition. Address changes include the complete old/new address. Automatic timestamp-only changes are ignored; a no-op beneficiary update records empty `from`/`to` objects. Audit records have no write/delete or query endpoints.

Beneficiary update/delete and basket create/delete use serializable transactions. Concurrent conflicts return the existing Portuguese HTTP 409 response, so clients can retry; audit failures roll back the entire domain change.

Apply `20260926160000_add_audit_log` with `npm run prisma:deploy` before starting this version, and generate the client with `npm run prisma:generate`. The migration only adds the audit enum, table, actor relation, and indexes; it does not backfill historical changes. See [the module plan](plans/beneficiary-and-basket.md) for business rules and test coverage.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
