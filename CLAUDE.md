# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 18 (`react@^18`, resolved 18.3.1 — `ref` is NOT a plain prop: components that MT `Tooltip`/`PopoverHandler`/`MenuHandler` wrap must use `forwardRef`) + Vite + JavaScript (plain `.js`/`.jsx`, no TypeScript) + react-router v8 (data mode:
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
- `src/App.jsx` is the root layout element (theme provider, global modals, toaster, `<Outlet />`).
- **MVVM (MobX + mobx-tanstack-query)** — the target pattern for every page; pages are migrated from
  the Inertia app (`C:\projects\Portal\www\resources\js\ReactPages`) section by section, and a
  section's route is added to `src/router.jsx` only once it's migrated. Reference implementation:
  `src/pages/Notifications/`. Per section:
  - `model/` (or `src/entities/<domain>/` when shared across pages) — plain functions over
    `apiFetch` + query-key factories. No React, no MobX.
  - `viewmodel/<Page>ViewModel.js` — MobX class: observable UI state (filters, pagination, modals,
    forms, selection), `scope.query({ queryKey: () => [...observables], queryFn })` /
    `scope.mutation({ mutationFn, invalidateQueries })`, computed getters, action methods, optional
    `mount()` returning a cleanup (Echo/window subscriptions). Call `makeViewModel(this)` in the
    constructor **before** creating queries (reactive keys must read observables). Don't extend a
    base class — `makeAutoObservable` doesn't support subclassing; use the injected `scope`.
  - `view/` — `observer()` components only reading `useVM()` / `useStores()`; no fetching, no
    business logic. Export as `export default observer(Component)` (whitelisted in ESLint).
  - `<Page>.jsx` route entry — `useViewModel((deps) => new XViewModel({ ...deps, ...routeParams }))`
    + `<ViewModelProvider value={vm}>`. Remount via `key` when route params change.
  - Server tables (filters + pagination + sorting + localStorage persist): compose
    `new TableState({ storageKey, initialFilters, signal: scope.signal })` in the VM and use
    `this.table.snapshot` in the reactive `queryKey`; wire `Table` via `onSort={table.applySorting}`,
    `pagination.onPageChange={table.setPageFromPaginator}`, `SearchInput onChange={table.handleInput}`.
  - Former Inertia props: `scope.query(pageOptionsQuery('<page>'))` from
    `src/entities/spa/pageOptionsApi.js`. Route params (Inertia `id`/`year`/...) come from
    `useParams()` → VM constructor, with `key` on the content component.
  - Fields that hold objects taken from query data (selected row, delete target) must be
    `observable.ref` (`makeViewModel(this, { selected: observable.ref })`), otherwise MobX deep-clones them.
  - Dynamic enable/disable of a query: `options: () => ({ enabled: this.x })` — a plain
    `enabled: () => ...` is called by TanStack, not tracked by MobX, so the query never starts
    when the observable flips. Don't create a second `Query` for a key another VM already
    observes inside a render-time VM (modal) — reuse that VM's query (stale refetch on mount
    updates the other observer mid-render → React "Cannot update a component" warning).
  - Shared domain models live in `src/entities/<domain>/` (`notification`, `file`, `userGroup`, `spa`,
    `document` — API + `DocumentFormViewModel`); global widgets (sidebar, bell, feedback modal, online
    users, `document/DocumentFormModal` — create/update document, used by /document and project import)
    in `src/widgets/`. Portal UI kit primitives (use these, not `@material-tailwind` `Dialog`/`Button`/
    `IconButton`): `components/Modal/Modal.jsx` (`Modal`/`ModalHeader title`/`ModalBody`/`ModalFooter`,
    close button auto-rendered from `onClose`, `hideClose` if the header has its own; `fullHeight` opt-in),
    `components/Buttons/Button.jsx` / `IconButton.jsx` / `CloseButton.jsx` (styles in `buttonStyles.js`;
    MT colour names are aliased, `green` → `primary`). Tables: reference look is `/project`
    (`ProjectListTable`); shared classes in `components/Table/tableStyles.js` (`TABLE_WRAP`, `TABLE`, `TH`,
    `TD`, `TR`, `TABLE_BAR`), header with the sort CTA in `components/Table/ColumnHeader.jsx`
    (used by `Table.jsx`). Column resizing was removed on purpose (unused) — don't re-add it. Dark surfaces are `neutral` (page 900, card 800,
    border 700; form fields bg `neutral-900` + border `neutral-600`, kit `surface-field`/`border-input`), dark text `gray`; no `slate`. Shared view helpers: `components/confirmToast.jsx` (toast-style confirm used by
    decree/dictionary), `components/UploadFileList.jsx` (attachments list).
  - `/project` is the former `/project/v2` (`/project/v2` redirects): `src/pages/Project/` —
    `viewmodel/ProjectListViewModels.js` (`ProjectListPageViewModel` + `CartModalViewModel`) replaces
    the origin island hooks and `legacyBridge`; feature/widget folders keep only pure `model/` + `ui/`.
    Cart ids live in localStorage `cartItems` (event `project-cart-changed`); "who is editing" comes
    from the `user-presence-changed` window event emitted by the sidebar `OnlineUsersViewModel`.
    Child VMs hang off the page VM (`vm.projectForm`, `vm.ticketForm`, `vm.settings`, `vm.proposalFilter`,
    `vm.reasonRules`); Escape closes the topmost one via `closeTopModal()` in the page keydown handler.
    Project create/edit (`ProjectFormViewModel`, port of legacy `ProjectModalManagerV2`) keeps the form
    as the canonical legacy snapshot of `GET /api/project/{id}` (`model/projectFormModel.js`
    `canonicalSnapshot`) + `_key` per table row, so the origin `shared/lib/threeWayMerge.js` /
    `projectSnapshot.js` merge 409 conflicts of `PATCH /api/project/json/{id}` directly; drafts live in
    IndexedDB (`shared/lib/drafts.js`, enabled by "project-settings".useProjectDraft); `?edit={id}` /
    `?card={id}` deep links. Saved filter sets ("Збережені:" in the active-filters bar,
    `features/saved-filters/` + `viewmodel/SavedFiltersViewModel.js`, `vm.savedFilters`) live in
    localStorage `project-saved-filters:{userId}` (no backend API); the default set applies on first
    open (no saved list state, no deep link) and on "Скинути все". Settings, proposal filter, hints and "last added" share localStorage
    "project-settings" with legacy. Live analysis (port of `LiveAnalysisManager`) is shared by the card
    and the form: `model/liveAnalysisModel.js` (API, highlight segments, tooltip config) +
    `viewmodel/LiveAnalysisState.js` (results per `field[:objectId]`, per-field request staleness) +
    `view/liveAnalysis/*` (badge with tooltip, highlighted text, textarea backdrop highlight). Card:
    `POST /api/project/{id}/liveAnalysis` after every load; form: `POST /api/project/json/{id|0}/liveAnalysis`
    with the form payload (full on edit open / button, single field on blur after 800 ms).
    Consolidated search (`model/consolidatedSearchModel.js` + `viewmodel/ConsolidatedSearchState.js`:
    names and identifier values, 900 ms debounce, the edited project excluded, per-field and merged
    modals) and the dictionary modals (`VocabularyModalViewModel`, `/api/project/addVocabulary*`,
    refetches voc_project) are ported. Legacy `StopWordsModalManager` / `modal-stop-words` is dead code
    (replaced by reason rules in backend commit e0535bd2, `/api/validation/stop-words` no longer
    exists) — not ported; its successor is the reason-rules modal. The quick-view card on `/project` is a port of the
    vanilla `projectCardManager.js` + `ProjectCardDock.js` (`viewmodel/ProjectCardViewModel.js`,
    `model/projectCardModel.js`, `view/ProjectCard.jsx`): `/api/project/{id}/dto` + audit count/history,
    per-field edit via `PATCH /api/project/{id}`, dock in localStorage `project-card-dock:{userId}`,
    `?card={id}&chain=1`. Do NOT use the legacy React `widgets/project/ProjectDetails` there (it stays
    only for the Proposal page; it reads `/dto` via `projectDto.js` — `/api/project/new/{id}` throws).
    Flags come from the backend `/flag-svg/*` (proxied).
  - **Page title, breadcrumbs and page-level buttons live in the global Header, not in `<main>`.**
    Pages without buttons call `usePageTitle(title, { breadcrumbs, documentTitle })`; pages with
    buttons render `<PageHeader title actions={...} />` (`src/layouts/app/PageHeader.jsx`, buttons
    from `HeaderButtons.jsx`: `HeaderButton` — primary "Додати"/text actions, `HeaderIconButton`).
    Actions are portaled into the Header slot, so they stay in the page tree (useVM works). Without
    explicit breadcrumbs, Header derives them from the sidebar menu (`entities/menu/routeMeta.js`:
    submenu item → parent crumb; nested route → prefix match); without a title it uses the menu
    label. Header is `sticky top-0` (50px) — window-scroll sticky bars in pages use `top-[50px]`.
    Don't add `<h1>` page titles or "Назад" links inside `<main>`.
  - Port from the **current** origin (`C:\projects\Portal\www\resources\js\ReactPages`), not from the
    stale copy in `src/pages` — some copied files predate backend contract changes (e.g. theme/i-doc
    settings moved to cookies). Origin used a `@/` alias (→ `resources/js`) and `Components/`
    capitalisation; this repo has neither (imports are relative, folder is `src/components`).
  - Infrastructure: `src/shared/mvvm/` (`VmScope`, `makeViewModel`, `useViewModel`, `useVM`,
    `ViewModelProvider`, `useObservableValue`, `TableState`), `src/lib/queryClient.js` (one `QueryClient` from
    mobx-tanstack-query, also passed to `<QueryClientProvider>` — shared cache),
    `src/shared/realtime/echoChannels.js` (`listenPrivate` — use `stopListening`, never
    `Echo.leave`, since several widgets share a channel), `src/shared/navigation/openUrl.js`,
    `src/shared/hooks/usePageTitle.js`.
