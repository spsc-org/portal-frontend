import React from "react";
import {usePage} from "@inertiajs/react";
import Page from "@/Components/Page.jsx";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";

const Index = () => {
    const {reports = []} = usePage().props;

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:report" className="max-w-3xl mx-auto mt-10">
                    <h1 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-100">
                        Звіти та аналітика
                    </h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a
                            href="/report/imo-analysis"
                            className="block bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                        >
                            <div className="font-medium text-gray-900 dark:text-slate-100">
                                Аналіз суден за списком IMO
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Завантаження списку IMO для подальшої перевірки
                            </div>
                        </a>
                        <a
                            href="/report/duplicates"
                            className="block bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-slate-100">
                                Дублікати в Рупорах
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                    Легасі
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Пошук ймовірних дублікатів проєктів за назвою та номером документа
                            </div>
                        </a>
                        {reports.map((report) => (
                            <a
                                key={report.key}
                                href={`/report/validation/${report.key}`}
                                className="block bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-slate-100">
                                    {report.label}
                                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                        Легасі
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Валідація ідентифікатора + звірка з даними проєкту
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </Page>
        </DictionaryProvider>
    );
};

export default Index;
