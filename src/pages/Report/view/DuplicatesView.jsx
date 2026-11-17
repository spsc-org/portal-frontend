import { observer } from "mobx-react-lite";
import Page from "../../../components/Page.jsx";
import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import Table from "../../../components/Table/Table.jsx";
const SUBJECT_TYPE_LABELS = {1: "Фізична особа", 5: "Судно"};

const columnHelper = createColumnHelper();

const DuplicatesView = ({ vm }) => {

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
            <Page>
                <div data-i-doc="page:report-duplicates" className="mt-2 mx-2">
                    <Table
                        loading={vm.isFetching}
                        canChangeVisibility
                        canChangeResize
                        textSize="xs"
                        data={vm.rows}
                        columns={columns}
                    />
                </div>
            </Page>
    );
};

export default observer(DuplicatesView);
