/**
 * Позиція спливної панелі праворуч від тригера (кнопка/бейдж у сайдбарі).
 * Якщо над тригером замало місця — відкриваємо вниз, інакше панель вилазить
 * за верх екрана.
 */
export function anchoredPosition(rect, { gap = 8, margin = 16, minHeight = 160 } = {}) {
  if (!rect) return { placement: 'above', bottom: 0, left: 0, maxHeight: 384 }

  const spaceAbove = rect.top - margin
  const spaceBelow = window.innerHeight - rect.bottom - margin

  if (spaceAbove >= minHeight || spaceAbove >= spaceBelow) {
    return {
      placement: 'above',
      bottom: window.innerHeight - rect.top + gap,
      left: rect.right + gap,
      maxHeight: Math.max(minHeight, spaceAbove),
    }
  }

  return {
    placement: 'below',
    top: rect.bottom + gap,
    left: rect.right + gap,
    maxHeight: Math.max(minHeight, spaceBelow),
  }
}

/** Inline-стиль панелі з позиції (динамічні px-координати — не Tailwind-класи). */
export function positionStyle(pos) {
  return {
    ...(pos.placement === 'below' ? { top: pos.top } : { bottom: pos.bottom }),
    left: pos.left,
    maxHeight: pos.maxHeight,
  }
}
