import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {addTicketLink, createTicket, removeTicketLink, resolveTicket} from "../../entities/dossierTicket/api.js";
import {dossierTicketKeys} from "../../shared/lib/queryKeys.js";

export const useTicketMutations = (entityType, entityId) => {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({queryKey: dossierTicketKeys.list(entityType, entityId)});

    // links за замовчуванням — лише сутність, до якої прикріплена ця модалка/кнопка;
    // extraLinks (опційно) дозволяє додати ще звʼязки (напр. другий конфліктний профіль).
    const createMutation = useMutation({
        mutationFn: ({text, payload, extraLinks = []}) =>
            createTicket({links: [{type: entityType, id: entityId}, ...extraLinks], text, payload}),
        onSuccess: () => {
            toast.success("Тікет створено");
            invalidate();
        },
        onError: () => toast.error("Не вдалося створити тікет"),
    });

    const resolveMutation = useMutation({
        mutationFn: ({ticketId, resolutionNote}) => resolveTicket(ticketId, resolutionNote),
        onSuccess: () => {
            toast.success("Тікет вирішено");
            invalidate();
        },
        onError: () => toast.error("Не вдалося вирішити тікет"),
    });

    // Одразу на бек, без окремої кнопки "зберегти" — кожен доданий/прибраний id
    // самостійний запит.
    const addLinkMutation = useMutation({
        mutationFn: ({ticketId, link}) => addTicketLink(ticketId, link),
        onSuccess: invalidate,
        onError: () => toast.error("Не вдалося додати привʼязку — перевірте id"),
    });

    const removeLinkMutation = useMutation({
        mutationFn: ({ticketId, link}) => removeTicketLink(ticketId, link),
        onSuccess: invalidate,
        onError: () => toast.error("Не вдалося прибрати привʼязку"),
    });

    return {createMutation, resolveMutation, addLinkMutation, removeLinkMutation};
};
