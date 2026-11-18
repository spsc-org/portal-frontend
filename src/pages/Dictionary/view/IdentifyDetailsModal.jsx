import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { useStores } from "../../../stores/storeHooks.js";
import { confirmToast } from "../../../components/confirmToast.jsx";
import { IDENTIFIER_API } from "../model/dictionaryApi.js";
import { IdentifierDetailsViewModel } from "../viewmodel/DictionaryViewModels.js";
import { Spinner, Tab, TabPanel, Tabs, TabsBody, TabsHeader, Tooltip } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import { DetailGrid, DetailItem } from "../../../components/DetailFields.jsx";
import { KIT_TAB, KIT_TAB_ACTIVE, KIT_TAB_PANEL, KIT_TABS_HEADER } from "../../../components/tabsStyles.js";
import {useMemo} from "react";
import Table from "../../../components/Table/Table.jsx";
import {createColumnHelper} from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const IdentifyDetailsModal = ({open, id, onClose, dictionary, dictionaries}) => {
    const vm = useViewModel((deps) => new IdentifierDetailsViewModel({ ...deps, api: IDENTIFIER_API.v1, id }));
    const auth = useStores().session.auth;
    const { countries = [], subjectTypes = [] } = dictionaries;
    const state = { dictionary };
    const tab = vm.tab;
    const data = vm.payload;
    const isFetching = vm.isFetching;
    const filters = vm.versionsFilters;
    const identifyVersions = vm.versionsQuery.data;
    const versionsIsLoading = vm.versionsQuery.isFetching;
    const handleEdit = (versionId) => () =>
        confirmToast("Відновити версію?", () => vm.rollback(versionId), { confirmText: "Відновити", color: "green" });

    const details = useMemo(() => {
        if (data?.data) {
            return {
                id: data?.data?.id,
                updatedAt: data?.data?.updatedAt,
                code: data?.data?.current_version?.code,
                description_en: data?.data?.current_version?.description_en,
                description_uk: data?.data?.current_version?.description_uk,
                group: data?.data?.current_version?.group,
                name_en: data?.data?.current_version?.name_en,
                name_uk: data?.data?.current_version?.name_uk,
                name_doc: data?.data?.current_version?.name_doc,
                comment: data?.data?.current_version?.comment,
                pattern: data?.data?.current_version?.pattern,
                updatedUserId: dictionary?.user?.find(c => c.id === data?.data?.current_version?.updatedUserId),
                version: data?.data?.current_version?.version,
                belongCountry: countries?.find(c => c.id === data?.data?.current_version?.belongCountryId),
                subjectType: subjectTypes?.find(item => item.id === data?.data?.current_version?.subjectTypeId),
            }
        }
    }, [data?.data, id])

    const columns = useMemo(() => [
        columnHelper.accessor("version", {
            id: 'version',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Версія',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("code", {
            id: 'code',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Код',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("group", {
            id: 'group',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Група',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("pattern", {
            id: 'pattern',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Паттерн',
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("name_uk", {
            id: 'name_uk',
            size: 250,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Назва',
            footer: info => info.column.id,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("name_en", {
            id: 'name_en',
            size: 250,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Назва англ',
            footer: info => info.column.id,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("name_doc", {
            id: 'name_doc',
            size: 250,
            header: () => 'Виводити як',
            enableSorting: false,
            enableResizing: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("description_uk", {
            id: 'description_uk',
            size: 250,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Опис',
            footer: info => info.column.id,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("description_en", {
            id: 'description_en',
            size: 250,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Опис англ',
            footer: info => info.column.id,
            cell: info => info.getValue()
        }),
        columnHelper.accessor("comment", {
            id: 'comment',
            size: 250,
            header: () => 'Коментар',
            enableSorting: false,
            enableResizing: false,
            footer: info => info.column.id,
            cell: info => info.getValue(),
        }),
        columnHelper.accessor("subjectTypeId", {
            id: 'subjectTypeId',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => "Тип суб'єкта",
            footer: info => info.column.id,
            cell: ({row}) => <span>{row?.original?.subjectTypeId}</span>,
        }),
        columnHelper.accessor("belongCountryId", {
            id: 'belongCountryId',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            header: () => 'Країна',
            footer: info => info.column.id,
            cell: ({row}) =>
                <span>{row?.original?.belongCountryId}</span>,
        }),
        columnHelper.accessor('createdAt', {
            id: 'createdAt',
            header: () => 'Дата створення',
            cell: props => props.getValue() || ' ---- ',
            size: 100,
            enableSorting: false,
            enableResizing: false,
            footer: info => info.column.id,
        }),
        columnHelper.accessor('updatedUserId', {
            id: 'updatedUserId',
            header: () => 'Створено',
            cell: props => {
                return dictionary?.user?.find(c => c.id === props.getValue())?.caption || ""
            },
            size: 100,
            enableSorting: false,
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
                    (auth?.user?.permissions?.pages?.dictionary?.update && row?.original?.id !== data?.data?.currentVersion) &&
                    <Tooltip content="Відновити">
                        <Button onClick={handleEdit(row?.id)} size="sm" color="green" title="Відновити">
                            <i className="fa-regular fa-rotate-left"></i>
                        </Button>
                    </Tooltip>
                }

            </div>),
        }),
    ], [auth, id, data, state?.dictionary])

    const versions = useMemo(() => {
        if (identifyVersions?.data?.length) {
            return identifyVersions?.data?.map(item => {
                return {
                    ...item,
                    subjectTypeId: subjectTypes.find(t => t.id === item?.subjectTypeId)?.caption,
                    belongCountryId: countries?.find(c => c.id === item?.belongCountryId)?.caption
                }
            })
        } else {
            return []
        }
    }, [identifyVersions, id])


    const handleLimit = vm.setVersionsLimit;
    const handlePageChange = vm.setVersionsPage;

    return (
        <Modal data-i-doc="modal:dictionary-identify-details-modal" open={open} size="xl" onClose={onClose}>
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    Ідентифікатор{details?.code ? <span className="ml-2 normal-case text-blue-600 dark:text-blue-400">{details.code}</span> : null}
                </h3>
            </ModalHeader>
            <ModalBody>
                {isFetching ?
                    <div className="flex w-full justify-center py-10">
                        <Spinner className="h-12 w-12"/>
                    </div>
                    :
                    <Tabs value={tab}>
                        <TabsHeader {...KIT_TABS_HEADER}>
                            <Tab value="info" className={KIT_TAB} activeClassName={KIT_TAB_ACTIVE}>Загальна інформація</Tab>
                            <Tab value="history" className={KIT_TAB} activeClassName={KIT_TAB_ACTIVE}>
                                <div className="flex flex-row items-center gap-x-2">
                                    Версії змін
                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-semibold text-gray-700 dark:bg-neutral-700 dark:text-gray-200">
                                        {versions?.length ?? 0}
                                    </span>
                                </div>
                            </Tab>
                        </TabsHeader>
                        <TabsBody>
                            <TabPanel data-i-doc="tab:dictionary-identify-info" value="info" className={KIT_TAB_PANEL}>
                                <DetailGrid>
                                    <DetailItem label="ID" value={details?.id}/>
                                    <DetailItem label="Код" value={details?.code}/>
                                    <DetailItem label="Група" value={details?.group}/>
                                    <DetailItem label="Паттерн">
                                        {details?.pattern
                                            ? <code className="block break-words rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200">{details.pattern}</code>
                                            : <span className="text-gray-500">—</span>}
                                    </DetailItem>
                                    <DetailItem label="Назва українською" value={details?.name_uk}/>
                                    <DetailItem label="Опис українською" value={details?.description_uk}/>
                                    <DetailItem label="Виводити як" value={details?.name_doc}/>
                                    <DetailItem label="Опис англійською" value={details?.description_en}/>
                                    <DetailItem label="Назва англійською" value={details?.name_en}/>

                                    <DetailItem label="Коментар" value={details?.comment}/>
                                    <DetailItem label="Тип суб'єкта" value={details?.subjectType?.caption}/>
                                    <DetailItem label="Країна" value={details?.belongCountry?.caption}/>

                                    <DetailItem label="Створено" value={data?.data?.createdAt}/>
                                    <DetailItem label="Останнє оновлення" value={data?.data?.updatedAt}/>
                                </DetailGrid>
                            </TabPanel>
                            <TabPanel data-i-doc="tab:dictionary-identify-history" value="history" className={KIT_TAB_PANEL}>
                                <h4 className="mb-3 text-sm font-bold text-gray-800 dark:text-gray-200">Версії</h4>
                                <Table
                                    loading={versionsIsLoading}
                                    canChangeVisibility={false}
                                    textSize="xs"
                                    pagination={{
                                        onLimitChange: handleLimit,
                                        onPageChange: handlePageChange,
                                        currentPage: filters?.page,
                                        pageSize: filters.limit,
                                        totalCount: identifyVersions?.total,
                                    }}
                                    data={versions} columns={columns}
                                />
                            </TabPanel>
                        </TabsBody>
                    </Tabs>
                }
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(IdentifyDetailsModal);
