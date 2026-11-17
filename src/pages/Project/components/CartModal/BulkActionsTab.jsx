import { useState } from "react";
import { setCartIds } from "../../entities/cart/storage.js";
import AddProposalForm from "./bulkForms/AddProposalForm.jsx";
import AddRestrictionsForm from "./bulkForms/AddRestrictionsForm.jsx";
import RewriteRestrictionsForm from "./bulkForms/RewriteRestrictionsForm.jsx";
import RewriteRestriction25Form from "./bulkForms/RewriteRestriction25Form.jsx";
import SetTermForm from "./bulkForms/SetTermForm.jsx";
import ReplaceTextForm from "./bulkForms/ReplaceTextForm.jsx";
import AddDocumentForm from "./bulkForms/AddDocumentForm.jsx";
import SetPerformerForm from "./bulkForms/SetPerformerForm.jsx";
import SetStateForm from "./bulkForms/SetStateForm.jsx";
import SetValidatorForm from "./bulkForms/SetValidatorForm.jsx";
import GenerateDossiersForm from "./bulkForms/GenerateDossiersForm.jsx";
import CreateTaskForm from "./bulkForms/CreateTaskForm.jsx";

// Порядок і підписи — точна копія лівої навігації bulkTab1..12 з
// modal-cart.blade.php, щоб звірка з легасі була "по пунктах".
const BULK_ITEMS = [
    { id: "bulkTab1", title: "Додати подання", icon: "fas fa-briefcase", Component: AddProposalForm },
    { id: "bulkTab2", title: "Додати обмежувальні заходи", icon: "fas fa-ban", Component: AddRestrictionsForm },
    { id: "bulkTab3", title: "Оновити обмежувальні заходи", icon: "fas fa-ban", Component: RewriteRestrictionsForm },
    { id: "bulkTab4", title: "Перезаписати 25-й захід", icon: "fas fa-ban", Component: RewriteRestriction25Form },
    { id: "bulkTab5", title: "Встановити інший термін", icon: "fas fa-calendar-alt", Component: SetTermForm },
    { id: "bulkTab6", title: "Замінити текст в обгрунтуванні", icon: "fas fa-file-lines", Component: ReplaceTextForm },
    { id: "bulkTab7", title: "Додати документ", icon: "fas fa-file-upload", Component: AddDocumentForm },
    { id: "bulkTab8", title: "Призначити виконавця", icon: "fas fa-user-check", Component: SetPerformerForm },
    { id: "bulkTab9", title: "Встановити стан", icon: "fas fa-spinner", Component: SetStateForm },
    { id: "bulkTab10", title: "Призначити валідатора", icon: "fas fa-user-check", Component: SetValidatorForm },
    { id: "bulkTab11", title: "Згенерувати досьє", icon: "fas fa-file-pdf", Component: GenerateDossiersForm },
    { id: "bulkTab12", title: "Створити задачу", icon: "fas fa-list-check", Component: CreateTaskForm },
];

// tab-2 — "Масові дії": ліва вертикальна навігація на 12 пунктів + права
// панель з активною формою. `onActionDone` спільний для всіх 12 форм —
// саме тут (у CartModal.jsx) зведена уся "після успіху" поведінка
// (toast/file-open/close/legacy-refresh), кожна форма лише викликає його.
const BulkActionsTab = ({ projectIds, userId, onActionDone, cart }) => {
    const [activeId, setActiveId] = useState(BULK_ITEMS[0].id);
    const [loadListText, setLoadListText] = useState("");
    const [loadListError, setLoadListError] = useState("");

    const ActiveComponent = BULK_ITEMS.find((item) => item.id === activeId)?.Component;

    const handleLoadList = () => {
        try {
            const parsed = JSON.parse(loadListText);
            if (!Array.isArray(parsed)) throw new Error("Очікується масив ID");
            setCartIds(parsed.map(Number));
            cart.refresh();
            setLoadListError("");
            setLoadListText("");
        } catch {
            setLoadListError("Некоректний JSON-масив ID, напр. [123, 456, 789]");
        }
    };

    return (
        <div className="flex flex-col gap-6 bg-gray-50 p-6 dark:bg-neutral-900">
            <div className="flex gap-6">
                <div className="w-1/4">
                    <div className="flex flex-col gap-2">
                        {BULK_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveId(item.id)}
                                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                    activeId === item.id
                                        ? "border-blue-500 bg-white text-blue-600 dark:border-blue-500 dark:bg-neutral-800 dark:text-blue-400"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                                }`}
                            >
                                <i className={`${item.icon} mr-2 w-4 text-center`} />{item.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-3/4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-600 dark:bg-neutral-800">
                    {ActiveComponent && (
                        <ActiveComponent projectIds={projectIds} userId={userId} onDone={onActionDone} />
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Поточний список</label>
                <textarea
                    readOnly
                    value={JSON.stringify(projectIds)}
                    className="w-full resize-y rounded-lg border border-gray-300 bg-gray-100 p-3 text-sm text-gray-600 focus:outline-none dark:border-neutral-600 dark:bg-neutral-950 dark:text-gray-400"
                />
            </div>

            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={handleLoadList}
                    className="self-start rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-blue-900/20"
                >
                    <i className="fas fa-upload mr-1.5" />Завантажити новий список
                </button>
                <textarea
                    value={loadListText}
                    onChange={(e) => setLoadListText(e.target.value)}
                    placeholder="Вставте JSON-масив ID: [123, 456, 789]"
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200"
                />
                {loadListError && <p className="text-sm text-red-600 dark:text-red-400">{loadListError}</p>}
            </div>
        </div>
    );
};

export default BulkActionsTab;
