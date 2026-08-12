import {keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {downloadFile, serializeParams} from "../../utils.js";
import toast from "react-hot-toast";


// Словники сторінки задач з GET /api/task/options — єдине джерело для
// фільтрів, панелі та форм (заміна Inertia-props при переході на
// API-driven React). Довідники стабільні в межах сесії — staleTime: Infinity.
export function useTaskOptions(auth) {
    return useQuery({
        queryKey: ['task-options'],
        queryFn: async () => {
            const response = await axios.get(`/api/task/options`, {
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            });
            return response.data?.data;
        },
        staleTime: Infinity,
        retry: false,
    });
}

// Бекенд завжди повертає {message} (і {errors} для 422 — див. CLAUDE.md).
// Тост має показувати САМЕ цей текст, а не узагальнений — фронтенд не має
// права "ковтати" причину помилки з бекенду (авторизація/валідація/бізнес-правило).
export const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (!data) return fallback;
    if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        if (firstError) return Array.isArray(firstError) ? firstError[0] : firstError;
    }
    return data.message || fallback;
};

// Мультивибір (панель /task): масив обраних опцій -> масив id для бекенду
// (whereIn); порожній/відсутній масив -> undefined (фільтр не застосовується)
const toIdList = (options) => options?.length ? options.map(option => option.id) : undefined;

// Мапінг фільтрів панелі /task -> query-параметри бекенду. Спільне між
// useInfiniteTasks (список) і useExportTasks (експорт) — той самий набір
// критеріїв, той самий бекенд-метод (TaskService::buildFilteredTaskQuery).
const buildTaskFilterParams = (filters) => ({
    ...filters,
    page: undefined,
    statusId: toIdList(filters?.statusId),
    createdUserId: toIdList(filters?.createdUserId),
    assignedUserId: toIdList(filters?.assignedUserId),
    projectId: toIdList(filters?.projectId),
    priorityId: toIdList(filters?.priorityId),
    typeId: toIdList(filters?.typeId),
});

// Нескінченний потік задач для нового списку (патерн "Показати ще"):
// сторінки накопичуються, групування — клієнтський шар поверх завантаженого
export function useInfiniteTasks(filters, auth, enabled = true) {
    const params = buildTaskFilterParams(filters);
    return useInfiniteQuery({
        queryKey: ['tasks', 'infinite', params],
        queryFn: async ({pageParam}) => {
            const searchParams = serializeParams({...params, page: pageParam});
            const response = await axios.get(`/api/task`, {
                params: searchParams,
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            });
            return response.data;
        },
        initialPageParam: 0,
        // Рахуємо за фактично завантаженим, а не за meta.page —
        // незалежно від індексації сторінок на бекенді
        getNextPageParam: (lastPage, allPages) => {
            const meta = lastPage?.meta;
            if (!meta) return undefined;
            const loaded = allPages.reduce((sum, page) => sum + (page?.data?.length || 0), 0);
            return loaded < meta.total ? allPages.length : undefined;
        },
        enabled,
        retry: false,
    });
}

// Експорт поточного (відфільтрованого) списку задач у XLSX — ті самі
// критерії, що й useInfiniteTasks, бекенд віддає файл напряму (responseType
// 'blob'), тож помилки теж прилітають як Blob — парсимо вручну, щоб не
// проковтнути справжнє повідомлення бекенду (403/500).
export function useExportTasks() {
    return useMutation({
        mutationFn: async ({filters, auth}) => {
            const params = buildTaskFilterParams(filters);
            const searchParams = serializeParams(params);
            const response = await axios.get('/api/task/export', {
                params: searchParams,
                responseType: 'blob',
                headers: {'userId': auth?.user?.id},
            });
            return response;
        },
        onSuccess: (response) => {
            const disposition = response.headers?.['content-disposition'] || '';
            const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
            const fileName = match ? decodeURIComponent(match[1]) : `tasks_${Date.now()}.xlsx`;
            downloadFile(response.data, fileName);
        },
        onError: async (error) => {
            if (error?.response?.data instanceof Blob) {
                try {
                    const parsed = JSON.parse(await error.response.data.text());
                    toast.error(parsed?.message || "Не вдалося експортувати задачі");
                    return;
                } catch {
                    // не JSON — падаємо до загального повідомлення нижче
                }
            }
            toast.error(getErrorMessage(error, "Не вдалося експортувати задачі"));
        },
    });
}

export function useGetBugs(filters, auth) {
    const params = {
        ...filters,
        statusId: filters?.statusId?.id,
        createdUserId: filters?.createdUserId?.id,
        assignedUserId: filters?.assignedUserId?.id,
        projectId: filters?.projectId?.id,
        priorityId: filters?.priorityId?.id,
        typeId: filters?.typeId?.id,
    }
    return useQuery({
        queryKey: ['tasks', params],
        queryFn: async () => {
            const searchParams = serializeParams(params);
            const response = await axios.get(`/api/task/bug`, {
                params: searchParams,
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            });
            return response.data;
        },
        retry: false,
        placeholderData: keepPreviousData,
    });
}


