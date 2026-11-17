// Ключі кешу й команди (мутації) довідників — заміна react-query хуків
// entities/*/queries.js з Inertia-версії (ті самі toast-и й інвалідації).
import {
  addPhoneComment,
  archivePhone,
  commitPhoneImport,
  confirmPhoneNumber,
  createPhone,
  deletePhone,
  deletePhoneComment,
  duplicatePhone,
  previewPhoneImport,
  restorePhone,
  togglePhoneFavorite,
  updatePhone,
  updatePhoneComment,
} from './phoneApi.js'
import {
  commitBirthdayImport,
  createBirthday,
  deleteBirthday,
  previewBirthdayImport,
  shareBirthday,
  updateBirthday,
} from './birthdayApi.js'

export const PHONE_KEYS = {
  all: ['phones'],
  list: (filters) => ['phones', filters],
  detail: (id) => ['phone', id],
  options: ['phone-options'],
  comments: (entryId) => ['phone-comments', entryId],
  audit: (entryId, page, limit) => ['phone-audit', entryId, page, limit],
}

export const BIRTHDAY_KEYS = {
  all: ['birthdays'],
  list: (filters) => ['birthdays', filters],
  detail: (id) => ['birthday', id],
  options: ['birthday-options'],
}

export const PHONE_COMMANDS = {
  create: { mutationFn: createPhone, invalidate: () => [PHONE_KEYS.all], success: 'Запис додано', error: 'Не вдалося додати запис' },
  update: {
    mutationFn: ({ id, data }) => updatePhone(id, data),
    invalidate: ({ id }) => [PHONE_KEYS.detail(id), PHONE_KEYS.all],
    error: 'Не вдалося зберегти зміни',
  },
  remove: { mutationFn: deletePhone, invalidate: () => [PHONE_KEYS.all], success: 'Запис видалено', error: 'Не вдалося видалити запис' },
  duplicate: { mutationFn: duplicatePhone, invalidate: () => [PHONE_KEYS.all], success: 'Картку продубльовано', error: 'Не вдалося продублювати картку' },
  archive: {
    mutationFn: archivePhone,
    invalidate: (_id, entry) => [PHONE_KEYS.detail(entry.id), PHONE_KEYS.all],
    success: 'Картку архівовано',
    error: 'Не вдалося архівувати картку',
  },
  restore: {
    mutationFn: restorePhone,
    invalidate: (_id, entry) => [PHONE_KEYS.detail(entry.id), PHONE_KEYS.all],
    success: 'Картку розархівовано',
    error: 'Не вдалося розархівувати картку',
  },
  toggleFavorite: {
    mutationFn: togglePhoneFavorite,
    invalidate: (id) => [PHONE_KEYS.detail(id), PHONE_KEYS.all],
    success: (result) => (result.is_favorite ? 'Додано в обране' : 'Знято з обраного'),
    error: 'Не вдалося оновити обране',
  },
  confirmNumber: {
    mutationFn: ({ numberId }) => confirmPhoneNumber(numberId),
    invalidate: ({ entryId }) => [entryId && PHONE_KEYS.detail(entryId), PHONE_KEYS.all],
    success: 'Актуальність підтверджено',
    error: 'Не вдалося підтвердити номер',
  },
  previewImport: { mutationFn: previewPhoneImport, error: 'Не вдалося розпізнати файл' },
  commitImport: {
    mutationFn: commitPhoneImport,
    invalidate: () => [PHONE_KEYS.all],
    success: (entries) => `Імпортовано записів: ${entries.length}`,
    error: 'Не вдалося імпортувати записи',
  },
  // comments_count у списку рахується на бекенді — інвалідуємо й список.
  addComment: {
    mutationFn: ({ entryId, body }) => addPhoneComment(entryId, body),
    invalidate: ({ entryId }) => [PHONE_KEYS.comments(entryId), PHONE_KEYS.all],
    error: 'Не вдалося надіслати коментар',
  },
  updateComment: {
    mutationFn: ({ commentId, body }) => updatePhoneComment(commentId, body),
    invalidate: ({ entryId }) => [PHONE_KEYS.comments(entryId)],
    error: 'Не вдалося зберегти коментар',
  },
  deleteComment: {
    mutationFn: ({ commentId }) => deletePhoneComment(commentId),
    invalidate: ({ entryId }) => [PHONE_KEYS.comments(entryId), PHONE_KEYS.all],
    error: 'Не вдалося видалити коментар',
  },
}

export const BIRTHDAY_COMMANDS = {
  create: { mutationFn: createBirthday, invalidate: () => [BIRTHDAY_KEYS.all], success: 'Запис додано', error: 'Не вдалося додати запис' },
  update: {
    mutationFn: ({ id, data }) => updateBirthday(id, data),
    invalidate: ({ id }) => [BIRTHDAY_KEYS.detail(id), BIRTHDAY_KEYS.all],
    error: 'Не вдалося зберегти зміни',
  },
  remove: { mutationFn: deleteBirthday, invalidate: () => [BIRTHDAY_KEYS.all], success: 'Запис видалено', error: 'Не вдалося видалити запис' },
  share: {
    mutationFn: ({ id, userIds }) => shareBirthday(id, userIds),
    invalidate: ({ id }) => [BIRTHDAY_KEYS.detail(id), BIRTHDAY_KEYS.all],
    success: 'Список розшарювання оновлено',
    error: 'Не вдалося оновити розшарювання',
  },
  previewImport: { mutationFn: previewBirthdayImport, error: 'Не вдалося розпізнати файл' },
  commitImport: {
    mutationFn: commitBirthdayImport,
    invalidate: () => [BIRTHDAY_KEYS.all],
    success: (entries) => `Імпортовано записів: ${entries.length}`,
    error: 'Не вдалося імпортувати записи',
  },
}
