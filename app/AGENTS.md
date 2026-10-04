# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.


## Theme architecture

The app uses NativeWind v4 as the styling system and keeps theme values centralized.
The theme is semantic: components must reference names such as `background1`,
`background2`, `foreground`, and `muted`, never raw color literals.

### Source of truth

- Keep all light and dark tokens in `src/constants/theme.ts`.
- Export one `Theme.light` and one `Theme.dark` object using NativeWind `vars()`.
- Store values as CSS variables with the `--color-` prefix.
- Do not duplicate color values in components, screen files, or separate style objects.
- Add new tokens only when they represent a reusable semantic role.

Example:

```ts
import { vars } from 'nativewind';

export const Theme = {
  light: vars({
    '--color-background1': '#0A1529',
    '--color-background2': '#FFFFFF',
    '--color-foreground': '#FF6E32',
    '--color-muted': '#D3DCEB',
  }),
  dark: vars({
    '--color-background1': '#060D1A',
    '--color-background2': '#111D31',
    '--color-foreground': '#FF8F68',
    '--color-muted': '#B8C4D6',
  }),
};
```

### Theme provider

- Create/use `src/components/app-theme-provider.tsx` as the runtime theme boundary.
- The provider reads `useColorScheme` from NativeWind and applies `Theme.light`
  or `Theme.dark` to a root `View`.
- Wrap the application from `src/app/_layout.tsx` with this provider.
- Keep Expo Router's `ThemeProvider` for navigation UI; it is separate from
  NativeWind's component theme.
- Keep `expo.userInterfaceStyle` set to `automatic` so the app follows the
  device theme by default.

### NativeWind usage

- Map the CSS variables to semantic names in the NativeWind/Tailwind theme.
- Prefer classes such as `bg-background1`, `bg-background2`,
  `text-foreground`, and `text-muted`.
- Use `className` for layout, spacing, sizing, typography, and themed colors.
- Do not spread `dark:bg-...` and `dark:text-...` variants for colors that
  already exist in the centralized theme.
- Use `dark:` only for a genuine visual variant that is not a theme token.

### Exceptions

Use `style` or `StyleSheet` only when NativeWind cannot express the requirement,
such as animated values, calculated dimensions, platform-specific runtime values,
or third-party component APIs that require a style object. These exceptions must
not create a second source of truth for theme colors.

### Theme selection

- System theme is the default.
- Manage the global preference through `src/context/theme-preference-context.tsx`
  and NativeWind's color scheme API. Persist it through
  `src/services/theme-preference.ts` (local storage on web and SecureStore on
  native), and keep a control to restore the system mode in the “Mais” screen.
- Keep `darkMode: "class"` in `tailwind.config.js`; NativeWind v4 needs class
  mode for manual light/dark selection.
- In `metro.config.js`, resolve NativeWind's CSS input, `projectRoot`, and
  `configPath` from `__dirname` so starting Expo from another working directory
  does not silently load the default media-based theme config.
- Every new themed component must work in both light and dark modes and preserve
  readable contrast.


## Responsive architecture

The app must support phones, tablets, and web using NativeWind responsive variants.

### Breakpoints

- Use a mobile-first approach: unprefixed classes are the phone baseline.
- Use `sm:`, `md:`, and `lg:` for progressively larger windows.
- The project breakpoints are:
  - `sm`: 480px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
- These values describe window width, not a fixed device category. A tablet in
  split-screen mode must respond to its current window width.
- Keep the breakpoint definitions centralized in `tailwind.config.js`.

Example:

```tsx
<View className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
  <Text className="text-base sm:text-lg md:text-xl lg:text-2xl">
    Responsive content
  </Text>
</View>
```

### Layout conventions

- Use the base styles for phone layouts and add only the changes needed at larger
  breakpoints.
- Use full-width layouts on phones and constrained, centered containers on larger
  windows, for example `mx-auto w-full max-w-5xl px-4 md:px-8 lg:px-12`.
