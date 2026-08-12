import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {linkProfileRelation, unlinkProfileRelation} from "../../entities/dossierConnection/api.js";
import {sanctionProfileKeys} from "../../shared/lib/queryKeys.js";

// Дзеркальний рядок з'являється і на пов'язаному профілі — інвалідуємо обидва.
const invalidateAffected = (queryClient, ...profileIds) => {
    queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
    profileIds.filter(Boolean).forEach((profileId) => {
        queryClient.invalidateQueries({queryKey: sanctionProfileKeys.detail(profileId)});
    });
};

export const useProfileRelationMutations = (profileId) => {
    const queryClient = useQueryClient();

    const linkMutation = useMutation({
        mutationFn: ({relatedProfileId, connectionTypeId, note}) =>
            linkProfileRelation(profileId, {relatedProfileId, connectionTypeId, note}),
        onSuccess: (_, {relatedProfileId}) => {
            toast.success("Профіль пов'язано");
            invalidateAffected(queryClient, profileId, relatedProfileId);
        },
        onError: () => toast.error("Не вдалося пов'язати профіль"),
    });

    const unlinkMutation = useMutation({
        mutationFn: ({connectionId}) => unlinkProfileRelation(connectionId),
        onSuccess: (_, {relatedProfileId}) => {
            toast.success("Зв'язок між профілями прибрано");
            invalidateAffected(queryClient, profileId, relatedProfileId);
        },
        onError: () => toast.error("Не вдалося прибрати зв'язок"),
    });

    return {linkMutation, unlinkMutation};
};
