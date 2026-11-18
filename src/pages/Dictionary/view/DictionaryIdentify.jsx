import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { confirmToast } from "../../../components/confirmToast.jsx";
import { GROUPS, IDENTIFIER_API } from "../model/dictionaryApi.js";
import { IdentifierListViewModel } from "../viewmodel/DictionaryViewModels.js";
import {Fragment, useMemo} from "react";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";
import Table from "../../../components/Table/Table.jsx";
import {createColumnHelper} from "@tanstack/react-table";
import AdvancedSelect from "../../../components/fields/AdvancedSelect.jsx";
import { Switch, Tooltip } from "@material-tailwind/react"
import Button from "../../../components/Buttons/Button.jsx"
import {convertDate} from "../../../lib/utils.js";
import IdentifyDetailsModal from "./IdentifyDetailsModal.jsx";
import IdentifyModal from "./IdentifyModal.jsx";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import DateRangePicker from "../../../components/fields/DateRangePicker.jsx";
import CollapsibleSection from "../../../components/CollapsibleSection.jsx";

const columnHelper = createColumnHelper();

/** page — DictionaryPageViewModel (словники, права, глобальний voc_user). */
const DictionaryIdentify = ({ page }) => {
    const vm = useViewModel((deps) => new IdentifierListViewModel({ ...deps, page, api: IDENTIFIER_API.v1 }));
    const state = { dictionary: page.vocabulary };
    const auth = page.auth;
    const { countries, subjectTypes } = page;
    const { selectedId, isDetailsOpen, isAddOpen, filters, isLoading, isFetching, data } = vm;
    const handleChangeFilters = vm.table.handleInput;
    const handleChangeOptions = vm.changeOptions;
    const handleLimit = vm.table.setLimit;
    const handlePageChange = vm.table.setPageFromPaginator;
    const handleSortModel = vm.table.applySorting;
    const handleChangeDeleted = vm.changeDeleted;
    const handleChangeDate = vm.changeDate;
    const hasNonEmptyFilter = () => vm.hasActiveFilters;
    const handleClearFilters = vm.clearFilters;
    const toggleAdd = vm.toggleAdd;
    const onDetailsClose = vm.closeDetails;
    const handleDetails = (id) => () => vm.openDetails(id);
    const handleEdit = (id) => () => vm.openEdit(id);
    const handleDelete = (id) => () => confirmToast("Видалити елемент?", () => vm.remove(id));
    const handleRestore = (id) => () =>
        confirmToast("Відновити елемент?", () => vm.restore(id), { confirmText: "Відновити", color: "green" });

    const columns = useMemo(() => [
        columnHelper.accessor("code", {
            id: 'code',
            size: 100,
            header: () => 'Код',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("group", {
            id: 'group',
            size: 100,
            header: () => 'Група',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("pattern", {
            id: 'pattern',
            size: 100,
            header: () => 'Паттерн',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_uk", {
            id: 'name_uk',
            size: 250,
            header: () => 'Назва',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_en", {
            id: 'name_en',
            size: 250,
            header: () => 'Назва англійською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_doc", {
            id: 'name_doc',
            size: 250,
            header: () => 'Виводити як',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("description_uk", {
            id: 'description_uk',
            size: 250,
            header: () => 'Опис українською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("description_en", {
            id: 'description_en',
            size: 250,
            header: () => 'Опис англійською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("subjectTypeId", {
            id: 'subjectTypeId',
            size: 100,
            header: () => "Тип суб'єкта",
            footer: info => info.column.id,
            cell: ({row}) => <span>{row?.original?.subjectTypeId?.caption}</span>,
        }),
        columnHelper.accessor("belongCountryId", {
            id: 'belongCountryId',
            size: 100,
            header: () => 'Країна',
            footer: info => info.column.id,
            cell: ({row}) => <span>{row?.original?.belongCountryId?.caption}</span>,
        }),
        columnHelper.accessor("comment", {
            id: 'comment',
            size: 250,
            header: () => 'Коментар',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('updatedAt', {
            header: () => 'Дата актуал.',
            cell: props => props.getValue() ?
                <Tooltip content={props.getValue()}>
                    {convertDate(props.getValue())}
                </Tooltip>
                : ' ---- ',
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('projectsCount', {
            id: 'projectsCount',
            header: () => 'К-сть. проєктів',
            cell: props => props.getValue(),
            size: 100,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Дії',
            cell: ({row}) => (<div className="flex flex-row gap-x-1 p-1 justify-end">
                {
                    auth?.user?.permissions?.pages?.dictionary?.read && !row?.original?.deletedAt &&
                    <Tooltip content="Деталі">
                        <Button onClick={handleDetails(row?.id)} size="sm" variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    auth?.user?.permissions?.pages?.dictionary?.update && !row?.original?.deletedAt &&
                    <Tooltip content="Редагувати">
                        <Button onClick={handleEdit(row?.id)} size="sm" color="yellow" title="Редагувати">
                            <i className="fa-regular fa-pen-to-square"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    auth?.user?.permissions?.pages?.dictionary?.delete && !row?.original?.deletedAt &&
                    <Tooltip content="Видалити">
                        <Button onClick={handleDelete(row?.id)} size="sm" color="red" title="Видалити">
                            <i className="fa-regular fa-trash"></i>
                        </Button>
                    </Tooltip>
                }
                {
                    (auth?.user?.permissions?.pages?.dictionary?.restore && row?.original?.deletedAt) &&
                    <Tooltip content="Відновити">
                        <Button onClick={handleRestore(row?.id)} size="sm" color="green" title="Відновити">
                            <i className="fa-regular fa-trash-can-arrow-up"></i>
                        </Button>
                    </Tooltip>
                }
            </div>),
        }),
    ], [vm, auth, state?.dictionary])

    return (
        <Fragment>
            {page.tab === "identify" && (
                <PageHeader
                    title="Ідентифікатори"
                    breadcrumbs={[{ label: "Словники", href: "/dictionary" }]}
                    actions={auth?.user?.permissions?.pages?.dictionary?.create && (
                        <HeaderButton icon="fa-solid fa-plus" disabled={isLoading} onClick={toggleAdd}>Додати</HeaderButton>
                    )}
                />
            )}
            <div className="mt-2 mx-2">
                <CollapsibleSection
                    title="Фільтри"
                    showHiddenAppliedBadge
                    className="mb-4 rounded-xl border border-gray-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="min-w-0" data-filter-active={filters?.code?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="code" value={filters.code} label="Код"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.name?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="name" value={filters.name} label="Назва"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.comment?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="comment" value={filters.comment} label="Коментар"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.group?.length > 0 ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={GROUPS} label="Група" id="group"
                                            selectedOptions={filters.group}
                                            onChange={handleChangeOptions('group')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.subjectTypeId?.length > 0 ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti
                                            options={subjectTypes}
                                            label="Тип особи"
                                            id="subjectTypeId"
                                            selectedOptions={filters.subjectTypeId}
                                            onChange={handleChangeOptions('subjectTypeId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.belongCountryId?.length > 0 ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={countries} label="Країна"
                                            id="belongCountryId"
                                            selectedOptions={filters.belongCountryId}
                                            onChange={handleChangeOptions('belongCountryId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                            <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                             label="Дата актуалізації"/>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-2 dark:border-neutral-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            {Boolean(auth?.user?.permissions?.pages?.dictionary?.restore) &&
                                <Tooltip content="Приховати видалені">
                                    <Switch size="xs" ripple={false}
                                            color="green"
                                            name="hideDeleted" checked={filters.hideDeleted}
                                            onChange={handleChangeDeleted}/>
                                </Tooltip>
                            }
                            <Tooltip content="Скинути фільтри">
                                <Button
                                    size="sm"
                                    className="h-9 px-3"
                                    disabled={!hasNonEmptyFilter()}
                                    onClick={handleClearFilters}>
                                    <i className="fa-regular fa-filter-slash mr-1"></i>
                                    Скинути
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </CollapsibleSection>
                <Table
                    onDoubleClick={(row) => {
                        if (auth?.user?.permissions?.pages?.dictionary?.read && !row?.original?.deletedAt) {
                            vm.openDetails(row.id);
                        }
                    }}
                    loading={isFetching}
                    canChangeVisibility
                    textSize="xs"
                    pagination={{
                        onLimitChange: handleLimit,
                        onPageChange: handlePageChange,
                        currentPage: filters?.page,
                        pageSize: data?.limit,
                        totalCount: data?.total,
                    }}
                    data={data?.data}
                    columns={columns}
                    onSort={handleSortModel}
                />
            </div>
            {
                isDetailsOpen &&
                <IdentifyDetailsModal dictionaries={page.dictionaries} open={isDetailsOpen} dictionary={state?.dictionary} onClose={onDetailsClose}
                                      id={selectedId}/>
            }
            {
                isAddOpen &&
                <IdentifyModal dictionaries={page.dictionaries} id={selectedId} open={isAddOpen} onClose={toggleAdd}/>
            }
        </Fragment>
    );
};

export default observer(DictionaryIdentify);
