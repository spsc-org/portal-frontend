import { observable } from 'mobx'
import toast from 'react-hot-toast'
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { createCommands } from '../../../shared/mvvm/commands.js'
import { staffOptionsQuery } from '../../Staff/model/staffCommands.js'
import { DEFAULT_FILTERS, QUERY_KEYS, STORAGE_KEYS, VALIDATION_MESSAGES, VIEW_MODES } from '../constants/attendanceConfig.js'
import { fetchCalendar, VACATION_SCHEDULE_URL } from '../model/attendanceApi.js'
import { ATTENDANCE_COMMANDS, errorToast, validationToast } from '../model/attendanceCommands.jsx'

const RANGE_MONTHS = { '1m': 0, '2m': 1, '3m': 2, '6m': 5, '1y': 11 }
const EMPTY_OPTIONS = {
  absence_types: [],
  statuses: [],
  working_days: [1, 2, 3, 4, 5],
  users: [],
  report_types: { groups: [], types: [] },
}
const EMPTY_FORM = {
  id: '',
  user_id: '',
  type: 'remote',
  status: 'approved',
  start_date: '',
  end_date: '',
  reason: '',
  travel_days: 0,
}
const ymd = (date) => format(date, 'yyyy-MM-dd')

function readStorage(key, parse, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? parse(raw) : fallback
  } catch {
    return fallback
  }
}
const asIs = (value) => value

function readDate() {
  const parsed = readStorage(STORAGE_KEYS.CURRENT_DATE, parseISO, null)
  return parsed && isValid(parsed) ? parsed : new Date()
}

/**
 * /staff — облік відсутностей: налаштування перегляду (persist у localStorage),
 * календар за період, форма заявки, модалки (документи, стройовка, зведена).
 */
export class AttendanceViewModel {
  // Налаштування перегляду
  rangeType = readStorage(STORAGE_KEYS.RANGE_TYPE, asIs, '1m')
  filters = readStorage(STORAGE_KEYS.FILTERS, JSON.parse, DEFAULT_FILTERS)
  viewMode = readStorage(STORAGE_KEYS.VIEW_MODE, asIs, VIEW_MODES.CALENDAR)
  currentDate = readDate()

  // Модалки
  isCreateModalOpen = false
  isDeleteConfirmOpen = false
  isDocumentsDialogOpen = false
  isStatisticsDialogOpen = false
  isSummaryModalOpen = false
  editingAbsence = null
  absenceForDocuments = null

  // Форма заявки
  form = { ...EMPTY_FORM }
  isOpenEnded = false

