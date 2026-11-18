import Button from "../../../../components/Buttons/Button.jsx"
import { convertDate } from "../../../../lib/utils.js";
import { twMerge } from "tailwind-merge";
import { TABLE, TABLE_WRAP, TD, TH, TR } from "../../../../components/Table/tableStyles.js";

const VesselImoTable = ({ lists = [], onImportClick }) => {
    return (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                        Судна під санкціями (IMO)
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Незалежний модуль — списки не беруть участі в консолідованому пошуку.
                        Одна книга Excel містить вкладку на кожен список; імпорт оновлює всі
                        розпізнані вкладки одразу (повне перезаписування списку).
                    </p>
                </div>
                <Button size="sm" onClick={onImportClick}>
                    <i className="fa-solid fa-file-arrow-up mr-2" />
                    Імпортувати книгу
                </Button>
            </div>

            <div className={TABLE_WRAP}>
                <table className={twMerge(TABLE, "w-full min-w-max table-auto text-left")}>
                    <thead>
                        <tr>
                            {['Країна', 'Список', 'Кількість IMO', 'Останнє оновлення'].map((label) => (
                                <th key={label} className={TH}>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {lists.map((list) => {
                            return (
                                <tr key={list.id} className={TR}>
                                    <td className={TD}>
                                        <div className="flex items-center gap-2">
                                            {list.country && (
                                                <img
                                                    src={`/flag-svg/${list.country.toLowerCase()}.svg`}
                                                    alt={list.country}
                                                    className="h-4 w-6 object-contain border border-gray-200 dark:border-neutral-600"
                                                />
                                            )}
                                            <div>
                                                {list.country || '—'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={TD}>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {list.caption}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {list.code}
                                        </div>
                                    </td>
                                    <td className={TD}>
                                        <div>
                                            {list.rowCount ?? 0}
                                        </div>
                                    </td>
                                    <td className={TD}>
                                        <div>
                                            {convertDate(list.lastImportedAt) || '—'}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VesselImoTable;
