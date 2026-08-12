import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchVesselImoDetails, fetchVesselImoLists, fetchVesselImoLogs} from "./api.js";
import {
    commitVesselImoDetailsImport,
    commitVesselImoImport,
    previewVesselImoDetailsImport,
    previewVesselImoImport,
} from "./importApi.js";

const vesselImoKeys = {
    lists: () => ["vessel-imo-lists"],
    logs: (page, limit) => ["vessel-imo-logs", page, limit],
    details: (page, limit, q) => ["vessel-imo-details", page, limit, q],
};

export const useVesselImoListsQuery = (enabled = true) =>
    useQuery({
        queryKey: vesselImoKeys.lists(),
        queryFn: fetchVesselImoLists,
        enabled,
    });

// Спільний журнал усього модуля (списки + деталі суден, поле `type` на рядку) — один список в UI.
export const useVesselImoLogsQuery = (page, limit = 15) =>
    useQuery({
        queryKey: vesselImoKeys.logs(page, limit),
        queryFn: () => fetchVesselImoLogs({page, limit}),
    });

export const usePreviewVesselImoImportMutation = () =>
    useMutation({
        mutationFn: previewVesselImoImport,
    });

export const useCommitVesselImoImportMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: commitVesselImoImport,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: vesselImoKeys.lists()});
            queryClient.invalidateQueries({queryKey: ["vessel-imo-logs"]});
        },
    });
};

export const useVesselImoDetailsQuery = (page, limit = 50, q, enabled = true) =>
    useQuery({
        queryKey: vesselImoKeys.details(page, limit, q),
        queryFn: () => fetchVesselImoDetails({page, limit, q}),
        placeholderData: keepPreviousData,
        enabled,
    });

export const usePreviewVesselImoDetailsImportMutation = () =>
    useMutation({
        mutationFn: previewVesselImoDetailsImport,
    });

export const useCommitVesselImoDetailsImportMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: commitVesselImoDetailsImport,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["vessel-imo-details"]});
            queryClient.invalidateQueries({queryKey: ["vessel-imo-logs"]});
        },
    });
};
