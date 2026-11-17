import { makeViewModel } from '../../../shared/mvvm/makeViewModel.js'
import { DOSSIER_COMMANDS, runDossierCommand } from '../model/developApi.js'

const toChunk = (value, fallback) => {
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

/**
 * /develop/dossier — 6 artisan-команд дедуплікації досьє з консольним логом
 * (HTML від сервера: ansiToHtml() на бекенді, той самий підхід, що й у Blade-оригіналі).
 */
export class DossierToolsViewModel {
  log = []
  runningCmd = null
  showLegacy = false
  form = {
    importType: '',
    importChunk: '500',
    importFresh: false,
    importFreshConfirm: false,
    linkChunk: '1000',
    linkUseDrsId: true,
    linkUseIdentifiers: false,
    linkUseSubjectId: true,
    orphansChunk: '500',
    statusChunk: '500',
    updateType: '',
    updateChunk: '500',
    processChunk: '500',
  }

  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)
  }

  setField(name, value) {
    this.form[name] = value
    // Зняли "fresh" — скидаємо й підтвердження деструктивної дії.
    if (name === 'importFresh' && !value) this.form.importFreshConfirm = false
  }

  /** Fresh-імпорт деструктивний — без явного підтвердження кнопка неактивна. */
  get importBlocked() {
    return this.form.importFresh && !this.form.importFreshConfirm
  }

  isRunning(cmd) {
    return this.runningCmd === cmd
  }

  toggleLegacy() {
    this.showLegacy = !this.showLegacy
  }

  clearLog() {
    this.log = []
  }

  appendLog(html, type = 'info') {
    this.log.push({ id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), html, type })
  }

  /** Тіло запиту кожної команди з полів форми. */
  bodyFor(cmd) {
    const f = this.form
    switch (cmd) {
      case 'import-truth-source':
        return { type: f.importType || null, chunk: toChunk(f.importChunk, 500), fresh: f.importFresh }
      case 'link-projects':
        return {
          chunk: toChunk(f.linkChunk, 1000),
          drs_id: f.linkUseDrsId,
          identifiers: f.linkUseIdentifiers,
          subject_id: f.linkUseSubjectId,
        }
      case 'create-orphan-profiles':
        return { chunk: toChunk(f.orphansChunk, 500) }
      case 'refresh-status':
        return { chunk: toChunk(f.statusChunk, 500) }
      case 'update-truth-source':
        return { type: f.updateType || null, chunk: toChunk(f.updateChunk, 500) }
      case 'process-drafts':
        return { chunk: toChunk(f.processChunk, 500) }
      default:
        return {}
    }
  }

  async run(cmd) {
    this.appendLog(`<span class="text-yellow-400">⏳ Запуск: ${DOSSIER_COMMANDS[cmd].label}...</span>`, 'warning')
    this.runningCmd = cmd
    try {
      const data = await runDossierCommand(cmd, this.bodyFor(cmd))
      if (data?.status === 'success') {
        this.appendLog(data.output || 'Виконано.', 'success')
      } else {
        this.appendLog(`<span class="text-red-400">Помилка:</span><br>${data?.output || 'Невідома помилка'}`, 'error')
      }
    } catch (error) {
      const message = error?.payload?.output || error?.message || 'Невідома помилка'
      this.appendLog(`<span class="text-red-400">Помилка запиту: ${message}</span>`, 'error')
    } finally {
      this.runningCmd = null
    }
  }
}
