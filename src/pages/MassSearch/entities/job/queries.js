import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {deleteMassSearchJob, fetchMassSearchJob, fetchMassSearchJobs, retryMassSearchJobItem, runMassSearchJobSearch} from "./api.js";
import {commitMassSearchImport, previewMassSearchImport} from "./importApi.js";

// Той самий контракт помилок, що й Task/StaffResponsible (CLAUDE.md): {message} + {errors} на 422.
export const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (!data) return fallback;
    if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        if (firstError) return Array.isArray(firstError) ? firstError[0] : firstError;
    }
    return data.message || fallback;
};

const jobKeys = {
    list: () => ["mass-search-jobs"],
    detail: (jobId) => ["mass-search-jobs", jobId],
};

export const useMassSearchJobsQuery = () =>
    useQuery({
        queryKey: jobKeys.list(),
        queryFn: fetchMassSearchJobs,
    });

// Поки завдання в черзі/виконується — опитуємо що 2с, щоб бачити прогрес по
// рядках наживо (без цього користувач бачив би статичний список до
// завершення ВСЬОГО завдання, що суперечить самій ідеї "дивитись, поки йде
// пошук"). Зупиняється само, щойно статус стає кінцевим.
const POLLING_STATUSES = ["queued", "running"];

export const useMassSearchJobQuery = (jobId, enabled = true) =>
    useQuery({
        queryKey: jobKeys.detail(jobId),
        queryFn: () => fetchMassSearchJob(jobId),
        enabled: enabled && Boolean(jobId),
        refetchInterval: (query) => (POLLING_STATUSES.includes(query.state.data?.status) ? 2000 : false),
    });

export const usePreviewMassSearchImportMutation = () =>
    useMutation({
        mutationFn: previewMassSearchImport,
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося розпізнати файл")),
    });

export const useCommitMassSearchImportMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: commitMassSearchImport,
        onSuccess: () => {
            toast.success("Завдання створено");
            queryClient.invalidateQueries({queryKey: jobKeys.list()});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося створити завдання")),
    });
};

export const useRunMassSearchJobSearchMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({jobId, groupIds, searchMethodIds}) => runMassSearchJobSearch(jobId, {groupIds, searchMethodIds}),
        onSuccess: (job) => {
            toast.success("Пошук запущено");
            queryClient.setQueryData(jobKeys.detail(job.id), (prev) => ({...prev, ...job}));
            queryClient.invalidateQueries({queryKey: jobKeys.list()});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося запустити пошук")),
    });
};

export const useRetryMassSearchJobItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: retryMassSearchJobItem,
        onSuccess: (_item, {jobId}) => {
            toast.success("Рядок перевірено заново");
            queryClient.invalidateQueries({queryKey: jobKeys.detail(jobId)});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося перезапустити пошук для рядка")),
    });
};

export const useDeleteMassSearchJobMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteMassSearchJob,
        onSuccess: () => {
            toast.success("Завдання видалено");
            queryClient.invalidateQueries({queryKey: jobKeys.list()});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити завдання")),
    });
};
