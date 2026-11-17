import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { ViewModelProvider } from "../../shared/mvvm/ViewModelContext.jsx";
import { confirmToast } from "../../components/confirmToast.jsx";
import { ProposalListViewModel } from "./viewmodel/ProposalViewModels.js";
import {createColumnHelper} from "@tanstack/react-table";
import {Link} from "react-router";
import {useMemo} from "react";
import {Button, Popover, PopoverContent, PopoverHandler, Switch, Tooltip} from "@material-tailwind/react";
import {format} from "date-fns";
import Table, {loadColumnSizes} from "../../components/Table/Table.jsx";
import Page from "../../components/Page.jsx";
import SearchInput from "../../components/fields/SearchInput.jsx";
import CreateProposalModal from "./CreateProposalModal.jsx";
import UpdateProposalModal from "./UpdateProposalModal.jsx";
import ProposalDetailsModal from "./ProposalDetailsModal.jsx";
import AdvancedSelect from "../../components/fields/AdvancedSelect.jsx";
import SingleSelect from "../../components/fields/SingleSelect.jsx";
import DateRangePicker from "../../components/fields/DateRangePicker.jsx";
import CollapsibleSection from "../../components/CollapsibleSection.jsx";
import PageHeader from "../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../layouts/app/HeaderButtons.jsx";


