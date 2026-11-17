import { apiFetch } from '../../../lib/api.js'
import { downloadFile } from '../../../lib/utils.js'

/** Імпорт проєктів з Excel (v2): шаблон → валідація → пошук дублікатів → імпорт. */

/** Шаблон Excel для типу суб'єкта (ім'я файлу — з Content-Disposition). */
export async function downloadLayout({ documentId, subjectTypeId }) {
  const response = await apiFetch('/api/v2/project/download/layout', {
    params: { documentId, subjectTypeId },
    responseType: 'blob',
    raw: true,
  })
  const filename = response.headers['content-disposition']?.split('filename=')[1]
  downloadFile(response.data, filename)
}

export function validateImportFile({ file, documentId, itemTypeId }, userId) {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch('/api/v2/project/import/validate', {
    method: 'POST',
    body: formData,
    params: { documentId: documentId || undefined, itemTypeId: itemTypeId ?? undefined },
    headers: { userId },
  })
}

export const findDuplicates = (body, userId) =>
  apiFetch('/api/document/find-duplicates', { method: 'POST', body, headers: { userId } })

export function importProjects({ forceImport, documentId, itemTypeId, ...payload }, userId) {
  return apiFetch('/api/v2/project/import', {
    method: 'POST',
    body: payload,
    params: {
      documentId: documentId || undefined,
      itemTypeId: itemTypeId ?? undefined,
      forceImport: forceImport ? true : undefined,
    },
    headers: { userId },
  })
}

/** Проєкти за id (той самий /api/project/data, що й legacy-список /project). */
export const fetchProjectsByIds = (ids, { limit, page }, userId) =>
  apiFetch('/api/project/data', {
    params: { fetchData: true, limit, page, filters: JSON.stringify({ fId: ids.join(',') }) },
    headers: { userId },
  })

export const fetchDuplicateProjects = (ids, { limit, page }, userId) =>
  apiFetch('/api/project/data', {
    params: { limit, page, filters: JSON.stringify({ fId: ids?.join(',') }) },
    headers: { userId },
  })
