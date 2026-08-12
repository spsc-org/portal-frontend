# Working with the Portal UI Kit design system

This documents how I (Claude) will interpret references to the **Portal UI Kit**
in future prompts in this repo, and what I'll actually do when you point me at it.

## What it is

- A `claude.ai/design` project of type `PROJECT_TYPE_DESIGN_SYSTEM`, named
  **"Portal UI Kit"**, id `3efa1d85-2dd3-4855-9d0e-17cf7e3c12f9`
  (`https://claude.ai/design/p/3efa1d85-2dd3-4855-9d0e-17cf7e3c12f9`).
- Accessed through the `DesignSync` MCP tool (`get_project` / `list_files` / `get_file`
  for reading). This repo (`portal-frontend`) is not the design system's own repo, so
  I'll only ever **read** from it here, never `write_files`/`delete_files` into it.
- It mirrors the real, already-shipped **portal-ui-kit** npm package (`0.0.0`) — the
  React component layer of a **separate Laravel + Inertia app** (see
  `guidelines/docs/i-doc-registry.md`, which maps components to real source files like
  `resources/js/ReactPages/Admin/Index.jsx`). It is **not** part of this repo's own
  component tree and none of it is wired into `portal-frontend` yet.
- 144 components across ~30 domain folders: `admin`, `buttons`, `fields`, `table`,
  `modal(s)`, `project`, `proposal`, `task`, `decree`, `dictionary`, `inventory`,
  `staffattendance`, `welcome`, `atoms`, `layouts`, `integrations`, `general`, `views`,
  `document(ation)`, `subject`, `audit`, `advancedsearch`, `projectimport`, `show`,
  `sekeleton`, `shared`, `widgets`. Full index: `../../README.md`'s "Components" section or
  `_ds_manifest.json` (`components[].sourcePath`, `cards[]`, `tokens[]`).

## File anatomy per component

Each component folder (`components/<group>/<Name>/`) has four files:

- `<Name>.prompt.md` — one-line usage pointer (`window.PortalUI.<Name>`, bundle-based).
- `<Name>.d.ts` — prop types **synthesized from JSX**, usually loose/opaque
  (`[key: string]: unknown`). Don't trust it as a real contract — verify against the
  `.html` variant grid, or better, the real source `file:line` in
  `guidelines/docs/i-doc-registry.md` when one exists for that component.
- `<Name>.html` — a static variant-grid preview card (used for the Design System pane).
- `<Name>.jsx` — **not real source**. It's a one-line re-export stub
  (`Object.assign(window, { <Name>: window.PortalUI.<Name> })`) against the compiled
  `_ds_bundle.js` global. Never port this file's contents into `portal-frontend` as if
  it were the implementation.

Root-level files worth knowing:
- `_ds_bundle.js` / `_ds_bundle.css` — the compiled bundle exposing `window.PortalUI.*`
  and its styles. Only relevant for standalone HTML prototyping, not for the Vite app.
