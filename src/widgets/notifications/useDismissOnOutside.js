import { useEffect } from 'react'

/**
 * Закрити панель кліком поза `refs`. View-рівень (DOM), тому не у VM.
 * eventName='mousedown' — коли клік усередині панелі синхронно видаляє вузол
 * (позначення рядка прочитаним): до моменту `click` e.target уже від'єднаний,
 * і contains() хибно поверне false.
 */
export function useDismissOnOutside(active, refs, onDismiss, eventName = 'mousedown') {
  useEffect(() => {
    if (!active) return undefined

    const handler = (event) => {
      const inside = refs.some((ref) => ref.current && ref.current.contains(event.target))
      if (!inside) onDismiss()
    }

    document.addEventListener(eventName, handler)
    return () => document.removeEventListener(eventName, handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs — стабільні useRef
  }, [active, onDismiss, eventName])
}
