import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Button, Dialog, DialogBody, DialogFooter, DialogHeader} from "@material-tailwind/react";
import React, {useEffect, useMemo, useState} from "react";
import toast from "react-hot-toast";
import SingleSelect from "../../../../Components/fields/SingleSelect.jsx";

const TOAST_STYLE = {
    style: {
        background: 'dark:dark:bg-slate-800',
        color: 'text-slate-400',
    },
};

// Модалка кураторства набору проєктів задачі (taskLink): таблиця з
// пошуком по доданих, видалення рядків, додавання через фільтр-движок
// проєктів (той самий, що на /project). Масовий відбір за фільтрами —
// на сторінці /project через корзину (не дублюємо фільтри тут).
// Винесено з TaskViewPanel.jsx — самодостатня модалка, монтується лише
// поки відкрита; чернетка (draft) ініціалізується з initialProjects при
// монтуванні (== відкритті).
const ProjectsSetModal = ({onClose, taskId, initialProjects, auth, token}) => {
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState(initialProjects);
    const [projectsSearch, setProjectsSearch] = useState("");
    const emptyPickerFilters = {fText: "", fDocument: "", fType: null, fAction: null, fProposal: null};
    const [pickerFilters, setPickerFilters] = useState(emptyPickerFilters);
    const [appliedPickerFilters, setAppliedPickerFilters] = useState(emptyPickerFilters);

    const draftIds = useMemo(() => draft.map(project => project.id), [draft]);

    const updateLinkedProjectsMutation = useMutation({
        mutationFn: async (projectIds) => {
            const response = await axios.patch(`/api/task/${taskId}/projects`, {projectIds}, {
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRF-Token": token,
                    "userId": auth?.user?.id,
                }
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Набір проєктів оновлено", TOAST_STYLE);
            queryClient.invalidateQueries({queryKey: ['task-show', taskId]});
        },
        onError: ({response}) => toast.error(response?.data?.message || "Не вдалося оновити набір проєктів"),
    });

    const saveDraft = () => {
        updateLinkedProjectsMutation.mutate(draftIds, {onSuccess: onClose});
    };

    // Дебаунс критеріїв пошуку (текстові поля не смикають бекенд на кожну літеру)
    useEffect(() => {
        const timer = setTimeout(() => setAppliedPickerFilters(pickerFilters), 350);
        return () => clearTimeout(timer);
    }, [pickerFilters]);

    // Словники фільтрів пікера — з options-ендпоінта проєктів
    const {data: pickerVoc} = useQuery({
        queryKey: ['project-picker-voc'],
        queryFn: async () => {
            const response = await axios.get('/api/project/options', {
                params: {only: 'subjectType,action,proposal'},
                headers: {"userId": auth?.user?.id},
            });
            return response.data?.data;
        },
        staleTime: Infinity,
    });
    const pickerVocOptions = useMemo(() => ({
        subjectType: Object.values(pickerVoc?.subjectType || {}),
        action: Object.values(pickerVoc?.action || {}),
        proposal: Object.values(pickerVoc?.proposal || {}),
    }), [pickerVoc]);

    const hasPickerCriteria = Boolean(
        appliedPickerFilters.fText.trim() || appliedPickerFilters.fDocument.trim()
        || appliedPickerFilters.fType || appliedPickerFilters.fAction || appliedPickerFilters.fProposal
    );

    // Пошук проєктів (перші 50 збігів, той самий фільтр-движок, що /project)
    const {data: pickerResponse, isFetching: isPickerLoading} = useQuery({
        queryKey: ['project-picker', appliedPickerFilters],
        queryFn: async () => {
            const response = await axios.get('/api/project/picker', {
                params: {
                    fText: appliedPickerFilters.fText.trim() || undefined,
                    fDocument: appliedPickerFilters.fDocument.trim() || undefined,
                    fType: appliedPickerFilters.fType ? [appliedPickerFilters.fType.id] : undefined,
                    fAction: appliedPickerFilters.fAction ? [appliedPickerFilters.fAction.id] : undefined,
                    fProposal: appliedPickerFilters.fProposal ? [appliedPickerFilters.fProposal.id] : undefined,
                },
                headers: {"userId": auth?.user?.id},
            });
            return response.data?.data;
        },
        enabled: hasPickerCriteria,
        placeholderData: keepPreviousData,
    });
    const pickerItems = pickerResponse?.items || [];
    const pickerTotal = pickerResponse?.total || 0;

    const addPickedProject = (item) => {
        setDraft(prev => prev.some(project => project.id === item.id)
            ? prev
            : [...prev, {id: item.id, name: item.name}]);
    };

    return (
        <Dialog data-i-doc="modal:task-view-panel-projects-set" open handler={onClose} size="md">
            <DialogHeader className="text-base dark:text-slate-100">
                Набір проєктів ({draft.length})
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto pt-0">
                {/* Пошук проєктів для додавання — той самий фільтр-движок, що /project */}
                <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            value={pickerFilters.fText}
                            onChange={(e) => setPickerFilters(prev => ({...prev, fText: e.target.value}))}
                            placeholder="Глобальний пошук…"
                            className="rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                        <input
                            value={pickerFilters.fDocument}
                            onChange={(e) => setPickerFilters(prev => ({...prev, fDocument: e.target.value}))}
                            placeholder="Документ…"
                            className="rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        <SingleSelect size="xs" closeMenuOnSelect isClearable id="picker-type"
                                      options={pickerVocOptions.subjectType}
                                      value={pickerFilters.fType}
                                      onChange={(option) => setPickerFilters(prev => ({...prev, fType: option || null}))}
                                      placeholder="Тип особи"/>
                        <SingleSelect size="xs" closeMenuOnSelect isClearable id="picker-proposal"
                                      options={pickerVocOptions.proposal}
                                      value={pickerFilters.fProposal}
                                      onChange={(option) => setPickerFilters(prev => ({...prev, fProposal: option || null}))}
                                      placeholder="Пакет"/>
                        <SingleSelect size="xs" closeMenuOnSelect isClearable id="picker-action"
                                      options={pickerVocOptions.action}
                                      value={pickerFilters.fAction}
                                      onChange={(option) => setPickerFilters(prev => ({...prev, fAction: option || null}))}
                                      placeholder="Тип дії"/>
                    </div>
                    {hasPickerCriteria &&
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>
                                    {isPickerLoading
                                        ? "Пошук…"
                                        : `Знайдено: ${pickerTotal}${pickerTotal > pickerItems.length ? ` (показано перші ${pickerItems.length})` : ""}`}
                                </span>
                            </div>
                            <div className="mt-1 max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
                                {pickerItems.map(item => {
                                    const alreadyAdded = draft.some(project => project.id === item.id);
                                    return (
                                        <div key={item.id} className="flex items-center gap-2 px-2 py-1">
                                            <span className="shrink-0 font-mono text-[10px] text-slate-400">#{item.id}</span>
                                            <span className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-300">
                                                {item.name || "—"}
                                            </span>
                                            <button type="button"
                                                    disabled={alreadyAdded}
                                                    onClick={() => addPickedProject(item)}
                                                    title={alreadyAdded ? "Вже в наборі" : "Додати в набір"}
                                                    className={alreadyAdded
                                                        ? "cursor-default text-green-500"
                                                        : "text-blue-500 transition hover:text-blue-600"}>
                                                <i className={`fa-regular ${alreadyAdded ? "fa-check" : "fa-plus"}`}></i>
                                            </button>
                                        </div>
                                    );
                                })}
                                {!isPickerLoading && pickerItems.length === 0 &&
                                    <p className="px-2 py-2 text-center text-xs text-slate-400">Нічого не знайдено</p>
                                }
                            </div>
                        </div>
                    }
                </div>

                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    У наборі
                </p>
                {draft.length > 3 &&
                    <input
                        value={projectsSearch}
                        onChange={(e) => setProjectsSearch(e.target.value)}
                        placeholder="Пошук серед доданих…"
                        className="mb-2 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                }
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                    {draft
                        .filter(project => !projectsSearch
                            || String(project.id).includes(projectsSearch)
                            || (project.name || '').toLowerCase().includes(projectsSearch.toLowerCase()))
                        .map(project => (
                            <div key={project.id} className="flex items-center gap-2 px-2.5 py-1.5">
                                <span className="shrink-0 font-mono text-[11px] text-slate-400">#{project.id}</span>
                                <span className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-300">
                                    {project.name || "—"}
                                </span>
                                <button type="button"
                                        onClick={() => setDraft(prev => prev.filter(item => item.id !== project.id))}
                                        title="Прибрати з набору"
                                        className="text-slate-400 transition hover:text-red-500">
                                    <i className="fa-regular fa-xmark"></i>
                                </button>
                            </div>
                        ))}
                    {draft.length === 0 &&
                        <p className="px-2.5 py-3 text-center text-xs text-slate-400">Набір порожній</p>
                    }
                </div>
                <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                    Великі набори зручно збирати в розділі «Проєкти» через корзину («Створити задачу»).
                </p>
            </DialogBody>
            <DialogFooter className="gap-2">
                <Button variant="text" color="blue-gray" onClick={onClose}>Скасувати</Button>
                <Button color="green" disabled={updateLinkedProjectsMutation.isPending}
                        onClick={saveDraft}>
                    {updateLinkedProjectsMutation.isPending ? 'Зберігаю…' : 'Зберегти'}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default ProjectsSetModal;
