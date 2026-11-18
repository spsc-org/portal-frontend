import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import Page from "../../../components/Page.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";
import { Alert, Card, Spinner, Textarea } from "@material-tailwind/react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/Modal/Modal.jsx"
import Button from "../../../components/Buttons/Button.jsx"
import { twMerge } from "tailwind-merge";
import { TABLE, TD, TH, TR } from "../../../components/Table/tableStyles.js";
const ImoAnalysisView = ({ vm }) => {
    const { imoList, lists, notes } = vm;
    const detailsByImo = vm.detailsByImo;
    const sanctionsByImo = vm.sanctionsByImo;
    const duplicateFlags = vm.duplicateFlags;
    const notFoundImos = vm.notFoundImos;

    return (
            <Page>
                <div data-i-doc="page:report-imo-analysis" className="mx-auto mt-10 max-w-[95vw] px-4">
                    <PageHeader
                        title="Аналіз суден за списком IMO"
                        documentTitle="Аналіз суден за IMO"
                        actions={<HeaderButton icon="fa-solid fa-file-arrow-up" onClick={vm.openModal}>Завантажити список IMO</HeaderButton>}
                    />

                    <Alert color="amber" variant="ghost" icon={<i className="fa-solid fa-triangle-exclamation" />} className="mb-4">
                        Перед перевіркою переконайтеся, що база підсанкційних IMO в актуальному
                        стані — списки та деталі суден оновлюються окремо на{' '}
                        <Link to="/integrations-vessel-imo" className="font-semibold underline">
                            сторінці «Судна під санкціями (IMO)»
                        </Link>.
                    </Alert>

                    {vm.isLoading && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
                            <Spinner className="h-4 w-4" />
                            Підтягуємо дані з бази{imoList && imoList.length > 300 ? ' (частинами, список великий)…' : '…'}
                        </div>
                    )}

                    {imoList && imoList.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                            <Button size="sm" color="secondary" onClick={vm.exportExcel}>
                                <i className="fa-solid fa-file-excel" />
                                Експорт в Excel
                            </Button>
                            <Button size="sm" color="secondary" onClick={vm.copyNotFound}>
                                <i className="fa-solid fa-copy" />
                                Скопіювати незнайдені IMO{notFoundImos.length > 0 ? ` (${notFoundImos.length})` : ''}
                            </Button>
                        </div>
                    )}

                    <Card className="w-full overflow-auto dark:bg-neutral-700 shadow-md max-h-[70vh]">
                            <table className={twMerge(TABLE, "w-full min-w-max table-auto text-left")}>
                                <thead>
                                    <tr>
                                        {[
                                            { label: "#" }, { label: "IMO" }, { label: "" }, { label: "Назва" }, { label: "Позивний" }, { label: "MMSI" },
                                            { label: "Тип судна" }, { label: "Прапор" }, { label: "Статус" }, { label: "Власник" },
                                            ...lists.map((l) => ({ label: l.code, title: l.caption })),
                                            { label: "Примітка" },
                                        ].map(({ label, title }, i) => (
                                            <th key={`${label}-${i}`} title={title} className={twMerge(TH, "sticky top-0 z-10")}>
                                                <div className="text-sm text-gray-700 dark:text-gray-400">{label}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(imoList ?? []).map((imo, index) => {
                                        const isDuplicate = duplicateFlags[index];
                                        const detail = detailsByImo[imo];
                                        const notFound = vm.isNotFound(imo);
                                        const rowKey = `${imo}-${index}`;
                                        const imoLists = sanctionsByImo[imo] ?? [];
                                        const rowClass = notFound
                                            ? "bg-gray-100 dark:bg-neutral-600/50"
                                            : isDuplicate
                                                ? "bg-amber-50 dark:bg-amber-900/20"
                                                : "even:bg-blue-gray-50/50 dark:even:bg-neutral-600/30";
                                        return (
                                            <tr key={rowKey} className={rowClass}>
                                                <td className={TD}>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{index + 1}</div>
                                                </td>
                                                <td className={TD}>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{imo}</div>
                                                </td>
                                                <td className={TD}>
                                                    {isDuplicate && (
                                                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                                            Дублікат
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={TD}>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{detail?.name || '—'}</div>
                                                </td>
                                                <td className={TD}>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{detail?.callSign || '—'}</div>
                                                </td>
                                                <td className={TD}>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{detail?.mmsi || '—'}</div>
                                                </td>
                                                <td className={TD}>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{detail?.shipType || '—'}</div>
                                                </td>
                                                <td className={TD}>
                                                    <div title={detail?.flag || ''} className="text-sm text-gray-700 dark:text-gray-300">{detail?.flagCode || '—'}</div>
                                                </td>
                                                <td className={TD}>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{detail?.status || '—'}</div>
                                                </td>
                                                <td className={TD}>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{detail?.ownerName || '—'}</div>
                                                </td>
                                                {lists.map((l) => {
                                                    const matched = imoLists.includes(l.code);
                                                    return (
                                                        <td
                                                            key={l.code}
                                                            className={twMerge(TD, `py-2 px-4 border-b border-blue-gray-50 dark:border-neutral-700 text-center ${matched ? 'bg-blue-gray-100 dark:bg-neutral-500/40' : ''}`)}>
                                                            {matched
                                                                ? <i className="fa-solid fa-circle text-blue-gray-700 dark:text-gray-300" title={l.caption} />
                                                                : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                        </td>
                                                    );
                                                })}
                                                <td className={twMerge(TD, "max-w-[22rem]")}>
                                                    <input
                                                        type="text"
                                                        value={notes[imo] ?? ""}
                                                        onChange={(e) => vm.setNote(imo, e.target.value)}
                                                        placeholder="Примітка…"
                                                        className="w-full text-sm bg-transparent border-b border-blue-gray-100 dark:border-neutral-600 focus:outline-none focus:border-blue-500 dark:text-gray-200"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!imoList || imoList.length === 0) && (
                                        <tr className={TR}>
                                            <td colSpan={11 + lists.length} className={twMerge(TD, "text-center")}>
                                                {imoList ? "Список порожній" : "Завантажте список IMO, щоб побачити дані"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                </div>

                <Modal open={vm.modalOpen} handler={vm.closeModal} size="sm">
                    <ModalHeader>
                <h3 className="min-w-0 truncate text-base font-bold uppercase">
                            Список IMO для перевірки
                        </h3>
            </ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            По одному IMO-номеру на рядок.
                        </p>
                        <Textarea
                            label="IMO-номери"
                            rows={12}
                            value={vm.text}
                            onChange={(e) => vm.setText(e.target.value)}
                            className="dark:text-gray-200"
                            labelProps={{ className: "dark:!text-gray-400 dark:peer-focus:!text-blue-300" }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={vm.closeModal}>
                            Скасувати
                        </Button>
                        <Button variant="gradient" color="green" onClick={vm.accept}>
                            Прийняти
                        </Button>
                    </ModalFooter>
                </Modal>
            </Page>
    );
};

export default observer(ImoAnalysisView);
