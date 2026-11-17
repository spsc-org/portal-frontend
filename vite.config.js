import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Префікси, які в dev проксуються на Laravel. Браузер бачить один origin
// (localhost:3000), тож Sanctum-cookie/XSRF працюють без CORS, а код з
// відносними URL (axios.get('/api/...'), fetch('/profile/avatar')) не треба
// переписувати.
const BACKEND_PREFIXES = [
  '/api',
  '/sanctum',
  '/broadcasting',
  '/storage',
  '/profile',
  '/staff',
  '/consolidated-data',
  // Файли зі сховища бекенду (прев'ю вкладень, аватари): /files?path=…, /public-file?path=…
  '/files',
  '/public-file',
  // Прапори країн (public/flag-svg бекенду): картка проєкту, ідентифікатори
  '/flag-svg',
  // Сторінки бекенду поза SPA (повна навігація через proxy)
  '/telescope',
  '/vendor/telescope',
  // POST-команди DeveloperController (сама сторінка /develop/dossier — SPA).
  // Regex-ключ: рядковий '/develop' за startsWith зачепив би /developer-*.
  '^/develop/dossier/',
  // Друк/експорт інвентарю (Excel): /inventory/export, /inventory/{id}/export
  '^/inventory/(\\d+/)?export',
  // Експорт проєктів (Excel/NSDC): /project/export, /project/projectExportToTable
  '^/project/(export|projectExportToTable)',
]

// SPA-маршрути під backend-префіксами: навігацію браузера (Accept: text/html)
// на них віддаємо Vite/SPA, а XHR/fetch — бекенду. Решта HTML-навігацій під
// префіксом — Blade-сторінки (/staff/summary-print, /staff/vacation-schedule,
// /profile) — іде на бекенд.
const SPA_OVERLAP = {
  '/staff': /^\/staff(?:\/(?:contracts|responsible))?\/?(?:[?#].*)?$/,
}

const spaNavigationBypass = (pattern) => (req) => {
  if (req.headers.accept?.includes('text/html') && pattern.test(req.url)) return req.url
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8591'

  const reverbTarget = env.VITE_REVERB_PROXY_TARGET || 'http://127.0.0.1:6001'

  const proxy = Object.fromEntries(
    BACKEND_PREFIXES.map((prefix) => [
      prefix,
      {
        target,
        changeOrigin: true,
        ...(SPA_OVERLAP[prefix] ? { bypass: spaNavigationBypass(SPA_OVERLAP[prefix]) } : {}),
      },
    ]),
  )

  // Reverb WebSocket (Pusher-протокол: ws://<host>/app/<key>). Не плутати з
  // HMR-сокетом Vite — той іде на "/" з протоколом vite-hmr.
  proxy['/app'] = { target: reverbTarget, ws: true, changeOrigin: true }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['@material-tailwind/react'],
    },
    // Сторінки перенесено з Inertia-застосунку (Vite < 8), який покладався на
    // старий CJS-interop: `import X from 'cjs-пакет'` з __esModule давав
    // module.exports.default. У Vite 8 (Rolldown) default — це весь
    // module.exports, і такі компоненти (react-images-uploading тощо) падають
    // з "Element type is invalid: … got: object".
    legacy: {
      inconsistentCjsInterop: true,
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy,
    },
  }
})
