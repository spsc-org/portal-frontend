import React, { useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Card, IconButton, Spinner, Tooltip, Typography } from "@material-tailwind/react";
import toast from "react-hot-toast";
import Page from "@/Components/Page.jsx";
import { DictionaryProvider } from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import ConfirmModal from "../../Components/Modal/ConfirmModal.jsx";
import {
    getErrorMessage,
    useCountryOptionsQuery,
    useCreateReasonRuleMutation,
    useDeleteReasonRuleMutation,
    useReasonRulesQuery,
    useUpdateReasonRuleMutation,
} from "./entities/reasonRules/queries.js";

const CATEGORY_OPTIONS = [
    { value: "warning", label: "Увага" },
    { value: "forbidden", label: "Заборона" },
    { value: "required", label: "Обов'язково" },
];

const countryName = (c) => c.caption || c.name_uk || c.name_en || "Unnamed";
const ReasonRulesPage = () => {
    const { auth } = usePage().props;
    const { data: rules = [], isLoading } = useReasonRulesQuery();
    const { data: countries = [] } = useCountryOptionsQuery(auth?.user?.id);

    const createMutation = useCreateReasonRuleMutation();
    const updateMutation = useUpdateReasonRuleMutation();
    const deleteMutation = useDeleteReasonRuleMutation();

    const [showInactive, setShowInactive] = useState(false);
    const [phrase, setPhrase] = useState("");
    const [category, setCategory] = useState("warning");
    const [countryId, setCountryId] = useState("");
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [addError, setAddError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);

    const sortedCountries = useMemo(
        () => [...countries].sort((a, b) => countryName(a).localeCompare(countryName(b))),
        [countries],
    );

    const visibleRules = showInactive ? rules : rules.filter((r) => r.is_active);

    const handleAdd = () => {
        const trimmed = phrase.trim();
        if (!trimmed) {
            setAddError("Введіть фразу");
            return;
        }
        setAddError("");

        createMutation.mutate({
            phrase: trimmed,
            category,
            field_type: "reasoning",
            is_case_sensitive: caseSensitive,
            target_country_id: countryId || null,
        }, {
            onSuccess: () => {
                setPhrase("");
                setCaseSensitive(false);
                setCountryId("");
                toast.success("Правило додано");
            },
            onError: (error) => setAddError(getErrorMessage(error, "Не вдалося додати правило")),
        });
    };

    const patchRule = (id, payload, successMessage) => {
        updateMutation.mutate({ id, payload }, {
            onSuccess: () => toast.success(successMessage),
            onError: (error) => toast.error(getErrorMessage(error, "Не вдалося зберегти зміни")),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Правило видалено");
            },
            onError: (error) => toast.error(getErrorMessage(error, "Не вдалося видалити правило")),
        });
    };

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:project-reason-rules" className="mx-auto mt-6 max-w-5xl px-4">
                    <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-slate-100">
                        Системні правила обґрунтувань
                    </h1>

                    <div className="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
                        <p className="mb-1 text-sm text-gray-600 dark:text-slate-400">
                            Глобальні правила застосовуються до всіх користувачів під час перевірки
                            обґрунтування проєкту. Правила <strong>персональні</strong> (налаштовані
                            користувачами) тут не відображаються.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                            <span className="inline-flex items-center gap-1 rounded border border-yellow-300 bg-yellow-100 px-2 py-1 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <i className="fa-solid fa-triangle-exclamation" /> Увага — фраза знайдена, попередження
                            </span>
                            <span className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-100 px-2 py-1 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <i className="fa-solid fa-ban" /> Заборона — фраза знайдена, помилка
                            </span>
                            <span className="inline-flex items-center gap-1 rounded border border-green-300 bg-green-100 px-2 py-1 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <i className="fa-solid fa-circle-check" /> Обов'язково — фраза відсутня, попередження
                            </span>
                        </div>
                    </div>

                    <div className="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
                        <h2 className="mb-4 text-lg font-semibold text-gray-700 dark:text-slate-200">Додати правило</h2>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[240px] flex-1">
                                <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">Фраза</label>
                                <input
                                    type="text"
                                    maxLength={500}
                                    value={phrase}
                                    onChange={(e) => setPhrase(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                    placeholder="Введіть фразу…"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">Категорія</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">Поле</label>
                                <select disabled value="reasoning" className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
                                    <option value="reasoning">Обґрунтування</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-500 dark:text-slate-400">Країна</label>
                                <select
                                    value={countryId}
                                    onChange={(e) => setCountryId(e.target.value)}
                                    className="w-[150px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value="">(Будь-яка)</option>
                                    {sortedCountries.map((c) => <option key={c.id} value={c.id}>{countryName(c)}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 pb-2">
                                <input
                                    type="checkbox"
                                    id="rrCaseSensitive"
                                    checked={caseSensitive}
                                    onChange={(e) => setCaseSensitive(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:border-slate-600"
                                />
                                <label htmlFor="rrCaseSensitive" className="cursor-pointer text-sm text-gray-600 dark:text-slate-400">
                                    З урахуванням регістру
                                </label>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    disabled={createMutation.isPending}
                                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    <i className="fa-solid fa-plus" /> Додати
                                </button>
                            </div>
                        </div>
                        {addError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{addError}</p>}
                    </div>

                    <Card className="overflow-hidden shadow-md dark:bg-slate-800">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200">Список правил</h2>
                            <div className="flex items-center gap-3">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                                    <input
                                        type="checkbox"
                                        checked={showInactive}
                                        onChange={(e) => setShowInactive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 dark:border-slate-600"
                                    />
                                    Показати неактивні
                                </label>
                                <span className="text-xs text-gray-400 dark:text-slate-500">{visibleRules.length} із {rules.length}</span>
                            </div>
                        </div>

                        {isLoading && (
                            <div className="flex items-center justify-center py-12 text-gray-400 dark:text-slate-500">
                                <Spinner className="mr-2 h-5 w-5" /> Завантаження…
                            </div>
                        )}

                        {!isLoading && visibleRules.length === 0 && (
                            <div className="py-12 text-center text-sm text-gray-400 dark:text-slate-500">
                                <i className="fa-solid fa-list-check mb-2 block text-3xl opacity-30" />
                                Немає правил
                            </div>
                        )}

                        {!isLoading && visibleRules.length > 0 && (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Фраза</th>
                                        <th className="w-[120px] px-4 py-3 text-left">Категорія</th>
                                        <th className="w-[180px] px-4 py-3 text-left">Країна</th>
                                        <th className="w-[120px] px-4 py-3 text-left">Поле</th>
                                        <th className="w-[100px] px-4 py-3 text-center">Регістр</th>
                                        <th className="w-[80px] px-4 py-3 text-center">Активне</th>
                                        <th className="w-[80px] px-4 py-3 text-right">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {visibleRules.map((r) => (
                                        <tr key={r.id} className={`transition hover:bg-gray-50 dark:hover:bg-slate-700/50 ${r.is_active ? "" : "opacity-50"}`}>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-gray-800 dark:text-slate-200">{r.phrase}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={r.category}
                                                    onChange={(e) => patchRule(r.id, { category: e.target.value }, "Категорію змінено")}
                                                    className="cursor-pointer rounded border border-transparent bg-transparent px-2 py-1 text-xs hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:text-slate-200 dark:hover:border-slate-600"
                                                >
                                                    {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <select
                                                    value={r.target_country_id ?? ""}
                                                    onChange={(e) => patchRule(r.id, { target_country_id: e.target.value || null }, "Країну змінено")}
                                                    className="w-full cursor-pointer rounded border border-transparent bg-transparent px-2 py-1 text-xs hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:text-slate-200 dark:hover:border-slate-600"
                                                >
                                                    <option value="">(Будь-яка)</option>
                                                    {sortedCountries.map((c) => <option key={c.id} value={c.id}>{countryName(c)}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-slate-400">
                                                {r.field_type === "reasoning" ? "Обґрунтування" : r.field_type}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={r.is_case_sensitive}
                                                    onChange={(e) => patchRule(r.id, { is_case_sensitive: e.target.checked }, "Налаштування регістру змінено")}
                                                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 dark:border-slate-600"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    title={r.is_active ? "Деактивувати" : "Активувати"}
                                                    onClick={() => patchRule(r.id, { is_active: !r.is_active }, r.is_active ? "Правило деактивовано" : "Правило активовано")}
                                                    className={`text-sm transition ${r.is_active ? "text-green-600 hover:text-red-500" : "text-gray-400 hover:text-green-600 dark:text-slate-500"}`}
                                                >
                                                    <i className={`fa-solid ${r.is_active ? "fa-toggle-on" : "fa-toggle-off"} text-xl`} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Tooltip content="Видалити">
                                                    <IconButton size="sm" variant="text" onClick={() => setDeleteTarget(r)} className="text-gray-400 hover:text-red-600 dark:text-slate-500">
                                                        <i className="fa-solid fa-trash-can" />
                                                    </IconButton>
                                                </Tooltip>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>
                </div>

                <ConfirmModal
                    open={Boolean(deleteTarget)}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    isLoading={deleteMutation.isPending}
                    title="Видалити правило?"
                    message={deleteTarget ? `Правило «${deleteTarget.phrase}» буде видалено безповоротно.` : ""}
                />
            </Page>
        </DictionaryProvider>
    );
};

export default ReasonRulesPage;
