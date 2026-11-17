import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  ANNOUNCEMENT_KEYS,
  acknowledgeAnnouncement,
  announcementErrorMessage,
  deleteAnnouncement,
  fetchAnnouncement,
  publishAnnouncement,
} from '../../../entities/announcement/announcementApi.js'
import { AnnouncementListViewModel } from './AnnouncementListViewModel.js'

/**
 * /announcement — дошка оголошень (master-detail): список зліва, картка справа,
 * deep-link ?view={id}. Відкриття картки фіксує прочитання на бекенді, окрім
 * requires_acknowledgement=true (там — кнопка «Я прочитав»).
 */
export class AnnouncementBoardViewModel {
  activeId = null
  createOpen = false
  editOpen = false
  confirmDelete = false

  constructor({ scope, stores, initialViewId }) {
    this.scope = scope
    this.stores = stores
    this.activeId = initialViewId ? Number(initialViewId) : null
    makeViewModel(this)

    this.list = new AnnouncementListViewModel({ scope })

    this.detailQuery = scope.query({
      queryKey: () => ANNOUNCEMENT_KEYS.detail(this.activeId),
      queryFn: ({ queryKey }) => fetchAnnouncement(queryKey[1]),
      enabled: ({ queryKey }) => Boolean(queryKey[1]),
    })

    const invalidateAll = { queryKey: ANNOUNCEMENT_KEYS.all }
    this.deleteMutation = scope.mutation({ mutationFn: deleteAnnouncement, invalidateQueries: invalidateAll })
    this.publishMutation = scope.mutation({ mutationFn: publishAnnouncement })
    this.acknowledgeMutation = scope.mutation({ mutationFn: acknowledgeAnnouncement })
  }

  // ---- права --------------------------------------------------------------

  get canRead() {
    return this.stores.session.can('announcement', 'read')
  }

  get canCreate() {
    return this.stores.session.can('announcement', 'create')
  }

  /** Автор із правом створення керує своїм оголошенням. */
  get canManage() {
    const announcement = this.detail
    return this.canCreate && Number(announcement?.author_id) === Number(this.stores.session.userId)
  }

  // ---- деталі -------------------------------------------------------------

  get detail() {
    return this.detailQuery.data ?? null
  }

  get isDetailLoading() {
    return Boolean(this.activeId) && (this.detailQuery.isLoading || !this.detail)
  }

  get showAcknowledgeButton() {
    return Boolean(this.detail?.requires_acknowledgement && !this.detail?.is_read)
  }

  // ---- actions ------------------------------------------------------------

  /** Вибір картки; синхронізацію ?view= робить View (react-router). */
  select(id) {
    this.activeId = id ? Number(id) : null
  }

  openCreate() {
    this.createOpen = true
  }

  closeCreate() {
    this.createOpen = false
  }

  openEdit() {
    this.editOpen = true
  }

  closeEdit() {
    this.editOpen = false
  }

  askDelete() {
    this.confirmDelete = true
  }

  cancelDelete() {
    this.confirmDelete = false
  }

  refreshActive() {
    return Promise.all([
      this.scope.invalidate(ANNOUNCEMENT_KEYS.detail(this.activeId)),
      this.scope.invalidate(ANNOUNCEMENT_KEYS.all),
    ])
  }

  /** @returns {Promise<boolean>} true — видалено (View скидає ?view=). */
  async deleteActive() {
    try {
      await this.deleteMutation.mutate(this.activeId)
      toast.success('Оголошення видалено')
      this.confirmDelete = false
      this.activeId = null
      return true
    } catch (error) {
      toast.error(announcementErrorMessage(error, 'Не вдалося видалити оголошення'))
      return false
    }
  }

  async publishActive() {
    try {
      await this.publishMutation.mutate(this.activeId)
      toast.success('Оголошення опубліковано')
      await this.refreshActive()
    } catch (error) {
      toast.error(announcementErrorMessage(error, 'Не вдалося опублікувати оголошення'))
    }
  }

  async acknowledgeActive() {
    try {
      await this.acknowledgeMutation.mutate(this.activeId)
      await this.refreshActive()
    } catch (error) {
      toast.error(announcementErrorMessage(error, 'Не вдалося позначити прочитаним'))
    }
  }
}
