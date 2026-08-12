import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    confirmConnection,
    linkConnection,
    moveConnection,
    unconfirmConnection,
    unlinkConnection,
    updateConnectionNote,
    voidConnection,
} from "../../entities/dossierConnection/api.js";
import {sanctionProfileKeys} from "../../shared/lib/queryKeys.js";

// Зв'язок міг перейти на інший профіль (move) або вплинути на needs_review у списку,
// тож інвалідуємо і список, і деталі залучених профілів.
const invalidateAffected = (queryClient, ...profileIds) => {
    queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
    profileIds.filter(Boolean).forEach((profileId) => {
        queryClient.invalidateQueries({queryKey: sanctionProfileKeys.detail(profileId)});
    });
};

export const useConnectionMutations = (profileId) => {
    const queryClient = useQueryClient();

    const linkMutation = useMutation({
        mutationFn: ({modelClass, modelId, matchedCriteria}) =>
            linkConnection(profileId, {modelClass, modelId, matchedCriteria}),
        onSuccess: () => {
            toast.success("Джерело прив'язано до профілю");
            invalidateAffected(queryClient, profileId);
        },
        onError: () => toast.error("Не вдалося прив'язати джерело"),
    });

    const confirmMutation = useMutation({
        mutationFn: (connectionId) => confirmConnection(connectionId),
        onSuccess: () => {
            toast.success("Зв'язок підтверджено");
            invalidateAffected(queryClient, profileId);
        },
        onError: () => toast.error("Не вдалося підтвердити зв'язок"),
    });

    const unconfirmMutation = useMutation({
        mutationFn: (connectionId) => unconfirmConnection(connectionId),
        onSuccess: () => {
            toast.success("Підтвердження скасовано");
            invalidateAffected(queryClient, profileId);
        },
        onError: () => toast.error("Не вдалося скасувати підтвердження"),
    });

    const moveMutation = useMutation({
        mutationFn: ({connectionId, targetProfileId, reason}) =>
            moveConnection(connectionId, {targetProfileId, reason}),
        onSuccess: (_, {targetProfileId}) => {
            toast.success("Зв'язок перенесено на інший профіль");
            invalidateAffected(queryClient, profileId, targetProfileId);
        },
        onError: () => toast.error("Не вдалося перенести зв'язок"),
    });

    const unlinkMutation = useMutation({
        mutationFn: ({connectionId, reason}) => unlinkConnection(connectionId, {reason}),
        onSuccess: () => {
            toast.success("Зв'язок вилучено");
            invalidateAffected(queryClient, profileId);
        },
        onError: (error) => toast.error(error?.response?.data?.message || "Не вдалося вилучити зв'язок"),
    });

    const voidMutation = useMutation({
        mutationFn: ({connectionId, reason}) => voidConnection(connectionId, {reason}),
        onSuccess: () => {
            toast.success("Зв'язок позначено нікчемним");
            invalidateAffected(queryClient, profileId);
        },
        onError: () => toast.error("Не вдалося позначити зв'язок нікчемним"),
    });

    const updateNoteMutation = useMutation({
        mutationFn: ({connectionId, note}) => updateConnectionNote(connectionId, note),
        onSuccess: () => invalidateAffected(queryClient, profileId),
        onError: () => toast.error("Не вдалося зберегти примітку"),
    });

    return {linkMutation, confirmMutation, unconfirmMutation, moveMutation, unlinkMutation, voidMutation, updateNoteMutation};
};
