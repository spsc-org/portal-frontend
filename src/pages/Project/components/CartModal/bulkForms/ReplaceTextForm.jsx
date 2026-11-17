import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../../shared/mvvm/index.js";
import { cartErrorMessage } from "../../../model/projectModel.js";
import BulkFormShell from "./BulkFormShell.jsx";

// bulkTab6 — "Замінити текст обґрунтування": пошук/заміна підрядка в тексті
// обґрунтування кожного відібраного проєкта (сервер сам шукає й замінює,
// фронт лише передає search/replace як є).
const ReplaceTextForm = ({ projectIds, userId, onDone }) => {
    const [search, setSearch] = useState("");
    const [replace, setReplace] = useState("");
    const [reason, setReason] = useState("");
    const mutation = useVM().cartModal.cmd.replaceReasoningText;

    const handleSubmit = () => {
        mutation.mutate([projectIds, search, replace, reason, userId], { onSuccess: (result) => onDone(result) });
    };

    return (
        <BulkFormShell
            title="Замінити текст обґрунтування"
            description={<p>Знаходить підрядок «Що шукати» в тексті обґрунтування й замінює на «На що замінити» для кожного відібраного проєкта.</p>}
            reason={reason}
            onReasonChange={setReason}
            onSubmit={handleSubmit}
            isPending={mutation.isPending}
            isError={mutation.isError}
            errorMessage={cartErrorMessage(mutation.error, "Не вдалося виконати операцію")}
            disabled={!search}
        >
            <div className="flex flex-col gap-3">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Що шукати</label>
                    <textarea
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Текст для пошуку"
                        className="min-h-[80px] w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200 dark:placeholder-gray-500"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">На що замінити</label>
                    <textarea
                        value={replace}
                        onChange={(e) => setReplace(e.target.value)}
                        placeholder="Текст заміни"
                        className="min-h-[80px] w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200 dark:placeholder-gray-500"
                    />
                </div>
            </div>
        </BulkFormShell>
    );
};

export default observer(ReplaceTextForm);