- Use NativeWind classes for responsive padding, gaps, sizes, direction, columns,
  typography, and visibility.
- Define reusable spacing tokens in `tailwind.config.js` when a value is part
  of the design system. Do not confuse spacing tokens with screen breakpoints.
- Prefer semantic component sizes such as `size-sm`, `size-md`, and `size-lg`
  only when they represent component dimensions; use `sm:`, `md:`, and `lg:`
  as responsive prefixes.
- Use `web:`, `native:`, `ios:`, and `android:` only for platform
  differences, not as substitutes for responsive breakpoints.

### Runtime dimensions

- Do not use `useWindowDimensions` only to choose a style that NativeWind can
  express with responsive classes.
- Use `useWindowDimensions` when the value drives behavior, data, navigation,
  virtualization, or a calculation that cannot be represented by a class.
- Do not create a second responsive styling system with conditional
  `StyleSheet` objects.

### Validation

Every responsive screen must be checked at minimum in:

- a narrow phone width;
- a wide phone width;
- a tablet width in portrait;
- a tablet width in landscape or split-screen;
- a desktop web width.

Responsive styles must remain usable during rotation and window resizing.


## Folder architecture

The app is organized by feature. A feature owns its screens and all code that
exists only to support that feature.

### Feature folders

- Put feature code under `src/features/<feature-name>/`.
- Put feature screens under `src/features/<feature-name>/screens/`.
- A feature may contain its own `components/`, `constants/`, `hooks/`,
  `services/`, `utils/`, `types/`, and other focused folders as needed.
- A file inside a feature must remain there when it is used only by that feature.
- Feature-local code may depend on shared code, but shared code must not depend
  on a feature.
- Avoid importing one feature directly from another. Extract the shared
  responsibility to a common folder when that relationship becomes necessary.

Example:

```
src/
  app/
    index.tsx
    explore.tsx
  features/
    auth/
      screens/
        login-screen.tsx
        register-screen.tsx
      components/
      constants/
      services/
      utils/
    benefits/
      screens/
      components/
      hooks/
  components/
  constants/
  hooks/
  services/
  utils/
  types/
```

### Expo Router files

- Keep `src/app/` focused on Expo Router route definitions and layout files.
- Route files should be thin adapters that render screens from
  `src/features/<feature>/screens/`.
- Do not place feature business logic directly in `src/app/`.
- Navigation-specific layout and route configuration may remain in `src/app/`.

Example:

```tsx
// src/app/index.tsx
export { default } from '@/features/auth/screens/login-screen';
```

### Shared folders

Move code to a shared folder only when it is intentionally reusable by more
than one feature.

- `src/components/`: reusable visual components and UI primitives.
- `src/context/`: global React contexts shared across features, such as the authenticated user context.
- `src/constants/`: app-wide constants and configuration values.
- `src/hooks/`: hooks used by multiple features.
- `src/services/`: shared clients and integrations.
- `src/utils/`: generic, feature-independent helpers.
- `src/types/`: shared TypeScript contracts.

Shared code must stay generic and must not contain assumptions about one
specific feature. Feature-specific variants belong inside the feature.

### API routes

- Keep all API endpoint paths in `src/constants/routes.ts`.
- Use semantic groups and functions for dynamic parameters.
- API clients and feature services must import routes from this file instead of
  hardcoding endpoint strings.
- Keep the API base URL and environment configuration separate from endpoint
  paths.

Example:

```ts
export const API_ROUTES = {
  auth: {
    login: '/users/login',
    register: '/users',
  },
  users: {
    byId: (id: string) => `/users/${id}`,
  },
} as const;
```

Do not duplicate or inline these paths in screens, components, hooks, or
services.

### API client and request hooks

- Use `axios` through the singleton in `src/services/api/client.ts`. Do not
  create an Axios instance inside a feature or inside an individual hook.
