import { observable, reaction, toJS } from 'mobx'
import { keepPreviousData } from '@tanstack/react-query'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  ANNOUNCEMENT_KEYS,
  fetchAnnouncementOptions,
  fetchAnnouncements,
} from '../../../entities/announcement/announcementApi.js'

// Ключ сумісний з Inertia-версією (`${location.pathname}-filters`).
const FILTERS_STORAGE_KEY = '/announcement-filters'
const PAGE_SIZE = 20

function restoreFilters() {
  try {
    return JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

/** Ліва колонка дошки: фільтри (persist у localStorage) + список з докачуванням. */
export class AnnouncementListViewModel {
  q = ''
  scopeFilter = 'all' // "чиї оголошення" (options.scopes)
  unreadOnly = false
  selectedAuthors = []

  constructor({ scope }) {
    this.scope = scope
    const stored = restoreFilters()
    this.q = stored.q || ''
    this.scopeFilter = stored.scope || 'all'
    this.unreadOnly = Boolean(stored.unreadOnly)
    this.selectedAuthors = stored.selectedAuthors || []
    makeViewModel(this, { selectedAuthors: observable.ref })

    this.optionsQuery = scope.query({
      queryKey: ANNOUNCEMENT_KEYS.options,
      queryFn: fetchAnnouncementOptions,
      staleTime: Infinity,
    })

    this.listQuery = scope.infiniteQuery({
      queryKey: () => ANNOUNCEMENT_KEYS.list(this.requestFilters),
      queryFn: ({ pageParam = 0, queryKey }) => fetchAnnouncements({ ...queryKey[1], page: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) =>
        lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined,
      placeholderData: keepPreviousData,
    })

    const stop = reaction(
      () => toJS({ q: this.q, scope: this.scopeFilter, unreadOnly: this.unreadOnly, selectedAuthors: this.selectedAuthors }),
      (filters) => {
        try {
          localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
        } catch {
          // не критично
        }
      },
    )
    scope.signal.addEventListener('abort', stop, { once: true })
  }

  /** Параметри запиту (порожні фільтри не відправляємо). */
  get requestFilters() {
    return {
      q: this.q || undefined,
      isRead: this.unreadOnly ? false : undefined,
      scope: this.scopeFilter === 'all' ? undefined : this.scopeFilter,
      authorIds: this.selectedAuthors.map((author) => author.id),
      limit: PAGE_SIZE,
    }
  }

  get authors() {
    return this.optionsQuery.data?.authors || []
  }

  get scopeOptions() {
    return (this.optionsQuery.data?.scopes || []).filter((option) => option.value !== 'all')
  }

  get announcements() {
    return (this.listQuery.data?.pages || []).flatMap((page) => page?.data || [])
  }

  get total() {
    return this.listQuery.data?.pages?.[0]?.meta?.total ?? 0
  }

  get isLoading() {
    return this.listQuery.isLoading
  }

  get hasActiveFilters() {
    return Boolean(this.q || this.scopeFilter !== 'all' || this.unreadOnly || this.selectedAuthors.length)
  }

  setQ(value) {
    this.q = value || ''
  }

  toggleScope(value) {
    this.scopeFilter = this.scopeFilter === value ? 'all' : value
  }

  toggleUnreadOnly() {
    this.unreadOnly = !this.unreadOnly
  }

  setAuthors(authors) {
    this.selectedAuthors = authors || []
  }

  resetFilters() {
    this.q = ''
    this.scopeFilter = 'all'
    this.unreadOnly = false
    this.selectedAuthors = []
  }

  loadMore() {
    return this.listQuery.fetchNextPage()
  }
}
