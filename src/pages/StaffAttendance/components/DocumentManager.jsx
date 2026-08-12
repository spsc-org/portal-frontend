import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card, IconButton, Typography } from "@material-tailwind/react";
import toast from 'react-hot-toast';
import CustomToast from "@/Components/CustomToast.jsx";
import { format } from 'date-fns';
import { VALIDATION_MESSAGES } from '../constants/attendanceConfig.js';
import {
    useAddDocumentMutation,
    useDeleteDocumentMutation,
    useUpdateDocumentMutation,
} from '../hooks/index.js';

const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

const DocumentForm = ({ formData, onFormChange, onSubmit, onCancel, isLoading, submitLabel }) => (
    <div className="flex flex-col gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-900">
        <div className="flex gap-2">
            <div className="flex-1">
                <Input
                    type="text"
                    label="Номер документа"
                    size="md"
                    value={formData.document_number}
                    onChange={(e) => onFormChange('document_number', e.target.value)}
                    placeholder="Наприклад: 123-АБ"
                />
            </div>
            <div className="flex-1">
                <Input
                    type="date"
                    label="Дата документа"
                    size="md"
                    value={formData.document_date}
                    onChange={(e) => onFormChange('document_date', e.target.value)}
                />
            </div>
            <div className="flex-1">
                <Input
                    type="text"
                    label="Опис"
                    size="md"
                    value={formData.description}
                    onChange={(e) => onFormChange('description', e.target.value)}
                    placeholder="Наприклад: Наказ про відпустку"
                />
            </div>
        </div>
        <div className="flex gap-2 justify-end">
            <Button
                variant="text"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
            >
                Скасувати
            </Button>
            <Button
                size="sm"
                color="blue"
                onClick={onSubmit}
                disabled={isLoading}
            >
                {isLoading ? 'Зберігаю...' : submitLabel}
            </Button>
        </div>
    </div>
);

