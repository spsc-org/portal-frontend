import { InfiniteQuery, Mutation, Query } from 'mobx-tanstack-query'
import { queryClient as defaultQueryClient } from '../../lib/queryClient.js'

/**
 * Життєвий цикл ViewModel: спільний QueryClient + AbortSignal.
 *
 * Кожен Query/Mutation, створений через scope, отримує `abortSignal` —
 * `dispose()` (unmount сторінки) знищує всі їхні підписки на кеш, тож
 * VM не тримає observers після того, як View зникла.
 *
 * Чому композиція, а не базовий клас: `makeAutoObservable` у MobX 6
 * не працює з класами, що наслідують інший клас.
 */
export class VmScope {
  constructor(queryClient = defaultQueryClient) {
    this.queryClient = queryClient
    this.abortController = new AbortController()
  }

  get signal() {
    return this.abortController.signal
  }

  get disposed() {
    return this.abortController.signal.aborted
  }

  /** `queryKey` можна задати функцією — тоді він реактивний (observable VM). */
  query(config) {
    return new Query({ queryClient: this.queryClient, abortSignal: this.signal, ...config })
  }

  infiniteQuery(config) {
    return new InfiniteQuery({ queryClient: this.queryClient, abortSignal: this.signal, ...config })
  }

  /**
   * `invalidateQueries: { queryKey: [...] }` — інвалідація кешу після успіху.
   *
   * УВАГА: `mutation.mutate(vars)` резолвиться в MutationObserverResult
   * (дані — у `.data`) і відхиляється при помилці. Коли потрібні самі дані —
   * `mutation.mutateAsync(vars)` (як у react-query).
   */
  mutation(config) {
    const mutation = new Mutation({ queryClient: this.queryClient, abortSignal: this.signal, ...config })
    mutation.mutateAsync = (variables, options) => mutation.mutate(variables, options).then((result) => result.data)
    return mutation
  }

  invalidate(queryKey) {
    return this.queryClient.invalidateQueries({ queryKey })
  }

  dispose() {
    if (!this.disposed) this.abortController.abort()
  }
}
