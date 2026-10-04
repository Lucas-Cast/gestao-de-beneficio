# Beneficiary, Basket, and Audit Plan

## Purpose

Document the architecture, business rules, API scope, and test requirements for the beneficiary and basket modules, including a generic audit log. The modules and tests are implemented. Deploy migration `20260926160000_add_audit_log` before running this application version; historical changes are not backfilled.

## Domain responsibilities

- `Beneficiary` represents a person eligible to receive basket deliveries. Its address is managed as part of the beneficiary aggregate.
- `Basket` is an immutable, reusable definition containing one or more supplies and their quantities. A changed composition is represented by creating a new basket.
- `BasketSupply` associates a basket with a supply and the positive integer quantity required by one basket.
- `AuditLog` is a generic, append-only record of changes to beneficiary and basket aggregates. It has no foreign key to the audited entity; its actor is a real `User` relation.

## Module architecture

- Implement `beneficiary`, `basket`, and `audit` as resource-oriented NestJS modules under `src/modules/`.
- Each service may call only its own repository directly. Cross-module data access must use the owning module's service. For operations inside a coordinated transaction, pass the same `Prisma.TransactionClient` to the appropriate service method.
- Keep Prisma access inside repositories, pure invariants in domain classes, and HTTP validation and documentation in DTOs/controllers. Use typed domain errors and the shared HTTP error mapper; client-visible error messages must be in Brazilian Portuguese.
- Import the new modules into `AppModule`. Export services, not repositories, for cross-module use.
- Require JWT authentication for all endpoints in these modules. Do not add role-based restrictions; both `ADMIN` and `COMMON` users with valid authentication may use them.
- Use the authenticated user ID as the audit actor. Never accept the actor ID from request bodies.

## Beneficiary module

Provide create, list, detail, update, and soft-delete operations.

- Use the existing fields: `name`, `birthDate`, `sex` (`M` or `F`), `phone`, `cpf`, and address (`street`, `number`, optional `complement`, `neighborhood`, `city`, `state`, `postalCode`).
- Manage beneficiary and address writes in one transaction. Address is not soft-deleted independently; soft-deleting its beneficiary retains the address and existing delivery history.
- CPF must remain unique. Translate duplicate CPF constraints into a safe Portuguese conflict response.
- Normal list and detail queries exclude beneficiaries with `deletedAt` set. A separate paginated deleted-beneficiary list supports search/filtering, and an explicit restore operation clears `deletedAt` and writes an audit entry. Soft deletion retains beneficiary and delivery records; a deleted beneficiary cannot be used for a new delivery.
- Update supports beneficiary fields and nested address changes. An omitted address in a partial update leaves the existing address unchanged.

## Basket module

Provide create, list, detail, and soft-delete operations. Do not provide an update endpoint.

- Creation accepts a name, optional description, and a non-empty list of `{ supplyId, quantity }` items. Basket names are not unique.
- Each item must reference a non-deleted supply, have a positive integer quantity, and appear at most once in the submitted list. Do not allow clients to set audit or delivery actor fields.
- Basket composition is immutable after creation. To change it, soft-delete the old basket and create a new one.
- Normal list and detail queries exclude deleted baskets and deleted `BasketSupply` rows. Soft-deleting a basket and all of its active `BasketSupply` rows occurs in one transaction. Existing deliveries and stock movements remain available as history; the deleted basket cannot be used for new deliveries.
- A basket with delivery history may still be soft-deleted because no historical row is physically removed.

## Generic audit log

Add an `AuditLog` Prisma model with these fields:

- `id`: generated UUID.
- `entityType`: enum containing `BENEFICIARY` and `BASKET`.
- `entityId`: ID of the audited aggregate, with no foreign key to `Beneficiary` or `Basket`.
- `from` and `to`: nullable JSON values containing only the fields changed by the operation.
- `changedById`: foreign key to `User`, using restrictive deletion behavior; users are soft-deleted by the application.
- `createdAt` and `updatedAt`: standard timestamps. Audit records are append-only; `updatedAt` is not changed by normal application operations.

Add indexes for `(entityType, entityId, createdAt)` and `(changedById, createdAt)`. PostgreSQL JSON fields should use the Prisma/PostgreSQL JSON representation. Do not add an audit query endpoint in this scope.

Write exactly one audit record per successful beneficiary create, update, or soft-delete command, and per successful basket create or soft-delete command. Insert it within the same database transaction as the domain change. If the domain transaction fails, its audit record must also roll back.

- On creation, `from` is `null`; `to` contains the persisted aggregate state, including its address or basket composition.
- On beneficiary update, `from` and `to` contain the same changed keys. If the address changes, record the old and new address under `address`.
- On basket creation, record its complete initial supply composition under `supplies`. On basket soft deletion, include the change to the active composition as well as the `deletedAt` transition, because its `BasketSupply` rows are soft-deleted in the same transaction.
- On beneficiary soft deletion, record the `deletedAt` transition from `null` to the persisted deletion timestamp; the address itself is retained.
- Use persisted values (including database-generated defaults and IDs) in `to`; use the authenticated user as `changedById`.
- Do not audit reads. Do not update or delete an existing audit record.

## Delivery integration

Update `BasketDeliveryService` to use `BeneficiaryService` and `BasketService` for its cross-module reads, passing the active transaction client. Remove `findBeneficiary` and `findBasket` from `BasketDeliveryRepository` once those services own the queries.

