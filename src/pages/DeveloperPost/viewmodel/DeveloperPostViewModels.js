import { observable, reaction, toJS } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  DEVELOPER_POST_KEYS,
  deleteDeveloperPost,
  developerPostErrorMessage,
  fetchDeveloperPost,
  fetchDeveloperPostOptions,
  fetchDeveloperPosts,
  publishDeveloperPost,
} from '../model/developerPostApi.js'

// Ключ сумісний з Inertia-версією (`${location.pathname}-filters`).
const FILTERS_STORAGE_KEY = '/developer-posts-filters'
const PAGE_SIZE = 20

function restoreFilters() {
  try {
    return JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export const optionsQueryConfig = {
  queryKey: DEVELOPER_POST_KEYS.options,
  queryFn: fetchDeveloperPostOptions,
  staleTime: Infinity,
}

/** Ліва колонка: фільтри (persist) + класична пагінація (сторінки 1/2/3…). */
export class DeveloperPostListViewModel {
  q = ''
  scopeFilter = 'all'
  unreadOnly = false
  selectedAuthors = []
  selectedTags = []
  selectedStatuses = []
  page = 1

  constructor({ scope }) {
    this.scope = scope
    const stored = restoreFilters()
    this.q = stored.q || ''
    this.scopeFilter = stored.scope || 'all'
    this.unreadOnly = Boolean(stored.unreadOnly)
    this.selectedAuthors = stored.selectedAuthors || []
    this.selectedTags = stored.selectedTags || []
    this.selectedStatuses = stored.selectedStatuses || []
    makeViewModel(this, {
      selectedAuthors: observable.ref,
      selectedTags: observable.ref,
      selectedStatuses: observable.ref,
    })

    this.optionsQuery = scope.query(optionsQueryConfig)
    this.listQuery = scope.query({
      queryKey: () => DEVELOPER_POST_KEYS.list(this.requestFilters),
      queryFn: ({ queryKey }) => fetchDeveloperPosts(queryKey[1]),
      placeholderData: keepPreviousData,
    })

    const stops = [
      // Persist фільтрів.
      reaction(
        () => toJS(this.storedFilters),
        (filters) => {
          try {
            localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
          } catch {
            // не критично
          }
        },
      ),
      // Будь-яка зміна фільтрів — на першу сторінку.
      reaction(() => JSON.stringify(this.storedFilters), () => { this.page = 1 }),
    ]
    scope.signal.addEventListener('abort', () => stops.forEach((stop) => stop()), { once: true })
  }

  get storedFilters() {
    return {
      q: this.q,
      scope: this.scopeFilter,
      unreadOnly: this.unreadOnly,
      selectedAuthors: this.selectedAuthors,
      selectedTags: this.selectedTags,
      selectedStatuses: this.selectedStatuses,
    }
  }

  get requestFilters() {
    return {
      page: this.page,
      limit: PAGE_SIZE,
      q: this.q || undefined,
      isRead: this.unreadOnly ? false : undefined,
      scope: this.scopeFilter === 'all' ? undefined : this.scopeFilter,
      authorIds: this.selectedAuthors.map((author) => author.id),
      tags: this.selectedTags.map((tag) => tag.id),
      statuses: this.selectedStatuses.map((status) => status.id),
    }
  }

  get authors() {
    return this.optionsQuery.data?.authors || []
  }

  get tagOptions() {
    return (this.optionsQuery.data?.tags || []).map((tag) => ({ id: tag.value, label: tag.label }))
  }

  get statusOptions() {
    return (this.optionsQuery.data?.statuses || []).map((status) => ({ id: status.value, label: status.label }))
  }

  get posts() {
    return this.listQuery.data?.data || []
  }

  get meta() {
    return this.listQuery.data?.meta || { total: 0, page: 1, pages: 1 }
  }

  get isLoading() {
    return this.listQuery.isLoading
  }

  get hasActiveFilters() {
    return Boolean(
      this.q || this.scopeFilter !== 'all' || this.unreadOnly ||
      this.selectedAuthors.length || this.selectedTags.length || this.selectedStatuses.length,
    )
  }

  setQ(value) { this.q = value || '' }
  toggleMine() { this.scopeFilter = this.scopeFilter === 'mine' ? 'all' : 'mine' }
  toggleUnreadOnly() { this.unreadOnly = !this.unreadOnly }
  setAuthors(value) { this.selectedAuthors = value || [] }
  setTags(value) { this.selectedTags = value || [] }
  setStatuses(value) { this.selectedStatuses = value || [] }
  prevPage() { this.page = Math.max(1, this.page - 1) }
  nextPage() { this.page = Math.min(this.meta.pages, this.page + 1) }

  resetFilters() {
    this.q = ''
    this.scopeFilter = 'all'
    this.unreadOnly = false
    this.selectedAuthors = []
    this.selectedTags = []
    this.selectedStatuses = []
  }
}

/** /developer-posts — блог розробників / реєстр версій (master-detail, ?view={id}). */
export class DeveloperPostBoardViewModel {
  activeId = null
  createOpen = false
  editOpen = false
  confirmDelete = false

  constructor({ scope, stores, initialViewId }) {
    this.scope = scope
    this.stores = stores
    this.activeId = initialViewId ? Number(initialViewId) : null
    makeViewModel(this)

    this.list = new DeveloperPostListViewModel({ scope })
    this.detailQuery = scope.query({
      queryKey: () => DEVELOPER_POST_KEYS.detail(this.activeId),
      queryFn: ({ queryKey }) => fetchDeveloperPost(queryKey[1]),
      enabled: ({ queryKey }) => Boolean(queryKey[1]),
    })
    this.deleteMutation = scope.mutation({ mutationFn: deleteDeveloperPost, invalidateQueries: { queryKey: DEVELOPER_POST_KEYS.all } })
    this.publishMutation = scope.mutation({ mutationFn: publishDeveloperPost })
  }

  get canRead() {
    return Boolean(this.stores.session.scopeFor('developer-posts', 'read'))
  }

  get canCreate() {
    return Boolean(this.stores.session.scopeFor('developer-posts', 'create'))
  }

  /** developer-posts.update: true — будь-які пости, 'individual' — лише власні. */
  get canManage() {
    const scope = this.stores.session.scopeFor('developer-posts', 'update')
    if (scope === true) return true
    if (scope === 'individual') return Number(this.detail?.author_id) === Number(this.stores.session.userId)
    return false
  }

  get detail() {
    return this.detailQuery.data ?? null
  }

  get isDetailLoading() {
    return Boolean(this.activeId) && (this.detailQuery.isLoading || !this.detail)
  }

  select(id) { this.activeId = id ? Number(id) : null }
  openCreate() { this.createOpen = true }
  closeCreate() { this.createOpen = false }
  openEdit() { this.editOpen = true }
  closeEdit() { this.editOpen = false }
  askDelete() { this.confirmDelete = true }
  cancelDelete() { this.confirmDelete = false }

  async deleteActive() {
    try {
      await this.deleteMutation.mutate(this.activeId)
      toast.success('Пост видалено')
      this.confirmDelete = false
      this.activeId = null
      return true
    } catch (error) {
      toast.error(developerPostErrorMessage(error, 'Не вдалося видалити пост'))
      return false
    }
  }

  async publishActive() {
    try {
      await this.publishMutation.mutate(this.activeId)
      toast.success('Пост опубліковано')
      await Promise.all([
        this.scope.invalidate(DEVELOPER_POST_KEYS.detail(this.activeId)),
        this.scope.invalidate(DEVELOPER_POST_KEYS.all),
      ])
    } catch (error) {
      toast.error(developerPostErrorMessage(error, 'Не вдалося опублікувати пост'))
    }
  }
}
