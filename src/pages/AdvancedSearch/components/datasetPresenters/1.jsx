import {Chip, Typography} from "@material-tailwind/react";

// Хелпери розмітки — на рівні модуля (не створюються заново в кожному рендері).
// Helper для відображення секції
const Section = ({title, children, className = ""}) => (
    <div className={`mb-4 ${className}`}>
        <Typography variant="h6" color="blue-gray" className="dark:text-slate-200 mb-2 text-sm font-bold uppercase tracking-wider border-b dark:border-slate-600 pb-1">
            {title}
        </Typography>
        {children}
    </div>
);


// Helper для рядка даних
const InfoRow = ({label, value, children}) => {
    if (!value && !children) return null;
    return (
        <div className="flex flex-col sm:flex-row sm:gap-2 mb-1">
            <span className="text-gray-600 dark:text-slate-400 font-medium min-w-[120px] text-sm">{label}:</span>
            <span className="text-gray-900 dark:text-slate-200 text-sm break-words flex items-center gap-2">
                {children || value}
            </span>
        </div>
    );
};


const Dataset1Presenter = ({record}) => {
    if (!record) return null;

    const {
        nameUk, nameRu, nameEn, birthDate,
        adrUk, adrRu, adrEn,
        reasoning, notes,
        state_caption, state_icon, state_color,
        action_type_caption,
        precomputedData
    } = record;

    let data = precomputedData || {};
    // Захист від випадку, якщо precomputedData прийшов як рядок
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse precomputedData", e);
            data = {};
        }
    }

    return (
        <div className="flex flex-col gap-4 p-2">
            {/* Header Info */}
            <div className="bg-gray-50 dark:bg-slate-700/30 p-3 rounded-lg border border-gray-200 dark:border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InfoRow label="Статус">
                            {state_icon && <i className={`${state_icon} ${state_color || 'text-gray-600 dark:text-slate-400'}`}></i>}
                            <span>{state_caption}</span>
                        </InfoRow>
                        <InfoRow label="Тип дії" value={action_type_caption}/>
                        <InfoRow label="Дата народження" value={birthDate}/>
                    </div>
                    <div>
                        <InfoRow label="Ім'я (UK)" value={nameUk}/>
                        <InfoRow label="Ім'я (RU)" value={nameRu}/>
                        <InfoRow label="Ім'я (EN)" value={nameEn}/>
                    </div>
                </div>
            </div>

            {/* Addresses */}
            {(adrUk || adrRu || adrEn) && (
                <Section title="Адреси">
                    <InfoRow label="Адреса (UK)" value={adrUk}/>
                    <InfoRow label="Адреса (RU)" value={adrRu}/>
                    <InfoRow label="Адреса (EN)" value={adrEn}/>
                </Section>
            )}

            {/* Identifiers */}
            {data.identifiers && Array.isArray(data.identifiers) && data.identifiers.length > 0 && (
                <Section title="Ідентифікатори">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max table-auto text-left text-sm">
                            <thead>
                            <tr className="border-b border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800">
                                <th className="p-2 font-medium text-gray-700 dark:text-slate-300">Тип</th>
                                <th className="p-2 font-medium text-gray-700 dark:text-slate-300">Значення</th>
                                <th className="p-2 font-medium text-gray-700 dark:text-slate-300">Країна</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.identifiers.map((item, index) => (
                                <tr key={index} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-2 text-gray-800 dark:text-slate-300">{item.caption || item.group}</td>
                                    <td className="p-2 font-mono text-gray-800 dark:text-slate-300">{item.value}</td>
                                    <td className="p-2 text-gray-800 dark:text-slate-300">{item.country}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            )}

            {/* Restrictions */}
            {data.restrictions && Array.isArray(data.restrictions) && data.restrictions.length > 0 && (
                <Section title="Обмеження (Санкції)">
                    <div className="flex flex-wrap gap-2">
                        {data.restrictions.map((item, index) => {
                            // Визначаємо колір чіпа
                            let color = "blue";
                            if (item.color === 'g') color = "green"; // green - active/good?
                            if (item.color === 'o') color = "orange"; // orange - warning?
                            if (item.color === 'r') color = "red"; // red - error/inactive?

                            return (
                                <Chip
                                    key={index}
                                    value={`${item.num}${item.value ? ': ' + item.value : ''}`}
                                    color={color}
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-full normal-case"
                                />
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* Proposals */}
            {data.proposals && Array.isArray(data.proposals) && data.proposals.length > 0 && (
                <Section title="Пропозиції (Пакети)">
                    <ul className="space-y-2 text-sm">
                        {data.proposals.map((prop, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-800 dark:text-slate-200">
                                <span className="text-gray-400 dark:text-slate-500 mt-1">•</span>
                                <div>
                                    <span className="font-medium">{prop.caption}</span>

                                    {prop.decreeCode && (
                                        <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded w-fit">
                                            <i className="fa-solid fa-gavel text-xs"></i>
                                            <span className="font-bold text-xs">№{prop.decreeCode}</span>
                                        </div>
                                    )}

                                    {prop.stateId && <span className="text-xs text-gray-400 dark:text-slate-500 ml-2">[State: {prop.stateId}]</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {/* Documents */}
            {data.documents && Array.isArray(data.documents) && data.documents.length > 0 && (
                <Section title="Документи (Підстави)">
                    <ul className="space-y-2 text-sm">
                        {data.documents.map((doc, index) => (
                            <li key={index} className="flex items-start gap-2 bg-gray-50 dark:bg-slate-700/30 p-2 rounded">
                                <i className="fa-regular fa-file-lines mt-1 text-blue-500 dark:text-blue-400"></i>
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-slate-200">{doc.unitCaption}</div>
                                    <div className="text-gray-600 dark:text-slate-400">№{doc.regNum} від {doc.regDate}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {/* Attachments */}
            {data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0 && (
                <Section title="Вкладення">
                    <ul className="space-y-2 text-sm">
                        {data.attachments.map((att, index) => (
                            <li key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/30 p-2 rounded border border-gray-100 dark:border-slate-600">
                                <i className="fa-solid fa-paperclip text-gray-500 dark:text-slate-400"></i>
                                <span className="text-gray-800 dark:text-slate-200 font-medium break-all">{att.original_name}</span>
                                {att.mime_type && <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{att.mime_type}</span>}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {/* Categories */}
            {data.categories && Array.isArray(data.categories) && data.categories.length > 0 && (
                <Section title="Категорії">
                    <div className="flex flex-wrap gap-2">
                        {data.categories.map((cat, index) => (
                            <Chip
                                key={index}
                                value={cat.caption}
                                variant="outlined"
                                size="sm"
                                className="rounded-full normal-case border-gray-300 dark:border-slate-500 text-gray-700 dark:text-slate-300"
                            />
                        ))}
                    </div>
                </Section>
            )}

            {/* Reasoning */}
            {reasoning && (
                <Section title="Обґрунтування">
                    <div className="text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-700/30 p-3 rounded border border-gray-200 dark:border-slate-600 whitespace-pre-wrap">
                        {reasoning}
                    </div>
                </Section>
            )}

            {/* Notes */}
            {notes && (
                <Section title="Примітки">
                    <div className="text-sm text-gray-600 dark:text-slate-400 italic">
                        {notes}
                    </div>
                </Section>
            )}
        </div>
    );
};

export default Dataset1Presenter;
