import {keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    acknowledgeAnnouncement,
    attachAnnouncementFiles,
    createAnnouncement,
    deleteAnnouncement,
    deleteAnnouncementAttachment,
    fetchAnnouncement,
    fetchAnnouncementOptions,
    fetchAnnouncements,
    publishAnnouncement,
    updateAnnouncement,
} from "./api.js";
import {announcementKeys} from "../../shared/lib/queryKeys.js";

// Бекенд завжди повертає {message} (і {errors} для 422) — той самий контракт,
// що й у Task/Dossier (CLAUDE.md).
export const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (!data) return fallback;
    if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        if (firstError) return Array.isArray(firstError) ? firstError[0] : firstError;
    }
    return data.message || fallback;
};

export const useAnnouncementOptionsQuery = () =>
    useQuery({
        queryKey: announcementKeys.options(),
        queryFn: fetchAnnouncementOptions,
        staleTime: Infinity,
    });

// Список оголошень з докачуванням сторінок ("Показати ще") — той самий підхід,
// що й useInfiniteProfilesQuery у Dossier.
export const useInfiniteAnnouncementsQuery = ({q, authorIds, isRead, scope, limit = 20} = {}) =>
    useInfiniteQuery({
        queryKey: announcementKeys.list({q, authorIds, isRead, scope, limit}),
        queryFn: ({pageParam = 0}) => fetchAnnouncements({page: pageParam, limit, q, authorIds, isRead, scope}),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage?.meta && lastPage.meta.page < lastPage.meta.pages ? lastPage.meta.page : undefined,
        placeholderData: keepPreviousData,
    });

export const useAnnouncementQuery = (announcementId) =>
    useQuery({
        queryKey: announcementKeys.detail(announcementId),
        queryFn: () => fetchAnnouncement(announcementId),
        enabled: Boolean(announcementId),
    });

export const useCreateAnnouncementMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAnnouncement,
        onSuccess: (_data, variables) => {
            toast.success(variables?.isDraft ? "Чернетку збережено" : "Оголошення опубліковано");
            queryClient.invalidateQueries({queryKey: ["announcements"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти оголошення")),
    });
};

export const usePublishAnnouncementMutation = (announcementId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => publishAnnouncement(announcementId),
        onSuccess: () => {
            toast.success("Оголошення опубліковано");
            queryClient.invalidateQueries({queryKey: announcementKeys.detail(announcementId)});
            queryClient.invalidateQueries({queryKey: ["announcements"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося опублікувати оголошення")),
    });
};

export const useUpdateAnnouncementMutation = (announcementId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => updateAnnouncement(announcementId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: announcementKeys.detail(announcementId)});
            queryClient.invalidateQueries({queryKey: ["announcements"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти зміни")),
    });
};

export const useDeleteAnnouncementMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAnnouncement,
        onSuccess: () => {
            toast.success("Оголошення видалено");
            queryClient.invalidateQueries({queryKey: ["announcements"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити оголошення")),
    });
};

export const useAttachAnnouncementFilesMutation = (announcementId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (files) => attachAnnouncementFiles(announcementId, files),
        onSuccess: () => queryClient.invalidateQueries({queryKey: announcementKeys.detail(announcementId)}),
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося додати файл")),
    });
};

export const useDeleteAnnouncementAttachmentMutation = (announcementId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attachment) => deleteAnnouncementAttachment(attachment.id),
        onSuccess: () => queryClient.invalidateQueries({queryKey: announcementKeys.detail(announcementId)}),
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити файл")),
    });
};

export const useAcknowledgeAnnouncementMutation = (announcementId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => acknowledgeAnnouncement(announcementId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: announcementKeys.detail(announcementId)});
            queryClient.invalidateQueries({queryKey: ["announcements"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося позначити прочитаним")),
    });
};
