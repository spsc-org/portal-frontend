import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { runtimeConfig } from '../../../lib/runtimeConfig.js'
import {
  WELCOME_KEYS,
  fetchDashboard,
  fetchLatestDraft,
  fetchMyOpenTasks,
  fetchProjectActivity,
  fetchProjectRefs,
  fetchRecentProjects,
  fetchUnreadAnnouncements,
} from '../model/welcomeApi.js'
import { buildActivityChart, buildUpcomingBirthdays } from '../model/welcomeModel.js'

const CHART_DAYS_KEY = 'welcome_chart_days'
export const CHART_DAY_OPTIONS = [30, 60, 90]

export const TASK_TABS = [
  { id: 'assigned', label: 'Я виконавець' },
  { id: 'created', label: 'Створені мною' },
]

function readChartDays() {
  try {
    const saved = parseInt(localStorage.getItem(CHART_DAYS_KEY), 10)
    return CHART_DAY_OPTIONS.includes(saved) ? saved : 30
  } catch {
    return 30
  }
}

const NO_ROWS = []

/** Головна сторінка /welcome. */
export class WelcomeViewModel {
  chartDays = readChartDays()
  taskTab = 'assigned'

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores
    makeViewModel(this)

    this.dashboardQuery = scope.query({
      queryKey: () => WELCOME_KEYS.dashboard(this.userId),
      queryFn: ({ queryKey }) => fetchDashboard(queryKey[1]),
      enabled: ({ queryKey }) => queryKey[1] != null,
      staleTime: 60 * 1000,
    })

    this.activityQuery = scope.query({
      queryKey: () => WELCOME_KEYS.activity(this.chartDays),
      queryFn: ({ queryKey }) => fetchProjectActivity(queryKey[1]),
      staleTime: 5 * 60 * 1000,
    })

    // Обидві вкладки вантажаться одразу — лічильники в перемикачі видно без кліку
    this.assignedTasksQuery = this.createTasksQuery('assigned')
    this.createdTasksQuery = this.createTasksQuery('created')

    this.announcementsQuery = scope.query({
      queryKey: WELCOME_KEYS.announcements,
      queryFn: fetchUnreadAnnouncements,
      staleTime: 60 * 1000,
    })

    // /api/project/* закрито pageAccess — без доступу до /project блок не показуємо й не запитуємо
    this.recentProjectsQuery = scope.query({
      queryKey: () => WELCOME_KEYS.recentProjects(this.userId),
      queryFn: ({ queryKey }) => fetchRecentProjects(queryKey[1]),
      options: () => ({ enabled: this.canSeeProjects && this.userId != null }),
      staleTime: 60 * 1000,
    })

    this.projectRefsQuery = scope.query({
      queryKey: WELCOME_KEYS.projectRefs,
      queryFn: () => fetchProjectRefs(this.userId),
      options: () => ({ enabled: this.canSeeProjects && this.userId != null }),
      staleTime: Infinity,
    })

