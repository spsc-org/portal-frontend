import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { pageOptionsQuery } from '../../../entities/spa/pageOptionsApi.js'
import { NOTIFICATION_KEYS } from '../../../entities/notification/notificationApi.js'
import { fetchBellUnreadCount, fetchNotificationSections, generateTestNotification } from '../model/developApi.js'

export const TEST_NOTIFICATION_TYPES = [
  { type: 'system.message', title: 'Системне повідомлення', hint: 'Без entity_id — лишається в дзвінику' },
  { type: 'task', entityId: '397', title: 'Задача #397', hint: 'Бейдж розділу "task" · веде на /task?view=397' },
  { type: 'dossier', entityId: '48043', title: 'Досьє #48043', hint: 'Бейдж розділу "dossier" · веде на /dossier?view=48043' },
  { type: 'project_ticket', entityId: '1', title: 'Тікет проєкту #1', hint: 'Бейдж розділу "project" · веде на /project?view=1' },
  { type: 'inventory', entityId: '1', title: 'Інвентарна одиниця #1', hint: 'Бейдж розділу "inventory" · веде на /inventory?view=1' },
  { type: 'announcement', entityId: '1', title: 'Оголошення #1', hint: 'Бейдж розділу "announcement" · веде на /announcement?view=1' },
]

/**
 * /develop/notifications — генерація тестової нотифікації обраному юзеру
 * (actor = поточний) і блок "Поточний стан" (свої бейджі/дзвіник).
 */
export class NotificationToolsViewModel {
  targetUserId = ''
  sendingType = null

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    this.targetUserId = String(stores.session.userId ?? '')
    makeViewModel(this)

    this.optionsQuery = scope.query(pageOptionsQuery('develop-notifications'))
    this.stateQuery = scope.query({
      queryKey: ['develop-notifications', 'state'],
      queryFn: async () => {
        const [sections, bellUnreadCount] = await Promise.all([fetchNotificationSections(), fetchBellUnreadCount()])
        return { sections, bell_unread_count: bellUnreadCount }
      },
    })
    this.sendMutation = scope.mutation({ mutationFn: generateTestNotification })
  }

  get users() {
    return this.optionsQuery.data?.users ?? []
  }

  get currentUserId() {
    return this.stores.session.userId
  }

  get state() {
    return this.stateQuery.data ?? null
  }

  get types() {
    return TEST_NOTIFICATION_TYPES
  }

  setTargetUser(id) {
    this.targetUserId = id
  }

  refreshState() {
    return this.stateQuery.refetch()
  }

  async send({ type, entityId }) {
    this.sendingType = type
    try {
      const body = { type }
      if (entityId) body.entity_id = entityId
      if (this.targetUserId) body.user_id = this.targetUserId
      await this.sendMutation.mutate(body)
      await this.refreshState()
      // Свої бейджі/дзвіник у сайдбарі — теж перечитати (на випадок, якщо realtime вимкнено).
      this.scope.invalidate(NOTIFICATION_KEYS.all)
    } catch {
      window.alert('Помилка створення нотифікації')
    } finally {
      this.sendingType = null
    }
  }
}
