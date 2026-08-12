import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    attachDeveloperPostFiles,
    createDeveloperPostDraft,
    deleteDeveloperPost,
    deleteDeveloperPostAttachment,
    discardDeveloperPostDraft,
    fetchDeveloperPost,
    fetchDeveloperPostOptions,
    fetchDeveloperPosts,
    finalizeDeveloperPostDraft,
    publishDeveloperPost,
    updateDeveloperPost,
} from "./api.js";
import {developerPostKeys} from "../../shared/lib/queryKeys.js";

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

export const useDeveloperPostOptionsQuery = () =>
    useQuery({
        queryKey: developerPostKeys.options(),
        queryFn: fetchDeveloperPostOptions,
        staleTime: Infinity,
    });

// Класична пагінація (сторінки 1/2/3…) — на відміну від Task/Announcement
// ("Показати ще"), за прямою вимогою користувача для цього розділу.
export const useDeveloperPostsQuery = ({page = 1, limit = 20, q, authorIds, tags, statuses, isRead, scope} = {}) =>
    useQuery({
        queryKey: developerPostKeys.list({page, limit, q, authorIds, tags, statuses, isRead, scope}),
        queryFn: () => fetchDeveloperPosts({page, limit, q, authorIds, tags, statuses, isRead, scope}),
        placeholderData: keepPreviousData,
    });

export const useDeveloperPostQuery = (postId) =>
    useQuery({
        queryKey: developerPostKeys.detail(postId),
        queryFn: () => fetchDeveloperPost(postId),
        enabled: Boolean(postId),
    });

// Чернетка-шелл при відкритті модалки створення — без тостів/інвалідації,
// це ще не "справжній" пост, який хтось має побачити.
export const useCreateDeveloperPostDraftMutation = () =>
    useMutation({
        mutationFn: createDeveloperPostDraft,
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося підготувати пост")),
    });

export const useFinalizeDeveloperPostDraftMutation = (draftId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => finalizeDeveloperPostDraft(draftId, data),
        onSuccess: (_data, variables) => {
            const messages = {draft: "Чернетку збережено", scheduled: "Пост заплановано", published: "Пост опубліковано"};
            toast.success(messages[variables?.status] || "Збережено");
            queryClient.invalidateQueries({queryKey: ["developer-posts"]});
            queryClient.invalidateQueries({queryKey: developerPostKeys.options()});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти пост")),
    });
};

// Закрили модалку створення, не дозаповнивши — мовчки прибираємо чернетку
// (без тоста, це не дія користувача над "справжнім" постом).
export const useDiscardDeveloperPostDraftMutation = () =>
    useMutation({
        mutationFn: discardDeveloperPostDraft,
    });

export const usePublishDeveloperPostMutation = (postId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => publishDeveloperPost(postId),
        onSuccess: () => {
            toast.success("Пост опубліковано");
            queryClient.invalidateQueries({queryKey: developerPostKeys.detail(postId)});
            queryClient.invalidateQueries({queryKey: ["developer-posts"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося опублікувати пост")),
    });
};

export const useUpdateDeveloperPostMutation = (postId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => updateDeveloperPost(postId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: developerPostKeys.detail(postId)});
            queryClient.invalidateQueries({queryKey: ["developer-posts"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти зміни")),
    });
};

export const useDeleteDeveloperPostMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteDeveloperPost,
        onSuccess: () => {
            toast.success("Пост видалено");
            queryClient.invalidateQueries({queryKey: ["developer-posts"]});
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити пост")),
    });
};

export const useAttachDeveloperPostFilesMutation = (postId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (files) => attachDeveloperPostFiles(postId, files),
        onSuccess: () => queryClient.invalidateQueries({queryKey: developerPostKeys.detail(postId)}),
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося додати файл")),
    });
};

export const useDeleteDeveloperPostAttachmentMutation = (postId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attachment) => deleteDeveloperPostAttachment(attachment.id),
        onSuccess: () => queryClient.invalidateQueries({queryKey: developerPostKeys.detail(postId)}),
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити файл")),
    });
};
