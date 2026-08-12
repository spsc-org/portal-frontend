import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {linkConnection} from "../../entities/dossierConnection/api.js";
import {bulkCreateProfilesFromOrphans, createProfileFromOrphan} from "../../entities/orphanProject/api.js";

const MODEL_CLASS_PROJECT = 1;

// Дії панелі "Список сирот": привʼязати проєкт-сироту до досьє за вручну введеним id
// (переюзає загальний connections.store — сирота лінкується так само, як і будь-яке
// інше джерело), або створити нове досьє одразу з даних проєкту (OrphanProjectService).
export const useOrphanMutations = () => {
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({queryKey: ["orphan-projects"]});
        queryClient.invalidateQueries({queryKey: ["sanction-profiles"]});
    };

    const linkMutation = useMutation({
        mutationFn: ({profileId, projectId}) => linkConnection(profileId, {modelClass: MODEL_CLASS_PROJECT, modelId: projectId}),
        onSuccess: (_, {profileId}) => {
            toast.success(`Проєкт привʼязано до досьє #${profileId}`);
            invalidate();
        },
        onError: () => toast.error("Не вдалося привʼязати — перевірте id досьє"),
    });

    const createMutation = useMutation({
        mutationFn: (projectId) => createProfileFromOrphan(projectId),
        onSuccess: (profile) => {
            toast.success(`Створено досьє #${profile.id}`);
            invalidate();
        },
        onError: () => toast.error("Не вдалося створити досьє з проєкту"),
    });

    const bulkCreateMutation = useMutation({
        mutationFn: (projectIds) => bulkCreateProfilesFromOrphans(projectIds),
        onSuccess: ({created, errors}) => {
            if (created.length > 0) {
                toast.success(`Створено досьє: ${created.length}`);
            }
            if (errors.length > 0) {
                toast.error(`Не вдалося створити: ${errors.length}`);
            }
            invalidate();
        },
        onError: () => toast.error("Не вдалося виконати пакетне створення"),
    });

    return {linkMutation, createMutation, bulkCreateMutation};
};