const columnHelper = createColumnHelper();
const PROPOSAL_STATE = [
    {
        value: undefined, label: "Всі"
    },
    {
        value: "1", label: "Зафіксовані"
    },
    {
        value: "0", label: "Незафіксовані"
    }
]
const IndexContent = observer(({ vm }) => {
    const {auth, users = [], issuers = [], proposalState = [], decrees = []} = vm.props;
    const { filters, selectedId, isDetailsOpen, data, isFetching } = vm;
    const openCreate = vm.isCreateOpen;
    const setOpenCreate = () => vm.closeCreate();
    const editOpen = Boolean(vm.editDialog);
    const editDialogProps = vm.editDialog;
    const handleEditClose = vm.closeEdit;
    const handleAdd = vm.openCreate;
    const clearSelected = () => {};
    const setIsDetailsOpen = () => vm.closeDetails();
    const setSelectedId = (id) => vm.openDetails(id);
    const handleClearFilters = vm.clearFilters;
    const handleChangeFilters = vm.table.handleInput;
    const handleLimit = vm.table.setLimit;
    const handlePageChange = vm.table.setPageFromPaginator;
    const handleSortModel = vm.table.applySorting;
    const handleChangeOptions = vm.changeOptions;
    const handleDetails = (id) => () => vm.openDetails(id);
    const handleRestore = (id) => () => confirmToast("Відновити подання?", () => vm.restore(id), { confirmText: "Відновити", color: "green" });
    const handleDelete = (id) => () => confirmToast(`Ви хочете видалити пакет. #${id} Видалення пакету не видаляє пропозицій, що входять до нього. Дійсно видалити пакет?`, () => vm.remove(id));
    const showRestoreBtn = (row) => vm.canRestore(row);

    const columns = useMemo(() => [
        columnHelper.accessor("id", {
            id: 'id',
            size: 60,
            header: () => 'ID',
            cell: info => {
                return (<div className="space-x-5">
                    <span>{info.getValue()}</span>
                    <span className="text-lg">

                    {
                        Boolean(info.row?.original?.isHistorical) &&
                        <Tooltip content="Зафіксований">
                            <i className=" text-blue-600 fa-solid fa-lock"></i>
                        </Tooltip>
                    }
                  </span>

                </div>)
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("issuerId", {
            id: 'issuerId',
            size: loadColumnSizes()?.find(item => item.column === 'issuerId')?.size || 150,
            header: () => "Суб'єкт подання",
            cell: info => {
                if (info.getValue()) {
                    const issuer = issuers.find(i => i.id === info.getValue());
                    return (<span>{issuer?.caption} </span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("stateId", {
            id: 'stateId',
            size: loadColumnSizes()?.find(item => item.column === 'stateId')?.size || 100,
            header: () => 'Стан',
            cell: info => {
                if (info.getValue()) {
                    const state = proposalState.find(i => i.id === info.getValue());
                    return (<span> <i className={state?.icon}></i> {state?.caption}</span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor("caption", {
            id: 'caption',
            size: loadColumnSizes()?.find(item => item.column === 'caption')?.size || 100,
            header: () => 'Назва',
            cell: info => <HighlightedText
                text={info.getValue()}
                filter={filters?.text || ''}
            />,
            footer: info => info.column.id,
        }),
        columnHelper.accessor("description", {
            id: 'description',
            size: loadColumnSizes()?.find(item => item.column === 'description')?.size || 100,
            header: () => 'Опис',
            cell: info => {
                const rawValue = info.getValue();
                const isLongText = typeof rawValue === "string" && rawValue.length > 80;
                const displayText = isLongText ? `${rawValue.slice(0, 80)}...` : rawValue;
                return isLongText ?
                    <Popover>
                        <PopoverHandler>
                            <span
                                className="inline-flex w-full cursor-pointer max-w-[150px] hover:underline">{displayText}</span>
                        </PopoverHandler>
                        <PopoverContent
                            className="bg-white dark:bg-gray-800 shadow-md max-w-lg max-h-80 overflow-auto font-normal text-xs text-slate-600 dark:text-slate-200">
                            {rawValue}
                        </PopoverContent>
                    </Popover> : <span>{info.getValue()}</span>

            },
            enableSorting: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor("calcSummary", {
            id: 'calcSummary',
            size: loadColumnSizes()?.find(item => item.column === 'calcSummary')?.size || 250,
            header: () => 'Summary',
            cell: info => {
                return <span dangerouslySetInnerHTML={{__html: info.getValue()}}/>
            },
            enableSorting: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor("decreeIds", {
            id: 'decreeIds',
            size: loadColumnSizes()?.find(item => item.column === 'decreeIds')?.size || 250,
            header: () => 'Указ',
            cell: info => {
                return (info.getValue() || []).map((item, key) => {
                    const decree = decrees.find(i => i.id === item);
                    return <p key={key} className="m-0.5 p-0.5 text-xs rounded-md ">{decree?.name}</p>
                })
            },
            enableSorting: false,
            footer: info => info.column.id,
        }),

        columnHelper.accessor('outgoingDate', {
            id: "outgoingDate",
            header: () => 'Дата реєстрації',
            cell: props => props.getValue() ?
                <span> {format(props.getValue(), "dd.MM.yyyy")}</span>
                : ' ---- ',
            size: 100,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('outgoingNumber', {
            id: "outgoingNumber",
            header: () => 'Реєстраційний номер',
            size: 100,
            cell: info => (<HighlightedText
                text={info.getValue()}
                filter={filters?.text || ''}
            />),
            footer: info => info.column.id,
        }),

        columnHelper.accessor('comments', {
            id: "comments",
            header: () => 'Коментар',
            size: 100,
            enableResizing: false,
            cell: info => {
                const rawValue = info.getValue();
                const isLongText = typeof rawValue === "string" && rawValue.length > 80;
                const displayText = isLongText ? `${rawValue.slice(0, 80)}...` : rawValue;
                return isLongText ?
                    <Popover>
                        <PopoverHandler>
                            <span
                                className="inline-flex w-full cursor-pointer max-w-[150px] hover:underline">{displayText}</span>
                        </PopoverHandler>
                        <PopoverContent
                            className="bg-white dark:bg-gray-800 shadow-md max-w-lg max-h-80 overflow-auto font-normal text-xs text-slate-600 dark:text-slate-200">
                            {rawValue}
                        </PopoverContent>
                    </Popover> : <span>{info.getValue()}</span>

            },
            footer: info => info.column.id,
        }),
        columnHelper.accessor('createdUserId', {
            id: "createdUserId",
            header: () => 'Створив',
            size: 100,
            cell: info => {
                if (info.getValue()) {
                    const user = users.find(i => i.id === info.getValue());
                    return (<span>{user?.name}</span>)
                }
                return "";
            },
            footer: info => info.column.id,
        }),
        columnHelper.display({
            id: 'actions',
            maxSize: 80,
            header: () => 'Дії',
            enableSorting: false,
            enableResizing: false,
            cell: ({row}) => (
                <div className="flex flex-row gap-x-2 p-2 justify-end">
                    {
                        Boolean(row?.original?.deletedAt) &&
                        <Button onClick={handleDetails(row?.id)} size="sm"
                                variant="outlined" color="blue">
                            <i className="fa-regular fa-circle-info"></i>
                        </Button>
                    }
                    {
                        !row?.original?.deletedAt &&
                        <Tooltip content="Детальна інформація та наповнення">
                            <Link to={`/proposal/${row.id}`}>
                                <Button size="sm"
                                        variant="filled" color="blue">
                                    <i className="fa-regular fa-list"></i>
                                </Button>
                            </Link>
                        </Tooltip>
                    }
                    {
                        Boolean(auth?.user?.permissions?.pages?.proposal?.delete)
                        && !row?.original?.isHistorical
                        && !row?.original?.deletedAt
                        && <Tooltip content="Видалити">
                            <Button
                                onClick={handleDelete(row?.id)}
                                size="sm"
                                color="red">
                                <i className="fa-regular fa-trash"></i>
                            </Button>
                        </Tooltip>
                    }
                    {
                        showRestoreBtn(row) ? <Tooltip content="Відновити">
                                <Button onClick={handleRestore(row?.id)} size="sm" color="green" title="Відновити">
                                    <i className="fa-regular fa-trash-can-arrow-up"></i>
                                </Button>
                            </Tooltip>
                            : null
                    }

                </div>),
        }),

    ], [vm, auth, data])

    const toggleFilterSwitch = ({target}) => vm.table.patchFilters({ [target.name]: target.checked }, { resetPage: false });
    const handleChangeDate = (range) => {
        if (range?.from || range?.to) {
            vm.table.patchFilters({ from: format(range.from, "yyyy-MM-dd") || "", to: format(range.to, "yyyy-MM-dd") || "" }, { resetPage: false });
        } else {
            vm.table.patchFilters({ from: undefined, to: undefined }, { resetPage: false });
        }
    };

    return (
            <Page>
                <PageHeader
                    title="Подання"
                    actions={auth?.user?.permissions?.pages?.proposal?.create && <HeaderButton icon="fa-solid fa-plus" onClick={handleAdd}>Додати</HeaderButton>}
                />
                <span data-i-doc="page:proposal" hidden />

                <CollapsibleSection
                    title="Фільтри"
                    showHiddenAppliedBadge
                    className="mt-2 mb-4 rounded-xl border border-gray-200 bg-gray-50/80 p-3 shadow-md dark:border-gray-700 dark:bg-gray-900/60 sm:p-4"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        <div className="min-w-0" data-filter-active={filters?.text?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="text" value={filters.text} label="Фільтр за текстом"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0"
                             data-filter-active={filters?.outgoingNumber?.trim() ? "true" : "false"}>
                            <SearchInput size="xs" name="outgoingNumber" value={filters.outgoingNumber}
                                         label="Реєстраційний номер"
                                         onChange={handleChangeFilters}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.issuerId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={issuers} label="Суб'єкт подання" id="issuerId"
                                            selectedOptions={filters.issuerId}
                                            onChange={handleChangeOptions('issuerId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.decreeId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={decrees} label="Указ" id="decreeId"
                                            selectedOptions={filters.decreeId}
                                            onChange={handleChangeOptions('decreeId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.stateId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={proposalState} label="Стан" id="stateId"
                                            selectedOptions={filters.stateId}
                                            onChange={handleChangeOptions('stateId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={filters?.createdUserId?.length ? "true" : "false"}>
                            <AdvancedSelect size="xs" isMulti options={users} label="Створив"
                                            id="createdUserId"
                                            selectedOptions={filters.createdUserId}
                                            onChange={handleChangeOptions('createdUserId')}/>
                        </div>
                        <div className="min-w-0" data-filter-active={(filters?.from || filters?.to) ? "true" : "false"}>
                            <DateRangePicker size="xs" onChange={handleChangeDate} from={filters.from} to={filters.to}
                                             label="Дата"/>
                        </div>
                        <div className="min-w-0"
                             data-filter-active={filters?.hideNonHistorical?.value !== undefined ? "true" : "false"}>
                            <SingleSelect size="xs" closeMenuOnSelect options={PROPOSAL_STATE}
                                          label="Зафіксовані"
                                          id="hideNonHistorical"
                                          value={filters.hideNonHistorical}
                                          onChange={handleChangeOptions('hideNonHistorical')}/>
                        </div>

                        <div
                            className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-2 dark:border-gray-700 sm:col-span-2 xl:col-span-4 2xl:col-span-5">
                            <Tooltip content="Приховати видалені">
                                <label
                                    htmlFor="hideDeleted"
                                    data-filter-active={filters.hideDeleted ? "true" : "false"}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-300 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200"
                                >
                                    <Switch
                                        id="hideDeleted"
                                        ripple={false}
                                        color="green"
                                        name="hideDeleted"
                                        checked={filters.hideDeleted}
                                        onChange={toggleFilterSwitch}
                                    />
                                    <span>Приховати видалені</span>
                                </label>
                            </Tooltip>

                            <Tooltip content="Скинути фільтри">
                                <Button
                                    size="sm"
                                    className="h-9 px-3"
                                    onClick={handleClearFilters}
                                >
                                    <i className="fa-regular fa-filter-slash mr-1"></i>
                                    Скинути
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </CollapsibleSection>
                <Table
                    onDoubleClick={(row) => setSelectedId(row?.id)}
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
                    }} data={data?.data} columns={columns} onSort={handleSortModel}
                />
                {
                    selectedId && isDetailsOpen &&
                    <ProposalDetailsModal open={isDetailsOpen} selectedId={selectedId} onClose={() => {
                        clearSelected();
                        setIsDetailsOpen(false);
                    }}/>
                }
                {
                    editOpen && <UpdateProposalModal open={editOpen} {...editDialogProps} onClose={handleEditClose}/>
                }
                {
                    openCreate && <CreateProposalModal open={openCreate} onClose={() => setOpenCreate(!openCreate)}/>
                }

            </Page>
    );
});

/** Маршрут /proposal (pageAccess). Словники — /api/spa/pages/proposal/options. */
const Index = () => {
    const vm = useViewModel((deps) => new ProposalListViewModel(deps));
    return (
        <ViewModelProvider value={vm}>
            <IndexContent vm={vm}/>
        </ViewModelProvider>
    );
};

export default observer(Index);

const HighlightedText = ({text, filter}) => {
    if (!filter || !text) {
        return text;
    }

    const parts = text.split(new RegExp(`(${filter})`, 'gi'));

    return (
        <span>
      {parts.map((part, index) =>
          part.toLowerCase() === filter.toLowerCase() ? (
              <span key={index} className="bg-yellow-200">{part}</span>
          ) : (
              <span key={index}>{part}</span>
          )
      )}
    </span>
    );
};
