import { observable, reaction } from 'mobx'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  DEVELOPER_POST_KEYS,
  attachDeveloperPostFiles,
  createDeveloperPostDraft,
  deleteDeveloperPostAttachment,
  developerPostErrorMessage,
  discardDeveloperPostDraft,
  fetchDeveloperPost,
  finalizeDeveloperPostDraft,
  updateDeveloperPost,
} from '../model/developerPostApi.js'
import { optionsQueryConfig } from './DeveloperPostViewModels.js'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
const VERSION_RE = /^\d+\.\d+\.\d+$/
const STATUS_MESSAGES = { draft: 'Чернетку збережено', scheduled: 'Пост заплановано', published: 'Пост опубліковано' }

export const isImageAttachment = (fileName = '') =>
  IMAGE_EXTENSIONS.includes((fileName.split('.').pop() || '').toLowerCase())

const attachmentUrl = (attachment) => `${window.location.origin}/files?path=${attachment.fileUrl}`

function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

/**
 * Створення/редагування поста (post != null). Створення — одразу чернетка-шелл
 * (pending), щоб вкладення/зображення можна було вставляти в текст під час
 * першого заповнення; "Скасувати" — discard чернетки. Для вже опублікованого
 * поста стан фіксований (лише "Зберегти").
 */
export class DeveloperPostFormViewModel {
  title = ''
  body = ''
  version = ''
  tags = []
  scheduleMode = false
  publishAt = ''
  notify = false
  draftId = null

  constructor({ scope, board, post, onDone, onCreated }) {
    this.scope = scope
    this.board = board ?? null
    this.post = post ?? null
    this.onDone = onDone
    this.onCreated = onCreated
    this.draftRequested = false
    makeViewModel(this, { board: false, post: false, onDone: false, onCreated: false, draftRequested: false, tags: observable.ref })

    this.optionsQuery = scope.query(optionsQueryConfig)

    // Початкові значення — коли прийдуть options (теги/підказка версії).
    const stopFill = reaction(
      () => this.optionsQuery.data,
      (options) => options && this.fill(options),
      { fireImmediately: true },
    )
    scope.signal.addEventListener('abort', stopFill, { once: true })

    // Живий стан чернетки (вкладення) під час створення.
    this.draftQuery = scope.query({
      queryKey: () => DEVELOPER_POST_KEYS.detail(this.draftId),
      queryFn: ({ queryKey }) => fetchDeveloperPost(queryKey[1]),
      enabled: ({ queryKey }) => !this.post && Boolean(queryKey[1]),
    })

    const refreshDetail = () => ({ queryKey: DEVELOPER_POST_KEYS.detail(this.effectivePostId) })
    this.createDraftMutation = scope.mutation({ mutationFn: createDeveloperPostDraft })
    this.finalizeMutation = scope.mutation({ mutationFn: (data) => finalizeDeveloperPostDraft(this.draftId, data) })
    this.updateMutation = scope.mutation({ mutationFn: (data) => updateDeveloperPost(this.post.id, data) })
    this.discardMutation = scope.mutation({ mutationFn: discardDeveloperPostDraft })
    this.attachMutation = scope.mutation({
      mutationFn: (files) => attachDeveloperPostFiles(this.effectivePostId, files),
      onSuccess: () => this.scope.queryClient.invalidateQueries(refreshDetail()),
    })
    this.deleteAttachmentMutation = scope.mutation({
      mutationFn: (attachment) => deleteDeveloperPostAttachment(attachment.id),
      onSuccess: () => this.scope.queryClient.invalidateQueries(refreshDetail()),
    })
  }

  /** Чернетку створюємо один раз за життя VM (mount у StrictMode викликається двічі). */
  mount() {
    if (this.isEditing || this.draftRequested) return undefined
    this.draftRequested = true
    this.createDraftMutation
      .mutateAsync()
      .then((created) => this.setDraftId(created?.id))
      .catch((error) => toast.error(developerPostErrorMessage(error, 'Не вдалося підготувати пост')))
    return undefined
  }

  fill(options) {
    const post = this.post
    if (post) {
      this.title = post.title || ''
      this.body = post.body || ''
      this.version = post.version || ''
      this.tags = (options.tags || []).filter((option) => (post.tags || []).includes(option.value))
      this.scheduleMode = post.status === 'scheduled'
      this.publishAt = toDatetimeLocal(post.publish_at)
      this.notify = Boolean(post.notify)
    } else if (!this.version) {
      this.version = options.nextVersion || ''
    }
  }

