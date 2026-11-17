import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // MVVM-View експортуються як `export default observer(Component)`.
      'react-refresh/only-export-components': ['error', { extraHOCs: ['observer'] }],
      // Inertia прибрано (етап 7): сторінки — MVVM на react-router + MobX.
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@inertiajs/*'],
          message: 'Inertia видалено: дані — через ViewModel (scope.query/apiFetch), навігація — react-router, сесія — useSession().',
        }],
      }],
    },
  },
])
