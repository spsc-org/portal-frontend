import {keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    createBirthday,
    deleteBirthday,
    fetchBirthday,
    fetchBirthdayOptions,
    fetchBirthdays,
    shareBirthday,
    updateBirthday,
} from "./api.js";
import {commitBirthdayImport, previewBirthdayImport} from "./importApi.js";
import {birthdayKeys} from "../../shared/lib/queryKeys.js";

// Бекенд завжди повертає {message} (і {errors} для 422) — той самий контракт,
// що й у Task/Announcement (CLAUDE.md).
export const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (!data) return fallback;
    if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        if (firstError) return Array.isArray(firstError) ? firstError[0] : firstError;
    }
    return data.message || fallback;
};

export const useBirthdayOptionsQuery = () =>
    useQuery({
        queryKey: birthdayKeys.options(),
        queryFn: fetchBirthdayOptions,
        staleTime: Infinity,
    });

export const useInfiniteBirthdaysQuery = ({q, month, scope, limit = 50} = {}) =>
    useInfiniteQuery({
        queryKey: birthdayKeys.list({q, month, scope, limit}),
        queryFn: ({pageParam = 0}) => fetchBirthdays({page: pageParam, limit, q, month, scope}),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined,
        placeholderData: keepPreviousData,
    });

export const useBirthdayQuery = (id) =>
    useQuery({
        queryKey: birthdayKeys.detail(id),
        queryFn: () => fetchBirthday(id),
        enabled: Boolean(id),
    });

export const useCreateBirthdayMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBirthday,
        onSuccess: () => {
            toast.success("Запис додано");
            queryClient.invalidateQueries({queryKey: ["birthdays"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося додати запис")),
    });
};

export const useUpdateBirthdayMutation = (id) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => updateBirthday(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: birthdayKeys.detail(id)});
            queryClient.invalidateQueries({queryKey: ["birthdays"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти зміни")),
    });
};

export const useDeleteBirthdayMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBirthday,
        onSuccess: () => {
            toast.success("Запис видалено");
            queryClient.invalidateQueries({queryKey: ["birthdays"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити запис")),
    });
};

export const usePreviewBirthdayImportMutation = () =>
    useMutation({
        mutationFn: previewBirthdayImport,
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося розпізнати файл")),
    });

export const useCommitBirthdayImportMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: commitBirthdayImport,
        onSuccess: (entries) => {
            toast.success(`Імпортовано записів: ${entries.length}`);
            queryClient.invalidateQueries({queryKey: ["birthdays"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося імпортувати записи")),
    });
};

export const useShareBirthdayMutation = (id) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userIds) => shareBirthday(id, userIds),
        onSuccess: () => {
            toast.success("Список розшарювання оновлено");
            queryClient.invalidateQueries({queryKey: birthdayKeys.detail(id)});
            queryClient.invalidateQueries({queryKey: ["birthdays"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося оновити розшарювання")),
    });
};
