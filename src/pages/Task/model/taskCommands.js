import { rootStore } from '../../../stores/RootStore.js'
import {
  TASK_KEYS,
  attachTaskFiles,
  changeTaskStatus,
  deleteTask,
  deleteTaskAttachment,
  mergeTask,
  patchTaskField,
  restoreTask,
  toggleFavoriteTask,
} from './taskApi.js'

const userId = () => rootStore.session.userId

/**
 * Відповідь PATCH зливається в кеш картки НАПРЯМУ (setQueryData), а не лише
 * через invalidate: у CreateTaskModal перший GET чернетки й перший PATCH
 * користувача можуть "перегнати" один одного, і запізнілий GET затер би
 * щойно збережене. Мердж пополевий — PATCH-відповідь не містить усіх зв'язків.
 */
export function mergeTaskShowCache(scope, taskId, freshTask) {
  scope.queryClient.setQueryData(TASK_KEYS.show(taskId), (old) => {
    if (!old || !freshTask) return old
    return { ...old, data: { ...old.data, ...freshTask } }
  })
}

/** Команди списку /task (id — у змінних). */
export const TASK_COMMANDS = {
  deleteTask: {
    mutationFn: (vars) => deleteTask(vars, userId()),
    invalidate: () => [TASK_KEYS.all],
    success: (_, { force }) => (force ? 'Видалено успішно' : 'Архівовано успішно'),
    error: 'Помилка архівації',
  },
  restoreTask: {
    mutationFn: (id) => restoreTask(id, userId()),
    invalidate: () => [TASK_KEYS.all],
    success: 'Відновлено з архіву успішно',
    error: 'Помилка відновлення з архіву',
  },
  mergeTask: {
    mutationFn: (vars) => mergeTask(vars, userId()),
    invalidate: ({ baseId, donorId }) => [
      TASK_KEYS.all,
      TASK_KEYS.show(baseId),
      TASK_KEYS.show(donorId),
      TASK_KEYS.comments(baseId),
    ],
    success: 'Задачі злито успішно',
    error: 'Не вдалося злити задачі',
  },
  toggleFavorite: {
    mutationFn: (id) => toggleFavoriteTask(id, userId()),
    invalidate: (id) => [TASK_KEYS.all, TASK_KEYS.show(id)],
    success: (response) => (response?.data?.favorited ? 'Додано в обране' : 'Знято з обраного'),
    error: 'Не вдалося оновити обране',
  },
  changeStatus: {
    mutationFn: (vars) => changeTaskStatus(vars, userId()),
    invalidate: ({ id }) => [TASK_KEYS.all, TASK_KEYS.show(id)],
    success: 'Стан змінено',
    error: 'Не вдалося змінити стан',
  },
}

// segment ендпоінта, ключ тіла, тости. extra — додаткові ключі для інвалідації.
const FIELD_SPECS = {
  updateTitle: ['title', 'title', 'Назву оновлено', 'Не вдалося змінити назву'],
  updateDescription: ['description', 'description', 'Опис оновлено', 'Не вдалося змінити опис'],
  updateResult: ['result', 'result', 'Результат оновлено', 'Не вдалося зберегти результат'],
  updateType: ['type', 'typeId', 'Тип оновлено', 'Не вдалося змінити тип'],
  updatePriority: ['priority', 'priorityId', 'Пріоритет оновлено', 'Не вдалося змінити пріоритет'],
  // Новий проєкт / тег — одразу доступні в інших селектах (task-options)
  updateProject: ['project', 'projectId', 'Проєкт оновлено', 'Не вдалося змінити проєкт', [TASK_KEYS.options]],
  updateDueDate: ['due-date', 'dueDate', 'Термін оновлено', 'Не вдалося змінити термін'],
  updateTags: ['tags', 'tags', 'Теги оновлено', 'Не вдалося оновити теги', [TASK_KEYS.options]],
  updateAssignees: ['assignees', 'userIds', 'Учасників оновлено', 'Не вдалося оновити учасників'],
}

/**
 * Команди полів однієї задачі — спільні для картки (TaskViewPanel) і
 * чернетки (CreateTaskModal). getTaskId — геттер, бо в чернетці id
 * з'являється після створення.
 */
export function taskFieldCommands(getTaskId) {
  const fields = Object.fromEntries(
    Object.entries(FIELD_SPECS).map(([name, [segment, bodyKey, success, error, extra = []]]) => [
      name,
      {
        mutationFn: (value) => patchTaskField(getTaskId(), segment, bodyKey, value, userId()),
        onSuccess: (response, _vars, scope) => mergeTaskShowCache(scope, getTaskId(), response?.data),
        invalidate: () => [TASK_KEYS.all, ...extra],
        success,
        error,
      },
    ]),
  )
  const filesToast = (prefix) => (response) => {
    // Тост на кожен файл — як в Inertia-версії; success-рядок команди порожній.
    const files = response?.data?.files ?? []
    return files.map(({ fileName }) => `${prefix} ${fileName} завантажено`).join('\n') || undefined
  }
  return {
    ...fields,
    attachFiles: {
      mutationFn: (attachments) => attachTaskFiles(getTaskId(), attachments, {}, userId()),
      invalidate: () => [TASK_KEYS.show(getTaskId())],
      success: filesToast('Вкладення'),
      error: 'Не вдалося завантажити вкладення',
    },
    attachResultFiles: {
      mutationFn: (attachments) => attachTaskFiles(getTaskId(), attachments, { isResult: true }, userId()),
      invalidate: () => [TASK_KEYS.show(getTaskId())],
      success: filesToast('Файл результату'),
      error: 'Не вдалося завантажити файл результату',
    },
    deleteAttachment: {
      mutationFn: (attachment) => deleteTaskAttachment(attachment, userId()),
      invalidate: () => [TASK_KEYS.show(getTaskId())],
      success: (response) => `Вкладення ${response?.fileName ?? ''} видалено`,
      error: 'Не вдалося видалити вкладення',
    },
    changeStatus: {
      mutationFn: (statusId) => changeTaskStatus({ id: getTaskId(), statusId }, userId()),
      invalidate: () => [TASK_KEYS.show(getTaskId()), TASK_KEYS.all],
      success: 'Стан змінено',
      error: 'Не вдалося змінити стан',
    },
  }
}
