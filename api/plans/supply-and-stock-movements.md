# Supply, Stock Movement, and Basket Delivery Plan

## Purpose

This document records the architecture, business rules, and implemented test cases for supplies, stock movements, and basket deliveries. The modules and their tests are implemented; the new database migration must be deployed with the application.

## Domain responsibilities

- `Supply` is the catalog entry for an inventory item. It owns the current balance and the unit used to measure that balance.
- `StockMovement` is the immutable audit record of a stock increase or decrease. Its quantity is always positive; `type` determines the direction.
- `Basket` is a reusable basket definition. Its active `BasketSupply` rows specify the amount of each supply consumed by one basket.
- `BasketDelivery` records a quantity of baskets delivered to one beneficiary by one authenticated user.

## Module architecture

Implement the work in resource-oriented NestJS modules under `src/modules/`.

- `supply` owns supply CRUD, stock balance reads, and supply lifecycle rules.
- `stock-movement` owns movement contracts and history queries. Movement creation should be exposed only through business operations such as basket delivery or a separately authorized stock operation; controllers must not update stock directly.
- `basket-delivery` owns delivery creation, coordinating basket, beneficiary, supply, and movement records.
- Each module follows the repository conventions in `src/modules/AGENTS.md`: controller, service, repository, domain mapping, and DTOs. Repositories are the only layer that accesses Prisma.
- Use authenticated user identity from the JWT as the actor. Never accept `performedById` or `deliveredById` from an untrusted request body.
- Pure domains contain calculations and typed business failures without NestJS or Prisma imports. DTOs document HTTP responses separately; `fromPrisma` accepts structural records instead of coupling domains to the ORM.

## Supply API and rules

Provide the standard supply CRUD: create, list, get by ID, update, and soft delete.

- Creation accepts `name`, optional `description`, `unit`, and optional initial `currentQuantity`.
- If initial quantity is omitted, omit it from Prisma's create input and let the database apply `DEFAULT 0`. It may be supplied during creation even though no `StockMovement` is created for that opening balance.
- Stock, basket item, and movement quantities are whole numbers, stored as PostgreSQL `INTEGER`. The selected unit defines what one unit means: for example, `2 KILOGRAM` or `1500 GRAM`.
- Updates may change catalog fields such as `name`, `description`, and `unit`. They must not accept `currentQuantity`; stock changes after creation go through movements.
- Normal list and detail queries exclude rows with `deletedAt` set. Deletion is logical and must preserve movement and basket history.
- A deleted supply cannot be used for new basket deliveries or new movements. Existing records remain available in historical views.
- Reject duplicate supply names using the database unique constraint and translate that failure into the API's established conflict response.

## Stock movement rules

- `IN` and `OUT` quantities are strictly positive. Zero and negative movement quantities are invalid.
- `IN` increases `Supply.currentQuantity`; `OUT` decreases it.
- Never update or delete a movement to correct stock history. Record a compensating movement instead.
- Update the supply balance and insert its movement in the same database transaction. If either operation fails, neither should persist.
- An `OUT` movement must not make the balance negative. Enforce this inside the transaction to prevent concurrent requests from overselling stock.
- An initial quantity provided when creating a supply is an opening balance, not a movement. If opening-balance audit is required later, introduce a dedicated opening movement policy rather than silently changing this rule.
- Movement history is ordered newest first and supports filtering by supply, movement type, actor, and date range as the API needs evolve.
- `POST /stock-movements` is the authenticated manual-stock operation. Active users of either role may create entries and exits. `GET /stock-movements` filters by `supplyId`, `type`, `performedById`, `basketDeliveryId`, `from`, and `to`. Date bounds are inclusive. History pagination uses `page=1`, `pageSize=20` by default, with a maximum of 100 items; ordering is `createdAt DESC, id DESC`.
- Supply lists follow the same pagination contract (`{ data, total, page, pageSize }`) and support `search` and `unit`. Quantities are JSON integers and must fit PostgreSQL `INTEGER`.

## Basket delivery operations

Only delivery creation is in scope for `BasketDelivery` initially. Deliveries are permanent business records and do not have a soft-delete operation.

### Create

The request identifies the beneficiary, basket, number of baskets (`quantity`, default `1`), and optional observation. The actor is taken from the authenticated JWT.

Within one transaction:

1. Validate that the beneficiary, basket, and authenticated user are active and eligible for this operation.
2. Load the basket's active `BasketSupply` rows and validate that it contains at least one item and that every referenced supply is active.
3. Require a positive integer basket quantity.
4. For every basket item, multiply its integer quantity by the number of baskets and reject a result that exceeds the PostgreSQL `INTEGER` range.
5. Verify and atomically decrement each supply balance. Reject the complete delivery if any supply lacks enough stock; do not partially deliver a basket.
6. Create one `OUT` stock movement per supply for the total quantity consumed, attributed to the authenticated user. The delivery row is inserted earlier in the same transaction so movements can reference its ID.
7. Commit the delivery, movements, and all balance changes together. An error rolls back the earlier delivery insert as well.

`StockMovement.basketDeliveryId` now optionally links a movement to its delivery. The `20260926140000_link_delivery_stock_movements` migration introduces this relation, its index, and a constraint allowing only `OUT` movements to reference a delivery. Existing and manual movements keep a null reference. This association preserves the actual quantities moved at delivery time independently of later basket definition changes.

## Transaction and concurrency requirements

- Use Prisma interactive transactions for delivery and movement operations.
- Prevent lost updates and negative balances under concurrent requests. Use conditional atomic updates such as `updateMany` with `currentQuantity >= requiredQuantity`, checking the affected-row count, or an equivalent locking/isolation strategy supported by the database.
- Treat the entire basket delivery as atomic across all supplies. A shortage in any one supply rolls back every balance change, movement, and delivery record.
- Keep transaction logic in services; repositories provide the Prisma operations needed to perform it.

