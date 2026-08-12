import React, {useMemo, useState} from "react";
import {usePage} from "@inertiajs/react";
import {useQuery} from "@tanstack/react-query";
import {createColumnHelper} from "@tanstack/react-table";
import axios from "axios";
import Page from "@/Components/Page.jsx";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import Table from "@/Components/Table/Table.jsx";
import {Button} from "@material-tailwind/react";

const PROPOSAL_STATE = {
    1: "Проєкт", 2: "Готово", 3: "Проголосовано", 4: "Направлено",
    5: "Реалізовано", 6: "Не актуально", 7: "Повернуто",
};

const columnHelper = createColumnHelper();

const Validation = () => {
    const {report} = usePage().props;
    const [showValid, setShowValid] = useState(false);

    const {data, isFetching} = useQuery({
        queryKey: ["report-validation", report, showValid],
        queryFn: async () => {
            const response = await axios.get("/api/report/validation", {params: {report, showValid}});
            return response.data;
        },
    });

    const rows = data?.data ?? [];
    const summary = data?.meta?.summary;

    const columns = useMemo(() => [
        columnHelper.accessor("projectId", {header: "ID проєкту", size: 90}),
        columnHelper.accessor("code", {header: "Код", size: 130}),
        columnHelper.display({
            id: "name",
            header: "Найменування / Ім'я",
            size: 220,
            cell: ({row}) => {
                const r = row.original;
                return <div>{r.nameUk}<br/>{r.nameRu}<br/>{r.nameEn}</div>;
            },
        }),
        columnHelper.accessor("details", {header: "Деталі коду", size: 200}),
        columnHelper.display({
            id: "status",
            header: "Статус валідації",
            size: 160,
            cell: ({row}) => {
                const r = row.original;
                if (!r.valid) return <span className="text-red-600">{r.error || "Невалідний"}</span>;
                if (r.dateMismatch) return <span className="text-orange-500">⚠ Невідповідність дат</span>;
                return <span className="text-green-600">✓ Валідний</span>;
            },
        }),
        columnHelper.display({
            id: "dates",
            header: "Дати (проєкт | код)",
            size: 150,
            cell: ({row}) => (row.original.projectDate || row.original.codeDate)
                ? <span className={row.original.dateMismatch ? "text-red-600 font-semibold" : ""}>
                    {row.original.projectDate ?? "—"} | {row.original.codeDate ?? "—"}
                  </span>
                : "—",
        }),
        columnHelper.accessor("gender", {
            header: "Стать",
            size: 80,
            cell: ({getValue}) => getValue() === "male" ? "чол." : getValue() === "female" ? "жін." : "—",
        }),
        columnHelper.accessor("proposals", {
            header: "Подання",
            size: 220,
            cell: ({getValue}) => (
                <div>
                    {(getValue() ?? []).map((p, i) => (
                        <p key={i}>{p.caption} [{PROPOSAL_STATE[p.stateId] ?? p.stateId}]</p>
                    ))}
                </div>
            ),
        }),
    ], []);

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:report-validation" className="mt-2 mx-2">
                    <h1 className="text-lg font-semibold mb-2 text-gray-800 dark:text-slate-100">
                        <a href="/report" className="text-blue-500">Звіти</a> → Валідація
                    </h1>

                    {summary && (
                        <div className="mb-4 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded p-3">
                            Перевірено: {summary.totalChecked}, валідних: {summary.valid}, з помилками: {summary.invalid}
                            {summary.extra?.dateMismatch ? `, невідповідність дат: ${summary.extra.dateMismatch}` : ""}
                            {summary.extra?.invalidDateFormat ? `, невірний формат дати: ${summary.extra.invalidDateFormat}` : ""}
                            {summary.extra?.countryMismatch ? `, невірна країна: ${summary.extra.countryMismatch}` : ""}
                            {summary.extra?.gender ? `, стать: чол. ${summary.extra.gender.male ?? 0} / жін. ${summary.extra.gender.female ?? 0}` : ""}
                        </div>
                    )}

                    <Button size="sm" className="mb-3" onClick={() => setShowValid((v) => !v)}>
                        {showValid ? "Показати лише проблемні" : "Показати всі записи"}
                    </Button>

                    <Table
                        loading={isFetching}
                        canChangeVisibility
                        canChangeResize
                        textSize="xs"
                        data={rows}
                        columns={columns}
                    />
                </div>
            </Page>
        </DictionaryProvider>
    );
};

export default Validation;
