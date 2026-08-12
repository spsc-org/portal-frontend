import React from "react";
import {usePage} from "@inertiajs/react";
import {useQuery} from "@tanstack/react-query";
import {sourceType} from "../../shared/config/sourceTypes.js";
import {sanctionConnectionKeys} from "../../shared/lib/queryKeys.js";
import {useDossierOptionsQuery} from "../../entities/dossier/queries.js";

const DetailsSkeleton = () => (
    <div className="animate-pulse grid grid-cols-1 gap-2 md:grid-cols-2" aria-hidden="true">
        <div className="h-9 w-full rounded-md bg-gray-300 dark:bg-slate-700"/>
        <div className="h-9 w-full rounded-md bg-gray-300 dark:bg-slate-700"/>
        <div className="h-9 w-3/4 rounded-md bg-gray-300 dark:bg-slate-700"/>
        <div className="h-9 w-4/5 rounded-md bg-gray-300 dark:bg-slate-700"/>
    </div>
);

// Деталі ОБʼЄКТА, з яким установлено звʼязок (не самого звʼязку — той показує
// ConnectionCard/ConnectionListItem). Фетчиться окремим ендпоінтом лише для вибраного
// звʼязку (не для всього списку одразу — деталей джерела може бути багато, тягнути
// їх для кожного рядка реєстру зайве). Подання — за фабрикою: кожна таблиця-джерело
// має власний шаблон (SOURCE_TYPES[modelClass].detailsFields, shared/config/sourceTypes.js),
// бо набір даних у кожного джерела різний (одна логіка резолву/фетчу — різна видача).
// (перейменовано 2026-07-17 з component:sanction-profiles-connection-details-accordion:
// акордеон/кнопку прибрано — деталі джерела фетчаться і рендеряться автоматично при
// монтуванні картки, без дії користувача; поки триває запит — skeleton замість Spinner)
const ConnectionSourceDetails = ({modelClass, modelId}) => {
    const {auth} = usePage().props;
    const userId = auth?.user?.id;
    const {data: options} = useDossierOptionsQuery();
    const source = sourceType(modelClass);
    const DetailsFields = source.detailsFields;

    const {data, isPending, isError, error} = useQuery({
        queryKey: sanctionConnectionKeys.sourceDetails(modelClass, modelId),
        queryFn: () => source.detailsFetcher(modelId, userId),
        enabled: Boolean(source.detailsFetcher),
    });

    if (!source.detailsFetcher || !DetailsFields) {
        return null;
    }

    return (
        <div data-i-doc="component:sanction-profiles-connection-source-details" className="mt-[11px]">
            {isPending && <DetailsSkeleton/>}
            {isError && (
                <div className="text-[11px] text-red-600 dark:text-red-400 py-2">
                    Не вдалося завантажити: {error?.message ?? "невідома помилка"}
                </div>
            )}
            {!isPending && !isError && data && <DetailsFields data={data} {...options}/>}
        </div>
    );
};

export default ConnectionSourceDetails;