  // Оптимістичний стан ЗП: employee_id → bool (поверх даних календаря)
  zpOverrides = new Map()

  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this, {
      filters: observable.ref,
      currentDate: observable.ref,
      editingAbsence: observable.ref,
      absenceForDocuments: observable.ref,
    })
    this.optionsQuery = scope.query(staffOptionsQuery)
    this.calendarQuery = scope.query({
      queryKey: () => [
        QUERY_KEYS.CALENDAR,
        ymd(this.dateInterval.start),
        ymd(this.dateInterval.end),
        this.filterParams,
        this.rangeType,
      ],
      queryFn: () => fetchCalendar({ ...this.dateInterval, ...this.filterParams }),
      // enabled-функцію викликає TanStack (не реактивна) — динамічно лише через options.
      options: () => ({ enabled: Boolean(this.optionsQuery.data) }),
      staleTime: 60000,
    })
    this.cmd = createCommands(scope, ATTENDANCE_COMMANDS)
  }

  /** Insert — нова заявка (як у Inertia-версії). */
  mount() {
    const onKeyDown = (e) => {
      if (e.key === 'Insert') {
        e.preventDefault()
        this.openWithForm(null, { ...EMPTY_FORM })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }

  // ---- дані ----
  get options() {
    return this.optionsQuery.data?.data || EMPTY_OPTIONS
  }
  get isCalendarLoading() {
    return this.calendarQuery.isLoading
  }
  get holidays() {
    return this.calendarQuery.data?.holidays || []
  }
  get calendarData() {
    return (this.calendarQuery.data?.data || []).map((row) => ({ ...row, zp: Boolean(row.zp) }))
  }

  get dateInterval() {
    const start = startOfMonth(this.currentDate)
    return { start, end: endOfMonth(addMonths(start, RANGE_MONTHS[this.rangeType] ?? 0)) }
  }
  get days() {
    return eachDayOfInterval(this.dateInterval)
  }

  /** Плоскі параметри фільтрів (для ключа запиту й URL). */
  get filterParams() {
    return {
      types: this.filters.types.map((t) => t.value),
      users: this.filters.users.map((u) => u.id || u.value),
      includeDeleted: Boolean(this.filters.include_deleted),
    }
  }

  get summaryInitialFilters() {
    return {
      startDate: ymd(this.dateInterval.start),
      endDate: ymd(this.dateInterval.end),
      users: this.filterParams.users,
      types: this.filters.types.map((t) => t.value || t),
      statuses: ['approved'],
    }
  }

  getTypeColor(value) {
    return this.options.absence_types.find((t) => t.value === value)?.color || '#ccc'
  }

  // ---- налаштування перегляду ----
  persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(this.filters))
      localStorage.setItem(STORAGE_KEYS.RANGE_TYPE, this.rangeType)
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, this.viewMode)
      localStorage.setItem(STORAGE_KEYS.CURRENT_DATE, ymd(this.currentDate))
    } catch {
      // приватний режим / заблоковане сховище — налаштування просто не збережуться
    }
  }
  setRangeType(value) {
    this.rangeType = value
    this.persist()
  }
  setViewMode(value) {
    this.viewMode = value
    this.persist()
  }
  setCurrentDate(value) {
    this.currentDate = value
    this.persist()
  }
  setFilters(value) {
    this.filters = typeof value === 'function' ? value(this.filters) : value
    this.persist()
  }

  // ---- форма заявки ----
  get isEditing() {
    return Boolean(this.editingAbsence)
  }

  get dayCount() {
    const { start_date, end_date } = this.form
    if (this.isOpenEnded || !start_date || !end_date) return null
    const start = parseISO(start_date)
    const end = parseISO(end_date)
    if (!isValid(start) || !isValid(end)) return null
    return differenceInCalendarDays(end, start) + 1
  }

  /** Сумісно з Inertia useForm: setData('field', value) або setData({...}). */
  setData(keyOrData, value) {
    if (typeof keyOrData === 'string') this.form = { ...this.form, [keyOrData]: value }
    else this.form = keyOrData
  }
  setIsOpenEnded(value) {
    this.isOpenEnded = value
    if (value) this.setData('end_date', '')
  }

  openWithForm(absence, form) {
    this.editingAbsence = absence
    // Нова заявка завжди стартує як "дистанційна, затверджена" — так поводилася
    // Inertia-модалка (її effect при відкритті перезаписував type/status).
    this.form = absence ? form : { ...form, type: 'remote', status: 'approved' }
    this.isOpenEnded = absence ? !absence.end_date : false
    this.isCreateModalOpen = true
  }
  openCreate() {
    const today = ymd(new Date())
    this.openWithForm(null, { ...EMPTY_FORM, start_date: today, end_date: today })
  }
  cellClick(employeeId, date) {
    const day = ymd(date)
    this.openWithForm(null, { ...EMPTY_FORM, user_id: String(employeeId), start_date: day, end_date: day })
  }
  edit(absence) {
    this.openWithForm(absence, {
      id: String(absence.id),
      user_id: String(absence.user_id),
      type: absence.type_slug,
      status: absence.status_slug || 'pending',
      start_date: absence.start_date,
      end_date: absence.end_date || '',
      reason: absence.reason || '',
      travel_days: absence.travel_days || 0,
    })
  }
  closeForm() {
    this.isCreateModalOpen = false
  }

  async submitForm() {
    const { form, isOpenEnded } = this
    if (!form.user_id) return validationToast(VALIDATION_MESSAGES.SELECT_EMPLOYEE)
    if (!form.type) return validationToast(VALIDATION_MESSAGES.SELECT_TYPE)
    if (!form.start_date) return validationToast(VALIDATION_MESSAGES.SPECIFY_START_DATE)
    if (!isOpenEnded && !form.end_date) return validationToast(VALIDATION_MESSAGES.SPECIFY_END_DATE)
    if (!isOpenEnded && new Date(form.start_date) > new Date(form.end_date)) {
      return validationToast(VALIDATION_MESSAGES.INVALID_DATE_RANGE)
    }
    const payload = {
      ...form,
      id: this.editingAbsence ? this.editingAbsence.id : '',
      user_id: parseInt(form.user_id, 10),
      end_date: isOpenEnded ? null : form.end_date,
      travel_days: parseInt(form.travel_days, 10) || 0,
    }
    try {
      await this.cmd.saveAbsence.run(payload)
      this.isCreateModalOpen = false
      this.form = { ...EMPTY_FORM }
    } catch (error) {
      errorToast('Помилка збереження заявки', error, 'Помилка при збереженні заявки')
    }
  }

  // ---- видалення ----
  requestDelete(absence) {
    this.editingAbsence = absence
    this.isDeleteConfirmOpen = true
  }
  openDeleteFromForm() {
    this.isDeleteConfirmOpen = true
  }
  closeDeleteConfirm() {
    this.isDeleteConfirmOpen = false
  }
  async confirmDelete() {
    if (!this.editingAbsence?.id) return
    try {
      await this.cmd.deleteAbsence.run(this.editingAbsence.id)
      this.isDeleteConfirmOpen = false
      this.isCreateModalOpen = false
      this.form = { ...EMPTY_FORM }
    } catch {
      // тост уже показано командою
    }
  }

  // ---- ЗП (оптимістично, з відкатом) ----
  zpValue(row) {
    return this.zpOverrides.has(row.employee_id) ? this.zpOverrides.get(row.employee_id) : row.zp || false
  }
  async toggleZp(row, value) {
    const previous = this.zpValue(row)
    this.zpOverrides.set(row.employee_id, value)
    try {
      await this.cmd.updateUserZp.run({ userId: row.employee_id, zpValue: value })
      toast.success(`${row.full_name} - ЗП ${value ? 'включено' : 'вимкнено'}`)
    } catch (error) {
      this.zpOverrides.set(row.employee_id, previous)
      toast.error(`${row.full_name}: ${error?.payload?.message || 'Помилка при оновленні ЗП'}`)
    }
  }

  // ---- модалки ----
  manageDocuments(absence) {
    this.absenceForDocuments = absence
    this.isDocumentsDialogOpen = true
  }
  closeDocuments() {
    this.isDocumentsDialogOpen = false
  }
  openStatistics() {
    this.isStatisticsDialogOpen = true
  }
  closeStatistics() {
    this.isStatisticsDialogOpen = false
  }
  openSummary() {
    this.isSummaryModalOpen = true
  }
  closeSummary() {
    this.isSummaryModalOpen = false
  }
  /** Blade-сторінка бекенду — у новій вкладці (через proxy). */
  openVacationSchedule() {
    window.open(VACATION_SCHEDULE_URL, '_blank')
  }
}