- **Global stores** (`src/stores/`, `useStores()` / `useSession()` from `storeHooks.js`):
  - `SessionStore` — `me` (`GET /api/me`), `auth` (`GET /api/spa/auth`, the exact shape of the old
    Inertia `usePage().props.auth`: `{ user: { id, name, email, permissions, showKPI } }` — so
    replace `usePage().props.auth` with `session.auth`), `status`
    (`'loading' | 'authenticated' | 'guest'`), `hasPageAccess(pathname)` (mirror of backend
    `PageAccess` middleware), `can(page, action)` (mirror of `Gate`/`PermissionService::check`,
    `'individual'` counts as allowed), `login/register/logout`, `patchUiSettings`. A 401 from any
    request clears non-session query cache and drops to `guest`. `/api/me` is revalidated in the
    background (window focus after 5 min, every 10 min while visible).
  - Sidebar menu = `/api/me` `data.menu.catalog` (items, order, submenus) filtered by
    `data.access.pages`; persisted per user in localStorage (`src/entities/menu/menuCache.js`,
    key `portal.sidebar-menu`, signature-compared — rewritten only on change, cleared for guests).
    With a cache, `ProtectedRoute` renders the shell (sidebar) before `/api/me` resolves and
    `AuthorizedLayout` holds page content until the session is confirmed.
  - `DictionaryStore` — `GET /api/voc_user`, loaded on demand.
  - The transition adapters (`useMe`, `AuthContext`/`useAuth`, `DictionaryContext`) were removed in
    stage 7 — use `useSession()` / `useStores()` (auth pages call `useSession().login/register/logout`).
