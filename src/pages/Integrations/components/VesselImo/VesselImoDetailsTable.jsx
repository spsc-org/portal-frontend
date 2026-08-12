import React, { useState } from 'react';
import { Button, Card, IconButton, Input, Typography } from "@material-tailwind/react";
import { useVesselImoDetailsQuery } from "../../entities/vesselImo/queries.js";

const equasisUrl = (imo) => `https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=ShipSearch&imo=${imo}`;
const vesselTrackerUrl = (imo) => `https://www.vesseltracker.com/en/Ships/Imo/${imo}.html`;
const marineTrafficUrl = (imo) => `https://www.marinetraffic.com/en/ais/details/ships/imo:${imo}`;

const DetailRow = ({ detail, expanded, onToggle }) => {
    const classes = 'py-2 px-2 border-b border-blue-gray-50 dark:border-slate-700';

    return (
        <>
            <tr className="even:bg-blue-gray-50/50 dark:even:bg-slate-700/30 hover:bg-blue-gray-50 dark:hover:bg-slate-700/50">
                <td className={classes}>
                    <IconButton variant="text" size="sm" onClick={onToggle} className="dark:text-slate-400">
                        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} />
                    </IconButton>
                </td>
                <td className={classes}>
                    <Typography variant="small" className="font-medium dark:text-slate-200">{detail.imo}</Typography>
                </td>
                <td className={classes}><Typography variant="small" className="dark:text-slate-300">{detail.name || '—'}</Typography></td>
                <td className={classes}><Typography variant="small" className="dark:text-slate-300">{detail.shipType || '—'}</Typography></td>
                <td className={classes}><Typography variant="small" className="dark:text-slate-300">{detail.flag || '—'}</Typography></td>
                <td className={classes}><Typography variant="small" className="dark:text-slate-300">{detail.status || '—'}</Typography></td>
                <td className={classes}><Typography variant="small" className="dark:text-slate-300">{detail.yearBuilt || '—'}</Typography></td>
                <td className={classes}><Typography variant="small" className="dark:text-slate-300">{detail.ownerName || '—'}</Typography></td>
                <td className={classes}>
                    <div className="flex gap-2 text-blue-500">
                        <a href={equasisUrl(detail.imo)} target="_blank" rel="noreferrer" title="Equasis"><i className="fa-solid fa-arrow-up-right-from-square" /></a>
                        <a href={vesselTrackerUrl(detail.imo)} target="_blank" rel="noreferrer" title="VesselTracker"><i className="fa-solid fa-ship" /></a>
                        <a href={marineTrafficUrl(detail.imo)} target="_blank" rel="noreferrer" title="MarineTraffic"><i className="fa-solid fa-location-dot" /></a>
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={9} className="p-3 bg-blue-gray-50/50 dark:bg-slate-900 text-xs">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 dark:text-slate-400">
                            <div><span className="font-medium">Позивний:</span> {detail.callSign || '—'} ({detail.callSignCountry || '—'})</div>
                            <div><span className="font-medium">MMSI:</span> {detail.mmsi || '—'} ({detail.mmsiCountry || '—'})</div>
                            <div><span className="font-medium">Газ:</span> {detail.isGas ? 'так' : 'ні'}</div>
                            <div><span className="font-medium">Код прапора:</span> {detail.flagCode || '—'}</div>
                            <div><span className="font-medium">Коди країн:</span> {detail.allCodes || '—'}</div>
                            <div><span className="font-medium">Останнє оновлення:</span> {detail.lastUpdate || '—'}</div>
                            <div className="col-span-2 md:col-span-3"><span className="font-medium">Колишні назви:</span> {detail.formerNames || '—'}</div>
                            <div className="col-span-2 md:col-span-3"><span className="font-medium">Колишні прапори:</span> {detail.formerFlags || '—'}</div>
                            <div className="col-span-2 md:col-span-3"><span className="font-medium">Адреса власника:</span> {detail.ownerAddress || '—'}</div>
                            <div><span className="font-medium">Власник з:</span> {detail.ownerSince || '—'}</div>
                            <div className="col-span-2 md:col-span-3"><span className="font-medium">Колишні власники:</span> {detail.formerOwners || '—'}</div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const VesselImoDetailsTable = ({ onImportClick }) => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [expandedImo, setExpandedImo] = useState(null);

    const { data, isFetching } = useVesselImoDetailsQuery(page, 50, search || undefined);
    const details = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2 dark:text-slate-200">Деталі суден</h2>
                    <p className="text-gray-600 dark:text-slate-400">
                        Загальна таблиця з детальною інформацією про судна (Equasis та подібні
                        джерела), ключ — IMO. Незалежна від списків санкцій вище; кожен імпорт
                        повністю замінює дані.
                    </p>
                </div>
                <Button size="sm" variant="gradient" color="blue" onClick={onImportClick}>
                    <i className="fa-solid fa-file-arrow-up mr-2" />
                    Імпортувати
                </Button>
            </div>

            <Input
                label="Пошук за IMO, назвою або власником"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="dark:text-slate-200 mb-4"
                labelProps={{ className: "dark:!text-slate-400 dark:peer-focus:!text-blue-300" }}
                containerProps={{ className: "max-w-md" }}
            />

            <Card className="w-full overflow-auto dark:bg-slate-800 shadow-none">
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr>
                            {['', 'IMO', 'Назва', 'Тип', 'Прапор', 'Статус', 'Рік', 'Власник', 'Посилання'].map((label) => (
                                <th key={label} className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 py-2 px-2">
                                    <Typography variant="small" className="font-normal opacity-70 dark:text-slate-400">{label}</Typography>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {details.map((detail) => (
                            <DetailRow
                                key={detail.id}
                                detail={detail}
                                expanded={expandedImo === detail.imo}
                                onToggle={() => setExpandedImo(expandedImo === detail.imo ? null : detail.imo)}
                            />
                        ))}
                        {!isFetching && details.length === 0 && (
                            <tr>
                                <td colSpan={9} className="text-center py-4 text-gray-400 dark:text-slate-500">
                                    {search ? 'Нічого не знайдено' : 'Дані ще не імпортовані'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {meta && meta.pages > 1 && (
                <div className="flex items-center justify-between border-t border-blue-gray-50 dark:border-slate-700 pt-4 mt-4">
                    <span className="text-sm text-blue-gray-600 dark:text-slate-400">
                        Сторінка {meta.page} з {meta.pages} (Всього: {meta.total})
                    </span>
                    <div className="flex gap-2">
                        <button
                            className="text-sm px-3 py-1 border border-blue-gray-300 dark:border-slate-600 rounded disabled:opacity-40 dark:text-slate-300"
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page === 1}
                        >
                            Попередня
                        </button>
                        <button
                            className="text-sm px-3 py-1 border border-blue-gray-300 dark:border-slate-600 rounded disabled:opacity-40 dark:text-slate-300"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page === meta.pages}
                        >
                            Наступна
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VesselImoDetailsTable;
