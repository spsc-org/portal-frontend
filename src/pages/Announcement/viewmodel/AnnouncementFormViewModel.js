import { observable } from 'mobx'
import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import {
  ANNOUNCEMENT_KEYS,
  announcementErrorMessage,
  attachAnnouncementFiles,
  createAnnouncement,
  deleteAnnouncementAttachment,
  fetchAnnouncementOptions,
  updateAnnouncement,
} from '../../../entities/announcement/announcementApi.js'

/**
 * Створення або редагування оголошення (announcement != null). Вкладення при
 * редагуванні завантажуються одразу (оголошення вже існує) і показуються з
 * актуальної картки (board.detail), при створенні — чергою до сабміту.
 */
export class AnnouncementFormViewModel {
  title = ''
  details = ''
  requiresAcknowledgement = false
  audienceType = 'all'
  recipients = []
  files = []

  constructor({ scope, board, announcement, onDone, onCreated }) {
    this.scope = scope
    this.board = board
    this.announcement = announcement ?? null
    this.onDone = onDone
    this.onCreated = onCreated

    if (announcement) {
      this.title = announcement.title || ''
      this.details = announcement.details || ''
      this.requiresAcknowledgement = Boolean(announcement.requires_acknowledgement)
      this.audienceType = announcement.audience_type || 'all'
      this.recipients = announcement.recipients || []
    }

    makeViewModel(this, {
      board: false,
      announcement: false,
      onDone: false,
      onCreated: false,
      recipients: observable.ref,
      files: observable.ref,
    })

    this.optionsQuery = scope.query({
      queryKey: ANNOUNCEMENT_KEYS.options,
      queryFn: fetchAnnouncementOptions,
      staleTime: Infinity,
    })

    const id = this.announcement?.id
    const refreshDetail = { queryKey: ANNOUNCEMENT_KEYS.detail(id) }
    this.createMutation = scope.mutation({ mutationFn: createAnnouncement, invalidateQueries: { queryKey: ANNOUNCEMENT_KEYS.all } })
    this.updateMutation = scope.mutation({ mutationFn: (data) => updateAnnouncement(id, data), invalidateQueries: refreshDetail })
    this.attachMutation = scope.mutation({ mutationFn: (files) => attachAnnouncementFiles(id, files), invalidateQueries: refreshDetail })
    this.deleteAttachmentMutation = scope.mutation({
      mutationFn: (attachment) => deleteAnnouncementAttachment(attachment.id),
      invalidateQueries: refreshDetail,
    })
  }

  // ---- derived ------------------------------------------------------------

  get isEditing() {
    return Boolean(this.announcement)
  }

  get users() {
    return this.optionsQuery.data?.users || []
  }

  get attachments() {
    return this.board?.detail?.attachments ?? this.announcement?.attachments ?? []
  }

  get isPending() {
    return this.createMutation.isPending || this.updateMutation.isPending
  }

  /** Адресоване конкретним людям — потрібні адресати. */
  get isValid() {
    return this.title.trim().length > 0 && (this.audienceType !== 'selected' || this.recipients.length > 0)
  }

  get canSubmit() {
    return this.isValid && !this.isPending
  }

  get payload() {
    return {
      title: this.title.trim(),
      details: this.details.trim(),
      requiresAcknowledgement: this.requiresAcknowledgement,
      audienceType: this.audienceType,
      recipientIds: this.recipients.map((user) => user.id),
    }
  }

  // ---- actions ------------------------------------------------------------

  setTitle(value) {
    this.title = value
  }

  setDetails(value) {
    this.details = value
  }

  setRequiresAcknowledgement(value) {
    this.requiresAcknowledgement = value
  }

  /** Адресоване конкретним людям оголошення — доручення, підтвердження обов'язкове. */
  setAudienceType(value) {
    this.audienceType = value
    if (value === 'selected') this.requiresAcknowledgement = true
  }

  setRecipients(users) {
    this.recipients = users || []
  }

  addFiles(event) {
    this.files = [...this.files, ...Array.from(event.target.files || [])]
    event.target.value = ''
  }

  removeFile(index) {
    this.files = this.files.filter((_, i) => i !== index)
  }

  uploadAttachments(list = []) {
    const newFiles = list.filter((item) => item?.file).map((item) => item.file)
    if (!newFiles.length) return
    this.attachMutation.mutate(newFiles).catch((error) => toast.error(announcementErrorMessage(error, 'Не вдалося додати файл')))
  }

  deleteAttachment(attachment) {
    if (!attachment) return
    this.deleteAttachmentMutation
      .mutate(attachment)
      .catch((error) => toast.error(announcementErrorMessage(error, 'Не вдалося видалити файл')))
  }

  async saveEdit() {
    if (!this.canSubmit) return
    try {
      await this.updateMutation.mutate(this.payload)
      await this.scope.invalidate(ANNOUNCEMENT_KEYS.all)
      this.onDone()
    } catch (error) {
      toast.error(announcementErrorMessage(error, 'Не вдалося зберегти зміни'))
    }
  }

  async create(isDraft) {
    if (!this.canSubmit) return
    try {
      const created = await this.createMutation.mutateAsync({ ...this.payload, files: this.files, isDraft })
      toast.success(isDraft ? 'Чернетку збережено' : 'Оголошення опубліковано')
      this.onCreated?.(created?.id)
      this.onDone()
    } catch (error) {
      toast.error(announcementErrorMessage(error, 'Не вдалося зберегти оголошення'))
    }
  }
}
