import {useState} from "react";
import { observer } from "mobx-react-lite";
import { useViewModel } from "../../shared/mvvm/useViewModel.js";
import { InventoryDetailsViewModel } from "./viewmodel/InventoryViewModels.js";
import { confirmToast } from "../../components/confirmToast.jsx";
import { Spinner, Tab, TabPanel, Tabs, TabsBody, TabsHeader } from "@material-tailwind/react"
import { DetailGrid, DetailItem } from "../../components/DetailFields.jsx";
import AuditPager from "../../components/Audit/AuditPager.jsx";
import { KIT_TAB, KIT_TAB_ACTIVE, KIT_TAB_PANEL, KIT_TABS_HEADER } from "../../components/tabsStyles.js";
import IconButton from "../../components/Buttons/IconButton.jsx"
import { Modal, ModalHeader, ModalFooter } from "../../components/Modal/Modal.jsx"
import Button from "../../components/Buttons/Button.jsx"
import DocumentGallery from "../../components/DocumentGallary.jsx";
import {useFilteredAttachments} from "../../hooks/useFilteredAttachments.jsx";
import {LoadingDialogBody} from "../../components/Buttons/LoadingDialogBody.jsx";
import ImageGallery from "../../components/ImageGallery.jsx";
import { AUDIT_BODY, AUDIT_CARD, AUDIT_EMPTY, AUDIT_HEAD, AUDIT_META, AUDIT_USER, DIFF_FIELD, DIFF_FROM, DIFF_HEAD_ROW, DIFF_TABLE, DIFF_TH, DIFF_TO, DIFF_TR } from "../../components/Audit/auditStyles.js";

// --- AUDIT COMPONENTS START ---

const FIELD_LABELS = {
    caption: 'Опис',
    serial: 'Серійний номер',
    inventoryNum: 'Інвентарний номер',
    registryNum: 'Реєстр. №',
    amount: 'Кількість',
    cost: 'Вартість',
    valueTypeId: 'Тип',
    locationId: 'Розташування',
    baileeUserId: 'Відповідальний',
    responsibleUserId: 'Мат. відповідальний',
    invoice: 'Накладна',
    note: 'Примітка',
    details: 'Деталі',
};

