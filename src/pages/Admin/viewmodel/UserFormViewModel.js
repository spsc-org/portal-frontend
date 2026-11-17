import { reaction } from 'mobx'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { filterPermissions, mergePermissions } from '../../../lib/utils.js'
import { ADMIN_KEYS, createAdminUser, fetchAdminUser, updateAdminUser } from '../model/adminApi.js'

const EMPTY_PROFILE = {
  name: '',
  email: '',
  initials: '',
  isResponsible: false,
  showActivity: false,
  showKPI: false,
  password: '',
  dob: '',
  unit: '',
  rankId: null,
  agreementTo: '',
  positionFrom: '',
  rankFrom: '',
}

const toDateInput = (value) => (value ? format(value, 'yyyy-MM-dd') : '')

/**
 * Форма користувача: створення (id = null) або редагування (id).
 * Права: `permissions` — значення по всіх модулях схеми, `activePages` —
 * модулі, що реально підуть на бекенд (вимкнений модуль = без доступу).
 */
export class UserFormViewModel {
  form = { ...EMPTY_PROFILE }
  permissions = {}
  activePages = []
  errors = null
  activeTab = 'profile'
  // Захист від самопозбавлення адмін-прав: редагування секції `admin` у себе — після підтвердження.
  adminLocked = true
  confirmUnlock = false
  hydrated = false

  constructor({ scope, data, id, onDone }) {
    this.scope = scope
    this.data = data
    this.id = id ?? null
    this.onDone = onDone
    makeViewModel(this, { data: false, id: false, onDone: false })

    if (!this.isEdit) {
      // Створення: дефолти зі схеми, усі модулі увімкнені (як в Inertia-версії).
      const stopSchema = reaction(
        () => this.data.permissionsSchema,
        (schema) => {
          this.permissions = mergePermissions(schema)
          this.activePages = Object.keys(schema)
        },
        { fireImmediately: true },
      )
      scope.signal.addEventListener('abort', stopSchema, { once: true })
    }

    this.userQuery = scope.query({
      queryKey: ADMIN_KEYS.user(this.id),
      queryFn: () => fetchAdminUser(this.id, this.data.userId),
      enabled: this.isEdit,
    })

    if (this.isEdit) {
      // Заповнюємо форму, коли є і користувач, і схема, і звання.
      const stopHydrate = reaction(
        () => [this.userQuery.data, this.data.permissionsSchema, this.data.ranks],
        ([user, schema, ranks]) => user && this.hydrate(user, schema, ranks),
        { fireImmediately: true },
      )
      scope.signal.addEventListener('abort', stopHydrate, { once: true })
    }

    this.saveMutation = scope.mutation({
      mutationFn: (body) =>
        this.isEdit ? updateAdminUser(this.id, body, this.data.userId) : createAdminUser(body, this.data.userId),
      invalidateQueries: { queryKey: ['admin-users'] },
    })
  }

  hydrate(user, schema, ranks) {
    this.form = {
      ...EMPTY_PROFILE,
      email: user.email,
      name: user.name,
      isResponsible: Boolean(user.isResponsible),
      showActivity: Boolean(user.permissions?.general?.showActivity),
      showKPI: Boolean(user.showKPI),
      initials: user.initials,
      dob: user.dob,
      unit: user.unit || '',
      rankId: ranks.find((rank) => rank?.id === user.rankId) ?? null,
      agreementTo: toDateInput(user.agreementTo),
      positionFrom: toDateInput(user.positionFrom),
      rankFrom: toDateInput(user.rankFrom),
    }
    this.permissions = mergePermissions(schema, user)
    this.activePages = Object.keys(user.permissions?.pages ?? {})
    this.hydrated = true
  }

  // ---- derived ------------------------------------------------------------

  get isEdit() {
    return this.id != null
  }

  get title() {
    return this.isEdit ? `Редагування: ${this.userQuery.data?.name ?? ''}` : 'Додаванная користувача'
  }

  get schemaEntries() {
    return Object.entries(this.data.permissionsSchema)
  }

  get isSaving() {
    return this.saveMutation.isPending
  }

  /** Редагує сам себе й має адмін-доступ — секцію `admin` блокуємо до підтвердження. */
  isSelfAdminLock(category) {
    const user = this.userQuery.data
    const isAdmin = Boolean(user?.permissions?.pages?.['admin-users']?.read)
    return this.isEdit && this.id === this.data.userId && isAdmin && category === 'admin'
  }

  isPageActive(category) {
    return this.activePages.includes(category)
  }

  isSectionDisabled(category) {
    return !this.isPageActive(category) || (this.isSelfAdminLock(category) && this.adminLocked)
  }

  // ---- actions ------------------------------------------------------------

  setTab(tab) {
    this.activeTab = tab
  }

  handleInput({ target }) {
    this.form[target.name] = target.value
  }

  handleCheckbox({ target }) {
    this.form[target.name] = target.checked
  }

  setSelect(key, selected) {
    this.errors = { ...this.errors, [key]: '' }
    this.form[key] = selected
  }

  togglePage(category) {
    this.activePages = this.isPageActive(category)
      ? this.activePages.filter((page) => page !== category)
      : [...this.activePages, category]
  }

  setPermission(category, action, value) {
    this.permissions = { ...this.permissions, [category]: { ...this.permissions[category], [action]: value } }
  }

  askUnlockAdmin() {
    if (this.adminLocked) this.confirmUnlock = true
  }

  cancelUnlockAdmin() {
    this.confirmUnlock = false
  }

  unlockAdmin() {
    this.adminLocked = false
    this.confirmUnlock = false
  }

  buildBody() {
    // Пароль — лише при створенні: у формі редагування поля пароля немає
    // (як і в Inertia-версії), тож порожній рядок не має потрапити в PATCH.
    // eslint-disable-next-line no-unused-vars
    const { password, ...profile } = this.form
    return {
      ...(this.isEdit ? profile : this.form),
      rankId: this.form.rankId?.id,
      permissions: {
        general: { showActivity: this.form.showActivity },
        pages: filterPermissions(this.permissions, this.activePages),
      },
      showKPI: this.form.showKPI,
    }
  }

  async submit() {
    this.errors = null
    try {
      await this.saveMutation.mutate(this.buildBody())
      toast.success(this.isEdit ? 'Оновлено успішно' : 'Створено успішно')
      this.onDone()
    } catch (error) {
      if (error?.status === 422) {
        this.errors = error.payload?.unvalidFields ?? null
        // Усі валідовані поля — на табі профілю.
        this.activeTab = 'profile'
      } else {
        toast.error(error?.payload?.message ?? 'Не вдалося зберегти користувача')
      }
    }
  }
}
