import { makeAutoObservable } from 'mobx'

/**
 * makeAutoObservable для ViewModel з типовими налаштуваннями:
 *  - `autoBind` — методи можна передавати напряму в onClick/onChange;
 *  - службові поля (`scope`, `stores`) не робимо observable — ці імена
 *    зарезервовані: не називайте ними власний UI-стан (напр. фільтр "scope").
 *
 * ВАЖЛИВО: викликати в конструкторі ДО створення Query/Mutation, щоб
 * реактивні `queryKey: () => [...]` вже читали observable-поля.
 *
 * Поля, куди кладуться об'єкти з кешу запитів (вибраний рядок, ціль
 * видалення тощо), позначайте `observable.ref` — інакше MobX глибоко
 * клонує їх в observable-копію: makeViewModel(this, { selected: observable.ref }).
 *
 *   constructor({ scope, stores }) {
 *     this.scope = scope
 *     this.stores = stores
 *     makeViewModel(this)
 *     this.listQuery = scope.query({ queryKey: () => ['x', this.page], ... })
 *   }
 */
export function makeViewModel(target, overrides = {}) {
  return makeAutoObservable(
    target,
    { scope: false, stores: false, ...overrides },
    { autoBind: true },
  )
}
