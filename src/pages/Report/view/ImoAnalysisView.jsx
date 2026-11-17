import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import Page from "../../../components/Page.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import { HeaderButton } from "../../../layouts/app/HeaderButtons.jsx";
import {
    Alert,
    Button,
    Card,
    Dialog,
    DialogBody,
    DialogFooter,
    DialogHeader,
    Spinner,
    Textarea,
    Typography,
} from "@material-tailwind/react";
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
                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 mb-4">
                            <Spinner className="h-4 w-4" />
                            Підтягуємо дані з бази{imoList && imoList.length > 300 ? ' (частинами, список великий)…' : '…'}
                        </div>
                    )}

                    {imoList && imoList.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                            <Button size="sm" variant="outlined" color="blue-gray" onClick={vm.exportExcel} className="dark:text-slate-300 dark:border-slate-600">
                                <i className="fa-solid fa-file-excel mr-2" />
                                Експорт в Excel
                            </Button>
                            <Button size="sm" variant="outlined" color="blue-gray" onClick={vm.copyNotFound} className="dark:text-slate-300 dark:border-slate-600">
                                <i className="fa-solid fa-copy mr-2" />
                                Скопіювати незнайдені IMO{notFoundImos.length > 0 ? ` (${notFoundImos.length})` : ''}
                            </Button>
                        </div>
                    )}

                    <Card className="w-full overflow-auto dark:bg-slate-800 shadow-md max-h-[70vh]">
                            <table className="w-full min-w-max table-auto text-left">
                                <thead>
                                    <tr>
                                        {[
                                            { label: "#" }, { label: "IMO" }, { label: "" }, { label: "Назва" }, { label: "Позивний" }, { label: "MMSI" },
                                            { label: "Тип судна" }, { label: "Прапор" }, { label: "Статус" }, { label: "Власник" },
                                            ...lists.map((l) => ({ label: l.code, title: l.caption })),
                                            { label: "Примітка" },
                                        ].map(({ label, title }, i) => (
                                            <th key={`${label}-${i}`} title={title} className="sticky top-0 z-10 border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 py-2 px-4">
                                                <Typography variant="small" className="font-normal opacity-70 dark:text-slate-400">{label}</Typography>
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
                                            ? "bg-gray-100 dark:bg-slate-700/50"
                                            : isDuplicate
                                                ? "bg-amber-50 dark:bg-amber-900/20"
                                                : "even:bg-blue-gray-50/50 dark:even:bg-slate-700/30";
                                        return (
                                            <tr key={rowKey} className={rowClass}>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300">{index + 1}</Typography>
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300">{imo}</Typography>
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    {isDuplicate && (
                                                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                                            Дублікат
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300">{detail?.name || '—'}</Typography>
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300">{detail?.callSign || '—'}</Typography>
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300">{detail?.mmsi || '—'}</Typography>
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300">{detail?.shipType || '—'}</Typography>
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300" title={detail?.flag || ''}>{detail?.flagCode || '—'}</Typography>
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300">{detail?.status || '—'}</Typography>
                                                </td>
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700">
                                                    <Typography variant="small" className="dark:text-slate-300">{detail?.ownerName || '—'}</Typography>
                                                </td>
                                                {lists.map((l) => {
                                                    const matched = imoLists.includes(l.code);
                                                    return (
                                                        <td
                                                            key={l.code}
                                                            className={`py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700 text-center ${matched ? 'bg-blue-gray-100 dark:bg-slate-600/40' : ''}`}
                                                        >
                                                            {matched
                                                                ? <i className="fa-solid fa-circle text-blue-gray-700 dark:text-slate-300" title={l.caption} />
                                                                : <span className="text-gray-300 dark:text-slate-600">—</span>}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-2 px-4 border-b border-blue-gray-50 dark:border-slate-700 max-w-[22rem]">
                                                    <input
                                                        type="text"
                                                        value={notes[imo] ?? ""}
                                                        onChange={(e) => vm.setNote(imo, e.target.value)}
                                                        placeholder="Примітка…"
                                                        className="w-full text-sm bg-transparent border-b border-blue-gray-100 dark:border-slate-600 focus:outline-none focus:border-blue-500 dark:text-slate-200"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!imoList || imoList.length === 0) && (
                                        <tr>
                                            <td colSpan={11 + lists.length} className="text-center py-4 text-gray-400 dark:text-slate-500">
                                                {imoList ? "Список порожній" : "Завантажте список IMO, щоб побачити дані"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                </div>

                <Dialog open={vm.modalOpen} handler={vm.closeModal} size="sm" className="dark:bg-slate-800">
                    <DialogHeader>
                        <Typography variant="h5" className="dark:text-slate-200">
                            Список IMO для перевірки
                        </Typography>
                    </DialogHeader>
                    <DialogBody>
                        <Typography className="dark:text-slate-300 mb-4">
                            По одному IMO-номеру на рядок.
                        </Typography>
                        <Textarea
                            label="IMO-номери"
                            rows={12}
                            value={vm.text}
                            onChange={(e) => vm.setText(e.target.value)}
                            className="dark:text-slate-200"
                            labelProps={{ className: "dark:!text-slate-400 dark:peer-focus:!text-blue-300" }}
                        />
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="blue-gray" onClick={vm.closeModal} className="mr-1 dark:text-slate-300 dark:hover:bg-slate-700">
                            Скасувати
                        </Button>
                        <Button variant="gradient" color="green" onClick={vm.accept}>
                            Прийняти
                        </Button>
                    </DialogFooter>
                </Dialog>
            </Page>
    );
};

export default observer(ImoAnalysisView);
