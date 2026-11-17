import { observer } from 'mobx-react-lite';
import { useViewModel } from '../../../shared/mvvm/useViewModel.js';
import { DocumentManagerViewModel } from '../viewmodel/AttendanceModalViewModels.js';
import PropTypes from 'prop-types';
import { Button, Input, Card, IconButton, Typography } from "@material-tailwind/react";

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

/** Монтується з key={absence.id} — VM (локальний список документів) на кожну відсутність. */
const DocumentManager = ({ absenceId, documents = [] }) => {
    const vm = useViewModel((deps) => new DocumentManagerViewModel({ ...deps, absenceId, documents }));
    const { isAdding, editingId, formData, editingFormData } = vm;
    const localDocuments = vm.documents;
    const addDocumentMutation = vm.cmd.addDocument;
    const deleteDocumentMutation = vm.cmd.deleteDocument;
    const updateDocumentMutation = vm.cmd.updateDocument;
    const setIsAdding = vm.toggleAdding;
    const handleAdd = vm.add;
    const handleCancel = vm.cancelAdd;
    const handleDelete = vm.remove;
    const handleEdit = vm.startEdit;
    const handleEditSubmit = vm.submitEdit;
    const handleEditCancel = vm.cancelEdit;

    return (
        <div className="flex flex-col gap-3 mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
                <Typography className="font-bold text-sm">Документи</Typography>
                <Button
                    size="sm"
                    variant="text"
                    className="flex items-center gap-1"
                    onClick={() => setIsAdding()}
                    disabled={addDocumentMutation.isPending || deleteDocumentMutation.isPending || updateDocumentMutation.isPending}
                >
                    <i className="fa-solid fa-plus text-xs"></i>
                    Додати
                </Button>
            </div>

            {isAdding && (
                <DocumentForm
                    formData={formData}
                    onFormChange={vm.setFormField}
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
                                    onFormChange={vm.setEditingField}
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

export default observer(DocumentManager);
