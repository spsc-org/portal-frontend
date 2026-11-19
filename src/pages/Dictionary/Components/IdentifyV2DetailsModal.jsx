import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Spinner,
    Tab,
    TabPanel,
    Tabs,
    TabsBody,
    TabsHeader,
} from "@material-tailwind/react";
import React, {useMemo, useState} from "react";
import {useDictionaryPageProps} from "../useDictionaryPageProps.js";
import {useQuery} from "@tanstack/react-query";
import {http as axios} from "../../../lib/api.js";

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
    create:  {label: 'Створено',   color: 'bg-green-100 text-green-800'},
    update:  {label: 'Оновлено',   color: 'bg-blue-100 text-blue-800'},
    delete:  {label: 'Видалено',   color: 'bg-red-100 text-red-800'},
    restore: {label: 'Відновлено', color: 'bg-orange-100 text-orange-800'},
};

const ActionBadge = ({action}) => {
    const cfg = ACTION_CONFIG[action] || {label: action, color: 'bg-gray-100 text-gray-800'};
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
        if (value === null || value === undefined || value === '') return <span className="text-gray-400 italic">—</span>;
        if (typeof value === 'object') return value.label ?? value.value ?? '';
        return String(value);
    };

    return (
        <div className="border rounded-lg mb-2 overflow-hidden dark:border-gray-600">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
                <div className="flex items-center gap-x-3">
                    <ActionBadge action={entry.action}/>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{entry.createdAt}</span>
                    <span className="text-xs dark:text-gray-300">{userName}</span>
                    {rows.length > 0 && (
                        <span className="text-xs text-gray-400">({rows.length} зм.)</span>
                    )}
                </div>
                <i className={`fa-regular fa-chevron-${open ? 'up' : 'down'} text-gray-400 text-xs`}/>
            </button>

            {open && (
                <div className="px-3 py-2 dark:bg-gray-800">
                    {rows.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Немає змін у відстежуваних полях</p>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                            <tr className="text-left text-gray-500 dark:text-gray-400">
                                <th className="pb-1 w-1/4">Поле</th>
                                <th className="pb-1 w-[37.5%]">Було</th>
                                <th className="pb-1 w-[37.5%]">Стало</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map(({field, from, to}) => (
                                <tr key={field} className="border-t dark:border-gray-600">
                                    <td className="py-1 font-medium dark:text-gray-300">
                                        {FIELD_LABELS[field] || field}
                                    </td>
                                    <td className="py-1 text-red-500 dark:text-red-400">
                                        {formatValue(from)}
                                    </td>
                                    <td className="py-1 text-green-600 dark:text-green-400">
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

const IdentifyV2DetailsModal = ({open, id, onClose, dictionary}) => {
    const {auth, countries = [], subjectTypes = []} = useDictionaryPageProps();
    const [tab, setTab] = useState("info");

    const {data, isFetching} = useQuery({
        queryKey: ['identify-v2-details', id],
        queryFn: async () => {
            const response = await axios.get(`api/dictionary/identifier-v2/${id}`, {
                headers: {"userId": auth?.user?.id},
            });
            return response?.data;
        },
        enabled: !!id,
    })

    const [auditPage, setAuditPage] = useState(1);

    const {data: auditData, isFetching: auditLoading} = useQuery({
        queryKey: ['identify-v2-audit', id, auditPage],
        queryFn: async () => {
            const response = await axios.get(`api/dictionary/identifier-v2/${id}/audit`, {
                headers: {"userId": auth?.user?.id},
                params: {page: auditPage, limit: 50},
            });
            return response?.data;
        },
        enabled: !!id && tab === 'audit',
    })

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

    return (
        <Dialog data-i-doc="modal:dictionary-identify-v2-details-modal" open={open} size="xl" className="dark:bg-gray-800" handler={onClose}>
            <DialogHeader className="dark:text-gray-200">
                <span className="mr-5">Детальна інформація {details?.code}</span>
            </DialogHeader>
            <DialogBody className="h-[42rem] overflow-y-auto">
                {isFetching
                    ? <div className="flex justify-center w-full"><Spinner className="h-12 w-12"/></div>
                    : (
                        <Tabs value={tab}>
                            <TabsHeader className="bg-transparent" indicatorProps={{
                                className: "bg-gray-900/10 dark:bg-blue-900/50 shadow-none !text-gray-900",
                            }}>
                                <Tab value="info" onClick={() => setTab("info")} className="dark:text-gray-50">
                                    Загальна інформація
                                </Tab>
                                <Tab value="audit" onClick={() => setTab("audit")} className="dark:text-gray-50">
                                    <div className="flex items-center gap-x-2">
                                        Аудит змін
                                        {auditTotal > 0 && (
                                            <div className="relative h-[20px] w-[20px] bg-gray-950 dark:bg-gray-950 rounded-full">
                                                <span className="absolute text-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                                                    {auditTotal}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Tab>
                            </TabsHeader>
                            <TabsBody>
                                <TabPanel data-i-doc="tab:dictionary-identify-v2-info" value="info">
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
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
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex flex-row gap-x-2">
                                                <span className="dark:text-gray-400 font-bold">{label}:</span>
                                                <span className="dark:text-slate-400">{value}</span>
                                            </div>
                                        ))}
                                        {details?.pattern && (
                                            <div className="flex flex-row gap-x-2 col-span-2">
                                                <span className="dark:text-gray-400 font-bold">Паттерн:</span>
                                                <pre><code className="bg-slate-800 dark:bg-slate-950 px-2 py-1.5 rounded-md text-green-500 dark:text-green-700">{details.pattern}</code></pre>
                                            </div>
                                        )}
                                    </div>
                                </TabPanel>
                                <TabPanel data-i-doc="tab:dictionary-identify-v2-audit" value="audit">
                                    {auditLoading
                                        ? <div className="flex justify-center py-4"><Spinner className="h-8 w-8"/></div>
                                        : auditHistory.length === 0
                                            ? <p className="text-sm text-gray-400 italic">Записів аудиту немає</p>
                                            : <>
                                                {auditHistory.map(entry => (
                                                    <AuditEntry
                                                        key={entry.id}
                                                        entry={entry}
                                                        dictionary={dictionary}
                                                    />
                                                ))}
                                                {auditPages > 1 && (
                                                    <div className="flex items-center justify-center gap-x-2 mt-3">
                                                        <button
                                                            disabled={auditPage <= 1}
                                                            onClick={() => setAuditPage(p => p - 1)}
                                                            className="px-3 py-1 text-xs rounded border dark:border-gray-600 disabled:opacity-40"
                                                        >‹ Новіші</button>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {auditPage} / {auditPages}
                                                        </span>
                                                        <button
                                                            disabled={auditPage >= auditPages}
                                                            onClick={() => setAuditPage(p => p + 1)}
                                                            className="px-3 py-1 text-xs rounded border dark:border-gray-600 disabled:opacity-40"
                                                        >Старіші ›</button>
                                                    </div>
                                                )}
                                            </>
                                    }
                                </TabPanel>
                            </TabsBody>
                        </Tabs>
                    )
                }
            </DialogBody>
            <DialogFooter>
                <Button onClick={onClose} color="gray">
                    <span>Закрити</span>
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default IdentifyV2DetailsModal;
