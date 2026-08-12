import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {deleteProfile, deleteProfileAvatar, refreshProfileStatus, updateProfileCaption, updateProfileNote, uploadProfileAvatar} from "../../entities/dossier/api.js";
import {sanctionProfileKeys} from "../../shared/lib/queryKeys.js";

// Витягує повідомлення про помилку конкретного поля з конверта 422 {success:false,message,errors}
// (errors[field] буває або рядком, або масивом — Handler проєкту віддає перший варіант,
// але обробляємо обидва про всяк випадок).
export const fieldErrorMessage = (error, field) => {
    const fieldError = error?.response?.data?.errors?.[field];
    return Array.isArray(fieldError) ? fieldError[0] : fieldError;
};

export const useProfileMutations = (profileId) => {
    const queryClient = useQueryClient();

    const deleteProfileMutation = useMutation({
        mutationFn: () => deleteProfile(profileId),
        onSuccess: () => {
            toast.success("Профіль видалено");
            queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
            queryClient.removeQueries({queryKey: sanctionProfileKeys.detail(profileId)});
        },
        // 422 — у профілю лишились якірні (truth-source) зв'язки, видалення заблоковано.
        onError: (error) =>
            toast.error(error?.response?.data?.message ?? "Не вдалося видалити профіль"),
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: (file) => uploadProfileAvatar(profileId, file),
        onSuccess: (avatar) => {
            toast.success("Фото профілю оновлено");
            // Оновлюємо кеш деталей профілю напряму (без повного рефетчу) новим avatar_url з відповіді.
            queryClient.setQueryData(sanctionProfileKeys.detail(profileId), (old) =>
                old ? {...old, avatar_url: avatar.url} : old,
            );
            queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
        },
        onError: (error) =>
            toast.error(fieldErrorMessage(error, "avatar") ?? error?.response?.data?.message ?? "Не вдалося завантажити фото"),
    });

    const deleteAvatarMutation = useMutation({
        mutationFn: () => deleteProfileAvatar(profileId),
        onSuccess: () => {
            toast.success("Фото профілю видалено");
            queryClient.setQueryData(sanctionProfileKeys.detail(profileId), (old) =>
                old ? {...old, avatar_url: null} : old,
            );
            queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
        },
        onError: (error) =>
            toast.error(error?.response?.data?.message ?? "Не вдалося видалити фото"),
    });

    const updateCaptionMutation = useMutation({
        mutationFn: (viewCaption) => updateProfileCaption(profileId, viewCaption),
        onSuccess: (updatedProfile) => {
            // 204 (значення не змінилось) → updatedProfile === undefined, кеш лишаємо як є.
            if (updatedProfile) {
                queryClient.setQueryData(sanctionProfileKeys.detail(profileId), (old) =>
                    old ? {...old, ...updatedProfile} : updatedProfile,
                );
                queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
            }
        },
        // 422 (порожньо/задовге) обробляється інлайн у формі; тут — тільки 403/мережеві.
        onError: (error) => {
            if (error?.response?.status !== 422) {
                toast.error(error?.response?.data?.message ?? "Не вдалося оновити назву профілю");
            }
        },
    });

    const updateNoteMutation = useMutation({
        mutationFn: (note) => updateProfileNote(profileId, note),
        onSuccess: (updatedProfile) => {
            if (updatedProfile) {
                queryClient.setQueryData(sanctionProfileKeys.detail(profileId), (old) =>
                    old ? {...old, ...updatedProfile} : updatedProfile,
                );
            }
        },
        onError: (error) =>
            toast.error(fieldErrorMessage(error, "note") ?? error?.response?.data?.message ?? "Не вдалося зберегти примітку"),
    });

    const refreshStatusMutation = useMutation({
        mutationFn: () => refreshProfileStatus(profileId),
        onSuccess: (updatedProfile) => {
            toast.success("Стан підсанкційності перераховано");
            queryClient.setQueryData(sanctionProfileKeys.detail(profileId), (old) =>
                old ? {...old, ...updatedProfile} : updatedProfile,
            );
            queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
        },
        onError: (error) =>
            toast.error(error?.response?.data?.message ?? "Не вдалося оновити стан підсанкційності"),
    });

    return {deleteProfileMutation, uploadAvatarMutation, deleteAvatarMutation, updateCaptionMutation, updateNoteMutation, refreshStatusMutation};
};
