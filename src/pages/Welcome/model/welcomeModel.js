import { differenceInCalendarDays, format, isSameYear, isToday, isYesterday, startOfDay } from 'date-fns'
import { uk } from 'date-fns/locale'

/** Дата з бекенду ('2026-11-25 10:42:00' | ISO | 'YYYY-MM-DD') → Date | null. */
export const parseDate = (value) => {
  if (!value) return null
  const date = new Date(typeof value === 'string' && value.length > 10 ? value.replace(' ', 'T') : value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "сьогодні, 10:42" / "вчора, 17:30" / "21 листопада" / "21 листопада 2025". */
export const formatUpdated = (value, now = new Date()) => {
  const date = parseDate(value)
  if (!date) return '—'
  if (isToday(date)) return `сьогодні, ${format(date, 'HH:mm')}`
  if (isYesterday(date)) return `вчора, ${format(date, 'HH:mm')}`
  return format(date, isSameYear(date, now) ? 'd MMMM' : 'd MMMM yyyy', { locale: uk })
}

/** Термін задачі: { label, late }. */
export const formatDue = (value, now = new Date()) => {
  const date = parseDate(value)
  if (!date) return null
  const diff = differenceInCalendarDays(date, now)
  const label =
    diff === 0
      ? 'сьогодні'
      : diff === 1
        ? 'завтра'
        : format(date, isSameYear(date, now) ? 'd MMMM' : 'd MMMM yyyy', { locale: uk })
  return { label, late: diff < 0 }
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

const pluralDays = (n) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дні'
  return 'днів'
}

/**
 * Найближчі дні народження (поточний + наступний місяць) без сьогоднішніх і тих, що вже минули:
 * [{ id, name, initials, label: '28 листопада · через 3 дні' }], від найближчого.
 */
export const buildUpcomingBirthdays = (birthdays = {}, now = new Date()) => {
  const today = startOfDay(now)
  const seen = new Set()
  return [...(birthdays.currentMonth ?? []), ...(birthdays.nextMonth ?? [])]
    .map((user) => {
      const dob = parseDate(user.dob)
      if (!dob || seen.has(user.id)) return null
      seen.add(user.id)
      let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
      if (next < today) next = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
      const days = differenceInCalendarDays(next, today)
      if (days <= 0) return null
      const when = days === 1 ? 'завтра' : `через ${days} ${pluralDays(days)}`
      return {
        id: user.id,
        name: user.name,
        initials: initials(user.name),
        days,
        label: `${format(next, 'd MMMM', { locale: uk })} · ${when}`,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.days - b.days)
}

const LABEL_STEP = { 30: 2, 60: 4, 90: 6 }

/**
 * Стовпчики "дії за день" (сума всіх типів дій) + розбивка за типами для підказки.
 * rawData: [{ name: 'dd.mm', <dataKey>: count }], actions: [{ dataKey, name, color }].
 */
export const buildActivityChart = (rawData = [], actions = [], days = 30) => {
  const step = LABEL_STEP[days] ?? Math.max(1, Math.round(days / 15))
  const rows = rawData.map((day) => {
    const breakdown = actions
      .map((action) => ({ name: action.name, color: action.color, value: Number(day[action.dataKey]) || 0 }))
      .filter((action) => action.value > 0)
      .sort((a, b) => b.value - a.value)
    return { label: day.name, total: breakdown.reduce((sum, action) => sum + action.value, 0), breakdown }
  })

  const max = Math.max(0, ...rows.map((row) => row.total))
  const niceMax = Math.max(4, Math.ceil(max / 4) * 4)
  const total = rows.reduce((sum, row) => sum + row.total, 0)
  const peak = rows.reduce((best, row) => (row.total > (best?.total ?? 0) ? row : best), null)

  const bars = rows.map((row, index) => ({
    ...row,
    key: `${row.label}-${index}`,
    heightPct: (row.total / niceMax) * 100,
    // підпис кожного step-го дня, рахуючи від останнього (сьогодні завжди підписано)
    showLabel: (rows.length - 1 - index) % step === 0,
  }))

  const ticks = [1, 0.75, 0.5, 0.25, 0].map((fraction) => ({
    value: Math.round(niceMax * fraction),
    topPct: (1 - fraction) * 100,
  }))

  return { bars, ticks, total, peak: peak ? `${peak.label} (${peak.total})` : '—' }
}
