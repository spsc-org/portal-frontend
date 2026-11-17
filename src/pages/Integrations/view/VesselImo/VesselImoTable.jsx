import { Button, Card, Typography } from "@material-tailwind/react";
import { convertDate } from "../../../../lib/utils.js";

const VesselImoTable = ({ lists = [], onImportClick }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2 dark:text-slate-200">
                        Судна під санкціями (IMO)
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400">
                        Незалежний модуль — списки не беруть участі в консолідованому пошуку.
                        Одна книга Excel містить вкладку на кожен список; імпорт оновлює всі
                        розпізнані вкладки одразу (повне перезаписування списку).
                    </p>
                </div>
                <Button size="sm" variant="gradient" color="blue" onClick={onImportClick}>
                    <i className="fa-solid fa-file-arrow-up mr-2" />
                    Імпортувати книгу
                </Button>
            </div>

            <Card className="w-full overflow-auto dark:bg-slate-800 shadow-none">
                <table className="w-full min-w-max table-auto text-left">
                    <thead>
                        <tr>
                            {['Країна', 'Список', 'Кількість IMO', 'Останнє оновлення'].map((label) => (
                                <th key={label} className="border-b border-blue-gray-100 dark:border-slate-700 bg-blue-gray-50 dark:bg-slate-900 py-2 px-2">
                                    <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70 dark:text-slate-400">
                                        {label}
                                    </Typography>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {lists.map((list, index) => {
                            const classes = index === lists.length - 1 ? 'py-2 px-2' : 'py-2 px-2 border-b border-blue-gray-50 dark:border-slate-700';
                            return (
                                <tr key={list.id} className="even:bg-blue-gray-50/50 dark:even:bg-slate-700/30 hover:bg-blue-gray-50 dark:hover:bg-slate-700/50">
                                    <td className={classes}>
                                        <div className="flex items-center gap-2">
                                            {list.country && (
                                                <img
                                                    src={`/flag-svg/${list.country.toLowerCase()}.svg`}
                                                    alt={list.country}
                                                    className="h-4 w-6 object-contain border border-blue-gray-50 dark:border-slate-600"
                                                />
                                            )}
                                            <Typography variant="small" className="dark:text-slate-300">
                                                {list.country || '—'}
                                            </Typography>
                                        </div>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" className="font-medium dark:text-slate-200">
                                            {list.caption}
                                        </Typography>
                                        <Typography variant="small" className="text-xs text-gray-400 dark:text-slate-500">
                                            {list.code}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" className="dark:text-slate-300">
                                            {list.rowCount ?? 0}
                                        </Typography>
                                    </td>
                                    <td className={classes}>
                                        <Typography variant="small" className="dark:text-slate-300">
                                            {convertDate(list.lastImportedAt) || '—'}
                                        </Typography>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

export default VesselImoTable;