- Delivery creation must continue to reject missing or soft-deleted beneficiaries and baskets, and baskets whose active composition is empty or references a deleted supply.
- A deleted beneficiary or basket cannot be used for a new delivery. Existing delivery and movement records remain queryable and unchanged.
- Preserve the current atomic delivery behavior: delivery, stock movements, and all balance changes commit or roll back together. This plan adds no `AuditLog` entries for deliveries or stock movements; their existing delivery and stock-movement history remains unchanged.

## Error behavior

Represent invalid beneficiary data, invalid basket definitions, missing/deleted references, duplicate CPF, and invalid quantities as typed domain failures or DTO validation errors. Translate known Prisma constraint failures at the service boundary into safe HTTP responses with Brazilian Portuguese messages. Do not expose database codes, SQL details, or internal exception messages.

## Implementation sequence

1. Add or adjust the Prisma audit model, actor relation, enum, indexes, and migration; preserve the existing beneficiary, address, basket, and basket-supply relations.
2. Implement the generic audit module and transactional append operation.
3. Implement beneficiary DTOs, domain, repository, service, controller, CRUD, nested address persistence, and audit writes.
4. Implement basket DTOs, domain, repository, service, controller, creation/list/detail/soft-delete, composition validation, and audit writes.
5. Refactor basket delivery to obtain beneficiary and basket data through their owning services and remove the temporary cross-entity repository queries.
6. Register modules, then run Prisma generation, typecheck, lint, unit tests, and integration tests.

## Test requirements

Every business and operational rule in this plan must have explicit test coverage. All API integration tests use Testcontainers with a disposable PostgreSQL matching the production major version, apply migrations with `prisma migrate deploy`, use a dynamic connection URL, and stop the container during teardown. Never use production or shared development databases for tests.

### Unit tests

- Beneficiary create/update DTOs validate required fields, sex, dates, CPF, phone, address fields, and partial-update behavior.
- Basket creation rejects an empty composition, duplicate supply IDs, non-positive/non-integer quantities, and invalid supply references; valid quantities are preserved.
- Audit mapping creates the expected `from`/`to` values for creation, changed fields (including nested address and basket supplies), and soft deletion.
- Domain and Prisma errors map to the intended safe Portuguese HTTP status and message.

### PostgreSQL integration tests

- Beneficiary CRUD persists the address atomically, enforces unique CPF across active and soft-deleted records, excludes deleted records from normal reads, and lists/restores deleted beneficiaries with audit history.
- Basket creation persists its composition atomically, rejects deleted supplies, permits duplicate names, and exposes no update operation.
- Basket soft deletion soft-deletes its active composition rows atomically and preserves delivery and stock-movement history.
- Beneficiary create/update/delete and basket create/delete operations write one audit row with the correct entity type, entity ID, before/after JSON, actor, and timestamps.
- A failed domain write leaves no audit row; an audit-write failure rolls back the corresponding domain changes.
- The generic entity ID is not backed by a foreign key to the audited entity, while `changedById` references a user.
- Deleted beneficiaries and baskets are rejected by delivery creation; active ones continue to work through the owning module services.
- API validation and business errors use Portuguese messages and never expose database details.

## Implemented contracts and verification

- Routes are `/beneficiaries` (POST/GET), `/beneficiaries/deleted` (GET), `/beneficiaries/:id` (GET/PATCH/DELETE), `/beneficiaries/:id/restore` (PATCH), `/baskets` (POST/GET), and `/baskets/:id` (GET/DELETE). There is no basket update or audit HTTP endpoint.
- Lists use `page=1`, `pageSize=20` (maximum 100), and `{ data, total, page, pageSize }`. Active records are ordered by `createdAt DESC, id DESC`; deleted beneficiaries are ordered by `deletedAt DESC, id DESC`. Both beneficiary lists support case-insensitive name `search` and exact normalized `cpf`; basket lists support case-insensitive name `search`.
- CPF check digits are validated and formatting is removed before persistence. CPF uniqueness includes deleted records. Birth dates are valid past/present calendar dates in `YYYY-MM-DD`; phone accepts a 10/11-digit Brazilian number with DDD, optionally prefixed by 55; CEP uses 8 digits and UF is normalized to uppercase.
- Partial address updates preserve omitted fields, allow clearing `complement` with null, and reject null for required fields. Nested response objects do not repeat their IDs as foreign-key fields on the parent.
- Audit comparison excludes automatic `createdAt`/`updatedAt` changes. No-op beneficiary updates still create a single audit row with empty objects. Address changes contain the complete prior/new address; basket snapshots contain composition rows rather than mutable supply catalog/balance data.
- Beneficiary update/delete and basket create/delete use serializable transactions. Conflicts are mapped to Portuguese HTTP 409 responses, preserving accurate before/after values without silently losing concurrent edits.
- Unit coverage: `src/modules/beneficiary/dto/beneficiary.validation.spec.ts`, `src/modules/basket/dto/basket.validation.spec.ts`, `src/modules/basket/domain/basket.domain.spec.ts`, and `src/modules/audit/domain/audit.domain.spec.ts`.
- PostgreSQL coverage: `test/beneficiary-basket.e2e-spec.ts` exercises CRUD, authentication, audit payloads, rollback after actual audit insertion, generic entity IDs, actor foreign keys, preserved delivery history, and synchronized concurrent edits. Existing inventory tests cover delivery behavior through the new services.
