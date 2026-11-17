import toast from 'react-hot-toast'
import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { PROJECT_KEYS } from '../model/projectModel.js'
import { CARD_KEYS } from '../model/projectCardModel.js'
import { fetchProjectName, fetchTicket, saveTicket, ticketAttachmentUrl, uploadTicketAttachment } from '../model/ticketModel.js'

/**
 * Модалка "Новий тікет" / "Редагувати тікет" (порт legacy ticketManager + modal-ticket.blade.php).
 * Редагувати можна лише власний тікет у стані "новий" (stateId < 0), як legacy.
 */
export class TicketFormViewModel {
  isOpen = false
  projectId = null
  ticketId = null
  projectName = ''
  text = ''
  // { name, href } — поточний файл (збережений або щойно завантажений тимчасово)
  file = null
  pendingAttachment = null // { token, name }
  removeAttachment = false
  uploading = false
  saving = false
  errors = {}
  message = ''

  constructor({ scope, page }) {
    this.scope = scope
    this.page = page
    makeViewModel(this, { page: false })
  }

  get isEdit() {
    return this.ticketId != null
  }

  reset() {
    this.text = ''
    this.file = null
    this.pendingAttachment = null
    this.removeAttachment = false
    this.uploading = false
    this.saving = false
    this.errors = {}
    this.message = ''
    this.projectName = ''
  }

  openAdd(projectId) {
    this.reset()
    this.projectId = projectId
    this.ticketId = null
    this.isOpen = true
    this.loadProjectName()
  }

  async openEdit(projectId, ticketId) {
    let ticket
    try {
      ticket = await fetchTicket(ticketId)
    } catch (error) {
      toast.error(error.message)
      return
    }
    if (ticket.stateId >= 0) {
      toast.error('Неможливо редагувати тікет із поточним статусом.')
      return
    }
    if (Number(ticket.createdUserId) !== Number(this.page.userId)) {
      toast.error('Ви не можете редагувати тікет, створений іншим користувачем.')
      return
    }
    this.reset()
    this.projectId = projectId
    this.ticketId = ticketId
    this.text = ticket.text ?? ''
    if (ticket.attachmentPath && ticket.attachmentName) this.file = { name: ticket.attachmentName, href: ticketAttachmentUrl(ticket.id) }
    this.isOpen = true
    this.loadProjectName()
  }

  async loadProjectName() {
    const projectId = this.projectId
    const name = await fetchProjectName(projectId).catch(() => '')
    if (this.projectId === projectId) this.setProjectName(name)
  }
  setProjectName(name) {
    this.projectName = name
  }

  close() {
    this.isOpen = false
  }

  setText(text) {
    this.text = text
    if (this.errors.text) this.errors = { ...this.errors, text: undefined }
  }

  async pickFile(file) {
    if (!file) return
    this.uploading = true
    this.message = ''
    try {
      const attachment = await uploadTicketAttachment(file)
      this.setAttachment(attachment)
    } catch {
      this.setAttachment(null)
      this.setMessage('Помилка завантаження файлу')
    } finally {
      this.setUploading(false)
    }
  }
  setAttachment(attachment) {
    this.pendingAttachment = attachment
    this.file = attachment ? { name: attachment.name, href: null } : null
  }
  setUploading(value) {
    this.uploading = value
  }
  setMessage(message) {
    this.message = message
  }

  dropFile() {
    this.file = null
    this.pendingAttachment = null
    this.removeAttachment = true
  }

  async submit(event) {
    event?.preventDefault?.()
    if (this.saving || this.uploading) return
    this.saving = true
    this.errors = {}
    this.message = ''
    let result
    try {
      result = await saveTicket({
        ticketId: this.ticketId,
        projectId: this.projectId,
        text: this.text,
        attachment: this.pendingAttachment,
        removeAttachment: this.removeAttachment,
      })
    } catch (error) {
      result = { ok: false, errors: {}, message: `Помилка при відправці форми: ${error.message}` }
    }
    this.finishSubmit(result)
  }
  finishSubmit(result) {
    this.saving = false
    if (!result.ok) {
      this.errors = Object.fromEntries(Object.entries(result.errors).map(([key, messages]) => [key, Array.isArray(messages) ? messages[0] : messages]))
      this.message = result.message
      return
    }
    toast.success(this.isEdit ? 'Тікет збережено' : 'Тікет додано')
    this.scope.invalidate(PROJECT_KEYS.all)
    this.scope.invalidate(CARD_KEYS.all)
    this.isOpen = false
  }
}
