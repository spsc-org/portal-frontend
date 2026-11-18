import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";

// bulkTab4 — "Перезаписати 25-й обмежувальний захід": однаковий текст усім
// відібраним проєктам. Легасі-підказка: щоб ОЧИСТИТИ поле, треба вписати
// буквально слово "очистити" (це бекенд-конвенція, не фронтенд-логіка —
// нічого не інтерпретуємо на клієнті, просто шлемо текст як є).
const RewriteRestriction25Form = ({ projectIds, userId, onDone }) => {
    const [text, setText] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useVM().cartModal.cmd.rewriteRestriction25;

    const handleSubmit = () => {
        mutation.mutate([projectIds, text, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Перезаписати 25-й обмежувальний захід"
            description={(
                <>
                    <p>Встановлює для всіх відібраних проєктів однаковий текст 25-го заходу.</p>
                    <p><span className="font-medium dark:text-blue-200">Увага!</span> Поточний текст буде <strong className="dark:text-blue-200">перезаписано</strong>.</p>
                </>
            )}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
        >
            <div>
                <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Новий текст
                    <span className="text-xs font-normal text-gray-600 dark:text-gray-500" title='Щоб очистити поле, впишіть слово "очистити"'>
                        <i className="fas fa-info-circle" />
                    </span>
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Введіть текст"
                    className="min-h-[100px] w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200 dark:placeholder-gray-500"
                />
            </div>
        </BulkFormShell>
    );
};

export default observer(RewriteRestriction25Form);
