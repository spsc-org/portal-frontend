// Конфіг, що задається під час ЗАПУСКУ контейнера, а не під час білду: один і той
// самий образ SPA промоутиться з test у prod без перезбирання. `/config.js`
// (index.html, до main.jsx) пише entrypoint nginx-образу з env контейнера
// (docker/nginx/40-portal-config.sh); у dev це public/config.js з порожнім
// об'єктом, тож діє fallback на import.meta.env (VITE_*) з .env.
const runtime =
  (typeof window !== 'undefined' && window.__PORTAL_CONFIG__) || {}

function pick(runtimeKey, buildValue) {
  const value = runtime[runtimeKey]
  return value !== undefined && value !== '' ? value : buildValue
}

export const runtimeConfig = Object.freeze({
  reverbAppKey: pick('REVERB_APP_KEY', import.meta.env.VITE_REVERB_APP_KEY),
  appDebug: Boolean(pick('APP_DEBUG', import.meta.env.VITE_APP_DEBUG)),
  appVersion: pick('APP_VERSION', 'dev'),
})
