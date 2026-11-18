import { observer } from "mobx-react-lite";
import { Spinner } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody } from "../../../components/Modal/Modal.jsx"
import { DetailGrid, DetailItem } from "../../../components/DetailFields.jsx";
import { convertDate } from "../../../lib/utils.js";

const renderValue = (val) => {
    if (val === null || val === undefined) return <span className="italic text-gray-600 dark:text-gray-400">—</span>;
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
        <section>
            <h4 className={`mb-1.5 text-xs font-bold uppercase tracking-wide ${color}`}>{title}</h4>
            <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-800">
                {entries.map(([key, val]) => (
                    <div key={key} className="flex gap-3 px-3 py-1.5 text-xs">
                        <span className="w-40 shrink-0 truncate font-medium text-gray-800 dark:text-gray-200" title={key}>{key}</span>
                        <span className="min-w-0 break-words">{renderRow(val)}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

/** Деталі запису аудиту (diff). vm — AuditTableViewModel вкладки. */
const AuditDetailModal = ({ vm }) => {
    const { detail, diff } = vm;
    const record = detail?.record;
    const isFetching = vm.detailQuery.isFetching;

    return (
        <Modal open={vm.selectedId != null} onClose={vm.closeDetail} size="lg">
            <ModalHeader title={`Деталі запису аудиту #${vm.selectedId ?? ""}`}/>

            <ModalBody className="flex flex-col gap-4">
                {isFetching && <div className="flex justify-center py-8"><Spinner/></div>}

                {!isFetching && record && (
                    <>
                        <DetailGrid className="md:grid-cols-3">
                            <DetailItem label="Дія" value={record.action}/>
                            <DetailItem label="Сутність ID" value={record.entityId ?? record.projectId ?? record.identifierId}/>
                            <DetailItem label="Користувач" value={vm.userName(record.userId)}/>
                            <DetailItem label="Дата" value={convertDate(record.createdAt)}/>
                            {detail.previous && <DetailItem label="Попередній запис" value={`#${detail.previous}`}/>}
                        </DetailGrid>

                        {!vm.hasChanges && (
                            <p className="m-0 text-sm italic text-gray-600 dark:text-gray-400">Немає змін (перший знімок або порожній diff)</p>
                        )}

                        <DiffSection
                            title="Додано"
                            color="text-green-700 dark:text-green-400"
                            items={diff.added}
                            renderRow={(val) => <span className="text-green-700 dark:text-green-400">{renderValue(val)}</span>}
                        />
                        <DiffSection
                            title="Змінено"
                            color="text-blue-600 dark:text-blue-400"
                            items={diff.changed}
                            renderRow={(val) => (
                                <span className="flex gap-2 items-center">
                                    <span className="text-red-700 line-through dark:text-red-400">{renderValue(val?.fromLabel ?? val?.from)}</span>
                                    <i className="fa-solid fa-arrow-right text-gray-500 text-[10px]"/>
                                    <span className="text-green-700 dark:text-green-400">{renderValue(val?.toLabel ?? val?.to)}</span>
                                </span>
                            )}
                        />
                        <DiffSection
                            title="Видалено"
                            color="text-red-700 dark:text-red-400"
                            items={diff.removed}
                            renderRow={(val) => <span className="text-red-700 line-through dark:text-red-400">{renderValue(val)}</span>}
                        />
                    </>
                )}
            </ModalBody>
        </Modal>
    );
};

export default observer(AuditDetailModal);