const DocumentManager = ({ absenceId, documents = [] }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ document_number: '', document_date: getTodayDate(), description: '' });
    const [editingFormData, setEditingFormData] = useState({ document_number: '', document_date: '', description: '' });
    const [localDocuments, setLocalDocuments] = useState(documents);

    // Callbacks синхронізуються з мутаціями для уникнення race conditions
    // Когда mutate() завершиться, callback буде викликаний в хуку перед queryClient.invalidateQueries()

    // Callback для додавання документу: оновлюємо локальний список та очищаємо форму
    const handleAddSuccess = (data) => {
        if (data?.data) {
            setLocalDocuments([...localDocuments, data.data]);
            setFormData({ document_number: '', document_date: getTodayDate(), description: '' });
            setIsAdding(false);
        }
    };

    // Callback для видалення: видаляємо з локального списку
    const handleDeleteSuccess = (docId) => {
        setLocalDocuments(localDocuments.filter(d => d.id !== docId));
    };

    // Callback для оновлення: оновлюємо в локальному списку та закриваємо форму
    const handleUpdateSuccess = (data, docId) => {
        if (data?.data) {
            setLocalDocuments(localDocuments.map(d => d.id === docId ? data.data : d));
            setEditingId(null);
        }
    };

    const addDocumentMutation = useAddDocumentMutation(absenceId, handleAddSuccess);
    const deleteDocumentMutation = useDeleteDocumentMutation(handleDeleteSuccess);
    const updateDocumentMutation = useUpdateDocumentMutation(handleUpdateSuccess);

    const handleAdd = () => {
        if (!absenceId) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SAVE_ABSENCE_FIRST}/>);
            return;
        }

        const docNumber = formData.document_number?.trim();
        const docDate = formData.document_date?.trim();

        if (!docNumber) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SPECIFY_DOCUMENT_NUMBER}/>);
            return;
        }

        if (!docDate) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SPECIFY_DOCUMENT_DATE}/>);
            return;
        }

        // Callback handleAddSuccess визиватиметься в хуку при успішному результаті
        addDocumentMutation.mutate({
            document_number: docNumber,
            document_date: docDate,
            description: formData.description?.trim() || ''
        });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setFormData({ document_number: '', document_date: getTodayDate(), description: '' });
    };

    const handleDelete = (docId) => {
        // handleDeleteSuccess визиватиметься в хуку при успішному видаленні
        deleteDocumentMutation.mutate(docId);
    };

    const handleEdit = (doc) => {
        setEditingId(doc.id);
        setEditingFormData({
            document_number: doc.document_number,
            document_date: doc.document_date,
            description: doc.description || ''
        });
    };

    const handleEditSubmit = () => {
        const docNumber = editingFormData.document_number?.trim();
        const docDate = editingFormData.document_date?.trim();

        if (!docNumber) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SPECIFY_DOCUMENT_NUMBER}/>);
            return;
        }

        if (!docDate) {
            toast.custom((t) => <CustomToast t={t} title="Помилка" message={VALIDATION_MESSAGES.SPECIFY_DOCUMENT_DATE}/>);
            return;
        }

        // Callback handleUpdateSuccess визиватиметься в хуку при успішному оновленні
        updateDocumentMutation.mutate({
            docId: editingId,
            data: {
                document_number: docNumber,
                document_date: docDate,
                description: editingFormData.description?.trim() || ''
            }
        });
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditingFormData({ document_number: '', document_date: '', description: '' });
    };

    return (
        <div className="flex flex-col gap-3 mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
                <Typography className="font-bold text-sm">Документи</Typography>
                <Button
                    size="sm"
                    variant="text"
                    className="flex items-center gap-1"
                    onClick={() => setIsAdding(!isAdding)}
                    disabled={addDocumentMutation.isPending || deleteDocumentMutation.isPending || updateDocumentMutation.isPending}
                >
                    <i className="fa-solid fa-plus text-xs"></i>
                    Додати
                </Button>
            </div>

            {isAdding && (
                <DocumentForm
                    formData={formData}
                    onFormChange={(key, value) => setFormData({ ...formData, [key]: value })}
                    onSubmit={handleAdd}
                    onCancel={handleCancel}
                    isLoading={addDocumentMutation.isPending}
                    submitLabel="Додати"
                />
            )}

            {localDocuments.length === 0 ? (
                <Typography className="text-xs text-slate-500">Немає документів</Typography>
            ) : (
                <div className="flex flex-col gap-2">
                    {localDocuments.map(doc => (
                        <div key={doc.id}>
                            {editingId === doc.id ? (
                                <DocumentForm
                                    formData={editingFormData}
                                    onFormChange={(key, value) => setEditingFormData({ ...editingFormData, [key]: value })}
                                    onSubmit={handleEditSubmit}
                                    onCancel={handleEditCancel}
                                    isLoading={updateDocumentMutation.isPending}
                                    submitLabel="Оновити"
                                />
                            ) : (
                                <Card className="p-2 bg-white dark:bg-slate-800 border-0 shadow-sm">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <Typography className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                № {doc.document_number}
                                            </Typography>
                                            <Typography className="text-xs text-slate-600 dark:text-slate-400">
                                                {doc.document_date} • {doc.added_by}
                                            </Typography>
                                            {doc.description && (
                                                <Typography className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                                                    {doc.description}
                                                </Typography>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <IconButton
                                                variant="text"
                                                size="sm"
                                                className="h-6 w-6"
                                                onClick={() => handleEdit(doc)}
                                                disabled={deleteDocumentMutation.isPending || updateDocumentMutation.isPending}
                                            >
                                                <i className="fa-solid fa-pencil text-xs"></i>
                                            </IconButton>
                                            <IconButton
                                                variant="text"
                                                size="sm"
                                                className="h-6 w-6 text-red-500"
                                                onClick={() => handleDelete(doc.id)}
                                                disabled={deleteDocumentMutation.isPending || updateDocumentMutation.isPending}
                                            >
                                                <i className="fa-solid fa-trash text-xs"></i>
                                            </IconButton>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

DocumentForm.propTypes = {
    formData: PropTypes.shape({
        document_number: PropTypes.string,
        document_date: PropTypes.string,
        description: PropTypes.string,
    }).isRequired,
    onFormChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    submitLabel: PropTypes.string.isRequired,
};

DocumentManager.propTypes = {
    absenceId: PropTypes.number,
    documents: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        document_number: PropTypes.string,
        document_date: PropTypes.string,
        description: PropTypes.string,
        added_by: PropTypes.string,
    })),
};

export default DocumentManager;