  // ---- derived ------------------------------------------------------------

  get isEditing() {
    return Boolean(this.post)
  }

  get isPublished() {
    return this.post?.status === 'published'
  }

  get effectivePostId() {
    return this.post?.id ?? this.draftId
  }

  get tagOptions() {
    return this.optionsQuery.data?.tags || []
  }

  /** У редагуванні вкладення — з картки (detail інвалідується), у створенні — з чернетки. */
  get attachments() {
    if (this.isEditing) return this.board?.detail?.attachments ?? this.post.attachments ?? []
    return this.draftQuery.data?.attachments || []
  }

  get imageAttachments() {
    return this.attachments.filter((attachment) => isImageAttachment(attachment.fileName))
  }

  get isPreparingDraft() {
    return !this.isEditing && !this.draftId
  }

  get versionValid() {
    return this.version.trim() === '' || VERSION_RE.test(this.version.trim())
  }

  get isValid() {
    return this.title.trim().length > 0 && this.versionValid && (!this.scheduleMode || Boolean(this.publishAt)) &&
      (this.isEditing || Boolean(this.draftId))
  }

  get isPending() {
    return this.finalizeMutation.isPending || this.updateMutation.isPending
  }

  /** Найраніший час запланованої публікації — через хвилину від "зараз". */
  get minPublishAt() {
    return new Date(Date.now() + 60000).toISOString().slice(0, 16)
  }

  get canSubmit() {
    return this.isValid && !this.isPending
  }

  // ---- actions ------------------------------------------------------------

  setDraftId(id) { this.draftId = id ?? null }
  setTitle(value) { this.title = value }
  setBody(value) { this.body = value }
  setVersion(value) { this.version = value }
  setTags(value) { this.tags = value || [] }
  setScheduleMode(value) { this.scheduleMode = value }
  setPublishAt(value) { this.publishAt = value }
  setNotify(value) { this.notify = value }

  /** Вставити markdown зображення в позицію [start, end); повертає нову позицію курсора. */
  insertImage(attachment, start = this.body.length, end = this.body.length) {
    const markdown = `![${attachment.fileName || ''}](${attachmentUrl(attachment)})`
    this.body = `${this.body.slice(0, start)}${markdown}${this.body.slice(end)}`
    return start + markdown.length
  }

  uploadAttachments(list = []) {
    const files = list.filter((item) => item?.file).map((item) => item.file)
    if (!files.length) return
    this.attachMutation.mutate(files).catch((error) => toast.error(developerPostErrorMessage(error, 'Не вдалося додати файл')))
  }

  deleteAttachment(attachment) {
    if (!attachment) return
    this.deleteAttachmentMutation
      .mutate(attachment)
      .catch((error) => toast.error(developerPostErrorMessage(error, 'Не вдалося видалити файл')))
  }

  /** Скасування без збереження — прибираємо чернетку одразу. */
  cancel() {
    if (!this.isEditing && this.draftId) this.discardMutation.mutate(this.draftId).catch(() => {})
    this.onDone()
  }

  async submit(status) {
    if (!this.canSubmit) return
    const base = {
      title: this.title.trim(),
      body: this.body.trim(),
      version: this.version.trim() || null,
      tags: this.tags.map((option) => option.value),
    }

    try {
      let saved
      if (this.isEditing) {
        const published = this.isPublished
        saved = await this.updateMutation.mutateAsync({
          ...base,
          status: !published ? status : undefined,
          notify: !published ? this.notify : undefined,
          publishAt: !published && status === 'scheduled' ? new Date(this.publishAt).toISOString() : undefined,
        })
        await this.scope.invalidate(DEVELOPER_POST_KEYS.detail(this.post.id))
      } else {
        saved = await this.finalizeMutation.mutateAsync({
          ...base,
          status,
          notify: this.notify,
          publishAt: status === 'scheduled' ? new Date(this.publishAt).toISOString() : undefined,
        })
        toast.success(STATUS_MESSAGES[status] || 'Збережено')
        await this.scope.invalidate(DEVELOPER_POST_KEYS.options)
      }
      await this.scope.invalidate(DEVELOPER_POST_KEYS.all)
      this.onCreated?.(saved?.id)
      this.onDone()
    } catch (error) {
      toast.error(developerPostErrorMessage(error, this.isEditing ? 'Не вдалося зберегти зміни' : 'Не вдалося зберегти пост'))
    }
  }
}
