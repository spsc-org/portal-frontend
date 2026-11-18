import { observer } from "mobx-react-lite";
import { Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody } from "../../../components/Modal/Modal.jsx"
import CloseButton from "../../../components/Buttons/CloseButton.jsx"
import { convertDate } from "../../../lib/utils.js";

const renderValue = (val) => {
    if (val === null || val === undefined) return <span className="text-gray-600 italic">—</span>;
    if (typeof val === 'object' && 'label' in val && 'value' in val) {
        return <span>{val.label ? `${val.label}: ` : ''}{val.value ?? '—'}</span>;
    }
    if (typeof val === 'boolean') return val ? 'так' : 'ні';
    return String(val);
};

const DiffSection = ({ title, color, items, renderRow }) => {
    const entries = Object.entries(items);
    if (!entries.length) return null;

    return (
        <div className="mb-3">
            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${color}`}>{title}</div>
            <div className="divide-y divide-gray-100 dark:divide-neutral-700 border border-gray-200 dark:border-neutral-700 rounded">
                {entries.map(([key, val]) => (
                    <div key={key} className="flex gap-2 px-2 py-1 text-xs">
                        <span className="text-gray-600 dark:text-gray-400 shrink-0 w-40 truncate" title={key}>{key}</span>
                        {renderRow(val)}
                    </div>
                ))}
            </div>
        </div>
    );
};

/** Деталі запису аудиту (diff). vm — AuditTableViewModel вкладки. */
const AuditDetailModal = ({ vm }) => {
    const { detail, diff } = vm;
    const record = detail?.record;
    const isFetching = vm.detailQuery.isFetching;

    return (
        <Modal open={vm.selectedId != null} handler={vm.closeDetail} size="lg">
            <ModalHeader hideClose className="flex items-center justify-between py-3 px-4 border-b">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Деталі запису аудиту #{vm.selectedId}
                </div>
                <CloseButton onClick={vm.closeDetail} />
            </ModalHeader>

            <ModalBody className="px-4 py-3 overflow-y-auto max-h-[70vh]">
                {isFetching && <div className="flex justify-center py-8"><Spinner/></div>}

                {!isFetching && record && (
                    <>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-xs text-gray-600 dark:text-gray-400">
                            <span><span className="font-medium">Дія:</span> {record.action}</span>
                            <span><span className="font-medium">Сутність ID:</span> {record.entityId ?? record.projectId ?? record.identifierId ?? '—'}</span>
                            <span><span className="font-medium">Користувач:</span> {vm.userName(record.userId)}</span>
                            <span><span className="font-medium">Дата:</span> {convertDate(record.createdAt)}</span>
                            {detail.previous && (
                                <span><span className="font-medium">Попередній запис:</span> #{detail.previous}</span>
                            )}
                        </div>

                        {!vm.hasChanges && (
                            <p className="text-xs text-gray-600 italic">Немає змін (перший знімок або порожній diff)</p>
                        )}

                        <DiffSection
                            title="Додано"
                            color="text-green-600 dark:text-green-400"
                            items={diff.added}
                            renderRow={(val) => <span className="text-green-700 dark:text-green-400">{renderValue(val)}</span>}
                        />
                        <DiffSection
                            title="Змінено"
                            color="text-blue-600 dark:text-blue-400"
                            items={diff.changed}
                            renderRow={(val) => (
                                <span className="flex gap-2 items-center">
                                    <span className="text-red-500 line-through">{renderValue(val?.fromLabel ?? val?.from)}</span>
                                    <i className="fa-solid fa-arrow-right text-gray-500 text-[10px]"/>
                                    <span className="text-green-600">{renderValue(val?.toLabel ?? val?.to)}</span>
                                </span>
                            )}
                        />
                        <DiffSection
                            title="Видалено"
                            color="text-red-600 dark:text-red-400"
                            items={diff.removed}
                            renderRow={(val) => <span className="text-red-500 line-through">{renderValue(val)}</span>}
                        />
                    </>
                )}
            </ModalBody>
        </Modal>
    );
};

export default observer(AuditDetailModal);
