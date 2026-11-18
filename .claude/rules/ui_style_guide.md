# UI rule: Portal UI Kit style guide

Applies whenever writing or editing styling (`className`, layout, color, spacing) for
React components in this repo. This is a visual style guide, not a component index —
for "where does component X live" see `claude_design_kit.md` instead.

## Styling engine

- Tailwind utility classes only, written inline in `className`. No CSS-in-JS, no
  per-component style objects, no separate `.css`/`.module.css` files per component.
- Dark mode is class-based (`darkMode: 'class'`) — every visual state needs an
  explicit `dark:` variant, not a `prefers-color-scheme` media query.
- No raw hex colors (`#fde68a`) and no bare `px` literals in JSX — use Tailwind's
  scale (`bg-amber-300`, `p-4`, `gap-2`, …) or an existing token via `var()`.

## Form fields

- Every input / select / textarea: `bg-white dark:bg-neutral-900`, border
  `border-gray-200 dark:border-neutral-600`, `rounded-md`, `h-9` at the default/compact
  size, focus border `blue-500` / `dark:blue-400`; disabled `bg-gray-100 dark:bg-neutral-800`.
  Light rest border is `gray-200` everywhere — forms and modals too, never `gray-300`;
  never a `gray-900` focus border. Validation: `border-red-500` (error), `border-orange-400`
  (warning). Select divider: full control height, `gray-200` / `neutral-600`.
  react-select: `kitSelectClassNames()` (`src/components/fields/selectClassNames.js`);
  MT `Input`/`Textarea`: themed in `src/lib/theme.js`.

## Interaction

- Every button and link has `cursor: pointer` — set globally in `src/index.css`
  (`@layer base`, Tailwind v4 preflight resets it to `default`); disabled buttons get
  `not-allowed`. Don't add `cursor-default` to clickable elements; clickable non-button
  elements (`<div onClick>`, table rows, chips) need an explicit `cursor-pointer`.

## Typography

- Font stack: **Roboto** (weights 300/400/500/700) as primary, **Open Sans**
  (400/600/700) as fallback, then system sans-serif.
- Text color, light theme: never lighter than `text-gray-600` (kit `ink-muted`) —
  `text-gray-500` and lighter blend into white / gray-200 surfaces. Icons: not lighter
  than `text-gray-500`. Field adornments (placeholder, search icon, clear ×, select
  chevron) stay gray-500. `text-gray-400` is not used in the light theme at all.
  Dark theme muted text: `dark:text-gray-400`.

## Color vocabulary (component `color` prop)

- Accepted values: `primary | secondary | success | warning | error | white`. Map any
  new component's color prop onto this set rather than inventing new names.

## Size vocabulary (component `size` prop)

- Accepted values: `xs | sm | md | lg`.

## Layout / surface conventions

- Card/panel surfaces: `bg-white dark:bg-gray-900`, rounded corners (`rounded` /
  `rounded-lg`), padding on the spacing scale (`p-4`–`p-6`), children stacked with
  `flex flex-col gap-4` (adjust `gap-2`/`gap-6` for density) rather than margins
  between siblings.
- Canonical idiom straight from the kit's own docs:
  ```jsx
  <div className="flex flex-col gap-4 p-6 rounded-lg bg-white dark:bg-gray-900">
    <Input label="Назва" name="title" placeholder="" onChange={() => {}} />
    <Button color="success" size="md">Зберегти</Button>
  </div>
  ```

## Motion

- Two named keyframe animations exist for "just changed" row/field highlighting:
  `highlight` (`#fde68a` → transparent) for light mode, `darkHighlight` (`#92400e` →
  transparent) for dark mode, both `3s ease`. Reuse this pattern for any
  "recently updated" affordance instead of inventing a new flash animation.

## Chrome outside kit components (floating toggles, small badges, etc.)

- Border: `border-gray-300` light / `border-gray-600` dark.
- Surface: `bg-white` light / `bg-gray-800` dark.
- Text: `text-gray-700` light / `text-gray-200` dark.
- Small pill/chip shape: fully rounded (`rounded-full`), compact height (~34px,
  `h-[34px]` or the nearest scale step), `text-xs font-semibold`, subtle `shadow-sm`.

## Known limitation

- The design kit ships its component classes **uncompiled** — there is no real
  compiled Tailwind CSS in the kit to visually diff against, only the class-name
  conventions documented here (and in the kit's `README.md`). Treat this file as the
  source of truth for values, not the kit's rendered previews.
- Tailwind is **not wired into this repo's build yet** (no `@tailwindcss/vite` in
  `vite.config.js`, empty `src/index.css`) — utility classes written per this guide
  won't render until that's set up. Flag it if you're about to write styled JSX and
  it still isn't wired in.