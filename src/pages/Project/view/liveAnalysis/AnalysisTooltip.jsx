import {
    fieldDisplayName,
    layerConfig,
    layerData,
    layerDisplayName,
    layerMessageLines,
    nameFieldLabel,
    similarityClass,
    statusConfig,
} from "../../model/liveAnalysisModel.js";

const Divider = ({ children, title }) => (
    <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-600">
        {title && <div className="mb-2 text-xs opacity-75">{title}</div>}
        {children}
    </div>
);

const Progress = ({ layers }) => {
    if (!layers.length) return null;
    const count = (status) => layers.filter((layer) => layer.status === status).length;
    const [success, warning, failed] = [count("success"), count("warning"), count("failed")];
    const width = (value) => `${(value / layers.length) * 100}%`;
    return (
        <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs opacity-75">
                <span>Прогрес перевірки</span>
                <span>{layers.length} слоїв</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                {success > 0 && <div className="h-full bg-green-500" style={{ width: width(success) }} />}
                {warning > 0 && <div className="h-full bg-yellow-500" style={{ width: width(warning) }} />}
                {failed > 0 && <div className="h-full bg-red-500" style={{ width: width(failed) }} />}
            </div>
            <div className="mt-1 flex justify-between text-xs opacity-75">
                <span className="text-green-600 dark:text-green-400">{success} успішно</span>
                {warning > 0 && <span className="text-yellow-600 dark:text-yellow-400">{warning} попередження</span>}
                {failed > 0 && <span className="text-red-600 dark:text-red-400">{failed} помилок</span>}
            </div>
        </div>
    );
};

const Phrase = ({ children }) => <span className="mb-1 mr-1 inline-block rounded bg-gray-100 px-2 py-0.5 font-mono dark:bg-gray-700">{children}</span>;