- Keep session-token persistence in `src/services/api/session.ts`. The API
  client reads the token from this service and adds the `Authorization: Bearer`
  header automatically. Feature code is responsible for saving the token after
  login or registration and clearing it on logout.
- Keep API error normalization in `src/services/api/errors.ts`. Features and
  screens should consume the normalized error instead of depending directly on
  Axios error internals.
- Use the generic hooks in `src/hooks/api/`:
  - `use-api-get.ts` wraps TanStack Query for ordinary GET requests and exposes `refetch`.
  - `use-api-post.ts` exposes `execute(payload)` for mutations.
  - `use-api-delete.ts` exposes `execute()` for deletions.
- Mount one `QueryClientProvider` at the app root. Use TanStack Query's
  `useInfiniteQuery` for paginated reads and pass its `signal` to Axios so
  inactive or obsolete requests are canceled. Do not implement pagination,
  request generations, or `AbortController` manually in feature hooks.
- Native tab and stack screens may stay mounted while unfocused. Revalidate
  screen-specific reads when a route regains focus with Expo Router's
  `useFocusEffect` and the relevant TanStack Query key. Avoid a duplicate
  initial fetch and preserve unsaved form values when returning to a form.
- For now, query state exists only in memory while observed: do not persist
  query results, retain inactive query data, or add a cache/invalidation policy.
  POST/DELETE hooks use TanStack Query's `useMutation`/`mutateAsync` for
  pending, data, error, reset, and latest-call state. Do not recreate these
  states with local React state or request-generation refs.
- Generic hooks expose `data`, `loading`, `error`, and `reset`; feature hooks
  own business-specific query keys, filters, and page parameters.
- Compose generic request hooks inside feature hooks. For example,
  `src/features/auth/hooks/use-login.ts` should use `useApiPost` with
  `API_ROUTES.auth.login`, handle the login response, and persist its JWT.
- Do not put navigation inside the Axios client or generic hooks. Authentication
  state and route redirects belong to the auth feature/provider.
- Keep the API base URL in `EXPO_PUBLIC_API_URL` and endpoint paths in
  `src/constants/routes.ts`. Public Expo environment variables may contain
  addresses and configuration, never secrets.

### User-facing language

- All text visible to users must be written in Brazilian Portuguese, including
  screen copy, buttons, labels, placeholders, validation messages, API error
  feedback, notifications, empty states, accessibility labels, and confirmation
  dialogs.
- Keep code identifiers, API field names, route names, and internal logs in
  English when appropriate; this rule applies to user-facing text.
- When displaying an API error, use its normalized Portuguese message. Do not
  expose raw Axios, JavaScript, or infrastructure error messages to users.

### Error and success notifications

- User-facing operation errors and success messages must appear as toasts using
  `react-native-toast-message`, including API failures, authentication feedback,
  local-operation failures, and successful mutations. Frontend field-validation
  errors are an exception: show them inline beside their corresponding fields.
- Use a shared JavaScript notification service in `src/services/notifications.ts`.
  Hooks and features call that service; they must not import the toast library
  directly, render per-screen notification widgets, or duplicate notifications
  with error/success banners, alerts, headings, or inline operation-error messages.
  This restriction does not apply to inline frontend field-validation messages.
- Render the shared `AppToastHost` at the application root within the theme and
  safe-area boundaries. Keep it mounted across screen changes and authentication
  redirects. Use centralized theme tokens and accessible Portuguese messages.
- Keep the root Expo Router navigator mounted during authentication redirects.
  Apply authentication guards at route/group boundaries without unmounting the
  root navigator or root notification host; otherwise session changes can lose
  toast feedback.
- When a native modal needs its own toast host, `ThemedModal` owns this integration
  and reuses the root host configuration and notification service. Features must
  not manually install modal hosts. Follow the library's documented active-instance
  behavior so a toast appears above the active modal.
