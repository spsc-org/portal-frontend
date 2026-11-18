import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../shared/mvvm/useViewModel.js";
import { IDENTIFIER_API } from "../model/dictionaryApi.js";
import { IdentifierDetailsViewModel } from "../viewmodel/DictionaryViewModels.js";
import { Spinner, Tab, TabPanel, Tabs, TabsBody, TabsHeader } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import { DetailGrid, DetailItem } from "../../../components/DetailFields.jsx";
import AuditPager from "../../../components/Audit/AuditPager.jsx";
import { KIT_TAB, KIT_TAB_ACTIVE, KIT_TAB_PANEL, KIT_TABS_HEADER } from "../../../components/tabsStyles.js";
import {useMemo, useState} from "react";
import { AUDIT_BODY, AUDIT_CARD, AUDIT_EMPTY, AUDIT_HEAD, AUDIT_META, AUDIT_USER, DIFF_FIELD, DIFF_FROM, DIFF_HEAD_ROW, DIFF_TABLE, DIFF_TH, DIFF_TO, DIFF_TR } from "../../../components/Audit/auditStyles.js";

const FIELD_LABELS = {
    code: 'Код',
    group: 'Група',
    pattern: 'Паттерн',
    name_uk: 'Назва (укр)',
    name_en: 'Назва (англ)',
    name_doc: 'Виводити як',
    comment: 'Коментар',
    description_uk: 'Опис (укр)',
    description_en: 'Опис (англ)',
    subjectTypeId: "Тип суб'єкта",
    belongCountryId: 'Країна',
};

const ACTION_CONFIG = {
    create:  {label: 'Створено',   color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'},
    update:  {label: 'Оновлено',   color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'},
    delete:  {label: 'Видалено',   color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'},
    restore: {label: 'Відновлено', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'},
};

const ActionBadge = ({action}) => {
    const cfg = ACTION_CONFIG[action] || {label: action, color: 'bg-gray-100 text-gray-800 dark:bg-neutral-600 dark:text-gray-300'};
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

const AuditEntry = ({entry, dictionary}) => {
    const [open, setOpen] = useState(false);
    const userName = dictionary?.user?.find(u => u.id === entry.userId)?.caption || `#${entry.userId}`;

    const {added = {}, changed = {}, removed = {}} = entry.diff || {};
    const rows = [
        ...Object.entries(added).map(([field, value]) => ({field, from: null, to: value})),
        ...Object.entries(changed).map(([field, value]) => ({
            field,
            from: value?.fromLabel ?? value?.from,
            to: value?.toLabel ?? value?.to,
        })),
        ...Object.entries(removed).map(([field, value]) => ({field, from: value, to: null})),
    ];

    const formatValue = (value) => {
        if (value === null || value === undefined || value === '') return <span className="italic text-gray-600 dark:text-gray-400">—</span>;
        if (typeof value === 'object') return value.label ?? value.value ?? '';
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
                    {rows.length > 0 && (
                        <span className={AUDIT_META}>({rows.length} зм.)</span>
                    )}
                </div>
                <i className={`fa-regular fa-chevron-${open ? 'up' : 'down'} text-gray-600 text-xs`}/>
            </button>

            {open && (
                <div className={AUDIT_BODY}>
                    {rows.length === 0 ? (
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
                            {rows.map(({field, from, to}) => (
                                <tr key={field} className={DIFF_TR}>
                                    <td className={DIFF_FIELD}>
                                        {FIELD_LABELS[field] || field}
                                    </td>
                                    <td className={DIFF_FROM}>
                                        {formatValue(from)}
                                    </td>
                                    <td className={DIFF_TO}>
                                        {formatValue(to)}
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

const IdentifyV2DetailsModal = ({open, id, onClose, dictionary, dictionaries}) => {
    const vm = useViewModel((deps) => new IdentifierDetailsViewModel({ ...deps, api: IDENTIFIER_API.v2, id }));
    const { countries = [], subjectTypes = [] } = dictionaries;
    const tab = vm.tab;
    const setTab = vm.setTab;
    const data = vm.payload;
    const isFetching = vm.isFetching;
    const auditPage = vm.auditPage;
    const setAuditPage = vm.setAuditPage;
    const auditData = vm.auditQuery.data;
    const auditLoading = vm.auditQuery.isFetching;

    const details = useMemo(() => {
        if (!data?.data) return null;
        const d = data.data;
        return {
            id: d.id,
            code: d.code,
            group: d.group,
            pattern: d.pattern,
            name_uk: d.name_uk,
            name_en: d.name_en,
            name_doc: d.name_doc,
            comment: d.comment,
            description_uk: d.description_uk,
            description_en: d.description_en,
            subjectType: subjectTypes?.find(t => t.id === d.subjectTypeId),
            belongCountry: countries?.find(c => c.id === d.belongCountryId),
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            updatedUserId: dictionary?.user?.find(u => u.id === d.updatedUserId),
        }
    }, [data?.data, id])

    const auditHistory = auditData?.data ?? [];
    const auditTotal   = auditData?.total ?? 0;
    const auditPages   = auditData?.pages ?? 1;

    const FIELDS = [
        ['ID', details?.id],
        ['Код', details?.code],
        ['Група', details?.group],
        ['Назва українською', details?.name_uk],
        ['Опис українською', details?.description_uk],
        ['Виводити як', details?.name_doc],
        ['Опис англійською', details?.description_en],
        ['Назва англійською', details?.name_en],
        ['Коментар', details?.comment],
        ["Тип суб'єкта", details?.subjectType?.caption],
        ['Країна', details?.belongCountry?.caption],
        ['Створено', details?.createdAt],
        ['Останнє оновлення', details?.updatedAt],
    ];

    return (
        <Modal data-i-doc="modal:dictionary-identify-v2-details-modal" open={open} size="xl" onClose={onClose}>
            <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                    Ідентифікатор{details?.code ? <span className="ml-2 normal-case text-blue-600 dark:text-blue-400">{details.code}</span> : null}
                </h3>
            </ModalHeader>
            <ModalBody>
                {isFetching
                    ? <div className="flex w-full justify-center py-10"><Spinner className="h-12 w-12"/></div>
                    : (
                        <Tabs value={tab}>
                            <TabsHeader {...KIT_TABS_HEADER}>
                                <Tab value="info" onClick={() => setTab("info")} className={KIT_TAB} activeClassName={KIT_TAB_ACTIVE}>
                                    Загальна інформація
                                </Tab>
                                <Tab value="audit" onClick={() => setTab("audit")} className={KIT_TAB} activeClassName={KIT_TAB_ACTIVE}>
                                    <div className="flex items-center gap-x-2">
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
                                <TabPanel data-i-doc="tab:dictionary-identify-v2-info" value="info" className={KIT_TAB_PANEL}>
                                    <DetailGrid>
                                        {FIELDS.map(([label, value]) => <DetailItem key={label} label={label} value={value}/>)}
                                        <DetailItem label="Паттерн" className="md:col-span-2">
                                            {details?.pattern
                                                ? <code className="block break-words rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200">{details.pattern}</code>
                                                : <span className="text-gray-500">—</span>}
                                        </DetailItem>
                                    </DetailGrid>
                                </TabPanel>
                                <TabPanel data-i-doc="tab:dictionary-identify-v2-audit" value="audit" className={KIT_TAB_PANEL}>
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
                                                    />
                                                ))}
                                                <AuditPager page={auditPage} pages={auditPages} onChange={setAuditPage}/>
                                            </>
                                    }
                                </TabPanel>
                            </TabsBody>
                        </Tabs>
                    )
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

export default observer(IdentifyV2DetailsModal);
