import {useQuery} from "@tanstack/react-query";
import {fetchTickets, fetchTicketOptions} from "./api.js";
import {dossierTicketKeys} from "../../shared/lib/queryKeys.js";

export const useTicketsQuery = (entityType, entityId, {enabled = true} = {}) =>
    useQuery({
        queryKey: dossierTicketKeys.list(entityType, entityId),
        queryFn: () => fetchTickets(entityType, entityId),
        enabled: enabled && Boolean(entityType) && Boolean(entityId),
    });

// Словники панелі фільтрів /dossier/tickets — статичні (стани/типи), тож staleTime: Infinity,
// той самий принцип, що й useDossierOptionsQuery.
export const useTicketOptionsQuery = () =>
    useQuery({
        queryKey: ["dossier-ticket-options"],
        queryFn: fetchTicketOptions,
        staleTime: Infinity,
    });
