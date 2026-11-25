import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { runtimeConfig } from '../../../lib/runtimeConfig.js'
import {
  WELCOME_KEYS,
  fetchDashboard,
  fetchMyOpenTasks,
  fetchProjectActivity,
  fetchUnreadAnnouncements,
} from '../model/welcomeApi.js'

const CHART_DAYS_KEY = 'welcome_chart_days'
export const CHART_DAY_OPTIONS = [30, 60, 90]

function readChartDays() {
  try {
    const saved = parseInt(localStorage.getItem(CHART_DAYS_KEY), 10)
    return CHART_DAY_OPTIONS.includes(saved) ? saved : 30
  } catch {
    return 30
  }
}

/**
 * Стовпчики "по днях": у кожному дні дії сортуються за кількістю і кладуться
 * в сегменти stack_<i>_* (щоб найбільший сегмент завжди був знизу).
 */
export function toStackedChart(rawData = [], actions = []) {
  let maxSegments = 0

  const data = rawData.map((day) => {
    const row = { ...day }
    const dayActions = actions
      .map((action) => ({ name: action.name, color: action.color, value: day[action.dataKey] || 0 }))
      .filter((action) => action.value > 0)
      .sort((a, b) => b.value - a.value)

    maxSegments = Math.max(maxSegments, dayActions.length)
    dayActions.forEach((action, index) => {
      row[`stack_${index}_val`] = action.value
      row[`stack_${index}_name`] = action.name
      row[`stack_${index}_color`] = action.color
    })
    return row
  })

  return { data, maxSegments }
}

/** Головна сторінка /welcome. */
export class WelcomeViewModel {
  chartDays = readChartDays()

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

    this.myTasksQuery = scope.query({
      queryKey: () => WELCOME_KEYS.myTasks(this.userId),
      queryFn: ({ queryKey }) => fetchMyOpenTasks(queryKey[1]),
      enabled: ({ queryKey }) => queryKey[1] != null,
      staleTime: 60 * 1000,
    })

    this.announcementsQuery = scope.query({
      queryKey: WELCOME_KEYS.announcements,
      queryFn: fetchUnreadAnnouncements,
      staleTime: 60 * 1000,
    })
  }

  // ---- derived ------------------------------------------------------------

  get user() {
    return this.stores.session.auth.user
  }

  get userId() {
    return this.stores.session.userId
  }

  get userName() {
    return this.user?.name || this.stores.session.me?.name || 'користувачу'
  }

  get showKPI() {
    return Boolean(this.user?.showKPI)
  }

  get isDebug() {
    return runtimeConfig.appDebug
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

  get chart() {
    const result = this.activityQuery.data
    return toStackedChart(result?.chartData ?? [], result?.actions ?? [])
  }

  get isChartLoading() {
    return this.activityQuery.isLoading
  }

  get myTasks() {
    return this.myTasksQuery.data ?? []
  }

  get announcements() {
    return this.announcementsQuery.data ?? []
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

  refresh() {
    return this.dashboardQuery.refetch()
  }
}
