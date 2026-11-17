import withMT from "@material-tailwind/react/utils/withMT"

const config = withMT({
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontWeight: {
        default: 400,
      },
      keyframes: {
        highlight: {
          '0%': { backgroundColor: 'initial' },
          '30%': { backgroundColor: 'rgb(203 213 225)' },
          '70%': { backgroundColor: 'rgb(203 213 225)' },
          '100%': { backgroundColor: 'initial' }
        },
        darkHighlight: {
          '0%': { backgroundColor: 'initial' },
          '30%': { backgroundColor: 'rgb(113 113 122)'},
          '70%': { backgroundColor: 'rgb(113 113 122)'},
          '100%': { backgroundColor: 'initial' }
        },
        // /project: рядок, змінений іншим користувачем (live-оновлення), м'яко "блимає"
        rowUpdated: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '40%': { backgroundColor: 'rgb(254 243 199)' },
        },
        rowUpdatedDark: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '40%': { backgroundColor: 'rgba(120, 53, 15, 0.4)' },
        },
        spin: {
          from: {transform: 'rotate(0deg)'},
          to: {transform: 'rotate(360deg)'},
        }
      },
      transformOrigin: {
        'left-right': '0% 50%',
      },
      animation: {
        highlight: 'highlight 3s ease-in-out',
        darkHighlight: 'darkHighlight 3s ease-in-out',
        rowUpdated: 'rowUpdated 1.5s ease-in-out',
        rowUpdatedDark: 'rowUpdatedDark 1.5s ease-in-out',
        spin: 'spin 1s linear infinite',
      }
    },
  },

  // tw-elements/dist/plugin (Tailwind v3-era, 1.0.0-alpha13, not used anywhere
  // in src/) generates a `:root` utility selector that Tailwind v4's stricter
  // engine rejects outright — breaks the whole build, not just one page.
  plugins: [
    require('@tailwindcss/forms'),
  ],
})

// withMT() sets theme.colors (not theme.extend.colors), which REPLACES
// Tailwind's whole default palette with Material Tailwind's own legacy
// Material Design colors — no slate/zinc/neutral/stone, and gray/blue/red/…
// use different hex values than Tailwind's real defaults. Since the app's
// JSX is written against Tailwind's standard palette (slate-800, gray-700,
// …), move MT's colors into theme.extend.colors instead so Tailwind's
// built-in defaults come back, with MT's extra names (blue-gray, light-blue,
// deep-orange, …) still available as additions.
config.theme.extend.colors = config.theme.colors
delete config.theme.colors

export default config