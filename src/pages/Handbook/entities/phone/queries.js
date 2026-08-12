import {keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    addPhoneComment,
    archivePhone,
    confirmPhoneNumber,
    createPhone,
    deletePhone,
    deletePhoneComment,
    duplicatePhone,
    fetchPhone,
    fetchPhoneAuditHistory,
    fetchPhoneComments,
    fetchPhoneOptions,
    fetchPhones,
    restorePhone,
    togglePhoneFavorite,
    updatePhone,
    updatePhoneComment,
} from "./api.js";
import {commitPhoneImport, previewPhoneImport} from "./importApi.js";
import {phoneKeys} from "../../shared/lib/queryKeys.js";

export const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (!data) return fallback;
    if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        if (firstError) return Array.isArray(firstError) ? firstError[0] : firstError;
    }
    return data.message || fallback;
};

export const usePhoneOptionsQuery = () =>
    useQuery({
        queryKey: phoneKeys.options(),
        queryFn: fetchPhoneOptions,
        staleTime: Infinity,
    });

export const useInfinitePhonesQuery = ({q, department, status, sort, direction, onlyFavorite, onlyConfirmed, limit = 200} = {}) =>
    useInfiniteQuery({
        queryKey: phoneKeys.list({q, department, status, sort, direction, onlyFavorite, onlyConfirmed, limit}),
        queryFn: ({pageParam = 0}) => fetchPhones({page: pageParam, limit, q, department, status, sort, direction, onlyFavorite, onlyConfirmed}),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined,
        placeholderData: keepPreviousData,
    });

export const usePhoneQuery = (id) =>
    useQuery({
        queryKey: phoneKeys.detail(id),
        queryFn: () => fetchPhone(id),
        enabled: Boolean(id),
    });

export const useCreatePhoneMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPhone,
        onSuccess: () => {
            toast.success("Запис додано");
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося додати запис")),
    });
};

export const useUpdatePhoneMutation = (id) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => updatePhone(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: phoneKeys.detail(id)});
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти зміни")),
    });
};

export const useDeletePhoneMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePhone,
        onSuccess: () => {
            toast.success("Запис видалено");
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити запис")),
    });
};

export const usePreviewPhoneImportMutation = () =>
    useMutation({
        mutationFn: previewPhoneImport,
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося розпізнати файл")),
    });

export const useCommitPhoneImportMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: commitPhoneImport,
        onSuccess: (entries) => {
            toast.success(`Імпортовано записів: ${entries.length}`);
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося імпортувати записи")),
    });
};

export const useDuplicatePhoneMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: duplicatePhone,
        onSuccess: () => {
            toast.success("Картку продубльовано");
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося продублювати картку")),
    });
};

export const useArchivePhoneMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: archivePhone,
        onSuccess: (entry) => {
            toast.success("Картку архівовано");
            queryClient.invalidateQueries({queryKey: phoneKeys.detail(entry.id)});
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося архівувати картку")),
    });
};

export const useRestorePhoneMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: restorePhone,
        onSuccess: (entry) => {
            toast.success("Картку розархівовано");
            queryClient.invalidateQueries({queryKey: phoneKeys.detail(entry.id)});
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося розархівувати картку")),
    });
};

export const useTogglePhoneFavoriteMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: togglePhoneFavorite,
        onSuccess: (result, id) => {
            toast.success(result.is_favorite ? "Додано в обране" : "Знято з обраного");
            queryClient.invalidateQueries({queryKey: phoneKeys.detail(id)});
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося оновити обране")),
    });
};

export const useConfirmPhoneNumberMutation = (entryId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (numberId) => confirmPhoneNumber(numberId),
        onSuccess: () => {
            toast.success("Актуальність підтверджено");
            if (entryId) queryClient.invalidateQueries({queryKey: phoneKeys.detail(entryId)});
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося підтвердити номер")),
    });
};

export const usePhoneAuditHistoryQuery = (entryId, page = 1, limit = 50) =>
    useQuery({
        queryKey: ["phone-audit", entryId, page, limit],
        queryFn: () => fetchPhoneAuditHistory(entryId, {page, limit}),
        enabled: Boolean(entryId),
        placeholderData: keepPreviousData,
    });

export const usePhoneCommentsQuery = (entryId) =>
    useQuery({
        queryKey: phoneKeys.comments(entryId),
        queryFn: () => fetchPhoneComments(entryId),
        enabled: Boolean(entryId),
    });

export const useAddPhoneCommentMutation = (entryId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body) => addPhoneComment(entryId, body),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: phoneKeys.comments(entryId)});
            // comments_count у списку карток (PhoneList) рахується на бекенді
            // (withCount) — без інвалідації списку іконка/лічильник коментарів
            // там лишається застарілим після додавання коментаря в картці.
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося надіслати коментар")),
    });
};

export const useUpdatePhoneCommentMutation = (entryId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({commentId, body}) => updatePhoneComment(commentId, body),
        onSuccess: () => queryClient.invalidateQueries({queryKey: phoneKeys.comments(entryId)}),
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти коментар")),
    });
};

export const useDeletePhoneCommentMutation = (entryId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (commentId) => deletePhoneComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: phoneKeys.comments(entryId)});
            queryClient.invalidateQueries({queryKey: ["phones"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити коментар")),
    });
};
