import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'

/**
 * /documentation і /documentation/:category — markdown-файли з диска бекенду
 * (props колишнього DocumentationController → /api/spa/pages/documentation…/options).
 */
export class DocumentationViewModel {
  constructor({ scope, category }) {
    this.scope = scope
    this.category = category ?? null
    makeViewModel(this, { category: false })

    const page = this.category ? `documentation/${encodeURIComponent(this.category)}` : 'documentation'
    this.query = scope.query({ ...pageOptionsQuery(page), retry: false })
  }

  get categories() {
    return this.query.data?.categories ?? []
  }

  get activeCategory() {
    return this.query.data?.activeCategory ?? this.category
  }

  get content() {
    return this.query.data?.content ?? null
  }

  get isLoading() {
    return this.query.isLoading
  }

  get notFound() {
    return this.query.error?.status === 404
  }
}
