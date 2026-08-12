import React, {useState} from "react";
import {router} from "@inertiajs/react";
import {Button} from "@material-tailwind/react";
import Page from "@/Components/Page.jsx";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import SingleSelect from "@/Components/fields/SingleSelect.jsx";

const TYPE_OPTIONS = [
    {value: 1, label: "Без звʼязків з поданнями"},
    {value: 2, label: "Є звʼязки, жодного не реалізовано"},
];

const Index = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [type, setType] = useState(TYPE_OPTIONS[0]);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!year || !type) return;
        router.get(`/statistic/unrealized/${year}/${type.value}`);
    };

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:statistic" className="max-w-md mx-auto mt-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                    <h1 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-100">
                        Статистика — нереалізовані проєкти
                    </h1>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
                        <div>
                            <label htmlFor="year" className="block text-sm text-gray-500 dark:text-gray-300">
                                Рік
                            </label>
                            <input
                                id="year"
                                type="number"
                                min="2000"
                                max="2100"
                                required
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200"
                            />
                        </div>
                        <SingleSelect
                            label="Критерій"
                            id="type"
                            options={TYPE_OPTIONS}
                            value={type}
                            onChange={setType}
                            closeMenuOnSelect
                        />
                        <Button type="submit" className="mt-2">
                            Переглянути
                        </Button>
                    </form>
                </div>
            </Page>
        </DictionaryProvider>
    );
};

export default Index;