    this.latestDraftQuery = scope.query({
      queryKey: () => WELCOME_KEYS.latestDraft(this.userId),
      queryFn: ({ queryKey }) => fetchLatestDraft(queryKey[1]),
      options: () => ({ enabled: this.canSeeProjects && this.userId != null }),
      staleTime: 0,
    })
  }

  createTasksQuery(mode) {
    return this.scope.query({
      queryKey: () => WELCOME_KEYS.myTasks(this.userId, mode),
      queryFn: ({ queryKey }) => fetchMyOpenTasks(queryKey[1], mode),
      enabled: ({ queryKey }) => queryKey[1] != null,
      staleTime: 60 * 1000,
    })
  }

  // ---- derived ------------------------------------------------------------

  get session() {
    return this.stores.session
  }

  get user() {
    return this.session.auth.user
  }

  get userId() {
    return this.session.userId
  }

  get userName() {
    return this.user?.name || this.session.me?.name || 'користувачу'
  }

  get showKPI() {
    return Boolean(this.user?.showKPI)
  }

  get isDebug() {
    return runtimeConfig.appDebug
  }

  get canSeeProjects() {
    return this.session.hasPageAccess('/project')
  }

  get canCreateProject() {
    return this.canSeeProjects && Boolean(this.session.can('project', 'create'))
  }

  get canSeeProposals() {
    return this.session.hasPageAccess('/proposal')
  }

  get canSeeTasks() {
    return this.session.hasPageAccess('/task')
  }

  get dashboard() {
    return this.dashboardQuery.data ?? null
  }

  /** Скелетони і при першому завантаженні, і при ручному оновленні. */
  get isDashboardLoading() {
    return this.dashboardQuery.isLoading || this.dashboardQuery.isRefetching
  }

  get summary() {
    return this.dashboard?.summary ?? {}
  }

  get period() {
    return this.dashboard?.period ?? null
  }

  get birthdays() {
    return this.dashboard?.birthdays ?? {}
  }

  get birthdaysToday() {
    return this.birthdays.today ?? NO_ROWS
  }

  get upcomingBirthdays() {
    return buildUpcomingBirthdays(this.birthdays, new Date())
  }

  get chart() {
    const result = this.activityQuery.data
    return buildActivityChart(result?.chartData ?? NO_ROWS, result?.actions ?? NO_ROWS, this.chartDays)
  }

  get isChartLoading() {
    return this.activityQuery.isLoading
  }

  get tasksQuery() {
    return this.taskTab === 'created' ? this.createdTasksQuery : this.assignedTasksQuery
  }

  get tasks() {
    return this.tasksQuery.data?.rows ?? NO_ROWS
  }

  get isTasksLoading() {
    return this.tasksQuery.isLoading
  }

  get taskTabs() {
    const totals = {
      assigned: this.assignedTasksQuery.data?.total,
      created: this.createdTasksQuery.data?.total,
    }
    return TASK_TABS.map((tab) => ({ ...tab, count: totals[tab.id] ?? null, active: tab.id === this.taskTab }))
  }

  get announcements() {
    return this.announcementsQuery.data ?? NO_ROWS
  }

  get recentProjects() {
    const refs = this.projectRefsQuery.data ?? {}
    const states = Array.isArray(refs.state) ? refs.state : NO_ROWS
    const users = Array.isArray(refs.user) ? refs.user : NO_ROWS
    return (this.recentProjectsQuery.data ?? NO_ROWS).map((row) => ({
      id: row.id,
      name: row.nameUk || row.nameEn || row.nameRu || `Проєкт #${row.id}`,
      state: states.find((state) => state.id === row.stateId)?.caption ?? '',
      updatedAt: row.updatedAt || row.createdAt || null,
      performer: users.find((user) => user.id === row.performerId)?.caption ?? '',
    }))
  }

  get isRecentProjectsLoading() {
    return this.recentProjectsQuery.isLoading
  }

  /** Посилання "Продовжити чернетку": форма редагування проєкту або створення (openAdd підхопить чернетку). */
  get draftHref() {
    const draft = this.latestDraftQuery.data
    if (!draft) return null
    return draft.projectId != null ? `/project?edit=${draft.projectId}` : '/project?create=1'
  }

  // ---- actions ------------------------------------------------------------

  setChartDays(days) {
    this.chartDays = days
    try {
      localStorage.setItem(CHART_DAYS_KEY, String(days))
    } catch {
      // не критично
    }
  }

  setTaskTab(tab) {
    this.taskTab = tab
  }

  refresh() {
    const queries = [
      this.dashboardQuery,
      this.activityQuery,
      this.assignedTasksQuery,
      this.createdTasksQuery,
      this.announcementsQuery,
    ]
    if (this.canSeeProjects) queries.push(this.recentProjectsQuery, this.latestDraftQuery)
    return Promise.all(queries.map((query) => query.refetch()))
  }
}
