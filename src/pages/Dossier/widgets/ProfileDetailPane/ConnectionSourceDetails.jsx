import { observer } from "mobx-react-lite";
import { useViewModel } from "../../../../shared/mvvm/useViewModel.js";
import { DossierOptionsViewModel, SourceDetailsViewModel } from "../../viewmodel/DossierViewModels.js";
import { useStores } from "../../../../stores/storeHooks.js";

import {sourceType} from "../../shared/config/sourceTypes.js";

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
    const userId = useStores().session.userId;
    const options = useViewModel((deps) => new DossierOptionsViewModel(deps)).options;
    const source = sourceType(modelClass);
    const DetailsFields = source.detailsFields;
    const vm = useViewModel((deps) => new SourceDetailsViewModel({
        ...deps, modelClass, modelId,
        fetcher: source.detailsFetcher ? (id) => source.detailsFetcher(id, userId) : null,
    }));
    const { data, isPending, isError, error } = vm.query;

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

export default observer(ConnectionSourceDetails);
