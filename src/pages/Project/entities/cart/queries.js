import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    addDocument,
    addRestrictions,
    createTaskWithProjects,
    fetchBulkOperationsLog,
    fetchCartCollection,
    fetchTaskOptionsForCart,
    generateDossiers,
    linkProjectsToProposals,
    replaceReasoningText,
    rewriteRestriction25,
    rewriteRestrictions,
    rewriteTerm,
    setPerformer,
    setState,
    setValidator,
} from "./api.js";

const LOG_KEY = ["project-cart-bulk-log"];

export const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export const useBulkOperationsLogQuery = (userId, enabled) =>
    useQuery({
        queryKey: LOG_KEY,
        queryFn: () => fetchBulkOperationsLog(userId),
        enabled: Boolean(userId) && enabled,
    });

// projectIds — масив id з localStorage (entities/cart/storage.js). queryKey
// включає сам список, бо це саме те, що змінюється при додаванні/видаленні
// з корзини — react-query сам перезапросить дані при зміні набору.
export const useCartCollectionQuery = (projectIds, userId) =>
    useQuery({
        queryKey: ["project-cart-collection", ...projectIds.slice().sort((a, b) => a - b)],
        queryFn: () => fetchCartCollection(projectIds, userId),
        enabled: Boolean(userId) && projectIds.length > 0,
    });

export const useTaskOptionsForCartQuery = (userId, enabled) =>
    useQuery({
        queryKey: ["project-cart-task-options"],
        queryFn: () => fetchTaskOptionsForCart(userId),
        staleTime: Infinity,
        enabled: Boolean(userId) && enabled,
    });

// Спільна фабрика: усі 11 "простих" bulk-дій (усе, крім "Створити задачу",
// яка має власну спеціальну мутацію нижче) мають однакову форму виклику
// (projectIdList, ...specificFields, reason) і однакову поведінку на успіх —
// інвалідувати журнал, щоб нова операція з'явилась у tab-3 одразу.
const useBulkMutation = (fn) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables) => fn(...variables),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: LOG_KEY }),
    });
};

export const useLinkProjectsToProposalsMutation = () => useBulkMutation(linkProjectsToProposals);
export const useAddRestrictionsMutation = () => useBulkMutation(addRestrictions);
export const useRewriteRestrictionsMutation = () => useBulkMutation(rewriteRestrictions);
export const useRewriteRestriction25Mutation = () => useBulkMutation(rewriteRestriction25);
export const useRewriteTermMutation = () => useBulkMutation(rewriteTerm);
export const useReplaceReasoningTextMutation = () => useBulkMutation(replaceReasoningText);
export const useSetPerformerMutation = () => useBulkMutation(setPerformer);
export const useSetValidatorMutation = () => useBulkMutation(setValidator);
export const useSetStateMutation = () => useBulkMutation(setState);
export const useGenerateDossiersMutation = () => useBulkMutation(generateDossiers);

// addDocument — окремо, бо не приймає reason (3 аргументи, не 4).
export const useAddDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ([projectIdList, docFields, userId]) => addDocument(projectIdList, docFields, userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: LOG_KEY }),
    });
};

export const useCreateTaskWithProjectsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ([projectIdList, taskFields, userId]) => createTaskWithProjects(projectIdList, taskFields, userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: LOG_KEY }),
    });
};
