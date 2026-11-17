import { keepPreviousData } from '@tanstack/react-query'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { TableState } from '../../../shared/mvvm/TableState.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import { SUBJECT_KEYS, fetchSubject, fetchSubjects } from '../model/subjectApi.js'

const INITIAL_FILTERS = { limit: 50, page: 0, subjectType: undefined, caption: undefined }

/** /subject: реєстр суб'єктів + модалка пов'язаних проєктів. */
export class SubjectViewModel {
  detailsId = null

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.table = new TableState({
      storageKey: '/subject',
      initialFilters: INITIAL_FILTERS,
      signal: scope.signal,
      dirField: 'direction',
    })

    this.optionsQuery = scope.query(pageOptionsQuery('subject'))

    this.listQuery = scope.query({
      queryKey: () => SUBJECT_KEYS.list(this.table.snapshot),
      queryFn: ({ queryKey }) => fetchSubjects(queryKey[1], this.stores.session.userId),
      placeholderData: keepPreviousData,
      retry: false,
    })

    this.detailsQuery = scope.query({
      queryKey: () => SUBJECT_KEYS.detail(this.detailsId),
      queryFn: ({ queryKey }) => fetchSubject(queryKey[1], this.stores.session.userId),
      enabled: ({ queryKey }) => queryKey[1] != null,
    })
  }

  get subjectTypes() {
    return this.optionsQuery.data?.subjectTypes ?? []
  }

  subjectTypeCaption(typeId) {
    return this.subjectTypes.find((type) => type.id === typeId)?.caption ?? ''
  }

  get rows() {
    return this.listQuery.data?.data ?? []
  }

  get isLoading() {
    return this.listQuery.isLoading
  }

  get pagination() {
    return {
      currentPage: this.table.page,
      pageSize: this.listQuery.data?.limit,
      totalCount: this.listQuery.data?.total,
      onPageChange: this.table.setPageFromPaginator,
      onLimitChange: this.table.setLimit,
    }
  }

  setSubjectType(option) {
    this.table.setFilter('subjectType', option)
  }

  openDetails(id) {
    this.detailsId = id
  }

  closeDetails() {
    this.detailsId = null
  }

  get linkedProjects() {
    return this.detailsQuery.data?.linkedProjects
  }
}
