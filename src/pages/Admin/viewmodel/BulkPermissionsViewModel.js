import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { mergePermissions } from '../../../lib/utils.js'
import { bulkUpdatePermissions } from '../model/adminApi.js'

/**
 * Масові дії над відібраними користувачами (таб «Пермішени»):
 *  - applySections — секції, що підуть у bulk-патч;
 *  - enabledPages — модуль увімкнений (повністю перезаписує pages[key]),
 *    вимкнений — прибирає ключ сторінки.
 */
export class BulkPermissionsViewModel {
  applySections = []
  enabledPages = []
  permissions = {}

  constructor({ scope, data, userIds, onDone }) {
    this.scope = scope
    this.data = data
    this.userIds = userIds
    this.onDone = onDone
    this.permissions = mergePermissions(data.permissionsSchema)
    makeViewModel(this, { data: false, userIds: false, onDone: false })

    this.mutation = scope.mutation({
      mutationFn: (body) => bulkUpdatePermissions(body, this.data.userId),
      invalidateQueries: { queryKey: ['admin-users'] },
    })
  }

  get schemaEntries() {
    return Object.entries(this.data.permissionsSchema)
  }

  get canSubmit() {
    return this.applySections.length > 0 && this.userIds.length > 0
  }

  isApplied(category) {
    return this.applySections.includes(category)
  }

  isEnabled(category) {
    return this.enabledPages.includes(category)
  }

  toggleApply(category) {
    this.applySections = this.isApplied(category)
      ? this.applySections.filter((item) => item !== category)
      : [...this.applySections, category]
  }

  toggleEnabled(category) {
    this.enabledPages = this.isEnabled(category)
      ? this.enabledPages.filter((item) => item !== category)
      : [...this.enabledPages, category]
  }

  setPermission(category, action, value) {
    this.permissions = { ...this.permissions, [category]: { ...this.permissions[category], [action]: value } }
  }

  async submit() {
    if (!this.userIds.length) return toast.error('Не обрано користувачів')
    if (!this.applySections.length) return toast.error('Оберіть хоча б одну секцію для застосування')

    const sections = Object.fromEntries(
      this.applySections.map((page) => [
        page,
        this.isEnabled(page) ? { enabled: true, permissions: this.permissions[page] || {} } : { enabled: false },
      ]),
    )

    try {
      const payload = await this.mutation.mutateAsync({ userIds: this.userIds, sections })
      const updated = payload?.data?.updated ?? 0
      const skipped = payload?.data?.skipped ?? []
      toast.success(skipped.length ? `Оновлено: ${updated}. Пропущено: ${skipped.length}` : `Оновлено користувачів: ${updated}`)
      this.onDone({ clearSelection: true })
    } catch (error) {
      toast.error(error?.payload?.message || 'Помилка масового оновлення')
    }
  }
}
