import React, { useMemo, useState } from "react";
import { useCartCollectionQuery } from "../../entities/cart/queries.js";
import { useProjectOptionsQuery } from "../../entities/project/queries.js";
import ActionTypeIcon from "./cells/ActionTypeIcon.jsx";
import SubjectTypeIcon from "./cells/SubjectTypeIcon.jsx";
import StateIcon from "./cells/StateIcon.jsx";
import RestrictionsCell from "./cells/RestrictionsCell.jsx";
import CategoriesCell from "./cells/CategoriesCell.jsx";
import DecreeCell from "./cells/DecreeCell.jsx";
import ProposalsCell from "./cells/ProposalsCell.jsx";

// tab-1 — "Відібрані проєкти". Колонки й логіка форматування — порт
// TableManager.js (renderCellActionType/SubjectType/State/Restrictions/
// Categories/Decree/Proposals), винесений у атомарні cells/*.jsx — НЕ міст
// у легасі (на відміну від першої версії цього файлу): коли легасі
// TableManager.js колись приберуть, ця вкладка продовжить працювати
// незалежно. Ці ж атомарні компоненти — готова основа під майбутній
// переклад ГОЛОВНОГО списку проєктів на React (той самий рендер комірок).
const parsePrecomputedData = (raw) => {
    if (!raw || raw === "undefined" || raw === "null") return {};
    try {
        return typeof raw === "object" ? raw : JSON.parse(raw);
    } catch {
        return {};
    }
};

const SelectedProjectsTab = ({ cart, userId }) => {
    const [search, setSearch] = useState("");

    const { data: collection = [], isLoading } = useCartCollectionQuery(cart.ids, userId);
    const { data: vocabularies } = useProjectOptionsQuery(["state", "user"], userId);
    const states = vocabularies?.state ?? [];
    const users = vocabularies?.user ?? [];
    const userCaption = (id) => users.find((u) => String(u.id) === String(id))?.caption ?? "";

    const filtered = useMemo(() => {
        if (!search.trim()) return collection;
        const q = search.toLowerCase();
        return collection.filter((row) => (row.nameUk ?? "").toLowerCase().includes(q) || String(row.id).includes(q));
    }, [collection, search]);

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-neutral-600 dark:bg-neutral-750">
                <div className="relative w-72">
                    <i className="fas fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Пошук по списку..."
                        autoComplete="off"
                        className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                </div>
                <button
                    type="button"
                    onClick={cart.clear}
                    disabled={cart.ids.length === 0}
                    className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                    <i className="fa-solid fa-trash-can text-xs" />
                    <span>Очистити список</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-400">
                            <th className="whitespace-nowrap px-3 py-2">ID</th>
                            <th className="whitespace-nowrap px-3 py-2">Дія</th>
                            <th className="whitespace-nowrap px-3 py-2">Тип</th>
                            <th className="whitespace-nowrap px-3 py-2">Стан</th>
                            <th className="min-w-[180px] px-3 py-2">Назва</th>
                            <th className="whitespace-nowrap px-3 py-2">Обмеження</th>
                            <th className="whitespace-nowrap px-3 py-2">Категорії</th>
                            <th className="whitespace-nowrap px-3 py-2">Пакет / подання</th>
                            <th className="whitespace-nowrap px-3 py-2">Примітки</th>
                            <th className="whitespace-nowrap px-3 py-2">Користувачі</th>
                            <th className="w-10 px-3 py-2" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                        {isLoading && (
                            <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-400 dark:text-gray-500">Завантаження…</td></tr>
                        )}
                        {!isLoading && filtered.length === 0 && (
                            <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-400 dark:text-gray-500">Список порожній</td></tr>
                        )}
                        {filtered.map((row) => {
                            const precomputedData = parsePrecomputedData(row.precomputedData);
                            return (
                                <tr key={row.id} className={row.isDisabled === 1 ? "bg-gray-200 dark:bg-neutral-800" : "text-gray-700 dark:text-gray-200"}>
                                    <td className="whitespace-nowrap px-3 py-2">
                                        {row.id}{" "}
                                        {row.deletedAt && <span className="rounded bg-red-300 p-1">DELETED</span>}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2"><ActionTypeIcon actionType={row.actionTypeId} /></td>
                                    <td className="whitespace-nowrap px-3 py-2"><SubjectTypeIcon typeId={row.subjectTypeId} /></td>
                                    <td className="whitespace-nowrap px-3 py-2"><StateIcon stateId={row.stateId} states={states} /></td>
                                    <td className="px-3 py-2">{row.nameUk || row.nameEn || "—"}</td>
                                    <td className="px-3 py-2"><RestrictionsCell precomputedData={precomputedData} /></td>
                                    <td className="px-3 py-2"><CategoriesCell precomputedData={precomputedData} /></td>
                                    <td className="px-3 py-2">
                                        <DecreeCell decreeCode={row.decreeCode} expiredAt={row.expiredAt} decree={precomputedData?.decree} />
                                        <ProposalsCell precomputedData={precomputedData} />
                                    </td>
                                    <td className="max-w-[220px] truncate px-3 py-2" title={row.notes ?? ""}>{row.notes || "—"}</td>
                                    <td className="whitespace-nowrap px-3 py-2">
                                        {userCaption(row.createdUserId)}
                                        <br />
                                        {userCaption(row.updatedUserId)}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => cart.remove(row.id)}
                                            title="Прибрати зі списку"
                                            className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                                        >
                                            <i className="fas fa-xmark" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SelectedProjectsTab;
