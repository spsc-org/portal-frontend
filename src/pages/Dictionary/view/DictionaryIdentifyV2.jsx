import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { confirmToast } from "../../../components/confirmToast.jsx";
import { GROUPS, IDENTIFIER_API } from "../model/dictionaryApi.js";
import { IdentifierListViewModel } from "../viewmodel/DictionaryViewModels.js";
import {useMemo} from "react";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";
import Table, {loadColumnSizes} from "../../../components/Table/Table.jsx";
import {createColumnHelper} from "@tanstack/react-table";
import AdvancedSelect from "../../../components/fields/AdvancedSelect.jsx";
import {Button, Switch, Tooltip} from "@material-tailwind/react";
import {convertDate} from "../../../lib/utils.js";
import IdentifyV2DetailsModal from "./IdentifyV2DetailsModal.jsx";
import IdentifyV2Modal from "./IdentifyV2Modal.jsx";
import SearchInput from "../../../components/fields/SearchInput.jsx";
import DateRangePicker from "../../../components/fields/DateRangePicker.jsx";

const columnHelper = createColumnHelper();

/** page — DictionaryPageViewModel (словники, права, глобальний voc_user). */
const DictionaryIdentifyV2 = ({ page }) => {
    const vm = useViewModel((deps) => new IdentifierListViewModel({ ...deps, page, api: IDENTIFIER_API.v2 }));
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
            size: loadColumnSizes()?.find(item => item.column === 'code')?.size || 100,
            header: () => 'Код',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("group", {
            id: 'group',
            size: loadColumnSizes()?.find(item => item.column === 'group')?.size || 100,
            header: () => 'Група',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("pattern", {
            id: 'pattern',
            size: loadColumnSizes()?.find(item => item.column === 'pattern')?.size || 100,
            header: () => 'Паттерн',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_uk", {
            id: 'name_uk',
            size: loadColumnSizes()?.find(item => item.column === 'name_uk')?.size || 250,
            header: () => 'Назва',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_en", {
            id: 'name_en',
            size: loadColumnSizes()?.find(item => item.column === 'name_en')?.size || 250,
            header: () => 'Назва англійською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_doc", {
            id: 'name_doc',
            size: loadColumnSizes()?.find(item => item.column === 'name_doc')?.size || 250,
            header: () => 'Виводити як',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("description_uk", {
            id: 'description_uk',
            size: loadColumnSizes()?.find(item => item.column === 'description_uk')?.size || 250,
            header: () => 'Опис українською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("description_en", {
            id: 'description_en',
            size: loadColumnSizes()?.find(item => item.column === 'description_en')?.size || 250,
            header: () => 'Опис англійською',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("subjectTypeId", {
            id: 'subjectTypeId',
            size: loadColumnSizes()?.find(item => item.column === 'subjectTypeId')?.size || 100,
            header: () => "Тип суб'єкта",
            footer: info => info.column.id,
            cell: ({row}) => <span>{row?.original?.subjectTypeId?.caption}</span>,
        }),
        columnHelper.accessor("belongCountryId", {
            id: 'belongCountryId',
            size: loadColumnSizes()?.find(item => item.column === 'belongCountryId')?.size || 100,
            header: () => 'Країна',
            footer: info => info.column.id,
            cell: ({row}) => <span>{row?.original?.belongCountryId?.caption}</span>,
        }),
        columnHelper.accessor("comment", {
            id: 'comment',
            size: loadColumnSizes()?.find(item => item.column === 'comment')?.size || 250,
            header: () => 'Коментар',
            enableSorting: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('updatedAt', {
            header: () => 'Дата актуал.',
            cell: props => props.getValue()
                ? <Tooltip content={props.getValue()}>{convertDate(props.getValue())}</Tooltip>
                : ' ---- ',
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
            cell: ({row}) => (
                <div className="flex flex-row gap-x-1 p-1 justify-end">
                    {auth?.user?.permissions?.pages?.dictionary?.read && !row?.original?.deletedAt &&
                        <Tooltip content="Деталі">
                            <Button onClick={handleDetails(row?.id)} size="sm" variant="outlined" color="blue">
                                <i className="fa-regular fa-circle-info"/>
                            </Button>
                        </Tooltip>
                    }
                    {auth?.user?.permissions?.pages?.dictionary?.update && !row?.original?.deletedAt &&
                        <Tooltip content="Редагувати">
                            <Button onClick={handleEdit(row?.id)} size="sm" color="yellow">
                                <i className="fa-regular fa-pen-to-square"/>
                            </Button>
                        </Tooltip>
                    }
                    {auth?.user?.permissions?.pages?.dictionary?.delete && !row?.original?.deletedAt &&
                        <Tooltip content="Видалити">
                            <Button onClick={handleDelete(row?.id)} size="sm" color="red">
                                <i className="fa-regular fa-trash"/>
                            </Button>
                        </Tooltip>
                    }
                    {auth?.user?.permissions?.pages?.dictionary?.restore && row?.original?.deletedAt &&
                        <Tooltip content="Відновити">
                            <Button onClick={handleRestore(row?.id)} size="sm" color="green">
                                <i className="fa-regular fa-trash-can-arrow-up"/>
                            </Button>
                        </Tooltip>
                    }
                </div>
            ),
        }),
    ], [vm, auth, state?.dictionary])

    return (
        <span data-i-doc="tab:dictionary-identify-v2" style={{display: "contents"}}>
            <div className="flex flex-row justify-between items-center">
                <div className="grid grid-cols-8 gap-x-2 mb-5">
                    <SearchInput size="xs" name="code" value={filters.code} label="Код"
                                 onChange={handleChangeFilters}/>
                    <SearchInput size="xs" name="name" value={filters.name} label="Назва"
                                 onChange={handleChangeFilters}/>
                    <SearchInput size="xs" name="comment" value={filters.comment} label="Коментар"
                                 onChange={handleChangeFilters}/>
                    <AdvancedSelect size="xs" isMulti options={GROUPS} label="Група" id="group"
                                    selectedOptions={filters.group}
                                    onChange={handleChangeOptions('group')}/>
                    <AdvancedSelect size="xs" isMulti options={subjectTypes} label="Тип особи"
                                    id="subjectTypeId" selectedOptions={filters.subjectTypeId}
                                    onChange={handleChangeOptions('subjectTypeId')}/>
                    <AdvancedSelect size="xs" isMulti options={countries} label="Країна"
                                    id="belongCountryId" selectedOptions={filters.belongCountryId}
                                    onChange={handleChangeOptions('belongCountryId')}/>
                    <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                     label="Дата актуалізації"/>
                    <div className="flex gap-x-2">
                        {Boolean(auth?.user?.permissions?.pages?.dictionary?.restore) &&
                            <div className="mt-5 self-center max-w-[40px]">
                                <Tooltip content="Приховати видалені">
                                    <Switch size="xs" ripple={false} color="green"
                                            name="hideDeleted" checked={filters.hideDeleted}
                                            onChange={handleChangeDeleted}/>
                                </Tooltip>
                            </div>
                        }
                        <div className="flex items-center mt-4">
                            <Tooltip content="Скинути фільтри">
                                <Button size="sm" className="h-10" disabled={!hasNonEmptyFilter()}
                                        onClick={handleClearFilters}>
                                    <i className="fa-regular fa-filter-slash"/>
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
                {page.tab === "identify-v2" && (
                    <PageHeader
                        title="Ідентифікатори v2"
                        breadcrumbs={[{ label: "Словники", href: "/dictionary" }]}
                        actions={auth?.user?.permissions?.pages?.dictionary?.create && (
                            <HeaderButton icon="fa-solid fa-plus" disabled={isLoading} onClick={toggleAdd}>Додати</HeaderButton>
                        )}
                    />
                )}
            </div>
            <div className="mt-6 mx-2">
                <Table
                    onRowClick={(row) => {
                        if (auth?.user?.permissions?.pages?.dictionary?.read && !row?.original?.deletedAt) {
                            vm.openDetails(row.id);
                        }
                    }}
                    onDoubleClick={(row) => {
                        if (auth?.user?.permissions?.pages?.dictionary?.update && !row?.original?.deletedAt) {
                            vm.openEdit(row.id);
                        }
                    }}
                    loading={isFetching}
                    canChangeVisibility
                    canChangeResize
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
            {isDetailsOpen &&
                <IdentifyV2DetailsModal dictionaries={page.dictionaries} open={isDetailsOpen} dictionary={state?.dictionary}
                                        onClose={onDetailsClose} id={selectedId}/>
            }
            {isAddOpen &&
                <IdentifyV2Modal dictionaries={page.dictionaries} id={selectedId} open={isAddOpen} onClose={toggleAdd}/>
            }
        </span>
    );
};

export default observer(DictionaryIdentifyV2);
