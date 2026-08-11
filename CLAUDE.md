# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 19 + Vite + JavaScript (plain `.js`/`.jsx`, no TypeScript) + react-router v8 (data mode:
`createBrowserRouter`, client-side only, no SSR). This is the frontend for an internal "portal"
backed by a Laravel API using Sanctum SPA cookie authentication. The app is early-stage: only login
and a placeholder dashboard exist behind auth guards, but `package.json` already carries a large set
of dependencies for planned features (drag-and-drop, tables, charts, realtime, file/image upload,
markdown, virtualization) that aren't wired into any code yet — don't assume they're in use just
because they're installed.

## Commands

- `npm run dev` — start the Vite dev server (pinned to port 3000, `strictPort`, to match backend
  `CORS_ALLOWED_ORIGINS` / `SANCTUM_STATEFUL_DOMAINS`)
- `npm run build` — production build (`vite build`, outputs to `dist/`)
- `npm run preview` — preview the production build locally
- `npm run lint` — ESLint (flat config in `eslint.config.js`)

There is no `typecheck` script (no TypeScript/tsconfig in this repo), no `format` script (though
`.prettierrc` exists — run Prettier directly), no test runner, and no `start`/Docker setup — the
`Dockerfile`, `.dockerignore`, and custom `README.md` from the previous scaffold were removed.

## Architecture

- `index.html` is the real Vite entry HTML; it loads `src/main.jsx`, which creates the router via
  `createBrowserRouter` (exported as `router` from `src/router.jsx`) and mounts `<RouterProvider>`
  with `createRoot`.
- `src/router.jsx` declares the route tree inline as a single `createBrowserRouter([...])` call — no
  file-based routing, no codegen, no separate routes file. New routes/guards must be registered here
  directly.
- `src/App.jsx` is the root layout element: wraps `<Outlet />` in `<AuthProvider>` and renders it.
- **Auth**: `src/context/AuthContext.jsx` exposes `useAuth()` → `{ user, status, login, logout }`,
  where `status` is `'loading' | 'authenticated' | 'guest'`. On mount it calls `GET /api/me` to
  restore session state. `src/components/ProtectedRoute.jsx` and `GuestRoute.jsx` are layout-route
  guard components (used as the `element` of a router branch) that render `null` while
  `status === 'loading'` and otherwise redirect via `<Navigate>` based on auth state.
- `src/lib/api.js` — `apiFetch(path, { method, body, headers })` wraps `fetch()` against
  `VITE_API_URL` (default `http://127.0.0.1:8000`, see `.env.example`) with `credentials: 'include'`.
  For mutating methods (`POST`/`PUT`/`PATCH`/`DELETE`) it transparently handles the Sanctum SPA CSRF
  handshake: ensures an `XSRF-TOKEN` cookie exists (via `GET /sanctum/csrf-cookie`) and echoes it back
  as the `X-XSRF-TOKEN` header. Throws `ApiError(status, payload)` on non-2xx responses. On a 401 from
  any request it invokes a globally-registered handler (`setUnauthorizedHandler`, wired up by
  `AuthProvider`) so the UI drops back to `guest` state as soon as the backend session expires.
- No path alias is configured — there's no `tsconfig.json`/`jsconfig.json` and no `resolve.alias` in
  `vite.config.js`, so imports are relative (e.g. `../lib/api.js`). The `~/` alias from the earlier
  template is gone.
- Plain JavaScript throughout — TypeScript, `tsconfig.json`, and the entire previous `app/` directory
  (routes, layouts, pages, hooks, `lib/utils.ts`) have been deleted in favor of the new `src/` tree.
- shadcn/ui is gone: no `components.json`, no `app/components/ui`. Tailwind (`tailwindcss`,
  `prettier-plugin-tailwindcss`) is still listed in devDependencies and pages use Tailwind-style
  utility classNames, but **Tailwind is not actually wired in** — `vite.config.js` has no
  `@tailwindcss/vite` plugin and no stylesheet has an `@import "tailwindcss"`, so those utility
  classes currently render unstyled. `src/index.css` is empty; `src/assets/app.css` still holds the
  leftover `npm create vite` demo styles (`.counter`, `.hero`, `#next-steps`, etc.) unrelated to the
  actual pages.
- ESLint: flat config in `eslint.config.js` (`js.configs.recommended` +
  `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`), globals set to browser. Run via
  `npm run lint`.
- Prettier config (`.prettierrc`): no semicolons, double quotes, 80-char print width,
  `prettier-plugin-tailwindcss` enabled with `tailwindStylesheet: "src/app.css"` — note that path
  doesn't actually exist (the real stylesheet is `src/assets/app.css`).
- Package.json also carries several not-yet-used dependencies (`@dnd-kit/*`, `@tanstack/react-query`,
  `@tanstack/react-table`, `recharts`, `laravel-echo`, `pusher-js`, `@inertiajs/react`, `cropperjs`,
  `photoswipe`, `react-hot-toast`, `react-markdown`, `date-fns`, `virtua`, `@material-tailwind/react`,
  `tw-elements`, `font-awesome`/`@fortawesome`) — treat these as signals of planned features, not
  current architecture, until code actually imports them.