export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, force = false, auth, token}) => {
            const response = await axios.delete(force ? `/api/task/${id}/force` : `/api/task/${id}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        "X-CSRF-Token": token,
                        "userId": auth.user.id,
                    }
                }
            );
            return {...response.data, force}
        },
        onSuccess: async ({force}) => {
            toast.success(force ? "Видалено успішно" : "Архівовано успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });

        },
        onError: (error, {force}) => toast.error(getErrorMessage(error, force ? "Помилка видалення" : "Помилка архівації")),
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['tasks']});
            }
        },
    })
}

export function useRestoreTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, auth, token}) => {

            const response = await axios.post(`/api/task/${id}/restore`, undefined,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        "X-CSRF-Token": token,
                        "userId": auth.user.id,
                    }
                }
            );
            return response.data
        },
        onSuccess: async () => {
            toast.success("Відновлено з архіву успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });

        },
        onError: (error) => toast.error(getErrorMessage(error, "Помилка відновлення з архіву")),
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['tasks']});
            }
        },
    })
}

// Злиття двох задач: donorId вливається в задачу baseId (весь змістовний
// вміст донора переноситься в базову, донор м'яко видаляється)
export function useMergeTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({baseId, donorId, auth, token}) => {
            const response = await axios.patch(`/api/task/${baseId}/merge`, {donorId}, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth.user.id,
                }
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Задачі злито успішно", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося злити задачі")),
        onSettled: (data, error, variables) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['tasks']});
                queryClient.invalidateQueries({queryKey: ['task-show', variables.baseId]});
                queryClient.invalidateQueries({queryKey: ['task-show', variables.donorId]});
                queryClient.invalidateQueries({queryKey: ['task-comments', variables.baseId]});
            }
        },
    })
}

// Обране (зірочка): перший клік — додає, другий — знімає (POST-toggle).
export function useToggleFavoriteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, auth, token}) => {
            const response = await axios.post(`/api/task/${id}/favorite`, undefined, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth.user.id,
                }
            });
            return response.data;
        },
        onSuccess: (data) => {
            const favorited = data?.data?.favorited;
            toast.success(favorited ? "Додано в обране" : "Знято з обраного", {
                style: {
                    background: 'dark:dark:bg-slate-800',
                    color: 'text-slate-400',
                },
            });
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося оновити обране")),
        onSettled: (data, error, variables) => {
            if (!error) {
                queryClient.invalidateQueries({queryKey: ['tasks']});
                queryClient.invalidateQueries({queryKey: ['task-show', variables.id]});
            }
        },
    })
}

const TOAST_STYLE = {
    style: {
        background: 'dark:dark:bg-slate-800',
        color: 'text-slate-400',
    },
};

// Спільні мутації полів-"сутностей" задачі (теги/учасники/вкладення) —
// той самий набір ендпоінтів, що використовують і TaskViewPanel (картка),
// і CreateTaskModal (чернетка при створенні). taskId параметризує хук, щоб
// обидва місця могли ним користуватись без дублювання PATCH/PATCH-запитів.
//
// Кеш ['task-show', taskId] оновлюється НАПРЯМУ відповіддю мутації
// (setQueryData), а не лише invalidateQueries — у CreateTaskModal initial
// GET (запускається щойно з'являється draftId) і перший PATCH користувача
// можуть races: invalidate просто позначає запит застарілим, а вже
// летючий (in-flight) GET з даними ДО зміни долітає останнім і затирає
// щойно збережене. Пряме злиття відповіді PATCH у кеш усуває цю гонку;
// invalidateQueries('tasks') лишається — для списку задач фонового
// рефетчу достатньо. Мердж пошaйтовий (не replace): PATCH-відповідь не
// підвантажує всі зв'язки (напр. updateTags не вантажить assignedUsers),
// тож старі поля з кешу, яких немає у відповіді, зберігаються.
const mergeTaskShowCache = (queryClient, taskId, freshTask) => {
    queryClient.setQueryData(['task-show', taskId], (old) => {
        if (!old || !freshTask) return old;
        return {...old, data: {...old.data, ...freshTask}};
    });
};

export function useUpdateTaskTitle(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (title) => {
            const response = await axios.patch(`/api/task/${taskId}/title`, {title}, {
                headers: {'Content-Type': 'application/json', "X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Назву оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося змінити назву")),
    });
}

export function useUpdateTaskDescription(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (description) => {
            const response = await axios.patch(`/api/task/${taskId}/description`, {description}, {
                headers: {'Content-Type': 'application/json', "X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Опис оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося змінити опис")),
    });
}

export function useUpdateTaskResult(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (result) => {
            const response = await axios.patch(`/api/task/${taskId}/result`, {result}, {
                headers: {'Content-Type': 'application/json', "X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Результат оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти результат")),
    });
}

export function useUpdateTaskType(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (typeId) => {
            const response = await axios.patch(`/api/task/${taskId}/type`, {typeId}, {
                headers: {'Content-Type': 'application/json', "X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Тип оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося змінити тип")),
    });
}

export function useUpdateTaskPriority(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (priorityId) => {
            const response = await axios.patch(`/api/task/${taskId}/priority`, {priorityId}, {
                headers: {'Content-Type': 'application/json', "X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Пріоритет оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося змінити пріоритет")),
    });
}

export function useUpdateTaskProject(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (projectId) => {
            const response = await axios.patch(`/api/task/${taskId}/project`, {projectId}, {
                headers: {'Content-Type': 'application/json', "X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Проєкт оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
            // Новостворений проєкт має бути одразу доступний в інших селектах
            queryClient.invalidateQueries({queryKey: ['task-options']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося змінити проєкт")),
    });
}

export function useUpdateTaskDueDate(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dueDate) => {
            const response = await axios.patch(`/api/task/${taskId}/due-date`, {dueDate}, {
                headers: {'Content-Type': 'application/json', "X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Термін оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося змінити термін")),
    });
}

export function useUpdateTaskTags(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (tags) => {
            const response = await axios.patch(`/api/task/${taskId}/tags`, {tags}, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Теги оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
            // Новостворений тег має бути одразу доступний в інших селектах
            queryClient.invalidateQueries({queryKey: ['task-options']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося оновити теги")),
    });
}

export function useUpdateTaskAssignees(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userIds) => {
            const response = await axios.patch(`/api/task/${taskId}/assignees`, {userIds}, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onSuccess: (response) => {
            toast.success("Учасників оновлено", TOAST_STYLE);
            mergeTaskShowCache(queryClient, taskId, response?.data);
            queryClient.invalidateQueries({queryKey: ['tasks']});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося оновити учасників")),
    });
}

export function useAttachTaskFiles(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (attachments = []) => {
            const formData = new FormData();
            attachments
                .filter(attachment => attachment?.file instanceof File)
                .forEach((attachment, index) => formData.append(`attachments[${index}]`, attachment.file));
            const response = await axios.post(`/api/task/${taskId}/attach-file`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onSuccess: (response) => {
            const files = response?.data?.files ?? [];
            files.forEach(({fileName}) => toast.success(`Вкладення ${fileName} завантажено`, TOAST_STYLE));
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося завантажити вкладення")),
        onSettled: (data, error) => {
            if (!error) queryClient.invalidateQueries({queryKey: ['task-show', taskId]});
        },
    });
}

// Той самий ендпоінт, що й useAttachTaskFiles, лише з прапорцем isResult=1 у
// тілі запиту — бекенд (TaskAttachmentService::attachFile) позначає ним
// записи taskAttachment, щоб відділити файли результату від звичайних вкладень.
export function useAttachTaskResultFiles(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (attachments = []) => {
            const formData = new FormData();
            attachments
                .filter(attachment => attachment?.file instanceof File)
                .forEach((attachment, index) => formData.append(`attachments[${index}]`, attachment.file));
            formData.append('isResult', '1');
            const response = await axios.post(`/api/task/${taskId}/attach-file`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onSuccess: (response) => {
            const files = response?.data?.files ?? [];
            files.forEach(({fileName}) => toast.success(`Файл результату ${fileName} завантажено`, TOAST_STYLE));
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося завантажити файл результату")),
        onSettled: (data, error) => {
            if (!error) queryClient.invalidateQueries({queryKey: ['task-show', taskId]});
        },
    });
}

export function useDeleteTaskAttachment(taskId, auth, token) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (attachment) => {
            const response = await axios.delete(`/api/task/delete-file/${attachment.id}`, {
                headers: {"X-CSRF-Token": token, "userId": auth?.user?.id}
            });
            return response.data;
        },
        onSuccess: ({fileName}) => toast.success(`Вкладення ${fileName} видалено`, TOAST_STYLE),
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити вкладення")),
        onSettled: () => queryClient.invalidateQueries({queryKey: ['task-show', taskId]}),
    });
}

export function useGetAssignedTasks(filters, auth) {
    const params = {
        ...filters,
        statusId: filters?.statusId?.id,
        projectId: filters?.projectId?.id,
        priorityId: filters?.priorityId?.id,
        typeId: filters?.typeId?.id,
    }
    return useQuery({
        queryKey: ['tasks', params],
        queryFn: async () => {
            const searchParams = serializeParams(params);
            const response = await axios.get(`/api/task/assigned`, {
                params: searchParams,
                headers: {
                    'Content-Type': 'application/json',
                    'userId': auth?.user?.id,
                },
            });
            return response.data;
        },
        retry: false,
        placeholderData: keepPreviousData,
    });
}
