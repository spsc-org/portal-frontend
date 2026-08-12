import withMT from "@material-tailwind/react/utils/withMT"

export default withMT({
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
        spin: 'spin 1s linear infinite',
      }
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('tw-elements/dist/plugin'),
  ],
})