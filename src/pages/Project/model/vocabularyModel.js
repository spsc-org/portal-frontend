/**
 * Поповнення словників проєкту з форми (порт legacy IdentifierModalManager, AttributeModalManager,
 * CategoryModalManager): POST /api/project/addVocabulary{Identifier|Attribute|Category}.
 * Поля — ті самі імена, що legacy-форми (modalIdentifier-*, …); відповідь
 * { success, data, messages: { validationErrors: {name: msg}, generalErrors: [] } }.
 */
import axios from 'axios'
import { rootStore } from '../../../stores/RootStore.js'

export const VOCABULARY_KINDS = {
  identifier: {
    title: 'Додати ідентифікатор',
    url: '/api/project/addVocabularyIdentifier',
    empty: { 'modalIdentifier-group': '', 'modalIdentifier-caption': '', 'modalIdentifier-description': '', 'modalIdentifier-type': '', 'modalIdentifier-country': '' },
  },
  attribute: {
    title: 'Додати атрибут',
    url: '/api/project/addVocabularyAttribute',
    empty: { 'modalAttribute-caption': '', 'modalAttribute-description': '', 'modalAttribute-type': '0' },
  },
  category: {
    title: 'Додати категорію',
    url: '/api/project/addVocabularyCategory',
    empty: { 'modalCategory-caption': '' },
  },
}

export const IDENTIFIER_GROUPS = [
  { id: 'doc', caption: 'Документ, що посвідчує особу' },
  { id: 'reg', caption: 'Реєстраційний номер' },
]
export const IDENTIFIER_SUBJECT_TYPES = [
  { id: '1', caption: 'Особа' },
  { id: '2', caption: 'Організація' },
]
export const ATTRIBUTE_SUBJECT_TYPES = [
  { id: '0', caption: "Будь-який суб'єкт" },
  { id: '1', caption: 'Тільки до особи' },
  { id: '2', caption: 'Тільки до організацій' },
]

/** { ok, data } або { ok: false, errors: {field: msg}, general: [] } — помилки валідації не кидаються. */
export async function addVocabularyItem(kind, values) {
  const userId = rootStore.session.userId
  const response = await axios.post(VOCABULARY_KINDS[kind].url, { ...values, createdUserId: userId }, { headers: { userId }, validateStatus: () => true })
  const body = response.data ?? {}
  if (body.success) return { ok: true, data: body.data }
  return {
    ok: false,
    errors: body.messages?.validationErrors ?? {},
    general: body.messages?.generalErrors?.length ? body.messages.generalErrors : body.message ? [body.message] : response.status >= 400 ? [`Помилка сервера (${response.status})`] : [],
  }
}
