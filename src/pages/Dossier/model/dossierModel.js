/**
 * Model модуля Досьє: конфіги запитів і команд (замість react-query хуків
 * entities/*\/queries.js і features/*\/use*Mutations.js Inertia-версії).
 * HTTP-функції — entities/*\/api.js (axios із глобальними дефолтами src/lib/http.js).
 */
import { fetchDossierOptions, fetchProfile, fetchProfiles, deleteProfile, deleteProfileAvatar, findDuplicates, refreshProfileStatus, updateProfileCaption, updateProfileNote, uploadProfileAvatar } from '../entities/dossier/api.js'
import {
  confirmConnection,
  linkConnection,
  linkProfileRelation,
  moveConnection,
  unconfirmConnection,
  unlinkConnection,
  unlinkProfileRelation,
  updateConnectionNote,
  voidConnection,
} from '../entities/dossierConnection/api.js'
import { addTicketLink, createTicket, fetchTicketOptions, fetchTickets, removeTicketLink, resolveTicket } from '../entities/dossierTicket/api.js'
import { bulkCreateProfilesFromOrphans, createProfileFromOrphan, fetchOrphanProjects } from '../entities/orphanProject/api.js'
import { dossierTicketKeys, orphanProjectKeys, sanctionProfileKeys } from '../shared/lib/queryKeys.js'

const PROFILES = ['sanction-profiles']
const MODEL_CLASS_PROJECT = 1
const nextPage = (lastPage) => (lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined)

/** Перше повідомлення поля з 422 (avatar, note…). */
export const fieldErrorMessage = (error, field) => {
  const fieldError = error?.response?.data?.errors?.[field]
  return Array.isArray(fieldError) ? fieldError[0] : fieldError
}
const backendMessage = (fallback) => (error) => error?.response?.data?.message ?? fallback

export const DOSSIER_QUERIES = {
  // Словники сторінки (GET /api/dossier/options) — стабільні в межах сесії.
  options: { queryKey: sanctionProfileKeys.options(), queryFn: fetchDossierOptions, staleTime: Infinity },
  ticketOptions: { queryKey: ['dossier-ticket-options'], queryFn: fetchTicketOptions, staleTime: Infinity },
  profile: (profileId) => ({ queryKey: sanctionProfileKeys.detail(profileId), queryFn: () => fetchProfile(profileId) }),
  tickets: (entityType, entityId) => ({
    queryKey: dossierTicketKeys.list(entityType, entityId),
    queryFn: () => fetchTickets(entityType, entityId),
  }),
}

/** Параметри списку профілів з фільтрів сторінки (усі фільтри застосовує сервер). */
export const profileListParams = (filters, limit) => ({
  q: filters.q,
  subjectTypeIds: filters.typeFilter,
  modelClassIds: filters.modelClassFilter,
  needsReview: undefined,
  conflictOnly: filters.conflictOnly || undefined,
  uaSanctionsStatuses: filters.uaSanctionsStatusFilter,
  uaSanctionsDaysRemainingMax: filters.expiringWithinDays ?? undefined,
  hasAvatar: filters.hasAvatar,
  connectionsCountMin: filters.connectionsCountMin,
  connectionsCountMax: filters.connectionsCountMax,
  matchedPasses: filters.matchedPassFilter,
  origins: filters.originFilter,
  ticketStatus: filters.ticketStatusFilter ?? undefined,
  sort: filters.sort,
  direction: filters.direction,
  limit,
})

export const profilesInfiniteQuery = (getParams) => ({
  queryKey: () => sanctionProfileKeys.list(getParams()),
  queryFn: ({ pageParam = 0, queryKey }) => fetchProfiles({ ...queryKey[1], page: pageParam }),
  initialPageParam: 0,
  // meta.page — 1-indexed поточна сторінка; наступний 0-indexed pageParam дорівнює їй.
  getNextPageParam: nextPage,
})

