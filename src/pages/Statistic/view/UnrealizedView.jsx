import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { createColumnHelper } from "@tanstack/react-table";
import Page from "../../../components/Page.jsx";
import PageHeader from "../../../layouts/app/PageHeader.jsx";
import Table from "../../../components/Table/Table.jsx";

const SUBJECT_TYPE_LABELS = {1: "Фізична особа", 5: "Судно"};

const PROPOSAL_STATE = {
    1: {icon: "fa-regular fa-circle", label: "Проєкт"},
    2: {icon: "fa-solid fa-circle-quarter-stroke", label: "Готово"},
    3: {icon: "fa-regular fa-circle-half-stroke", label: "Проголосовано"},
    4: {icon: "fa-regular fa-circle-three-quarters-stroke", label: "Направлено"},
    5: {icon: "fa-solid fa-circle", label: "Реалізовано"},
    6: {icon: "fa-regular fa-ban", label: "Не актуально"},
    7: {icon: "fa-regular fa-circle", label: "Повернуто"},
};

const parseProposals = (raw) => {
    if (!raw) return [];
    try {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        return Array.isArray(data) ? data.filter((p) => !p.isDeleted) : [];
    } catch {
        return [];
    }
};

const columnHelper = createColumnHelper();

const UnrealizedView = ({ vm }) => {
    const columns = useMemo(() => [
        columnHelper.display({
            id: "index",
            header: "№",
            size: 50,
            cell: ({row}) => row.index + 1,
        }),
        columnHelper.accessor("subjectTypeId", {
            header: "Тип",
            size: 90,
            cell: ({getValue}) => SUBJECT_TYPE_LABELS[getValue()] ?? "Юридична особа",
        }),
        columnHelper.display({
            id: "name",
            header: "Назва",
            size: 220,
            cell: ({row}) => {
                const p = row.original;
                return (
                    <div>
                        {p.nameUk}<br/>
                        {p.nameRu}<br/>
                        {p.nameEn}<br/>
                        {p.birthDate}
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: "tax",
            header: "Податковий номер",
            size: 130,
            cell: ({row}) => `${row.original.taxP || ""} ${row.original.taxL || ""}`.trim(),
        }),
        columnHelper.display({
            id: "reg",
            header: "Реєстраційний номер",
            size: 130,
            cell: ({row}) => `${row.original.regP || ""} ${row.original.regL || ""}`.trim(),
        }),
        columnHelper.accessor("doc", {
            header: "Документ",
            size: 130,
        }),
        columnHelper.accessor("calcCategory", {
            header: "Категорія",
            size: 150,
            cell: ({getValue}) => <span dangerouslySetInnerHTML={{__html: getValue() || ""}}/>,
        }),
        columnHelper.accessor("calcProposal", {
            header: "Подання",
            size: 220,
            cell: ({getValue}) => (
                <div>
                    {parseProposals(getValue()).map((p, i) => {
                        const state = PROPOSAL_STATE[p.stateId];
                        return (
                            <p key={i}>
                                {state && <i className={state.icon} title={state.label}/>} [{state?.label}] {p.caption}
                            </p>
                        );
                    })}
                </div>
            ),
        }),
        columnHelper.accessor("calcDocuments", {
            header: "Документи",
            size: 200,
            cell: ({getValue}) => <span dangerouslySetInnerHTML={{__html: getValue() || ""}}/>,
        }),
        columnHelper.accessor("notes", {
            header: "Примітки",
            size: 150,
        }),
        columnHelper.accessor("createdUserId", {
            header: "Створив",
            size: 120,
        }),
        columnHelper.accessor("createdAt", {
            header: "Дата створення",
            size: 120,
        }),
        columnHelper.accessor("updatedUserId", {
            header: "Змінив",
            size: 120,
        }),
        columnHelper.accessor("updatedAt", {
            header: "Дата зміни",
            size: 120,
        }),
    ], []);

    return (
        <Page>
            <div data-i-doc="page:statistic-unrealized" className="mt-2 mx-2">
                <PageHeader title={`Нереалізовані проєкти (${vm.year}${vm.typeCaption ? `, ${vm.typeCaption}` : ""})`} />
                <Table
                    loading={vm.isFetching}
                    canChangeVisibility
                    textSize="xs"
                    data={vm.rows}
                    columns={columns}
                />
            </div>
        </Page>
    );
};

export default observer(UnrealizedView);
