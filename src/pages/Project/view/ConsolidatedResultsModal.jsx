import { observer } from "mobx-react-lite";
import { useVM } from "../../../shared/mvvm/index.js";
import { HighlightedText } from "./liveAnalysis/AnalysisText.jsx";
import { PROJECTS_DATASET_ID, TYPE_BADGES, fieldLabel, portalLinks, queryWords } from "../model/consolidatedSearchModel.js";

const CELL = "border-b border-gray-100 px-2 py-1.5 align-top text-[11px] dark:border-gray-700/60";
const TH = "sticky top-0 z-10 bg-gray-50 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-gray-500 dark:bg-neutral-900 dark:text-gray-400";

const Highlight = ({ text, query }) => <HighlightedText text={text ?? ""} items={queryWords(query)} />;

/** Комірка джерела: датасет, тип суб'єкта, посилання на проєкт порталу (legacy _renderPortalLinks). */
const SourceCell = ({ record }) => {
    const type = TYPE_BADGES[record.typeId];
    const links = portalLinks(record);
    const own = record.datasetId === PROJECTS_DATASET_ID;
    return (
        <td className={`${CELL} ${own ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}>
            <div className="font-medium text-gray-700 dark:text-gray-300">{record.datasetName || String(record.datasetId)}</div>
            {type && <span className={`inline-block rounded-full px-1.5 text-[10px] font-medium leading-4 ${type.className}`}>{type.label}</span>}
            {links && (
                <div className="mt-1.5 flex items-center gap-2">
                    <a href={links.card} target="_blank" rel="noreferrer" title="Переглянути картку проєкту" className="inline-flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800">
                        <i className="fa-regular fa-rectangle-history text-[11px]" />
                    </a>
                    <a href={links.edit} target="_blank" rel="noreferrer" title="Редагувати проєкт" className="inline-flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-500 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-gray-600 dark:bg-gray-800">
                        <i className="fa-solid fa-pen-to-square text-[11px]" />
                    </a>
                </div>
            )}
        </td>
    );
};

const RecordCells = ({ record, query }) => (
    <>
        <SourceCell record={record} />
        <td className={`${CELL} font-medium text-gray-800 dark:text-gray-200`}>
            <Highlight text={record.captions} query={query} />
        </td>
        <td className={`${CELL} text-gray-600 dark:text-gray-400`}>
            <Highlight text={record.identifiers} query={query} />
        </td>
        <td className={`${CELL} text-gray-500 dark:text-gray-400`}>{record.decree || ""}</td>
        <td className={`${CELL} whitespace-pre-line text-gray-500 dark:text-gray-400`}>
            <Highlight text={record.other} query={query} />
        </td>
    </>
);

const rowClass = (record) => `align-top transition-colors ${record.datasetId === PROJECTS_DATASET_ID ? "border-l-2 border-amber-400" : ""}`;

/**
 * Збіги в консолідованій базі (порт #modalConsolidatedSearch і #modalAllConsolidatedResults):
 * одного поля або зведена таблиця всіх полів без дублікатів.
 */
const ConsolidatedResultsModal = () => {
    const search = useVM().projectForm.consolidated;
    const { modal } = search;
    if (!modal) return null;
    const field = search.fieldModal;
    const isAll = modal.kind === "all";
    if (!isAll && !field) return null;
    const rows = isAll ? search.all : field.records;
    return (
        <div
            className="fixed inset-0 z-[1060] flex items-start justify-center overflow-y-auto bg-gray-900/50 pt-8 dark:bg-black/70"
            data-testid="consolidated-modal"
            onMouseDown={(event) => event.target === event.currentTarget && search.closeModal()}
        >
            <div className="m-3 flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
                    <h3 className="flex min-w-0 items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
                        <i className={`fa-solid ${isAll ? "fa-layer-group text-violet-500" : "fa-globe text-blue-500"}`} />
                        {isAll ? "Всі збіги в консолідованій базі" : "Збіги в консолідованій базі"}
                        {!isAll && (
                            <span className="truncate text-sm font-normal text-gray-500 dark:text-gray-400">
                                {fieldLabel(field.key) ? `[${fieldLabel(field.key)}] ` : ""}
                                {field.query}
                            </span>
                        )}
                    </h3>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{isAll ? `${rows.length} унікальних` : `${rows.length} знахідок`}</span>
                        {!isAll && field.time ? <span>{field.time} с</span> : null}
                        <button type="button" onClick={search.closeModal} aria-label="Закрити" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                            <i className="fas fa-xmark text-lg" />
                        </button>
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {rows.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-400">Збігів не знайдено</p>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className={`${TH} w-40`}>Джерело</th>
                                    <th className={TH}>Назви</th>
                                    <th className={TH}>Ідентифікатори</th>
                                    <th className={`${TH} w-28`}>Указ</th>
                                    <th className={TH}>Інше</th>
                                    {isAll && <th className={`${TH} w-48`}>Збіги</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {isAll
                                    ? rows.map(({ key, record, matches }) => {
                                          const query = matches.map((match) => match.query).join(" ");
                                          return (
                                              <tr key={key} className={rowClass(record)}>
                                                  <RecordCells record={record} query={query} />
                                                  <td className={`${CELL} leading-5`}>
                                                      {matches.length > 1 && (
                                                          <span className="mb-1 inline-block rounded-full bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                              {matches.length} поля
                                                          </span>
                                                      )}
                                                      {matches.map((match, index) => (
                                                          <div key={index}>
                                                              <span className="inline-block rounded bg-violet-100 px-1 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{match.label}</span>
                                                              <span className="ml-0.5 text-gray-500 dark:text-gray-400">{match.query}</span>
                                                          </div>
                                                      ))}
                                                  </td>
                                              </tr>
                                          );
                                      })
                                    : rows.map((record) => (
                                          <tr key={`${record.datasetId}-${record.id}`} className={rowClass(record)}>
                                              <RecordCells record={record} query={field.query} />
                                          </tr>
                                      ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(ConsolidatedResultsModal);