export const orphansInfiniteQuery = (getParams) => ({
  queryKey: () => orphanProjectKeys.list(getParams()),
  queryFn: ({ pageParam = 0, queryKey }) => fetchOrphanProjects({ ...queryKey[1], page: pageParam }),
  initialPageParam: 0,
  getNextPageParam: nextPage,
})

const affected = (...profileIds) => [PROFILES, ...profileIds.filter(Boolean).map((id) => sanctionProfileKeys.detail(id))]
/** Свіжий профіль із відповіді — одразу в кеш картки. */
const mergeProfile = (profileId) => (updated, _vars, scope) => {
  if (!updated) return
  scope.queryClient.setQueryData(sanctionProfileKeys.detail(profileId), (old) => (old ? { ...old, ...updated } : updated))
}

export const connectionCommands = (profileId) => ({
  link: {
    mutationFn: ({ modelClass, modelId, matchedCriteria }) => linkConnection(profileId, { modelClass, modelId, matchedCriteria }),
    invalidate: () => affected(profileId),
    success: "Джерело прив'язано до профілю",
    error: "Не вдалося прив'язати джерело",
  },
  confirm: { mutationFn: confirmConnection, invalidate: () => affected(profileId), success: "Зв'язок підтверджено", error: "Не вдалося підтвердити зв'язок" },
  unconfirm: { mutationFn: unconfirmConnection, invalidate: () => affected(profileId), success: 'Підтвердження скасовано', error: 'Не вдалося скасувати підтвердження' },
  move: {
    mutationFn: ({ connectionId, targetProfileId, reason }) => moveConnection(connectionId, { targetProfileId, reason }),
    invalidate: ({ targetProfileId }) => affected(profileId, targetProfileId),
    success: "Зв'язок перенесено на інший профіль",
    error: "Не вдалося перенести зв'язок",
  },
  unlink: {
    mutationFn: ({ connectionId, reason }) => unlinkConnection(connectionId, { reason }),
    invalidate: () => affected(profileId),
    success: "Зв'язок вилучено",
    error: "Не вдалося вилучити зв'язок",
  },
  void: {
    mutationFn: ({ connectionId, reason }) => voidConnection(connectionId, { reason }),
    invalidate: () => affected(profileId),
    success: "Зв'язок позначено нікчемним",
    error: "Не вдалося позначити зв'язок нікчемним",
  },
  updateNote: {
    mutationFn: ({ connectionId, note }) => updateConnectionNote(connectionId, note),
    invalidate: () => affected(profileId),
    error: 'Не вдалося зберегти примітку',
  },
})

export const profileCommands = (profileId) => ({
  deleteProfile: {
    mutationFn: () => deleteProfile(profileId),
    onSuccess: (_d, _v, scope) => scope.queryClient.removeQueries({ queryKey: sanctionProfileKeys.detail(profileId) }),
    invalidate: () => [PROFILES],
    success: 'Профіль видалено',
    error: false,
    onErrorMessage: backendMessage('Не вдалося видалити профіль'),
  },
  uploadAvatar: {
    mutationFn: (file) => uploadProfileAvatar(profileId, file),
    onSuccess: (avatar, _v, scope) =>
      scope.queryClient.setQueryData(sanctionProfileKeys.detail(profileId), (old) => (old ? { ...old, avatar_url: avatar.url } : old)),
    invalidate: () => [PROFILES],
    success: 'Фото профілю оновлено',
    error: false,
    onErrorMessage: (error) => fieldErrorMessage(error, 'avatar') ?? backendMessage('Не вдалося завантажити фото')(error),
  },
  deleteAvatar: {
    mutationFn: () => deleteProfileAvatar(profileId),
    onSuccess: (_d, _v, scope) =>
      scope.queryClient.setQueryData(sanctionProfileKeys.detail(profileId), (old) => (old ? { ...old, avatar_url: null } : old)),
    invalidate: () => [PROFILES],
    success: 'Фото профілю видалено',
    error: false,
    onErrorMessage: backendMessage('Не вдалося видалити фото'),
  },
  updateCaption: {
    mutationFn: (viewCaption) => updateProfileCaption(profileId, viewCaption),
    onSuccess: mergeProfile(profileId),
    invalidate: (_v, updated) => (updated ? [PROFILES] : []),
    error: false,
    // 422 показує сама модалка редагування біля поля.
    onErrorMessage: (error) => (error?.response?.status === 422 ? null : backendMessage('Не вдалося оновити назву профілю')(error)),
  },
  updateNote: {
    mutationFn: (note) => updateProfileNote(profileId, note),
    onSuccess: mergeProfile(profileId),
    error: false,
    onErrorMessage: (error) => fieldErrorMessage(error, 'note') ?? backendMessage('Не вдалося зберегти примітку')(error),
  },
  refreshStatus: {
    mutationFn: () => refreshProfileStatus(profileId),
    onSuccess: mergeProfile(profileId),
    invalidate: () => [PROFILES],
    success: 'Стан підсанкційності перераховано',
    error: false,
    onErrorMessage: backendMessage('Не вдалося оновити стан підсанкційності'),
  },
})

