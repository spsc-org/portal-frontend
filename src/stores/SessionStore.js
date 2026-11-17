import { makeAutoObservable, observable, reaction } from 'mobx'
import { ApiError, apiFetch } from '../lib/api.js'
import { clearMenuCache, menuFromMe, menuSignature, readMenuCache, writeMenuCache } from '../entities/menu/menuCache.js'

// /api/me перевіряється на зміни (меню, права) у фоні: при поверненні на
// вкладку, якщо дані старші за ME_STALE_MS, і за інтервалом, поки вкладка видима.
const ME_STALE_MS = 5 * 60 * 1000
const ME_REFRESH_MS = 10 * 60 * 1000

export const SESSION_KEYS = {
  me: ['session', 'me'],
  auth: ['session', 'auth'],
}

/**
 * Сесія поточного користувача (замість Inertia shared props + singleton useMe).
 *
 *  - `me`   — GET /api/me: профіль, access.pages, menu.catalog, settings.ui;
 *  - `auth` — GET /api/spa/auth: РІВНО та сама форма, що й Inertia
 *             `usePage().props.auth` ({ user: { id, name, email, permissions, showKPI } }),
 *             тож перенесені сторінки й permission-хелпери, що приймають `auth`,
 *             працюють без змін сигнатур.
 */
export class SessionStore {
  /** Меню з localStorage ({ userId, signature, menu }) — для рендеру до відповіді /api/me. */
  cachedMenu = readMenuCache()

  constructor({ scope }) {
    this.scope = scope
    makeAutoObservable(this, { scope: false, cachedMenu: observable.ref }, { autoBind: true })

    this.meQuery = scope.query({
      queryKey: SESSION_KEYS.me,
      queryFn: async () => {
        try {
          const payload = await apiFetch('/api/me')
          return payload?.data ?? null
        } catch (error) {
          // 401 — це не помилка, а стан "гість".
          if (error instanceof ApiError && error.status === 401) return null
          throw error
        }
      },
      staleTime: ME_STALE_MS,
      refetchOnWindowFocus: true,
      refetchInterval: ME_REFRESH_MS,
    })

    this.authQuery = scope.query({
      // id у ключі: при зміні користувача (logout → login іншим) — новий запит.
      queryKey: () => [...SESSION_KEYS.auth, this.me?.id ?? null],
      enabled: ({ queryKey }) => queryKey[2] != null,
      queryFn: async () => (await apiFetch('/api/spa/auth'))?.data ?? { user: null },
      staleTime: Infinity,
    })

    // Кожна відповідь /api/me звіряється з кешем меню (store живе весь час
    // роботи застосунку, тож reaction не потребує dispose).
    reaction(() => [this.me, this.meQuery.isPending], () => this.syncMenuCache())
  }

  // ---- стан -------------------------------------------------------------

  get me() {
    return this.meQuery.data ?? null
  }

  /** 'loading' | 'authenticated' | 'guest' — як у попередньому AuthContext. */
  get status() {
    if (this.meQuery.isPending) return 'loading'
    return this.me ? 'authenticated' : 'guest'
  }

  get isAuthenticated() {
    return this.status === 'authenticated'
  }

  get error() {
    return this.meQuery.error ?? null
  }

  /**
   * Меню сайдбару: зі свіжого /api/me, а до його відповіді — з localStorage.
   * null — меню ще невідоме (немає ні відповіді, ні кешу).
   */
  get menu() {
    if (this.me) return menuFromMe(this.me)
    return this.meQuery.isPending ? (this.cachedMenu?.menu ?? null) : null
  }

  /** Сесія ще перевіряється, але є кеш меню — каркас можна показати одразу. */
  get canRenderShell() {
    return this.status === 'authenticated' || (this.status === 'loading' && Boolean(this.cachedMenu))
  }

  /**
   * Звірити відповідь /api/me з кешем: однакова сигнатура — нічого не робимо
   * (без перезапису LS і перерендеру), інша — оновити кеш. Якщо меню змінилось
   * для того самого користувача, змінились і права — перезапитуємо /api/spa/auth.
   */
  syncMenuCache() {
    if (this.meQuery.isPending) return
    if (!this.me) {
      if (this.cachedMenu) {
        clearMenuCache()
        this.cachedMenu = null
      }
      return
    }

    const menu = menuFromMe(this.me)
    const signature = menuSignature(menu)
    const previous = this.cachedMenu
    if (previous?.userId === this.me.id && previous.signature === signature) return

    this.cachedMenu = writeMenuCache(this.me.id, menu, signature)
    if (previous?.userId === this.me.id && this.authQuery.isSuccess) {
      this.scope.invalidate(SESSION_KEYS.auth)
    }
  }

  /** Inertia-сумісний `auth` ({ user }). */
  get auth() {
    return { user: this.authQuery.data?.user ?? null }
  }

  get userId() {
    return this.me?.id ?? null
  }

  /** Права завантажені (до цього guard-и не повинні вирішувати "немає доступу"). */
  get permissionsReady() {
    return this.status === 'guest' || this.authQuery.isSuccess
  }

  get permissions() {
    return this.auth.user?.permissions ?? {}
  }

  get pagePermissions() {
    return this.permissions.pages ?? {}
  }

  // ---- перевірки доступу ------------------------------------------------

  /**
   * Дзеркало бекендного PageAccess (app/Http/Middleware/PageAccess.php):
   * доступ є, якщо шлях починається з "/{key}" для БУДЬ-ЯКОГО ключа в
   * permissions.pages (значення прав при цьому не перевіряються).
   */
  hasPageAccess(pathname) {
    return Object.keys(this.pagePermissions).some((key) => pathname.startsWith(`/${key}`))
  }

  /** Сире значення права: true | false | 'individual'. */
  scopeFor(page, action = 'read') {
    return this.pagePermissions[page]?.[action] ?? false
  }

  /** Аналог Gate (PermissionService::check): 'individual' теж дає доступ. */
  can(page, action = 'read') {
    const value = this.scopeFor(page, action)
    return value === 'individual' || Boolean(value)
  }

  // ---- мутації кешу сесії ----------------------------------------------

  setMe(data) {
    this.scope.queryClient.setQueryData(SESSION_KEYS.me, data ?? null)
  }

  reload() {
    return this.meQuery.refetch()
  }

  /** Локально оновити me.settings.ui.* після успішного PATCH (без запиту). */
  patchUiSettings(patch) {
    this.scope.queryClient.setQueryData(SESSION_KEYS.me, (me) =>
      me ? { ...me, settings: { ...me.settings, ui: { ...me.settings?.ui, ...patch } } } : me,
    )
  }

  /** Сесія скинута бекендом (401 з будь-якого запиту) або logout. */
  handleUnauthorized() {
    this.clearUserData()
    this.setMe(null)
  }

  /** Прибрати з кешу все, що не є сесією, — дані попереднього користувача. */
  clearUserData() {
    this.scope.queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' })
  }

  // ---- auth-дії (Sanctum SPA) ------------------------------------------

  async login(email, password, remember = false) {
    const payload = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password, remember },
    })
    this.setMe(payload?.data ?? null)
  }

  async register(fields) {
    const payload = await apiFetch('/api/auth/register', { method: 'POST', body: fields })
    this.setMe(payload?.data ?? null)
  }

  async logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' })
    this.handleUnauthorized()
  }
}
