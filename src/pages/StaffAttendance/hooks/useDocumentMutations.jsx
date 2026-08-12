import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import CustomToast from '@/Components/CustomToast.jsx';
import { API_ENDPOINTS, QUERY_KEYS } from '../constants/attendanceConfig.js';

// Мутації для керування документами відсутностей
// onLocalSuccess callback дозволяє компоненту оновлювати локальний стан без race conditions

export const useAddDocumentMutation = (absenceId, onLocalSuccess) => {
    const { token } = usePage().props;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await axios.post(
                `${API_ENDPOINTS.ABSENCE}/${absenceId}/documents`,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': token,
                    }
                }
            );
            return response.data;
        },
        onSuccess: (data) => {
            toast.success('Документ додано');
            onLocalSuccess?.(data);
        },
        onError: ({ response }) => {
            const message = response?.data?.message || 'Не вдалося додати документ';
            toast.custom((t) => <CustomToast t={t} title="Помилка додавання документа" message={message} />);
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR] });
            }
        },
    });
};

export const useDeleteDocumentMutation = (onLocalSuccess) => {
    const { token } = usePage().props;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (docId) => {
            const response = await axios.delete(
                `${API_ENDPOINTS.DOCUMENTS}/${docId}`,
                {
                    headers: {
                        'X-CSRF-Token': token,
                    }
                }
            );
            return response.data;
        },
        onSuccess: (data, docId) => {
            toast.success('Документ видалено');
            onLocalSuccess?.(docId);
        },
        onError: ({ response }) => {
            const message = response?.data?.message || 'Не вдалося видалити документ';
            toast.custom((t) => <CustomToast t={t} title="Помилка видалення документа" message={message} />);
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR] });
            }
        },
    });
};

export const useUpdateDocumentMutation = (onLocalSuccess) => {
    const { token } = usePage().props;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ docId, data }) => {
            const response = await axios.patch(
                `${API_ENDPOINTS.DOCUMENTS}/${docId}`,
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': token,
                    }
                }
            );
            return response.data;
        },
        onSuccess: (data, variables) => {
            toast.success('Документ оновлено');
            onLocalSuccess?.(data, variables.docId);
        },
        onError: ({ response }) => {
            const message = response?.data?.message || 'Не вдалося оновити документ';
            toast.custom((t) => <CustomToast t={t} title="Помилка оновлення документа" message={message} />);
        },
        onSettled: (data, error) => {
            if (!error) {
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDAR] });
            }
        },
    });
};
