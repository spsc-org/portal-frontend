/**
 * Текст аватара без фото: не більше 2 літер. Бекендні `initials` бувають цілим прізвищем
 * ("Дженкінс") — у колі вони вилазять за межі, тож обрізаємо на рівні UI:
 * два слова → перші літери ("Ковальчук Іван" → "КІ"), одне → перші 2 символи ("ДЖ").
 */
export function avatarInitials(initials, name = '') {
  const source = String(initials || '').trim() || String(name || '').trim()
  if (!source) return '?'
  const words = source.split(/[\s.]+/).filter(Boolean)
  const letters = words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2)
  return letters.toUpperCase()
}
