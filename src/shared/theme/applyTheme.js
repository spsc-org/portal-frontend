/**
 * Застосувати тему: клас `dark` на <html> (Tailwind darkMode: 'class'),
 * localStorage (його читає inline-скрипт в index.html до першого рендера —
 * без "спалаху" світлої теми) і cookie (контракт Blade-лейауту бекенду).
 */
export function applyTheme(theme) {
  const dark = theme === 'dark'
  document.documentElement.classList.toggle('dark', dark)

  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  } catch {
    // не критично
  }
  document.cookie = `theme=${dark ? 'dark' : 'light'}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=Strict`
}
