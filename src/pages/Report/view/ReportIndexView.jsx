import { observer } from "mobx-react-lite";
import { Link } from "react-router";
import Page from "../../../components/Page.jsx";

const ReportIndexView = ({ vm }) => {

    return (
            <Page>
                <div data-i-doc="page:report" className="max-w-3xl mx-auto mt-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link
                            to="/report/imo-analysis"
                            className="block bg-white dark:bg-neutral-700 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-neutral-700"
                        >
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                Аналіз суден за списком IMO
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Завантаження списку IMO для подальшої перевірки
                            </div>
                        </Link>
                        <Link
                            to="/report/duplicates"
                            className="block bg-white dark:bg-neutral-700 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-neutral-700"
                        >
                            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                                Дублікати в Рупорах
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                    Легасі
                                </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Пошук ймовірних дублікатів проєктів за назвою та номером документа
                            </div>
                        </Link>
                        {vm.reports.map((report) => (
                            <Link
                                key={report.key}
                                to={`/report/validation/${report.key}`}
                                className="block bg-white dark:bg-neutral-700 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-neutral-700"
                            >
                                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                                    {report.label}
                                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                        Легасі
                                    </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Валідація ідентифікатора + звірка з даними проєкту
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </Page>
    );
};

export default observer(ReportIndexView);
