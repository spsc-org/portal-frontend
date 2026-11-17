import { useState, useSyncExternalStore } from 'react'
import { reaction } from 'mobx'

/** Зовнішній store для useSyncExternalStore поверх MobX-selector-а. */
function createObservableSource(selector) {
  let value = selector()

  return {
    subscribe(onChange) {
      return reaction(selector, (next) => {
        value = next
        onChange()
      })
    },
    getSnapshot() {
      return value
    },
  }
}

/**
 * Міст MobX → React для компонентів, які ще НЕ обгорнуті в observer()
 * (не-observer компоненти, сторонні бібліотеки). Повертає
 * поточне значення selector-а і перерендерює компонент, коли воно змінюється.
 * У нових View використовуйте observer() — цей хук лише для сумісності.
 */
export function useObservableValue(selector) {
  const [source] = useState(() => createObservableSource(selector))

  return useSyncExternalStore(source.subscribe, source.getSnapshot)
}
