import React, { useEffect, useMemo, useState } from "react";
import Page from "@/Components/Page.jsx";
import { DictionaryProvider } from "@/ReactPages/Dictionary/DictionaryContext.jsx";
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
import toast from "react-hot-toast";
import { useImoLookupMutation } from "./entities/imoAnalysis/queries.js";

const ImoAnalysis = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [text, setText] = useState("");
    const [imoList, setImoList] = useState(null);
    const [lookupData, setLookupData] = useState(null);
    // Примітки — за IMO (не за рядком), зберігаються в localStorage і підтягуються при
    // наступному завантаженні того самого судна, незалежно від конкретного списку/сесії.
    const [notes, setNotes] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("report-imo-analysis-notes") || "{}");
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem("report-imo-analysis-notes", JSON.stringify(notes));
    }, [notes]);

    const lookupMutation = useImoLookupMutation();

    const detailsByImo = useMemo(() => {
        const map = {};
        for (const detail of lookupData?.details ?? []) {
            map[detail.imo] = detail;
        }
        return map;
    }, [lookupData]);

    const lists = lookupData?.lists ?? [];
    const sanctionsByImo = lookupData?.sanctions ?? {};

    const handleAccept = () => {
        const list = text.split("\n").map((line) => line.trim()).filter((line) => line !== "");
        setImoList(list);
        setLookupData(null);
        setModalOpen(false);
        if (list.length > 0) {
            lookupMutation.mutate({
                imos: [...new Set(list)],
                onProgress: setLookupData,
            });
        }
    };

    const handleNoteChange = (rowKey, value) => {
        setNotes((prev) => ({ ...prev, [rowKey]: value }));
    };

    const notFoundImos = useMemo(() => {
        if (!imoList) return [];
        return [...new Set(imoList.filter((imo) => !detailsByImo[imo]))];
    }, [imoList, detailsByImo]);

    const handleCopyNotFound = async () => {
        if (notFoundImos.length === 0) {
            toast("Незнайдених IMO немає");
            return;
        }
        await navigator.clipboard.writeText(notFoundImos.join("\n"));
        toast.success(`Скопійовано ${notFoundImos.length} IMO в буфер`);
    };

    const handleExportExcel = () => {
        const headers = ["#", "IMO", "Дублікат", "Назва", "Позивний", "MMSI", "Тип судна", "Прапор", "Статус", "Власник",
            ...lists.map((l) => l.country || l.code), "Примітка"];

        const rowsHtml = imoList.map((imo, index) => {
            const detail = detailsByImo[imo];
            const imoLists = sanctionsByImo[imo] ?? [];
            const cells = [
                index + 1,
                imo,
                duplicateFlags[index] ? "так" : "",
                detail?.name || "",
                detail?.callSign || "",
                detail?.mmsi || "",
                detail?.shipType || "",
                detail?.flagCode || "",
                detail?.status || "",
                detail?.ownerName || "",
                ...lists.map((l) => (imoLists.includes(l.code) ? (l.country || l.code) : "")),
                notes[imo] ?? "",
            ];
            return `<tr>${cells.map((c) => `<td>${String(c)}</td>`).join("")}</tr>`;
        }).join("");

        const html = `<html><head><meta charset="UTF-8"></head><body><table>`
            + `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>${rowsHtml}</table></body></html>`;

        const blob = new Blob([html], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `imo-analysis-${new Date().toISOString().slice(0, 10)}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // "Дублікат" — лише з другого й наступних входжень того самого IMO, не на першому.
    const duplicateFlags = useMemo(() => {
        if (!imoList) return [];
        const seenCounts = {};
        return imoList.map((imo) => {
            seenCounts[imo] = (seenCounts[imo] ?? 0) + 1;
            return seenCounts[imo] > 1;
        });
    }, [imoList]);

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:report-imo-analysis" className="mx-auto mt-10 px-4" style={{ maxWidth: '95vw' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                            Аналіз суден за списком IMO
                        </h1>
                        <Button size="sm" variant="gradient" color="blue" onClick={() => setModalOpen(true)}>
                            <i className="fa-solid fa-file-arrow-up mr-2" />
                            Завантажити список IMO
                        </Button>
                    </div>

                    <Alert color="amber" variant="ghost" icon={<i className="fa-solid fa-triangle-exclamation" />} className="mb-4">
                        Перед перевіркою переконайтеся, що база підсанкційних IMO в актуальному
                        стані — списки та деталі суден оновлюються окремо на{' '}
                        <a href="/integrations-vessel-imo" className="font-semibold underline">
                            сторінці «Судна під санкціями (IMO)»
                        </a>.
                    </Alert>

                    {lookupMutation.isPending && (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 mb-4">
                            <Spinner className="h-4 w-4" />
                            Підтягуємо дані з бази{imoList && imoList.length > 300 ? ' (частинами, список великий)…' : '…'}
                        </div>
                    )}

                    {imoList && imoList.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                            <Button size="sm" variant="outlined" color="blue-gray" onClick={handleExportExcel} className="dark:text-slate-300 dark:border-slate-600">
                                <i className="fa-solid fa-file-excel mr-2" />
                                Експорт в Excel
                            </Button>
                            <Button size="sm" variant="outlined" color="blue-gray" onClick={handleCopyNotFound} className="dark:text-slate-300 dark:border-slate-600">
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
                                        const notFound = lookupData !== null && !detail;
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
                                                        onChange={(e) => handleNoteChange(imo, e.target.value)}
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

                <Dialog open={modalOpen} handler={() => setModalOpen(false)} size="sm" className="dark:bg-slate-800">
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
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="dark:text-slate-200"
                            labelProps={{ className: "dark:!text-slate-400 dark:peer-focus:!text-blue-300" }}
                        />
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="blue-gray" onClick={() => setModalOpen(false)} className="mr-1 dark:text-slate-300 dark:hover:bg-slate-700">
                            Скасувати
                        </Button>
                        <Button variant="gradient" color="green" onClick={handleAccept}>
                            Прийняти
                        </Button>
                    </DialogFooter>
                </Dialog>
            </Page>
        </DictionaryProvider>
    );
};

export default ImoAnalysis;
