import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { OrphansViewModel } from "../../viewmodel/DossierViewModels.js";

import {Spinner} from "@material-tailwind/react";
import SearchInput from "../../../../components/fields/SearchInput.jsx";
import MultiSelectChip from "../../../../components/fields/MultiSelectChip.jsx";
import ConfirmModal from "../../../../components/Modal/ConfirmModal.jsx";
import SectionLabel from "../../shared/ui/SectionLabel.jsx";
import ModeratorBlock from "../../shared/ui/ModeratorBlock.jsx";
import OrphanRow from "./OrphanRow.jsx";

const byIds = (options, ids) => options.filter((option) => ids.includes(option.id));

const PAGE_SIZE_STORAGE_KEY = "sanctionProfiles.orphansPanel.pageSize";
const PAGE_SIZE_OPTIONS = [50, 100, 200];
const DEFAULT_PAGE_SIZE = 50;

const readPageSizePreference = () => {
    try {
        const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
        return PAGE_SIZE_OPTIONS.includes(stored) ? stored : DEFAULT_PAGE_SIZE;
    } catch {
        return DEFAULT_PAGE_SIZE;
    }
};

// "Список сирот" — проєкти (model_class=1) без жодного звʼязку з досьє (OrphanProjectService).
// Модераторська 4-та колонка сторінки /dossier (див. Index.jsx): відсуває Картку досьє
// (flex-1), а не перекриває її — Реєстр досьє й Картка досьє далі працюють у штатному
// режимі. Незалежна від лівого Реєстру досьє — той лишається звичайним пошуком-довідником
// (id підходящого досьє переписується вручну сюди, жодного програмного звʼязку між панелями).
const OrphansPanel = ({canManage, onClose}) => {
    const vm = useViewModel((deps) => new OrphansViewModel({ ...deps, readPageSize: readPageSizePreference }));
    const { q, subjectTypeIds, stateIds, pageSize, showBulkConfirm, orphans, total, options } = vm;
    const setQ = vm.setQ;
    const setSubjectTypeIds = vm.setSubjectTypeIds;
    const setStateIds = vm.setStateIds;
    const setPageSize = vm.setPageSize;
    const setShowBulkConfirm = vm.setShowBulkConfirm;
    const subjectTypeOptions = options?.subjectTypes ?? [];
    const stateOptions = options?.projectState ?? [];
    const { isFetching, hasNextPage, isFetchingNextPage } = vm.listQuery;
    const fetchNextPage = () => vm.listQuery.fetchNextPage();
    const { link: linkMutation, create: createMutation } = vm.cmd;
    const bulkCreateMutation = {
        mutate: (ids, opts) => vm.bulkCreate(ids).then(() => opts?.onSuccess?.()),
        isPending: vm.cmd.bulkCreate.isPending,
    };

    return (
        <div data-i-doc="view:sanction-profiles-orphans-panel" className="h-full flex flex-col overflow-hidden bg-white dark:bg-neutral-800">
            <div className="flex-none px-4 pt-[18px] pb-3.5 border-b border-gray-100 dark:border-neutral-700">
                <div className="flex items-baseline justify-between gap-2.5">
                    <SectionLabel>Список сирот</SectionLabel>
                    <button
                        type="button"
                        onClick={onClose}
                        title="Закрити"
                        className="flex-none w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-neutral-700"
                    >
                        <i className="fa-solid fa-xmark text-[13px]"></i>
                    </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <div className="text-[11.5px] font-semibold text-gray-600">
                        meta.total: <span className="text-blue-600 dark:text-blue-400">{total}</span> проєктів
                    </div>
                    <div className="flex items-center gap-0.5 rounded-md border border-gray-200 p-0.5 dark:border-neutral-700"
                         title="Розмір сторінки завантаження">
                        {PAGE_SIZE_OPTIONS.map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => setPageSize(size)}
                                className={`rounded px-[7px] py-[3px] text-[10.5px] font-semibold transition ${
                                    pageSize === size
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-2.5">
                    <SearchInput
                        size="xs"
                        name="orphans-q"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Пошук за назвою або drsId"
                        icon="fa-solid fa-magnifying-glass"
                    />
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <MultiSelectChip
                        label="Субʼєкт"
                        icon="fa-solid fa-shapes"
                        options={subjectTypeOptions}
                        value={byIds(subjectTypeOptions, subjectTypeIds)}
                        onChange={(selected) => setSubjectTypeIds(selected.map((option) => option.id))}
                    />
                    <MultiSelectChip
                        label="Стан"
                        icon="fa-solid fa-timeline"
                        options={stateOptions}
                        value={byIds(stateOptions, stateIds)}
                        onChange={(selected) => setStateIds(selected.map((option) => option.id))}
                    />
                </div>
                {orphans.length > 0 && (
                    <ModeratorBlock canManage={canManage} label="Дії із сиротами" className="mt-2.5">
                        <button
                            type="button"
                            disabled={bulkCreateMutation.isPending}
                            onClick={() => setShowBulkConfirm(true)}
                            title={bulkCreateMutation.isPending
                                ? "Створюю…"
                                : `Створити досьє для кожного проєкту, завантаженого зараз на екрані (${orphans.length})`}
                            className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/70"
                        >
                            <i className={`fa-solid ${bulkCreateMutation.isPending ? "fa-spinner fa-spin" : "fa-layer-group"} text-[13px]`}></i>
                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-amber-600 text-white text-[9px] font-bold leading-none">
                                {orphans.length}
                            </span>
                        </button>
                    </ModeratorBlock>
                )}
            </div>

            <ConfirmModal
                open={showBulkConfirm}
                onClose={() => setShowBulkConfirm(false)}
                onConfirm={() =>
                    bulkCreateMutation.mutate(orphans.map((project) => project.id), {
                        onSettled: () => setShowBulkConfirm(false),
                    })
                }
                title="Пакетне створення досьє"
                message={`Створити нове досьє для кожного з ${orphans.length} проєктів, завантажених зараз на екрані? Дію неможливо скасувати.`}
                isLoading={bulkCreateMutation.isPending}
            />

            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
                <div className="flex flex-col gap-2">
                    {isFetching && !orphans.length && (
                        <div className="flex justify-center py-10"><Spinner className="h-8 w-8"/></div>
                    )}
                    {!isFetching && !orphans.length && (
                        <div className="py-10 text-center text-sm text-gray-600">Сиріт не знайдено</div>
                    )}
                    {orphans.map((project) => (
                        <OrphanRow
                            key={project.id}
                            project={project}
                            canManage={canManage}
                            onLink={(profileId) => linkMutation.mutate({profileId, projectId: project.id})}
                            onCreate={() => createMutation.mutate(project.id)}
                            isLinking={linkMutation.isPending}
                            isCreating={createMutation.isPending}
                        />
                    ))}
                    {hasNextPage && (
                        <button
                            type="button"
                            disabled={isFetchingNextPage}
                            onClick={() => fetchNextPage()}
                            className="w-full py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-neutral-700 rounded-lg"
                        >
                            {isFetchingNextPage ? "Завантаження…" : `Показати ще (${orphans.length} із ${total})`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(OrphansPanel);
