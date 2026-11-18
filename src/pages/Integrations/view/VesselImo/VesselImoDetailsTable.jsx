import { observer } from "mobx-react-lite";
import IconButton from "../../../../components/Buttons/IconButton.jsx"
import Button from "../../../../components/Buttons/Button.jsx"
import SearchInput from "../../../../components/fields/SearchInput.jsx"
import { PaginationFooter } from "../ImportLogShared.jsx";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TD_EMPTY, TH, TR } from "../../../../components/Table/tableStyles.js";

const equasisUrl = (imo) => `https://www.equasis.org/EquasisWeb/restricted/ShipInfo?fs=ShipSearch&imo=${imo}`;
const vesselTrackerUrl = (imo) => `https://www.vesseltracker.com/en/Ships/Imo/${imo}.html`;
const marineTrafficUrl = (imo) => `https://www.marinetraffic.com/en/ais/details/ships/imo:${imo}`;

const DetailRow = ({ detail, expanded, onToggle }) => {

    return (
        <>
            <tr className={TR}>
                <td className={TD}>
                    <IconButton variant="text" size="sm" onClick={onToggle}>
                        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} />
                    </IconButton>
                </td>
                <td className={TD}>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{detail.imo}</div>
                </td>
                <td className={TD}><div>{detail.name || '—'}</div></td>
                <td className={TD}><div>{detail.shipType || '—'}</div></td>
                <td className={TD}><div>{detail.flag || '—'}</div></td>
                <td className={TD}><div>{detail.status || '—'}</div></td>
                <td className={TD}><div>{detail.yearBuilt || '—'}</div></td>
                <td className={TD}><div>{detail.ownerName || '—'}</div></td>
                <td className={TD}>
                    <div className="flex gap-2 text-blue-600 dark:text-blue-400">
                        <a href={equasisUrl(detail.imo)} target="_blank" rel="noreferrer" title="Equasis"><i className="fa-solid fa-arrow-up-right-from-square" /></a>
                        <a href={vesselTrackerUrl(detail.imo)} target="_blank" rel="noreferrer" title="VesselTracker"><i className="fa-solid fa-ship" /></a>
                        <a href={marineTrafficUrl(detail.imo)} target="_blank" rel="noreferrer" title="MarineTraffic"><i className="fa-solid fa-location-dot" /></a>
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr className={TR}>
                    <td colSpan={9} className={TD}>
                        <div className="grid grid-cols-2 gap-2 py-1 text-gray-700 md:grid-cols-3 dark:text-gray-300">
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

/** list — PagedListViewModel деталей суден (пошук з дебаунсом). */
const VesselImoDetailsTable = ({ list, onImportClick }) => {
    const { page, search } = list;
    const setPage = list.setPage;
    const setSearch = list.setSearch;
    const expandedImo = list.expandedId;
    const setExpandedImo = list.setExpanded;
    const isFetching = list.query.isFetching;
    const details = list.rows;
    const meta = list.meta;

    return (
        <div className="mt-6 bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Деталі суден</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Загальна таблиця з детальною інформацією про судна (Equasis та подібні
                        джерела), ключ — IMO. Незалежна від списків санкцій вище; кожен імпорт
                        повністю замінює дані.
                    </p>
                </div>
                <Button size="sm" onClick={onImportClick}>
                    <i className="fa-solid fa-file-arrow-up mr-2" />
                    Імпортувати
                </Button>
            </div>

            <div className="mb-3 w-full max-w-md">
                <SearchInput
                    size="xs"
                    name="vessel-details-search"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Пошук за IMO, назвою або власником"
                    icon="fa-regular fa-magnifying-glass"
                />
            </div>

            <div className={TABLE_WRAP}>
                <table className={twMerge(TABLE, "w-full min-w-max table-auto text-left")}>
                    <thead>
                        <tr>
                            {['', 'IMO', 'Назва', 'Тип', 'Прапор', 'Статус', 'Рік', 'Власник', 'Посилання'].map((label) => (
                                <th key={label} className={TH}>{label}</th>
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
                            <tr className={TR}>
                                <td colSpan={9} className={TD_EMPTY}>
                                    {search ? 'Нічого не знайдено' : 'Дані ще не імпортовані'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationFooter
                pagination={meta && { current_page: meta.page, last_page: meta.pages, total: meta.total }}
                page={page}
                onPageChange={setPage}
            />
        </div>
    );
};

export default observer(VesselImoDetailsTable);