- Trigger notifications from the most general layer that owns the operation.
  The shared TanStack Query cache owns normalized GET-error toasts;
  `useApiRequest` uses TanStack Query mutation callbacks for mutation-error
  and configured success toasts. Generic mutation hooks pass optional
  operation-specific success/error messages into that common layer.
  Keep notification options separate from Axios request configuration.
- Retain API-hook error state and promise rejection semantics. Do not toast from
  both Axios interceptors and request hooks, or repeat the same message from the
  screen consuming the hook. Canceled and superseded requests do not notify.
- Successful reads do not require a toast. When success feedback is needed,
  mutation hooks use a configured Portuguese message. For composed operations,
  notify only after the complete workflow succeeds; do not announce success
  before session persistence or other required steps finish.
- Errors from operations outside API requests, such as session persistence or
  logout, are notified by their owning shared/feature hook through the same
  service. Request-error normalization must not itself display a toast.
- Use Zod with React Hook Form and `zodResolver` for frontend form validation.
  Display each field's Portuguese validation message inline using `TextField`
  or the corresponding field component, with invalid styling and accessibility
  metadata. Do not also emit a toast for these errors, including invalid submits.
  Keep React Hook Form's first-invalid-field focus behavior; do not introduce a
  toast-oriented form-feedback hook for field validation.
- Network, timeout, and unexpected errors need safe Portuguese fallbacks; never
  forward raw JavaScript, Axios, or infrastructure text to a toast.
- Loading indicators, empty states, instructions, confirmation prompts, and
  factual summaries remain normal UI content. They are not error/success messages.

### Shared UI boundaries

- Create feature-independent visual primitives under `src/components/ui/`, such
  as themed buttons/cards, `ThemedModal`, `SearchField`, `ThemedTable`, and empty
  states. Keep global providers/hosts under `src/components/`.
- The reusable audit viewer is a component package under
  `src/components/AuditHistoryModal/`. Keep its modal, query hook, contracts,
  display helpers, and tests inside that folder (using `hooks/`, `types/`, and
  `utils/` subfolders where appropriate). Features provide an audit entity type
  and optional entity/actor IDs. The modal owns the inclusive date-range filter
  and paginated query; do not create feature-specific audit viewers. This
  package is an intentional data-owning exception; other shared UI primitives
  remain presentational.
- Shared UI components are presentational: receive values, typed rows, children,
  loading state, and callbacks. Do not fetch data, depend on feature contracts,
  or embed business-specific filters, validation, or pagination rules.
- On web list screens that provide `onRefresh`, pulling down from the top reloads
  the whole page; do not add a duplicate refresh button. Native screens continue
  using React Native's `RefreshControl` to refresh their data.
- Search debouncing and query logic belong to hooks; the generic search field
  handles input, clearing, and presentation only. Table columns and domain row
  renderers are supplied by the consuming feature.
- Keep components used only for one feature within that feature, including
  beneficiary/basket selectors, delivery composition/review/summary, home
  indicators, and recent-delivery rows. Compose shared primitives rather than
  turning these domain components into generic UI prematurely.
- Reuse existing primitives such as `TextField`; do not create competing input
  or notification implementations. Extract a feature-local component to shared
  UI only when another feature actually needs its generic behavior.

### Dependency direction

The preferred dependency direction is:

```
src/app -> src/features -> shared folders
```

Shared folders must not import from `src/app` or `src/features`. Keep
feature boundaries explicit, use path aliases, and avoid circular dependencies.


### Typography tokens

- Keep the NativeWind typography scale centralized in tailwind.config.js.
- Prefer semantic classes such as text-body, text-body-sm, text-body-sm-bold,
  text-title, text-subtitle, text-link, and text-code.
- A typography token should define font size, line height, and weight together
  when those values belong to the same text role.
- Do not hardcode font sizes, line heights, or font weights in components when
  an existing typography token is appropriate.
- Responsive typography uses the configured screen prefixes, for example
  text-body md:text-title. The prefix is a breakpoint, not a font-size token.
