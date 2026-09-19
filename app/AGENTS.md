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
- If a manual light/dark/system selector is added, use NativeWind's color scheme API.
- Persist a manual preference separately and provide a way to restore the system mode.
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
  - `use-api-get.ts` performs GET requests on mount and exposes `refetch`.
  - `use-api-post.ts` exposes `execute(payload)` for mutations.
  - `use-api-delete.ts` exposes `execute()` for deletions.
- These hooks expose `data`, `loading`, `error`, and `reset`. They do not
  implement cache, invalidation, or feature-specific business rules.
- Compose generic request hooks inside feature hooks. For example,
  `src/features/auth/hooks/use-login.ts` should use `useApiPost` with
  `API_ROUTES.auth.login`, handle the login response, and persist its JWT.
- Do not put navigation inside the Axios client or generic hooks. Authentication
  state and route redirects belong to the auth feature/provider.
- Keep the API base URL in `EXPO_PUBLIC_API_URL` and endpoint paths in
  `src/constants/routes.ts`. Public Expo environment variables may contain
  addresses and configuration, never secrets.

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
