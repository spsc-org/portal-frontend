import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    assignResponsible,
    createResponsibleFunction,
    deleteResponsibleFunction,
    endResponsibleAssignment,
    fetchMyResponsibleAssignments,
    fetchResponsibleAssignments,
    fetchResponsibleFunctions,
    fetchResponsibleOptions,
    fetchUsersWithoutResponsibility,
    updateResponsibleAssignment,
    updateResponsibleFunction,
} from "./api.js";

// Той самий контракт помилок, що й Task/DeveloperPost (CLAUDE.md): {message} + {errors} на 422.
export const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (!data) return fallback;
    if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        if (firstError) return Array.isArray(firstError) ? firstError[0] : firstError;
    }
    return data.message || fallback;
};

const responsibleKeys = {
    options: () => ["staff-responsible-options"],
    functions: () => ["staff-responsible-functions"],
    assignments: () => ["staff-responsible-assignments"],
    my: () => ["staff-responsible-my"],
    unassignedUsers: () => ["staff-responsible-unassigned-users"],
};

// Словник сторінки (users) — той самий принцип, що useDeveloperPostOptionsQuery/
// useTaskOptions: staleTime: Infinity, стабільний у межах сесії.
export const useResponsibleOptionsQuery = () =>
    useQuery({
        queryKey: responsibleKeys.options(),
        queryFn: fetchResponsibleOptions,
        staleTime: Infinity,
    });

// Повний реєстр — лише при staff-responsible.read === true (403 з бекенду при
// нижчому рівні, сторінка й так не рендерить цей запит без права).
export const useResponsibleFunctionsQuery = (enabled = true) =>
    useQuery({
        queryKey: responsibleKeys.functions(),
        queryFn: fetchResponsibleFunctions,
        enabled,
    });

// Повний список (активні + скасовані) — ТАБ "Призначення"; скасоване
// призначення лишається видимим в історії, а не зникає з інтерфейсу.
export const useResponsibleAssignmentsQuery = (enabled = true) =>
    useQuery({
        queryKey: responsibleKeys.assignments(),
        queryFn: fetchResponsibleAssignments,
        enabled,
    });

export const useMyResponsibleAssignmentsQuery = () =>
    useQuery({
        queryKey: responsibleKeys.my(),
        queryFn: fetchMyResponsibleAssignments,
    });

export const useUsersWithoutResponsibilityQuery = (enabled = true) =>
    useQuery({
        queryKey: responsibleKeys.unassignedUsers(),
        queryFn: fetchUsersWithoutResponsibility,
        enabled,
    });

const invalidateResponsibleQueries = (queryClient) => {
    queryClient.invalidateQueries({queryKey: responsibleKeys.functions()});
    queryClient.invalidateQueries({queryKey: responsibleKeys.assignments()});
    queryClient.invalidateQueries({queryKey: responsibleKeys.my()});
    queryClient.invalidateQueries({queryKey: responsibleKeys.unassignedUsers()});
};

export const useCreateResponsibleFunctionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResponsibleFunction,
        onSuccess: () => {
            toast.success("Функцію створено");
            invalidateResponsibleQueries(queryClient);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося створити функцію")),
    });
};

export const useUpdateResponsibleFunctionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({functionId, ...data}) => updateResponsibleFunction(functionId, data),
        onSuccess: () => {
            toast.success("Функцію збережено");
            invalidateResponsibleQueries(queryClient);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти функцію")),
    });
};

export const useDeleteResponsibleFunctionMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResponsibleFunction,
        onSuccess: () => {
            toast.success("Функцію видалено");
            invalidateResponsibleQueries(queryClient);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити функцію")),
    });
};

export const useAssignResponsibleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: assignResponsible,
        onSuccess: () => {
            toast.success("Відповідального призначено");
            invalidateResponsibleQueries(queryClient);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося призначити відповідального")),
    });
};

export const useEndResponsibleAssignmentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({assignmentId, endedAt}) => endResponsibleAssignment(assignmentId, endedAt),
        onSuccess: () => {
            toast.success("Призначення скасовано");
            invalidateResponsibleQueries(queryClient);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося скасувати призначення")),
    });
};

export const useUpdateResponsibleAssignmentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({assignmentId, ...data}) => updateResponsibleAssignment(assignmentId, data),
        onSuccess: () => {
            toast.success("Призначення збережено");
            invalidateResponsibleQueries(queryClient);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти призначення")),
    });
};
