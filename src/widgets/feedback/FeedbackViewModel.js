import { reaction } from 'mobx'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../shared/mvvm/makeViewModel.js'
import FEEDBACK_SCOPES from '../../components/Modal/feedbackFormConfig.js'
import { createIssue, uploadIssueAttachments } from './feedbackApi.js'

const DEFAULT_SCOPE_ID = FEEDBACK_SCOPES[0].id
// Чернетка (опис + вибрані рівні) переживає закриття вкладки; файли — ні.
const DRAFT_STORAGE_KEY = 'feedback-form-draft'

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

const findScope = (id) => FEEDBACK_SCOPES.find((scope) => scope.id === id)

/** Технічний контекст звернення: URL і заголовок відкритої (іншої) модалки. */
function gatherContext() {
  try {
    let activeModal = null
    document.querySelectorAll('[role="dialog"]').forEach((modal) => {
      if (!modal.innerText.includes("Зворотний зв'язок")) {
        const header = modal.querySelector('h1, h2, h3, h4, h5, [class*="header"], [class*="title"]')
        activeModal = header?.innerText?.trim() || 'Активне вікно'
      }
    })
    return { url: window.location.href, activeModal }
  } catch {
    return { url: window.location.href, activeModal: null }
  }
}

/**
 * Глобальна форма зворотного зв'язку (Alt+B або кнопка в сайдбарі).
 * Відкриття — через stores.ui (feedbackOpen), щоб будь-який компонент міг її викликати.
 */
export class FeedbackViewModel {
  description = ''
  scopeId = DEFAULT_SCOPE_ID
  typeId = null
  files = []
  context = { url: '', activeModal: null }

  constructor({ scope, stores }) {
    this.scope = scope
    this.stores = stores

    const draft = loadDraft()
    this.description = draft.description || ''
    const draftScope = findScope(draft.scopeId)
    this.scopeId = draftScope ? draft.scopeId : DEFAULT_SCOPE_ID
    this.typeId = draftScope?.types.some((t) => t.id === draft.typeId)
      ? draft.typeId
      : (draftScope?.types[0]?.id ?? FEEDBACK_SCOPES[0].types[0]?.id ?? null)

    makeViewModel(this)

    this.submitMutation = scope.mutation({
      mutationFn: async ({ payload, files }) => {
        const result = await createIssue(payload)
        const taskId = result?.data?.id
        if (taskId && files.length > 0) await uploadIssueAttachments(taskId, files)
        return result
      },
    })
  }

  mount() {
    // Чернетку зберігаємо при кожній зміні — переживе й аварійне закриття вкладки.
    const stopDraft = reaction(
      () => ({ description: this.description, scopeId: this.scopeId, typeId: this.typeId }),
      (draft) => {
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        } catch {
          // localStorage недоступний — не критично
        }
      },
    )

    // Контекст збираємо в момент відкриття (з будь-якого джерела).
    const stopContext = reaction(
      () => this.isOpen,
      (open) => {
        if (open) this.context = gatherContext()
      },
    )

    const onKeyDown = (e) => {
      // Alt + B (eng/ua)
      if (e.altKey && (e.code === 'KeyB' || e.key === 'b' || e.key === 'и')) {
        e.preventDefault()
        this.stores.ui.toggleFeedback()
      }
      if (e.key === 'Escape') this.close()
    }
    window.addEventListener('keydown', onKeyDown, true)

    return () => {
      stopDraft()
      stopContext()
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }

  // ---- derived ------------------------------------------------------------

  get isOpen() {
    return this.stores.ui.feedbackOpen
  }

  get scopes() {
    return FEEDBACK_SCOPES
  }

  get currentScope() {
    return findScope(this.scopeId) || FEEDBACK_SCOPES[0]
  }

  /** undefined, коли в обраного scope немає рівня 2. */
  get currentType() {
    return this.currentScope.types.find((t) => t.id === this.typeId)
  }

  get isSubmitting() {
    return this.submitMutation.isPending
  }

  // ---- actions ------------------------------------------------------------

  close() {
    this.stores.ui.closeFeedback()
  }

  setDescription(value) {
    this.description = value
  }

  /** Типи різні в різних scope — скидаємо на перший доступний. */
  setScope(scopeId) {
    this.scopeId = scopeId
    this.typeId = findScope(scopeId)?.types[0]?.id ?? null
  }

  setType(typeId) {
    this.typeId = typeId
  }

  /** Файли чекають локально (data_url-прев'ю) до сабміту — задачі ще не існує. */
  setFiles(list) {
    this.files = list
      .filter((item) => item?.file)
      .map((item, index) => ({
        id: item.id ?? `${item.file.name}-${index}`,
        file: item.file,
        data_url: item.data_url,
        fileName: item.file.name,
      }))
  }

  removeFile(attachment) {
    this.files = this.files.filter((item) => item.id !== attachment.id)
  }

  resetForm() {
    this.description = ''
    this.scopeId = DEFAULT_SCOPE_ID
    this.typeId = FEEDBACK_SCOPES[0].types[0]?.id ?? null
    this.files = []
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // ігноруємо
    }
  }

  async submit() {
    if (!this.description.trim()) {
      toast.error('Будь ласка, введіть опис')
      return
    }

    try {
      await this.submitMutation.mutate({
        payload: {
          description: this.description,
          tag: this.currentType?.label ?? null,
          project: this.currentScope.project,
          context: this.currentScope.showContext ? this.context : null,
        },
        files: this.files.map((item) => item.file),
      })
      toast.success('Ваше звернення успішно надіслано')
      this.close()
      this.resetForm()
    } catch (error) {
      toast.error(error?.payload?.message || 'Виникла помилка при відправці')
    }
  }
}
