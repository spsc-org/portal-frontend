import withMT from "@material-tailwind/react/utils/withMT"
import forms from "@tailwindcss/forms"

const config = withMT({
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontWeight: {
        default: 400,
      },
      keyframes: {
        // Portal UI kit: "щойно змінено" — бурштиновий спалах, що згасає (amber-200 / amber-800)
        highlight: {
          '0%': { backgroundColor: '#fde68a' },
          '100%': { backgroundColor: 'transparent' }
        },
        darkHighlight: {
          '0%': { backgroundColor: '#92400e' },
          '100%': { backgroundColor: 'transparent' }
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
        highlight: 'highlight 3s ease',
        darkHighlight: 'darkHighlight 3s ease',
        spin: 'spin 1s linear infinite',
      }
    },
  },

  // tw-elements/dist/plugin (Tailwind v3-era, 1.0.0-alpha13, not used anywhere
  // in src/) generates a `:root` utility selector that Tailwind v4's stricter
  // engine rejects outright — breaks the whole build, not just one page.
  plugins: [
    forms,
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
//
// But extend.colors with the SAME names (gray, blue, green, red, amber, …)
// still overrides Tailwind's defaults — gray-600 was MT's #757575 instead of
// Tailwind's #4b5563 that the Portal UI kit tokens are defined in. Keep only
// the MT names Tailwind doesn't have; everything else is stock Tailwind,
// matching the design system (tokens.json).
const MT_ONLY_COLORS = ["blue-gray", "brown", "deep-orange", "light-green", "light-blue", "deep-purple"]
config.theme.extend.colors = Object.fromEntries(
  MT_ONLY_COLORS.filter((name) => config.theme.colors?.[name]).map((name) => [name, config.theme.colors[name]]),
)
delete config.theme.colors

export default config