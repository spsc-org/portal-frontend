import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // public/ — статичні вендорні файли (FontAwesome тощо), не наш код
  globalIgnores(['dist', 'public']),
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
      // Деструктуризація, щоб прибрати проп із `...rest` (не DOM-атрибут), — не "невикористана змінна"
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
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
