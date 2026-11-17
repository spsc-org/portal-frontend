import toast from 'react-hot-toast'

/**
 * Перше повідомлення валідації (422) або message відповіді.
 * Підтримує і axios-помилки (error.response.data), і ApiError з apiFetch (error.payload).
 */
export function apiErrorMessage(error, fallback) {
  const data = error?.response?.data ?? error?.payload
  if (!data || typeof data !== 'object') return fallback
  if (data.errors) {
    const first = Object.values(data.errors)[0]
    if (first) return Array.isArray(first) ? first[0] : first
  }
  return data.message || fallback
}

/**
 * "Команда" — декларативна мутація сутності (замість react-query хуків
 * useXxxMutation з onSuccess/onError у FSD-entities Inertia-версії):
 *
 *   export const PHONE_COMMANDS = {
 *     archive: {
 *       mutationFn: archivePhone,
 *       invalidate: (id, entry) => [PHONE_KEYS.detail(entry.id), PHONE_KEYS.all],
 *       success: 'Картку архівовано',          // рядок або (data, vars) => рядок
 *       error: 'Не вдалося архівувати картку',  // fallback для toast.error
 *       onSuccess: (data, vars, scope) => {},  // опційно: setQueryData відповіддю
 *       onErrorMessage: (error) => 'текст' | null, // опційно: замість error
 *     },
 *   }
 *
 *   this.cmd = createCommands(scope, PHONE_COMMANDS)
 *   await this.cmd.archive.run(id)      // → data; помилку показує toast і прокидає далі
 *   this.cmd.archive.isPending           // observable (через Mutation)
 */
export function createCommand(scope, spec) {
  const mutation = scope.mutation({ mutationFn: spec.mutationFn })

  async function run(variables) {
    try {
      const data = await mutation.mutateAsync(variables)
      // Синхронні оновлення кешу відповіддю (setQueryData) — до інвалідацій.
      spec.onSuccess?.(data, variables, scope)
      const keys = spec.invalidate?.(variables, data) ?? []
      await Promise.all(keys.filter(Boolean).map((queryKey) => scope.invalidate(queryKey)))
      const message = typeof spec.success === 'function' ? spec.success(data, variables) : spec.success
      if (message) toast.success(message)
      return data
    } catch (error) {
      if (spec.onErrorMessage) {
        // власний текст (напр. помилка поля 422); null — тост не показувати
        const message = spec.onErrorMessage(error)
        if (message) toast.error(message)
      } else if (spec.error !== false) {
        toast.error(apiErrorMessage(error, spec.error ?? 'Сталася помилка'))
      }
      throw error
    }
  }

  return {
    mutation,
    run,
    /** Як run, але без прокидання помилки (для onClick без try/catch). */
    fire: (variables) => run(variables).catch(() => undefined),
    /**
     * Сумісно з react-query `mutation.mutate(vars, { onSuccess, onError })` —
     * щоб JSX, перенесений з Inertia-версії, працював без змін. Помилку не
     * прокидає (toast уже показано), лише викликає onError.
     */
    mutate: (variables, { onSuccess, onError } = {}) =>
      run(variables).then(
        (data) => {
          onSuccess?.(data, variables)
          return data
        },
        (error) => {
          onError?.(error, variables)
          return undefined
        },
      ),
    reset: () => mutation.reset(),
    get isPending() {
      return mutation.isPending
    },
    get isSuccess() {
      return mutation.isSuccess
    },
    get isError() {
      return mutation.isError
    },
    get data() {
      return mutation.data
    },
    get error() {
      return mutation.error
    },
  }
}

export function createCommands(scope, specs) {
  return Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, createCommand(scope, spec)]))
}
