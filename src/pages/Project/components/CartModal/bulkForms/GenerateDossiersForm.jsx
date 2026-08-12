import React, { useState } from "react";
import { useGenerateDossiersMutation, getErrorMessage } from "../../../entities/cart/queries.js";
import BulkFormShell from "./BulkFormShell.jsx";

// bulkTab11 — "Згенерувати досьє". Файл, що повертає бекенд (docx/html),
// НЕ відкривається тут — це спільна поведінка для всієї корзини, тому
// перевірка `result.data.filePath` і window.open/навігація зроблені один раз
// централізовано в CartModal.jsx (onDone), як і в легасі handleMassAction().
const GenerateDossiersForm = ({ projectIds, userId, onDone }) => {
    const [includePhoto, setIncludePhoto] = useState(true);
    const [photoMode, setPhotoMode] = useState("first");
    const [includeNotes, setIncludeNotes] = useState(false);
    const [outputFormat, setOutputFormat] = useState("docx");
    const [reason, setReason] = useState("");
    const mutation = useGenerateDossiersMutation();

    const handleSubmit = () => {
        const dossierOptions = { includePhoto, photoMode, includeNotes, outputFormat };
        mutation.mutate([projectIds, dossierOptions, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Згенерувати досьє"
            description={<p>Генерація досьє для всіх відібраних проєктів.</p>}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={getErrorMessage(mutation.error, "Не вдалося виконати операцію")}
        >
            <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={includePhoto} onChange={(e) => setIncludePhoto(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600" />
                    Виводити фото
                </label>
                {includePhoto && (
                    <div className="ml-6 flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <input type="radio" name="photoMode" checked={photoMode === "first"} onChange={() => setPhotoMode("first")} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                            Перше фото
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <input type="radio" name="photoMode" checked={photoMode === "all"} onChange={() => setPhotoMode("all")} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                            Всі фото
                        </label>
                    </div>
                )}
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600" />
                    Виводити примітки
                </label>
                <div>
                    <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Формат виводу</p>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input type="radio" name="outputFormat" checked={outputFormat === "docx"} onChange={() => setOutputFormat("docx")} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                            Word (.docx)
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input type="radio" name="outputFormat" checked={outputFormat === "html"} onChange={() => setOutputFormat("html")} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                            HTML (відкрити у браузері)
                        </label>
                    </div>
                </div>
            </div>
        </BulkFormShell>
    );
};

export default GenerateDossiersForm;