export const relationCommands = (profileId) => ({
  link: {
    mutationFn: ({ relatedProfileId, connectionTypeId, note }) => linkProfileRelation(profileId, { relatedProfileId, connectionTypeId, note }),
    invalidate: ({ relatedProfileId }) => affected(profileId, relatedProfileId),
    success: "Профіль пов'язано",
    error: "Не вдалося пов'язати профіль",
  },
  unlink: {
    mutationFn: ({ connectionId }) => unlinkProfileRelation(connectionId),
    invalidate: ({ relatedProfileId }) => affected(profileId, relatedProfileId),
    success: "Зв'язок між профілями прибрано",
    error: 'Не вдалося прибрати зв\'язок',
  },
})

const orphansAndProfiles = () => [['orphan-projects'], PROFILES]
export const ORPHAN_COMMANDS = {
  link: {
    mutationFn: ({ profileId, projectId }) => linkConnection(profileId, { modelClass: MODEL_CLASS_PROJECT, modelId: projectId }),
    invalidate: orphansAndProfiles,
    success: (_d, { profileId }) => `Проєкт привʼязано до досьє #${profileId}`,
    error: 'Не вдалося привʼязати — перевірте id досьє',
  },
  create: {
    mutationFn: createProfileFromOrphan,
    invalidate: orphansAndProfiles,
    success: (profile) => `Створено досьє #${profile.id}`,
    error: 'Не вдалося створити досьє з проєкту',
  },
  bulkCreate: {
    mutationFn: bulkCreateProfilesFromOrphans,
    invalidate: orphansAndProfiles,
    success: ({ created }) => (created.length > 0 ? `Створено досьє: ${created.length}` : undefined),
    error: 'Не вдалося виконати пакетне створення',
  },
}

export const ticketCommands = (entityType, entityId) => {
  const list = () => [dossierTicketKeys.list(entityType, entityId)]
  return {
    create: {
      mutationFn: ({ text, payload, extraLinks = [] }) => createTicket({ links: [{ type: entityType, id: entityId }, ...extraLinks], text, payload }),
      invalidate: list,
      success: 'Тікет створено',
      error: 'Не вдалося створити тікет',
    },
  }
}

/** Дії над одним тікетом (картка тікета; onChanged — інвалідує список власника). */
export const singleTicketCommands = (ticketId) => ({
  resolve: { mutationFn: (note) => resolveTicket(ticketId, note), success: 'Тікет вирішено', error: 'Не вдалося вирішити тікет' },
  addLink: { mutationFn: (link) => addTicketLink(ticketId, link), error: 'Не вдалося додати привʼязку — перевірте id' },
  removeLink: { mutationFn: (link) => removeTicketLink(ticketId, link), error: 'Не вдалося прибрати привʼязку' },
})

export const duplicatesSearchCommand = { mutationFn: ({ modelClass, modelId }) => findDuplicates({ modelClass, modelId }), error: false }