/** Дані шару (знайдені/відсутні фрази, сегменти, пари ключ-значення) — legacy formatLayerValidationData. */
const LayerData = ({ data }) => {
    if (data.foundPhrases) {
        return (
            <div className="mt-2 border-t border-gray-300 pt-2 dark:border-gray-600">
                {data.foundPhrases.map((item) => (
                    <span key={`${item.phrase}-${item.isGlobal}`}>
                        <Phrase>{item.phrase}</Phrase>
                        <span className={`mr-2 ${item.isGlobal ? "text-gray-400" : "text-blue-400"}`}>({item.isGlobal ? "системне" : "особисте"})</span>
                    </span>
                ))}
            </div>
        );
    }
    if (data.missingPhrases) {
        return (
            <div className="mt-2 border-t border-gray-300 pt-2 dark:border-gray-600">
                {data.missingPhrases.map((phrase) => (
                    <Phrase key={phrase}>{phrase}</Phrase>
                ))}
            </div>
        );
    }
    return (
        <div className="mt-2 border-t border-gray-300 pt-2 dark:border-gray-600">
            {Array.isArray(data)
                ? data
                      .filter((item) => item?.segment && item?.message)
                      .map((item, index) => (
                          <div key={index} className={index > 0 ? "mb-1 mt-2" : "mb-1"}>
                              <div className="text-xs font-medium">Сегмент:</div>
                              <div className="mb-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-700">"{item.segment}"</div>
                              <div className="text-xs text-red-600 dark:text-red-400">{item.message}</div>
                          </div>
                      ))
                : Object.entries(data).map(([key, value]) => (
                      <div key={key} className="mb-1">
                          <span className="font-medium">{key}:</span> <span>{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                      </div>
                  ))}
        </div>
    );
};

/** Знайдені в реєстрі записи за назвою (validationData.alternativeSearch). */
const AlternativeSearch = ({ search }) => {
    const records = [...(search?.foundRecords ?? [])].sort((a, b) => b.similarity - a.similarity);
    if (!records.length) return null;
    return (
        <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-600">
            <div className="mb-3 flex items-center gap-2">
                <i className="fas fa-search text-xs text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Альтернативний пошук</span>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs dark:bg-blue-900/30">{search.totalFound} знайдено</span>
            </div>
            <div className="overflow-hidden rounded border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
                <div className="border-b border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium dark:border-gray-600 dark:bg-gray-700">Знайдені записи за назвою:</div>
                <div className="max-h-48 overflow-y-auto">
                    {records.map((record, index) => (
                        <div key={`${record.record?.sid}-${index}`} className="border-b border-gray-100 p-2 last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">DRS ID: {record.record?.sid}</span>
                                <span className={`rounded px-2 py-0.5 text-xs ${similarityClass(record.similarity)}`}>{record.similarity}%</span>
                            </div>
                            <div className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                                <strong>Назва в БД:</strong> {record.record?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                                <strong>Знайдено по:</strong> {nameFieldLabel(record.matchedBy)}
                                <br />
                                <strong>Частина назви:</strong> "{record.matchedPart}"
                                <br />
                                <strong>Повне значення:</strong> "{record.originalValue}"
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">💡 Оберіть потрібний DRS ID та внесіть його в поле вручну</div>
        </div>
    );
};

const NameComparison = ({ comparison }) => {
    const entries = Object.entries(comparison?.comparisons ?? {});
    if (!entries.length) return null;
    return (
        <Divider title="Порівняння назв:">
            <div className="space-y-2">
                {entries.map(([field, data]) => (
                    <div key={field} className="rounded border border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-gray-800">
                        <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium">{nameFieldLabel(field)}</span>
                            <div className="flex items-center gap-2">
                                <span className={`rounded px-2 py-0.5 text-xs ${similarityClass(data.similarity)}`}>{data.similarity}%</span>
                                <i className={data.isMatch ? "fas fa-check text-green-600 dark:text-green-400" : "fas fa-times text-red-600 dark:text-red-400"} />
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            <div>
                                <strong>Найкраще співпадіння:</strong> "{data.contextName}"
                            </div>
                            <div>
                                <strong>В БД:</strong> "{data.foundName}"
                            </div>
                            {data.originalContextValue && data.originalContextValue !== data.contextName && (
                                <div className="mt-1 border-t border-gray-200 pt-1 dark:border-gray-600">
                                    <strong>Повне значення:</strong> "{data.originalContextValue}"
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Поріг схожості: {comparison.threshold || 80}% | Макс. схожість: {comparison.maxSimilarity || 0}%
            </div>
        </Divider>
    );
};

/** Вміст підказки результату аналізу поля (порт LiveAnalysisTooltipComponent). */
const AnalysisTooltip = ({ result, field, objectId }) => {
    const config = statusConfig(result.status);
    const layers = result.completedLayers ?? [];
    const vd = result.validationData && !Array.isArray(result.validationData) ? result.validationData : {};
    const showObjectId = objectId != null && !String(objectId).startsWith("tmp-");
    return (
        <>
            <div className={`mb-3 flex items-center gap-2 border-b pb-2 ${config.box.split(" ").filter((cls) => cls.includes("border")).join(" ")}`}>
                <i className={`${config.icon} ${config.color}`} />
                <div className="flex-1">
                    <div className="text-sm font-medium">{config.title}</div>
                    <div className="text-xs opacity-75">
                        Поле: {fieldDisplayName(field)}
                        {showObjectId && ` (ID: ${objectId})`}
                    </div>
                </div>
            </div>
            <Progress layers={layers} />
            {result.message?.trim() && (
                <div className="mb-3">
                    <div className="mb-1 text-xs opacity-75">Результат:</div>
                    <div className="text-sm font-medium">{result.message}</div>
                </div>
            )}
            <AlternativeSearch search={vd.alternativeSearch} />
            {vd.databaseRecord && (
                <Divider title="База даних:">
                    <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                        <div className="mb-1 text-sm font-medium">{vd.databaseRecord.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            DRS ID: {vd.databaseRecord.sid}
                            <br />
                            Таблиця: {vd.searchedIn}
                        </div>
                    </div>
                </Divider>
            )}
            <NameComparison comparison={vd.nameComparison} />
            {layers.length > 0 && (
                <Divider title="Деталі перевірки:">
                    <div className="space-y-3">
                        {layers.map((layer, index) => {
                            const layerStyle = layerConfig(layer.status);
                            const data = layerData(result, layer.layer);
                            return (
                                <div key={`${layer.layer}-${index}`} className={`rounded p-3 ${layerStyle.bg}`}>
                                    <div className="mb-2 flex items-center gap-2">
                                        <i className={`${layerStyle.icon} text-xs ${layerStyle.color}`} />
                                        <span className="text-xs font-medium">
                                            {index + 1}. {layerDisplayName(layer.layer)}
                                        </span>
                                    </div>
                                    <div className="pl-5 text-xs leading-relaxed">
                                        {layerMessageLines(layer.message).map((line, lineIndex) => (
                                            <div key={lineIndex}>{line}</div>
                                        ))}
                                        {data && <LayerData data={data} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Divider>
            )}
        </>
    );
};

export default AnalysisTooltip;
