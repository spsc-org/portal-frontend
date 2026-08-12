import React, {useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {createColumnHelper} from "@tanstack/react-table";
import axios from "axios";
import Page from "@/Components/Page.jsx";
import {DictionaryProvider} from "@/ReactPages/Dictionary/DictionaryContext.jsx";
import Table from "@/Components/Table/Table.jsx";

const SUBJECT_TYPE_LABELS = {1: "Фізична особа", 5: "Судно"};

const columnHelper = createColumnHelper();

const Duplicates = () => {
    const {data, isFetching} = useQuery({
        queryKey: ["report-duplicates"],
        queryFn: async () => {
            const response = await axios.get("/api/report/duplicates");
            return response.data;
        },
    });

    const rows = data?.data ?? [];

    const columns = useMemo(() => [
        columnHelper.accessor("id", {header: "ID", size: 80}),
        columnHelper.accessor("subjectTypeId", {
            header: "Тип",
            size: 100,
            cell: ({getValue}) => SUBJECT_TYPE_LABELS[getValue()] ?? "Юридична особа",
        }),
        columnHelper.display({
            id: "name",
            header: "Назва",
            size: 250,
            cell: ({row}) => {
                const r = row.original;
                return <div>{r.nameUk}<br/>{r.nameRu}<br/>{r.nameEn}<br/>
                    <span className="text-blue-600">{(r.regNums ?? []).join(", ")}</span>
                </div>;
            },
        }),
        columnHelper.accessor("matches", {
            header: "Ймовірні дублікати",
            size: 350,
            cell: ({getValue}) => (
                <div>
                    {(getValue() ?? []).map((m) => (
                        <p key={m.id}>
                            {m.id}) {m.nameUk}<br/>{m.nameRu}<br/>{m.nameEn}<br/>
                            <span className="text-blue-600">{(m.documents ?? []).join(", ")}</span>
                        </p>
                    ))}
                </div>
            ),
        }),
    ], []);

    return (
        <DictionaryProvider>
            <Page>
                <div data-i-doc="page:report-duplicates" className="mt-2 mx-2">
                    <h1 className="text-lg font-semibold mb-4 text-gray-800 dark:text-slate-100">
                        <a href="/report" className="text-blue-500">Звіти</a> → Дублікати в Рупорах
                    </h1>
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

export default Duplicates;