- `_ds_manifest.json` — canonical registry: component → real `sourcePath`, all preview
  cards, and the 54 CSS custom properties the kit ships (mostly `react-day-picker` /
  `photoswipe` tokens, not this app's own design tokens).
- `_adherence.oxlintrc.json` — the **lint contract the origin app enforces**, useful as
  a spec even though `portal-frontend` doesn't run oxlint:
  - no raw `<button>/<input>/<dialog>/<table>` — use `Button`/`Input`/`Modal`/`Table`.
  - no deep imports from `components/<group>/<Name>/**` — only from a barrel `index.js`.
  - no raw hex colors or `px` literals — use design tokens via `var()`.
  - `<Page>` only accepts an `auth` prop.
- `guidelines/docs/i-doc-registry.md` — maps some components/pages to real file:line in
  the origin Inertia app. Treat this as higher-authority than the `.d.ts` when present.
- `Projects List (React).html` — a **prototype-only** integration pattern: Tailwind Play
  CDN + Babel Standalone + pinned React 18 UMD + `_ds_bundle.js`. This is how the design
  system previews itself in isolation — it is *not* the pattern to copy into the Vite
  app (which has its own React 19 + esbuild pipeline).

## Styling idiom to preserve when porting

- Components carry Tailwind utility strings directly in `className` (e.g.
  `bg-blue-500 text-white px-4 py-3 rounded shadow-md`, with `dark:` variants). No
  CSS-in-JS, no per-component class API.
- Dark mode is class-based (`darkMode: 'class'`).
- `color` prop vocabulary: `primary | secondary | success | warning | error | white`.
- `size` prop vocabulary: `xs | sm | md | lg`.
- Theme/token source of truth upstream is `tailwind.config.cjs` (fonts `Roboto` /
  `Open Sans`, spacing, `highlight`/`spin` animations) — reuse its scale rather than
  inventing new values once we adopt it here.

## What this means concretely for `portal-frontend`

Per `../../CLAUDE.md`, this repo has Tailwind installed but **not wired in**
(`../../vite.config.js` has no `@tailwindcss/vite`, `../../src/index.css` is empty), no
`@material-tailwind/react` `ThemeProvider` set up, and only login + a placeholder
dashboard exist. So "reference the kit" will default to:

1. **Port, don't runtime-import.** I'll recreate the component as plain Tailwind JSX
   under `src/components/...` in this repo's own conventions (relative imports, no
   path alias, `.jsx`), matching the kit's class/color/size vocabulary — not load
   `_ds_bundle.js` as a live script.
2. **Primitives are portable, pages are not.** `buttons/`, `fields/`, `table/`,
   `modal/`, `atoms/`, `general/` are framework-agnostic enough to port directly.
   Anything page-shaped (`admin/Index`, `task/*`, `project/*`, `proposal/*`, …) is an
   **Inertia page** upstream — it reads `usePage()` and fetches via react-query, so
   it must be re-authored against this app's `useAuth()` / `apiFetch()` / react-router
   loader model rather than copied.
3. **Verify props before coding.** Since `.d.ts` files here are opaque, I'll check
   `guidelines/docs/i-doc-registry.md` for a real source pointer first, and ask you for
   the actual prop contract if neither source resolves it — I won't invent props.

## My procedure when you say "use `<X>` from the kit" / "per portal-ui-kit"

1. Resolve `<X>`'s group from `_ds_manifest.json` (re-`list_files`/`get_file` if this
   session's cached view might be stale).
2. Read `<X>.prompt.md`, `<X>.d.ts`, `<X>.html` for shape/variants.
3. Cross-check `guidelines/docs/i-doc-registry.md` for an authoritative source file:line.
4. Port it into `src/components/<group>/<X>.jsx` in this repo's plain-JS/Tailwind
   idiom, flagging anything Inertia-specific for you to confirm a replacement for.
5. If Tailwind still isn't wired into the Vite build at that point, say so before
   writing styled JSX that won't render — that's a prerequisite, not an assumption
   I'll silently make.

## Components already reviewed (admin group)

- `Index` (`components/admin/Index`) — admin page shell; real:
  `resources/js/ReactPages/Admin/Index.jsx:1`. Page-level, Inertia-bound — recreate
  intent, don't port verbatim.
- `UserModal` (`components/admin/UserModal`) — create-user modal; real:
  `resources/js/ReactPages/Admin/UserModal.jsx:1`.
- `UserUpdateModal` (`components/admin/UserUpdateModal`) — edit-user modal; real:
  `resources/js/ReactPages/Admin/UserUpdateModal.jsx:1`.

All three have opaque `.d.ts` props (`[key: string]: unknown`) — actual prop
contracts need to come from you or from the real app source before I port them.

## Open questions before deeper porting work

- Wire up Tailwind in `portal-frontend` first (plugin + `tailwind.config.cjs`
  equivalent), since every kit component assumes its utility classes compile?
- Introduce a `../../src/components` barrel (`index.js`) mirroring the kit's
  `no-restricted-imports` rule, or keep this repo's existing flat relative imports?
