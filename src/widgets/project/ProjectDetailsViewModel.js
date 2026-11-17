import { apiFetch } from '../../lib/api.js'
import { makeViewModel } from '../../shared/mvvm/makeViewModel.js'
import { projectFromDto } from './projectDto.js'

/** Картка проєкту (модалка "Перегляд"): DTO проєкту (/api/project/{id}/dto) + словники voc_project. */
export class ProjectDetailsViewModel {
  constructor({ scope, stores, id }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)
    const headers = () => ({ userId: stores.session.userId })
    this.query = scope.query({
      queryKey: ['project-dto', id],
      queryFn: () => apiFetch(`/api/project/${id}/dto`, { headers: headers() }),
    })
    this.vocabularyQuery = scope.query({
      // Спільний ключ зі списком /project; staleTime: Infinity — без рефетчу на монтуванні модалки
      queryKey: ['voc_project'],
      queryFn: () => apiFetch('/api/voc_project', { headers: headers() }),
      staleTime: Infinity,
    })
  }

  get project() {
    return projectFromDto(this.query.data?.data, this.vocabulary)
  }
  get isFetching() {
    return this.query.isFetching || this.vocabularyQuery.isPending
  }
  get vocabulary() {
    return this.vocabularyQuery.data
  }
}
