import React, {useEffect, useState} from 'react';
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import axios from "axios";

/**
 * modal: null | {mode:'add', inventoryId} | {mode:'edit', inventoryId, comment}
 */
const InventoryCommentModal = ({modal, onClose, token, currentUserId}) => {
    const queryClient = useQueryClient();
    const [text, setText] = useState('');

    useEffect(() => {
        if (modal) setText(modal.mode === 'edit' ? modal.comment.comment : '');
    }, [modal]);

    const onSettled = () => queryClient.invalidateQueries({queryKey: ['inventories']});

    const addMutation = useMutation({
        mutationFn: ({inventoryId, comment}) => axios.post(`/api/inventory/${inventoryId}/comments`, {comment}, {
            headers: {'X-CSRF-Token': token, userId: currentUserId},
        }),
        onSuccess: () => { toast.success('Коментар додано'); onClose(); },
        onError: () => toast.error('Помилка'),
        onSettled,
    });

    const editMutation = useMutation({
        mutationFn: ({inventoryId, commentId, comment}) => axios.patch(`/api/inventory/${inventoryId}/comments/${commentId}`, {comment}, {
            headers: {'X-CSRF-Token': token, userId: currentUserId},
        }),
        onSuccess: () => { toast.success('Збережено'); onClose(); },
        onError: () => toast.error('Помилка'),
        onSettled,
    });

    const handleSubmit = () => {
        if (!text.trim()) return;
        if (modal.mode === 'add') {
            addMutation.mutate({inventoryId: modal.inventoryId, comment: text.trim()});
        } else {
            editMutation.mutate({inventoryId: modal.inventoryId, commentId: modal.comment.id, comment: text.trim()});
        }
    };

    const isPending = addMutation.isPending || editMutation.isPending;

    return (
        <Dialog open={!!modal} handler={onClose} size="sm">
            <DialogHeader className="text-sm py-3">
                {modal?.mode === 'add' ? 'Додати коментар' : 'Редагувати коментар'}
            </DialogHeader>
            <DialogBody className="py-2">
                <textarea
                    autoFocus
                    rows={4}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
                    className="w-full rounded border border-gray-300 dark:border-gray-600
                               dark:bg-gray-700 dark:text-gray-100
                               p-2 text-sm resize-none
                               focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Текст коментаря…"
                />
                <p className="text-[11px] text-gray-400 mt-1">Ctrl+Enter — зберегти</p>
            </DialogBody>
            <DialogFooter className="gap-2 py-2">
                <Button size="sm" color="white" onClick={onClose}>Скасувати</Button>
                <Button size="sm" color="blue" onClick={handleSubmit} disabled={!text.trim() || isPending}>
                    {isPending ? 'Збереження…' : 'Зберегти'}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default InventoryCommentModal;
