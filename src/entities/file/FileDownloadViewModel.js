import { createElement } from 'react'
import toast from 'react-hot-toast'
import CustomToast from '../../components/CustomToast.jsx'
import { makeViewModel } from '../../shared/mvvm/makeViewModel.js'
import { blobErrorMessage, downloadStoredFile } from './fileApi.js'

/**
 * Завантаження збереженого файлу (галереї вкладень/документів).
 * `pendingId` — який саме тайл зараз показує спінер.
 */
export class FileDownloadViewModel {
  pendingId = null

  constructor({ scope }) {
    this.scope = scope
    makeViewModel(this)

    this.downloadMutation = scope.mutation({
      mutationFn: ({ path, fileName }) => downloadStoredFile(path, fileName),
    })
  }

  isPending(id) {
    return this.downloadMutation.isPending && this.pendingId === id
  }

  async download(attachment) {
    if (!attachment?.fileUrl) return

    this.pendingId = attachment.id
    try {
      await this.downloadMutation.mutate({ path: attachment.fileUrl, fileName: attachment.fileName })
    } catch (error) {
      const message = (await blobErrorMessage(error)) || 'Виникла помилка завантаження.'
      toast.custom((t) => createElement(CustomToast, { t, message }))
    }
  }
}
