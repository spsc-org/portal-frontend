import { useEffect, useState } from 'react'
import { useStores } from '../../stores/storeHooks.js'
import { VmScope } from './VmScope.js'

/**
 * Життєвий цикл однієї VM. Dispose відкладається на один tick:
 * StrictMode (dev) робить mount → unmount → mount синхронно, і повторний
 * activate() скасовує запланований dispose — VM лишається живою. При
 * справжньому unmount activate() вже не настає, і scope знищується.
 */
// StrictMode викликає ініціалізатор useState двічі й відкидає один результат —
// відкинута VM ніколи не буде activate()-нута. Щоб її Query не жили вічно
// (і не перезапитувались після інвалідацій), знищуємо неактивовану VM.
const ORPHAN_DISPOSE_DELAY = 5000

function createVmEntry(factory, stores) {
  const scope = new VmScope()
  const vm = factory({ scope, stores })
  let pendingDispose = setTimeout(() => scope.dispose(), ORPHAN_DISPOSE_DELAY)
  let unmount = null

  return {
    vm,
    activate() {
      if (pendingDispose) {
        clearTimeout(pendingDispose)
        pendingDispose = null
      }
      unmount = vm.mount?.() ?? null
    },
    deactivate() {
      if (typeof unmount === 'function') unmount()
      unmount = null
      pendingDispose = setTimeout(() => scope.dispose(), 0)
    },
  }
}

/**
 * Створює ViewModel на час життя компонента.
 *
 *   const vm = useViewModel((deps) => new FooViewModel({ ...deps, id }))
 *
 * - `deps` = { scope, stores }: scope — Query/Mutation з auto-dispose,
 *   stores — глобальні сторі (session, dictionary);
 * - фабрика викликається один раз; якщо VM залежить від параметрів маршруту,
 *   перемонтовуйте компонент через `key` (`<FooPage key={id} />`);
 * - `vm.mount()` (опційно) — підписки (Echo, window-події), повертає cleanup.
 */
export function useViewModel(factory) {
  const stores = useStores()
  const [entry] = useState(() => createVmEntry(factory, stores))

  useEffect(() => {
    entry.activate()
    return () => entry.deactivate()
  }, [entry])

  return entry.vm
}
