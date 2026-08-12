import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import CustomToast from '@/Components/CustomToast.jsx';
import { API_ENDPOINTS, QUERY_KEYS } from '../constants/attendanceConfig.js';

// Мутації для керування відсутностями персоналу
// onLocalSuccess callback дозволяє компоненту синхронізувати UI з сервером при успіху

/**
 * Hook for deleting an absence record.
 * @param {Function} [onLocalSuccess] Callback on successful deletion.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useDeleteAbsenceMutation = (onLocalSuccess) => {
    const { token } = usePage().props;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (absenceId) => {
            const response = await axios.delete(
                `${API_ENDPOINTS.ABSENCE}/${absenceId}`,
                {
                    headers: {
                        'X-CSRF-Token': token,
                    }
                }
            );
            return response.data;
        },
        onSuccess: () => {
            toast.success('Заявку видалено');
            onLocalSuccess?.();
        },
        onError: ({ response }) => {
            const message = response?.data?.message || 'Не вдалося видалити заявку';
            toast.error(message);
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR] });
            }
        },
    });
};

/**
 * Hook for creating or updating an absence record.
 * @param {boolean} isEditing Whether we are editing an existing record.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useSubmitAbsenceMutation = (isEditing) => {
    const { token } = usePage().props;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload) => {
            const url = isEditing ? `${API_ENDPOINTS.ABSENCE}/${payload.id}` : API_ENDPOINTS.ABSENCE;
            const method = isEditing ? 'PATCH' : 'POST';
            const response = await axios({
                method,
                url,
                data: payload,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                }
            });
            return response.data;
        },
        onSuccess: (data, payload) => {
            const message = isEditing ? 'Заявку успішно оновлено' : 'Заявку успішно створено';
            toast.success(message);
        },
        onError: ({ response }) => {
            const message = response?.data?.message || 'Помилка при збереженні заявки';
            toast.custom((t) => <CustomToast t={t} title="Помилка збереження заявки" message={message} />);
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR] });
            }
        },
    });
};

/**
 * Hook for updating user's ZP (Salary status).
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useUpdateUserZpMutation = () => {
    const { token } = usePage().props;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, zpValue }) => {
            const response = await axios.patch(
                `${API_ENDPOINTS.USER_ZP}/${userId}/zp`,
                { zp: zpValue },
                {
                    headers: { 'X-CSRF-Token': token }
                }
            );
            return response.data;
        },
        onSuccess: (data, { userId, zpValue }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATISTICS] });
        },
        onError: (error) => {
            const message = error.response?.data?.message || 'Помилка при оновленні ЗП';
            toast.error(message);
        },
    });
};