- **Inertia page props → `GET /api/spa/pages/<page>/options`** (backend `routes/api/spa.php`,
  `SpaPageOptionsController` + `App\Services\Spa\PageOptionsService`, same props as the Inertia
  controllers, same `pageAccess`/`Gate` checks). Pages without props use their existing APIs.
- **Guards**: `ProtectedRoute` / `GuestRoute` (observers over `session.status`); `RequirePage`
  (`pageAccess` + optional `gate={{ page, action }}`, renders `pages/Forbidden.jsx`) mirrors the
  web route's middleware. Section pages are lazy routes (`page(() => import(...))`).
- **Dev API connection**: the Vite dev server proxies `/api`, `/sanctum`, `/broadcasting`,
  `/storage`, `/profile`, `/staff`, `/consolidated-data` to `VITE_API_PROXY_TARGET` (default
  `http://127.0.0.1:8591`, the local Laravel), so the browser sees one origin (`localhost:3000`)
  and no CORS is involved. `/staff` and `/profile` overlap SPA routes, so browser navigations
  (`Accept: text/html`) bypass the proxy. `src/lib/http.js` (imported in `main.jsx`) sets global
  axios defaults (`baseURL: '/'`, credentials, XSRF, JSON headers) for pages calling bare `axios`.
- **Realtime**: `src/lib/echo.js` (imported in `main.jsx`) creates `window.Echo` (laravel-echo +
  pusher-js, `broadcaster: 'reverb'`) on the page's own origin; Vite proxies the WebSocket
  `/app/*` to `VITE_REVERB_PROXY_TARGET` (default `http://127.0.0.1:6001`, run
  `php artisan reverb:start` in the backend). Private/presence channel auth goes through
  `apiFetch('/broadcasting/auth')`, reusing the Sanctum session + XSRF handshake.
- `src/lib/api.js` — `apiFetch(path, { method, body, headers })` wraps axios against
  `VITE_API_URL` (default empty = same origin via the proxy, see `.env.example`) with credentials.
  For mutating methods (`POST`/`PUT`/`PATCH`/`DELETE`) it transparently handles the Sanctum SPA CSRF
  handshake: ensures an `XSRF-TOKEN` cookie exists (via `GET /sanctum/csrf-cookie`) and echoes it back
  as the `X-XSRF-TOKEN` header. Throws `ApiError(status, payload)` on non-2xx responses. On a 401 from
  any request it invokes a globally-registered handler (`setUnauthorizedHandler`, wired up by
  `RootStore` → `session.handleUnauthorized()`) so the UI drops back to `guest` state as soon as the
  backend session expires.
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
- State/data stack in use: `mobx`, `mobx-react-lite`, `mobx-tanstack-query` (requires
  `@tanstack/query-core ^5.90` — keep `@tanstack/react-query` on a version that shares the same
  query-core copy), `axios`, `laravel-echo` + `pusher-js`. `@inertiajs/react` was uninstalled in
  stage 7 and `@inertiajs/*` imports are banned by ESLint (`no-restricted-imports`).