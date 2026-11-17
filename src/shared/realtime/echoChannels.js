/**
 * Підписки на Reverb-канали (window.Echo створюється в src/lib/echo.js).
 *
 * Кілька віджетів (дзвіночок, сайдбар, сторінка нотифікацій) слухають ОДИН
 * і той самий канал. Тому на cleanup знімаємо лише власні обробники
 * (stopListening), а не Echo.leave(), який відписав би канал для всіх.
 *
 * @returns {() => void} cleanup
 */
export function listenPrivate(channelName, events, handler) {
  const echo = window.Echo
  if (!echo || !channelName) return () => {}

  const channel = echo.private(channelName)
  events.forEach((event) => channel.listen(event, handler))

  return () => events.forEach((event) => channel.stopListening(event, handler))
}

export function listenPublic(channelName, events, handler) {
  const echo = window.Echo
  if (!echo || !channelName) return () => {}

  const channel = echo.channel(channelName)
  events.forEach((event) => channel.listen(event, handler))

  return () => events.forEach((event) => channel.stopListening(event, handler))
}

/** Персональний канал нотифікацій (routes/channels.php: notifications.{userId}). */
export const userNotificationsChannel = (userId) => (userId ? `notifications.${userId}` : null)

export const NOTIFICATION_EVENTS = [
  '.notification.created',
  '.notification.read',
  '.notifications.read_all',
]
