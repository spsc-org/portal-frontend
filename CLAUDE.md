# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React Router v7 (data mode: `createBrowserRouter` with a hand-written route tree, client-side only,
no SSR) + TypeScript + Tailwind CSS v4 + shadcn/ui. This is currently a freshly scaffolded template
with a single index route wired up — expect to build out real routes, layouts, and features from
here.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build (`vite build`, outputs to `dist/`)
- `npm run start` — serve the production build (`serve -s dist -l 3000`, with SPA fallback)
- `npm run typecheck` — run `tsc` (no separate lint script exists)
- `npm run format` — format all `.ts`/`.tsx` files with Prettier
- `npx shadcn@latest add <component>` — add a new shadcn/ui component into `app/components/ui`

There is no test runner configured in this repo yet.

## Architecture

- `index.html` is the real Vite entry HTML; it loads `app/main.tsx`, which creates the router via
  `createBrowserRouter` and mounts `<RouterProvider>` with `createRoot`.
- Routes are declared as a manual `RouteObject[]` tree in `app/routes.tsx` — no file-based routing
  and no codegen; new pages must be registered here explicitly (`Component`, `children`, `index`,
  etc., and `loader`/`action` if data-fetching is ever needed).
- `app/root.tsx` exports `App` (the root layout element, renders `<Outlet />`) and `ErrorBoundary`
  (used as the root route's `ErrorBoundary`, reads the error via `useRouteError()`) that
  distinguishes route error responses (e.g. 404) from thrown JS errors (stack traces shown only in
  dev). The document `<html>/<head>/<body>` shell itself lives in `index.html`, not in `root.tsx`.
- Route modules live under `app/routes/` (e.g. `app/routes/home.tsx`) as plain components — no
  generated `Route.*` prop types (that was a framework-mode feature); type props manually.
- No SSR — this is a client-side-only SPA. `npm run start` serves the static `dist/` build with
  `serve -s`, which rewrites unmatched paths to `index.html` so client-side routing works on
  direct/refresh navigation.
- Path alias: `~/*` maps to `app/*` (configured in `tsconfig.json`, resolved via Vite 8's native
  `resolve.tsconfigPaths` option in `vite.config.ts` — no separate `vite-tsconfig-paths` package).
  shadcn's own aliases in `components.json` use the same `~/` prefix (`~/components`, `~/lib`,
  `~/lib/utils`, `~/components/ui`, `~/hooks`).
- `app/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) — the standard way to compose
  conditional Tailwind class names; shadcn components and Prettier's tailwind plugin both expect it.
- UI primitives from shadcn (e.g. `app/components/ui/button.tsx`) are built with
  `class-variance-authority` (cva) for variant/size props and `radix-ui`'s `Slot` for `asChild`
  composition — follow this pattern (cva + Slot + `cn`) for new UI primitives.
- Tailwind is wired in via the `@tailwindcss/vite` plugin (no `tailwind.config.*` file — v4 CSS-first
  config lives in `app/app.css`).
- shadcn config (`components.json`): style `radix-mira`, base color `mist`, CSS variables enabled,
  icon library `lucide-react`.
- Prettier config: no semicolons, double quotes, 80-char print width, `prettier-plugin-tailwindcss`
  enabled (auto-sorts class names; also aware of the `cn`/`cva` helper functions).
- Dockerfile builds a multi-stage production image (`node:20-alpine`) via `npm ci` → `npm run build`
  → `npm run start`; keep new runtime dependencies out of devDependencies if they're needed at
  container runtime.