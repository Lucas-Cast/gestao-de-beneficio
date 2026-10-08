# User Management

## Purpose and design reference

Provide administrators with a responsive view of registered accounts and safe
controls for activation, deactivation, and soft deletion. The implemented design
reference is [`assets/user-management.png`](./assets/user-management.png).

## Access and navigation

- The **Users** management route is available from **More** as **Manage users**
  only when the authenticated account has role `ADMIN`.
- The users route is hidden from the bottom-tab bar; it is not a seventh tab.
- The previous **Stock** placeholder was removed from **More**.
- The screen also redirects non-administrators without issuing the users-list
  request. The API independently authorizes every administrative operation.
- The login response includes the user's role. The app persists the role with
  the session. A previously persisted session without a role is treated as
  `COMMON`; an administrator using such a session must sign in again.

## User interface

- Reuse `CrudScreenLayout`, `SearchField`, `SelectFieldInput`, `ThemedTable`,
  `ThemedModal`, and the shared themed buttons and cards.
- On wide screens, show a table with name, e-mail, role, status, and actions.
  On narrow screens, show the same information in responsive cards.
- Search by name or e-mail after a 300 ms debounce. Filter by all, active, or
  inactive status. Load more results through paginated infinite queries.
- Show roles as **Administrador** and **Comum**, and statuses as **Ativo** and
  **Desativado**.
- For inactive accounts, offer **Ativar** and **Excluir**. For active accounts,
  offer **Desativar** and **Excluir**. Deactivation and deletion require
  confirmation; activation is immediate.
- Mark the signed-in account as **Você** and do not render actions for it.
- Deletion is a soft delete. Deleted accounts disappear from this list; this
  feature does not include a deleted-users recovery screen.
- There is no user creation, profile editing, or role-assignment interface in
  this feature.
- User-facing labels, confirmations, empty/error states, and notifications are
  in Brazilian Portuguese. API request failures and successful mutations use
  the shared notification mechanism. Mutations invalidate user-list queries;
  the screen also refreshes on pull-to-refresh and when it regains focus.

## API contract and authorization

- `GET /users?page=&pageSize=&search=&status=` lists active and inactive users,
  excluding soft-deleted records. It returns `{ data, total, page, pageSize }`;
  optional `search` matches name or e-mail, and `status` accepts `ACTIVE` or
  `INACTIVE`.
- Each returned user includes `id`, `name`, `email`, `role`, `isActive`, and
  timestamps. Password hashes are never returned.
- `PATCH /users/:id/status` accepts `{ "isActive": boolean }` and returns the
  updated user. It is used to activate or deactivate accounts.
- `PATCH /users/:id/role` accepts `{ "role": "ADMIN" | "COMMON" }` and returns
  the updated user. This is an API-only administrative operation; the app does
  not expose role assignment in its interface.
- `DELETE /users/:id` soft-deletes an account and returns `204`.
- The user list, user detail/update, status-change, role-change, and delete
  endpoints require the `ADMIN` role. The role guard reads the current user's
  role from the authenticated database-backed user, not solely from client
  navigation.
- The API rejects self-deactivation, self-role changes, and self-deletion, and
  prevents deactivating, demoting, or deleting the last active administrator.
  Status changes, role changes, and soft deletes run in serializable
  transactions.
- New registrations remain inactive and use the existing default `COMMON` role.
  Role promotion/demotion is available only through the administrator-only API
  endpoint; no role-management UI is provided.
- The first active administrator must be provisioned through a trusted initial
  setup procedure; this endpoint cannot bootstrap itself because it requires an
  existing administrator.
- No Prisma schema change or migration is required; role and active status
  already exist in the database.

## Verification coverage

- App tests cover role-gated navigation, the screen's admin-only access,
  paginated/filtered reads, activation, confirmation before deactivation and
  soft deletion, and the absence of actions for the signed-in account.
- API unit tests cover role inclusion in login responses, role/status changes,
  transaction isolation, self-protection, and last-administrator protection.
- PostgreSQL/Testcontainers integration tests cover paginated and filtered
  listing, password-field exclusion, rejection of non-admin requests, status
  and role validation/persistence, soft deletion, and self-lockout prevention.
