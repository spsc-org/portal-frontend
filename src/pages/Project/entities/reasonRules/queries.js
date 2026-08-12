import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createReasonRule,
    deleteReasonRule,
    fetchCountryOptions,
    fetchReasonRules,
    updateReasonRule,
} from "./api.js";

const REASON_RULES_KEY = ["reason-rules-admin"];

export const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export const useReasonRulesQuery = () =>
    useQuery({
        queryKey: REASON_RULES_KEY,
        queryFn: fetchReasonRules,
    });

export const useCountryOptionsQuery = () =>
    useQuery({
        queryKey: ["reason-rules-country-options"],
        queryFn: fetchCountryOptions,
        staleTime: Infinity,
    });

export const useCreateReasonRuleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createReasonRule,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: REASON_RULES_KEY }),
    });
};

export const useUpdateReasonRuleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => updateReasonRule(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: REASON_RULES_KEY }),
    });
};

export const useDeleteReasonRuleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteReasonRule,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: REASON_RULES_KEY }),
    });
};
