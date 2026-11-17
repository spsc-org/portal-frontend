/**
 * Перехід за URL, що прийшов з бекенду (нотифікації, посилання в даних).
 * Внутрішній шлях ("/task?id=1") — через react-router без перезавантаження,
 * зовнішній/абсолютний — звичайна навігація браузера.
 */
export function isInternalUrl(url) {
  if (!url) return false
  if (url.startsWith('/') && !url.startsWith('//')) return true

  try {
    return new URL(url, window.location.href).origin === window.location.origin
  } catch {
    return false
  }
}

export function openUrl(url, navigate) {
  if (!url) return

  if (navigate && isInternalUrl(url)) {
    const { pathname, search, hash } = new URL(url, window.location.href)
    navigate(`${pathname}${search}${hash}`)
    return
  }

  window.location.assign(url)
}
