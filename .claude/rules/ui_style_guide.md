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

## Typography

- Font stack: **Roboto** (weights 300/400/500/700) as primary, **Open Sans**
  (400/600/700) as fallback, then system sans-serif.

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