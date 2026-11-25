import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { apiFetch } from './api.js'
import { runtimeConfig } from './runtimeConfig.js'

// Laravel Reverb (Pusher-протокол). За замовчуванням підключаємось до того ж
// origin, що й сторінка: у dev Vite проксує WebSocket /app/* на Reverb
// (див. vite.config.js), у prod це робить reverse-proxy. VITE_REVERB_HOST/
// PORT/SCHEME задавай лише для прямого підключення до Reverb в обхід proxy.
const scheme =
  import.meta.env.VITE_REVERB_SCHEME ||
  (window.location.protocol === 'https:' ? 'https' : 'http')
const forceTLS = scheme === 'https'
const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname
const port = Number(
  import.meta.env.VITE_REVERB_PORT ||
    window.location.port ||
    (forceTLS ? 443 : 80),
)

window.Pusher = Pusher

// Авторизація private/presence-каналів через apiFetch: той самий Sanctum
// session-cookie + XSRF-рукостискання, що й для решти мутуючих запитів
// (Broadcast::routes на бекенді під middleware web+auth).
function authorizer(channel) {
  return {
    authorize(socketId, callback) {
      apiFetch('/broadcasting/auth', {
        method: 'POST',
        body: { socket_id: socketId, channel_name: channel.name },
      })
        .then((data) => callback(null, data))
        .catch((error) => callback(error, null))
    },
  }
}

// Глобальний інстанс: компоненти (NotificationBell, Sidebar, Notifications,
// UserActivityManager) звертаються саме до window.Echo.
export const echo = new Echo({
  broadcaster: 'reverb',
  key: runtimeConfig.reverbAppKey,
  wsHost: host,
  wsPort: port,
  wssPort: port,
  forceTLS,
  disableStats: true,
  enabledTransports: ['ws', 'wss'],
  authorizer,
})

window.Echo = echo