const ACTION_CONFIG = {
    create:        {label: 'Створено',          color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'},
    clone:         {label: 'Створено копію',    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'},
    update:        {label: 'Оновлено',          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'},
    delete:        {label: 'Видалено',          color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'},
    restore:       {label: 'Відновлено',        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'},
    node_attach:   {label: 'Додано до вузла',   color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'},
    node_detach:   {label: 'Видалено з вузла',  color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300'},
    file_attach:    {label: 'Додано файл',       color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'},
    file_detach:    {label: 'Видалено файл',    color: 'bg-gray-100 text-gray-800 dark:bg-neutral-600 dark:text-gray-300'},
    comment_add:    {label: 'Коментар додано',  color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'},
    comment_edit:   {label: 'Коментар змінено', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'},
    comment_delete: {label: 'Коментар видалено',color: 'bg-gray-100 text-gray-600 dark:bg-neutral-600 dark:text-gray-300'},
    legacy_update:  {label: 'Змінено (архів)',  color: 'bg-gray-100 text-gray-600 dark:bg-neutral-600 dark:text-gray-300'},
};

const ActionBadge = ({action}) => {
    const cfg = ACTION_CONFIG[action] || {label: action, color: 'bg-gray-100 text-gray-800 dark:bg-neutral-600 dark:text-gray-300'};
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

const AuditEntry = ({entry, dictionary, inventoryType, inventoryLocation}) => {
    const [open, setOpen] = useState(true);
    const userName = dictionary?.user?.find(u => u.id === entry.userId)?.caption || `#${entry.userId}`;

    // Convert diff object to array of [field, {from, to}]
    const diffEntries = [];
    if (entry.diff?.changed) {
        Object.entries(entry.diff.changed).forEach(([key, val]) => {
            diffEntries.push([key, {from: val.fromLabel ?? val.from, to: val.toLabel ?? val.to}]);
        });
    }
    if (entry.diff?.added) {
        Object.entries(entry.diff.added).forEach(([key, val]) => {
            const v = (val && typeof val === 'object' && 'label' in val) ? val.label : val;
            diffEntries.push([key, {from: null, to: v}]);
        });
    }
    if (entry.diff?.removed) {
        Object.entries(entry.diff.removed).forEach(([key, val]) => {
            const v = (val && typeof val === 'object' && 'label' in val) ? val.label : val;
            diffEntries.push([key, {from: v, to: null}]);
        });
    }

    const formatValue = (field, value) => {
        if (value === null || value === undefined || value === '') return <span className="italic text-gray-600 dark:text-gray-400">—</span>;
        // Check vocabularies if labels are not provided in diff (though AuditService usually provides labels)
        // For inventory specific fields if needed
        if (field === 'valueTypeId') return inventoryType?.find(t => t.id === value)?.caption || value;
        if (field === 'locationId') return inventoryLocation?.find(l => l.id === value)?.caption || value;

        return String(value);
    };

    return (
        <div className={AUDIT_CARD}>
            <button
                onClick={() => setOpen(o => !o)}
                className={AUDIT_HEAD}
            >
                <div className="flex items-center gap-x-3">
                    <ActionBadge action={entry.action}/>
                    <span className={AUDIT_META}>{entry.createdAt}</span>
                    <span className={AUDIT_USER}>{userName}</span>
                    {entry.action === 'legacy_update' && entry.context ? (
                        <span className={AUDIT_META}>({Object.keys(entry.context).length} зм.)</span>
                    ) : entry.context?.name ? (
                        <span className="text-xs text-purple-500 dark:text-purple-400">{entry.context.name}</span>
                    ) : entry.context?.fileName ? (
                        <span className="text-xs text-blue-500 dark:text-blue-400">{entry.context.fileName}</span>
                    ) : entry.action === 'clone' && entry.context?._clonedFrom ? (
                        <span className="text-xs text-teal-500 dark:text-teal-400">з #{entry.context._clonedFrom}</span>
                    ) : entry.action?.startsWith('comment') && entry.context?.comment ? (
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 truncate max-w-[300px]">{entry.context.comment}</span>
                    ) : entry.action === 'comment_edit' && entry.context?.to ? (
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 truncate max-w-[300px]">{entry.context.to}</span>
                    ) : diffEntries.length > 0 ? (
                        <span className={AUDIT_META}>({diffEntries.length} зм.)</span>
                    ) : null}
                </div>
                <i className={`fa-regular fa-chevron-${open ? 'up' : 'down'} text-gray-600 text-xs`}/>
            </button>

            {open && (
                <div className={AUDIT_BODY}>
                    {entry.action === 'legacy_update' && entry.context ? (
                        <table className={DIFF_TABLE}>
                            <thead>
                            <tr className={DIFF_HEAD_ROW}>
                                <th className={`${DIFF_TH} w-1/4`}>Поле</th>
                                <th className={`${DIFF_TH} w-[37.5%]`}>Було</th>
                                <th className={`${DIFF_TH} w-[37.5%]`}>Стало</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(entry.context).map(([field, val]) => {
                                const [oldVal, newVal] = Array.isArray(val) ? val : [null, val];
                                return (
                                    <tr key={field} className={DIFF_TR}>
                                        <td className={DIFF_FIELD}>
                                            {FIELD_LABELS[field] || field}
                                        </td>
                                        <td className={DIFF_FROM}>
                                            {formatValue(field, oldVal)}
                                        </td>
                                        <td className={DIFF_TO}>
                                            {formatValue(field, newVal)}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    ) : entry.context?.name ? (
                        <p className={AUDIT_USER}>
                            Вузол:&nbsp;
                            <span className="font-medium text-purple-700 dark:text-purple-300">
                                {entry.context.name}
                            </span>
                        </p>
                    ) : entry.context?.fileName ? (
                        <p className={AUDIT_USER}>
                            Файл:&nbsp;
                            <span className="font-medium text-blue-700 dark:text-blue-300">
                                {entry.context.fileName}
                            </span>
                        </p>
                    ) : entry.action === 'comment_add' || entry.action === 'comment_delete' ? (
                        <p className="text-xs dark:text-gray-300 break-words">
                            {entry.context?.comment}
                        </p>
                    ) : entry.action === 'comment_edit' ? (
                        <div className="flex flex-col gap-1 text-xs">
                            <p className="text-red-700 line-through dark:text-red-400">{entry.context?.from}</p>
                            <p className="text-green-600 dark:text-green-400">{entry.context?.to}</p>
                        </div>
                    ) : diffEntries.length === 0 ? (
                        <p className={AUDIT_EMPTY}>Немає змін у відстежуваних полях</p>
                    ) : (
                        <table className={DIFF_TABLE}>
                            <thead>
                            <tr className={DIFF_HEAD_ROW}>
                                <th className={`${DIFF_TH} w-1/4`}>Поле</th>
                                <th className={`${DIFF_TH} w-[37.5%]`}>Було</th>
                                <th className={`${DIFF_TH} w-[37.5%]`}>Стало</th>
                            </tr>
                            </thead>
                            <tbody>
                            {diffEntries.map(([field, {from, to}]) => (
                                <tr key={field} className={DIFF_TR}>
                                    <td className={DIFF_FIELD}>
                                        {FIELD_LABELS[field] || field}
                                    </td>
                                    <td className={DIFF_FROM}>
                                        {formatValue(field, from)}
                                    </td>
                                    <td className={DIFF_TO}>
                                        {formatValue(field, to)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

// --- AUDIT COMPONENTS END ---

const InventoryDetailsModal = ({open, id, onClose, dictionary, readOnly = false}) => {
    const vm = useViewModel((deps) => new InventoryDetailsViewModel({ ...deps, id }));
    const inventoryLocation = dictionary?.inventoryLocation ?? [];
    const inventoryType = dictionary?.inventoryType ?? [];
    const users = dictionary?.user ?? [];
    const responsibleUsers = dictionary?.responsibleUser ?? [];
    const tab = vm.tab;
    const setTab = vm.setTab;
    const auditPage = vm.auditPage;
    const setAuditPage = vm.setAuditPage;
    const data = vm.data;
    const isDictionaryFetching = vm.isFetching;
    const auditData = vm.auditData;
    const auditLoading = vm.auditLoading;
    const auditHistory = auditData?.data ?? [];
    const auditTotal   = auditData?.total ?? 0;
    const auditPages   = auditData?.pages ?? 1;
    const {imageAttachments, wordAttachments} = useFilteredAttachments(data?.attachments);
    const attachImages = vm.attachCmd;
    const attachDocuments = vm.attachCmd;
    const canUpdateRow = vm.canUpdateRow;
    const isReadOnly = Boolean(data?.data?.deletedAt) || readOnly;
    const handleUpdateDocumentList = vm.attach;
    const handleUpdateImageList = vm.attach;

    const handleDeleteAttachment = (attachment) => (event) => {
        event.preventDefault();
        if (attachment) confirmToast("Видалити файл?", () => vm.deleteAttachment(attachment));
    };

    return (
        <Modal data-i-doc="modal:inventory-details" open={open} size="xxl" onClose={onClose}>
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    Детальна інформація{data?.data?.caption ? <span className="ml-2 normal-case text-blue-600 dark:text-blue-400">{data.data.caption}</span> : null}
                </h3>
                <a className="ml-auto block" href={`/inventory/${id}/export`} target="_blank" rel="noreferrer" title="Друк">
                    <IconButton disabled={!id} size="sm" title="Друк">
                        <i className="fa-regular fa-print"></i>
                    </IconButton>
                </a>
            </ModalHeader>
            <LoadingDialogBody isLoading={isDictionaryFetching} className="relative min-h-[32rem]">


                        <Tabs value={tab}>
                            <TabsHeader {...KIT_TABS_HEADER}>
                                <Tab value="info" onClick={() => setTab("info")} className={KIT_TAB} activeClassName={KIT_TAB_ACTIVE}>Загальна інформація</Tab>
                                <Tab value="history" onClick={() => setTab("history")} className={KIT_TAB} activeClassName={KIT_TAB_ACTIVE}>
                                    <div className="flex flex-row items-center gap-x-2">
                                        Аудит змін
                                        {auditTotal > 0 && (
                                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-semibold text-gray-700 dark:bg-neutral-700 dark:text-gray-200">
                                                {auditTotal}
                                            </span>
                                        )}
                                    </div>
                                </Tab>
                            </TabsHeader>
                            <TabsBody>
                                <TabPanel data-i-doc="tab:inventory-details-info" value="info" className={KIT_TAB_PANEL}>
                                    <DetailGrid>
                                        <DetailItem label="itemId" value={data?.data?.id}/>
                                        <DetailItem label="Накладна" value={data?.data?.invoice}/>
                                        <DetailItem label="Опис" value={data?.data?.caption}/>
                                        <DetailItem label="Деталі" value={data?.data?.details}/>
                                        <DetailItem label="Серійний номер" value={data?.data?.serial}/>
                                        <DetailItem label="Інв. номер" value={data?.data?.inventoryNum}/>
                                        <DetailItem label="Реєстр. №" value={data?.data?.registryNum}/>
                                        <DetailItem label="Кількість" value={data?.data?.amount}/>
                                        <DetailItem label="Вартість" value={data?.data?.cost}/>
                                        <DetailItem label="Тип" value={inventoryType?.find(d => d.id === data?.data?.valueTypeId)?.caption}/>
                                        <DetailItem label="Розташування" value={inventoryLocation?.find(d => d.id === data?.data?.locationId)?.caption}/>
                                        <DetailItem label="Мат. відповідальний" value={responsibleUsers?.find(d => d.id === data?.data?.responsibleUserId)?.caption}/>
                                        <DetailItem label="Відповідальний" value={users?.find(d => d.id === data?.data?.baileeUserId)?.caption}/>
                                        <DetailItem label="Дата створення" value={data?.data?.createdAt}/>
                                        <DetailItem label="Дата редагування" value={data?.data?.updatedAt}/>
                                        {data?.data?.deletedAt &&
                                            <>
                                                <DetailItem label="Дата видалення" value={data?.data?.deletedAt}/>
                                                <DetailItem label="Останній змінив" value={dictionary?.user?.find(d => d.id === data?.data?.updatedUserId)?.caption}/>
                                            </>

                                        }
                                    </DetailGrid>
                                    <DetailItem className="mt-3" label="Примітка" value={data?.data?.note}/>
                                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-neutral-700 dark:bg-neutral-900/40">
                                        <ImageGallery allowNonImageType={false} data={imageAttachments}
                                                      isDisabled={isReadOnly || !canUpdateRow}
                                                      onUpdateList={handleUpdateImageList}
                                                      onDeleteAttachment={handleDeleteAttachment}
                                                      isLoading={attachImages.isPending}/>
                                    </div>
                                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-neutral-700 dark:bg-neutral-900/40">
                                        <DocumentGallery data={wordAttachments}
                                                         isDisabled={isReadOnly || !canUpdateRow}
                                                         onUpdateList={handleUpdateDocumentList}
                                                         onDeleteAttachment={handleDeleteAttachment}
                                                         isLoading={attachDocuments.isPending}/>
                                    </div>
                                </TabPanel>
                                {/*   HISTORY */}
                                <TabPanel data-i-doc="tab:inventory-details-history" value="history" className={KIT_TAB_PANEL}>
                                    {auditLoading
                                        ? <div className="flex justify-center py-4"><Spinner className="h-8 w-8"/></div>
                                        : auditHistory.length === 0
                                            ? <p className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">Записів аудиту немає</p>
                                            : <>
                                                {auditHistory.map(entry => (
                                                    <AuditEntry
                                                        key={entry.id}
                                                        entry={entry}
                                                        dictionary={dictionary}
                                                        inventoryType={inventoryType}
                                                        inventoryLocation={inventoryLocation}
                                                    />
                                                ))}
                                                <AuditPager page={auditPage} pages={auditPages} onChange={setAuditPage}/>
                                            </>
                                    }
                                </TabPanel>
                                {/*    END HISTORY*/}
                            </TabsBody>
                        </Tabs>
            </LoadingDialogBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>
                    Закрити
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default observer(InventoryDetailsModal);