## Error behavior

Represent business-rule failures such as missing or deleted references, empty basket definitions, invalid quantities, insufficient stock, duplicate names, and attempts to update stock through the supply update endpoint as typed, framework-independent domain errors. At the service boundary, use a shared mapper to translate domain errors and known Prisma constraint errors into appropriate NestJS HTTP exceptions with Brazilian Portuguese messages. Never expose Prisma codes or database details.

Use `ValidationPipe.exceptionFactory` to return validation messages in Brazilian Portuguese. A global exception filter standardizes HTTP error responses and converts unexpected failures to a safe, generic Portuguese message while preserving known HTTP status codes and messages. Keep pure calculations and invariants in the domain; services orchestrate them with repositories and transactions.

## Implementation sequence

1. Implement Supply DTOs, domain mapping, repository, service, controller, and CRUD behavior. Ensure `currentQuantity` is create-only.
2. Implement stock movement persistence and history queries, then centralize all balance changes through transactional movement operations.
3. Add the delivery-to-movement audit association to the Prisma schema and migration.
4. Implement transactional delivery creation.
5. Add focused tests for input rules, default opening balance, immutable stock on update, insufficient inventory rollback, concurrent decrements, and delivery movement audit records.

## Test requirements

Every business and operational rule in this plan must have one or more explicit test cases. Keep this checklist updated with the cases implemented so reviewers can see which guarantees are covered.

### Unit tests

- Supply DTOs reject invalid names, units, negative or fractional initial quantities, and attempts to include `currentQuantity` in update requests.
- Supply creation uses the database default of `0` when the initial quantity is omitted and persists a supplied opening balance without creating a stock movement.
- Supply CRUD excludes soft-deleted records, rejects duplicate names, and does not allow deleted supplies in new stock operations.
- Stock movement validation rejects zero and negative quantities; `IN` increases the balance and `OUT` decreases it.
- Basket delivery validates a positive integer quantity, non-empty basket contents, active references, and correctly multiplies each basket item's quantity by the number of baskets.
- Typed domain errors map to the intended NestJS HTTP status and Brazilian Portuguese message without exposing implementation details.
- DTO validation errors are returned in Brazilian Portuguese through the configured `ValidationPipe`.

### PostgreSQL integration tests

Use Testcontainers for every API integration test. Each Jest integration suite starts its own disposable PostgreSQL container with a pinned image using the same PostgreSQL major version as production, applies the project's migrations with `prisma migrate deploy`, and stops the container during teardown, including after failures. Configure Prisma and Nest with the container's dynamic connection URL before initializing the application. Never connect integration tests to production, a shared database, or a development database containing data that must be preserved. If Docker/container runtime is unavailable, fail the integration suite clearly rather than silently falling back to another database.

- Creating a movement updates `Supply.currentQuantity` and persists its `StockMovement` in the same transaction; a failure leaves neither change committed.
- An insufficient-stock `OUT` does not change the balance or create a movement.
- Concurrent `OUT` operations against the same supply cannot oversell stock or produce a negative balance.
- Creating a basket delivery creates the delivery and all corresponding `OUT` movements, updates every affected supply balance, and records the authenticated user as actor.
- If any basket item has insufficient stock, the entire delivery rolls back, including all earlier item decrements, movements, and the delivery record.
- API integration responses for validation, missing references, and insufficient stock use Portuguese messages and do not expose internal database errors.
- Unexpected exceptions return a generic Portuguese 500 response; known HTTP exceptions preserve their intended status and safe message.

### Implemented test cases and locations

- `src/common/domain/stock-quantity.spec.ts`: whole-number validation, addition/subtraction, non-negative balances, multiplication, and integer overflow.
- `src/common/errors/to-http-exception.spec.ts`: typed domain error mapping, safe Prisma constraint/conflict mapping, and unknown error propagation.
- `src/modules/supply/dto/supply.validation.spec.ts`: required fields, allowed units, invalid/null quantities, create-only balance, Portuguese validation, and rejection of client-provided actor/delivery identifiers.
- `src/modules/supply/service/supply.service.spec.ts`: database-default opening balance, explicit opening quantities, and metadata-only updates.
- `src/modules/stock-movement/domain/stock-movement.domain.spec.ts`: positive integer movement quantities, direction, and insufficient balance.
- `src/modules/basket-delivery/domain/basket-delivery.domain.spec.ts`: basket count bounds, empty definitions, invalid item quantities, multiplication, and deterministic supply ordering.
- `test/inventory.e2e-spec.ts`: real PostgreSQL CRUD/defaults, duplicate names, catalog filtering, forbidden quantity edits, soft deletion with preserved history, integer `IN`/`OUT` balances, overflow, failed-movement rollback, insufficient balance, synchronized concurrent withdrawals, filtered/paginated history, delivery creation/audit, immutable recorded quantities, whole-delivery rollback, invalid/deleted references, authenticated actors, and safe Portuguese responses.
- `test/app.e2e-spec.ts`: application bootstrap with the same isolated Testcontainers lifecycle.

Run unit tests with `npm test -- --runInBand` and integration tests with `npm run test:e2e -- --runInBand`. The backend CD validation job runs both before applying production migrations. Integration fixtures use PostgreSQL 18 (confirmed against the configured database) and pin the container image digest; test-case data is reset between cases in each suite.

Migration `20260926150000_use_integer_stock_quantities` converts supply balances, basket item quantities, and movement quantities to `INTEGER`. It fails if existing records contain fractions; normalize those records deliberately before retrying instead of silently rounding stock history.
