import React from "react";
import {Dialog, DialogBody, DialogHeader, IconButton, Spinner} from "@material-tailwind/react";
import {useQuery} from "@tanstack/react-query";
import {convertDate} from "@/utils.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderValue = (val) => {
    if (val === null || val === undefined) return <span className="text-gray-400 italic">—</span>;
    if (typeof val === 'object' && 'label' in val && 'value' in val) {
        return <span>{val.label ? `${val.label}: ` : ''}{val.value ?? '—'}</span>;
    }
    if (typeof val === 'boolean') return val ? 'так' : 'ні';
    return String(val);
};

// ─── DiffSection ─────────────────────────────────────────────────────────────

const DiffSection = ({title, color, items, renderRow}) => {
    const entries = Object.entries(items);
    if (!entries.length) return null;

    return (
        <div className="mb-3">
            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${color}`}>{title}</div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded">
                {entries.map(([key, val]) => (
                    <div key={key} className="flex gap-2 px-2 py-1 text-xs">
                        <span className="text-gray-500 dark:text-gray-400 shrink-0 w-40 truncate" title={key}>{key}</span>
                        {renderRow(val)}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── AuditDetailModal ─────────────────────────────────────────────────────────

const AuditDetailModal = ({open, entity, recordId, users = [], onClose}) => {
    const {data, isFetching} = useQuery({
        queryKey: ['audit-detail', entity, recordId],
        queryFn: async () => {
            const res = await axios.get(`/api/audit/${entity}/${recordId}`);
            return res.data?.data;
        },
        enabled: !!recordId,
    });

    const record = data?.record;
    const diff   = data?.diff ?? {added: {}, changed: {}, removed: {}};

    const userName = (id) => {
        const u = users.find(u => u.id === id);
        return u ? u.caption : (id ? `#${id}` : '—');
    };

    const hasChanges = Object.keys(diff.added).length
        + Object.keys(diff.changed).length
        + Object.keys(diff.removed).length;

    return (
        <Dialog open={open} handler={onClose} size="lg" className="dark:bg-gray-900">
            <DialogHeader className="flex items-center justify-between py-3 px-4 border-b dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                    Деталі запису аудиту #{recordId}
                </div>
                <IconButton variant="text" size="sm" onClick={onClose}>
                    <i className="fa-solid fa-xmark text-gray-600 dark:text-slate-300"/>
                </IconButton>
            </DialogHeader>

            <DialogBody className="px-4 py-3 overflow-y-auto max-h-[70vh]">
                {isFetching && (
                    <div className="flex justify-center py-8"><Spinner/></div>
                )}

                {!isFetching && record && (
                    <>
                        {/* Мета */}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-xs text-gray-600 dark:text-gray-400">
                            <span><span className="font-medium">Дія:</span> {record.action}</span>
                            <span><span className="font-medium">Сутність ID:</span> {record.entityId ?? record.projectId ?? record.identifierId ?? '—'}</span>
                            <span><span className="font-medium">Користувач:</span> {userName(record.userId)}</span>
                            <span><span className="font-medium">Дата:</span> {convertDate(record.createdAt)}</span>
                            {data.previous && (
                                <span><span className="font-medium">Попередній запис:</span> #{data.previous}</span>
                            )}
                        </div>

                        {/* Diff */}
                        {!hasChanges && (
                            <p className="text-xs text-gray-400 italic">Немає змін (перший знімок або порожній diff)</p>
                        )}

                        <DiffSection
                            title="Додано"
                            color="text-green-600 dark:text-green-400"
                            items={diff.added}
                            renderRow={(val) => (
                                <span className="text-green-700 dark:text-green-400">{renderValue(val)}</span>
                            )}
                        />

                        <DiffSection
                            title="Змінено"
                            color="text-blue-600 dark:text-blue-400"
                            items={diff.changed}
                            renderRow={(val) => (
                                <span className="flex gap-2 items-center">
                                    <span className="text-red-500 line-through">{renderValue(val?.fromLabel ?? val?.from)}</span>
                                    <i className="fa-solid fa-arrow-right text-gray-400 text-[10px]"/>
                                    <span className="text-green-600">{renderValue(val?.toLabel ?? val?.to)}</span>
                                </span>
                            )}
                        />

                        <DiffSection
                            title="Видалено"
                            color="text-red-600 dark:text-red-400"
                            items={diff.removed}
                            renderRow={(val) => (
                                <span className="text-red-500 line-through">{renderValue(val)}</span>
                            )}
                        />
                    </>
                )}
            </DialogBody>
        </Dialog>
    );
};

export default AuditDetailModal;
