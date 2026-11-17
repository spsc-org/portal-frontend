import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { STATISTIC_KEYS, UNREALIZED_TYPES, fetchUnrealized } from '../model/statisticApi.js'

/** /statistic: форма вибору року й критерію. */
export class StatisticFormViewModel {
  year = new Date().getFullYear()
  type = UNREALIZED_TYPES[0]

  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
  }

  get typeOptions() {
    return UNREALIZED_TYPES
  }

  get canSubmit() {
    return Boolean(this.year && this.type)
  }

  /** Шлях сторінки результатів (навігацію виконує View). */
  get resultPath() {
    return `/statistic/unrealized/${this.year}/${this.type.value}`
  }

  setYear(value) {
    this.year = value
  }

  setType(option) {
    this.type = option
  }
}

/** /statistic/unrealized/:year/:type — параметри з маршруту (раніше Inertia props). */
export class UnrealizedViewModel {
  constructor({ scope, year, type }) {
    this.scope = scope
    this.year = Number(year)
    this.type = Number(type)
    makeViewModel(this, { year: false, type: false })

    this.listQuery = scope.query({
      queryKey: STATISTIC_KEYS.unrealized(this.year, this.type),
      queryFn: () => fetchUnrealized(this.year, this.type),
    })
  }

  get rows() {
    return this.listQuery.data ?? []
  }

  get isFetching() {
    return this.listQuery.isFetching
  }

  get typeCaption() {
    return this.type === 1 ? 'без звʼязків' : 'з нереалізованими звʼязками'
  }
}
