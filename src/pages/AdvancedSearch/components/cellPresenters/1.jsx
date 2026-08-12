import React from 'react';
import {Tooltip} from "@material-tailwind/react";
import DecreeBadge from "../atoms/DecreeBadge.jsx";

// Презентери комірок для Dataset #1 (Portal Projects)
export default {
    // Кастомне відображення для колонки 'identifiers'
    identifiers: ({ row, highlightText, filters }) => {
        const originalData = row.original.original_data || {};
        const { precomputedData } = originalData;

        let identifiers = [];
        if (precomputedData && precomputedData.identifiers && Array.isArray(precomputedData.identifiers)) {
            identifiers = precomputedData.identifiers;
        } else if (originalData.computed_identifiers) {

            identifiers = originalData.computed_identifiers.split('; ').map(id => ({ text: id }));
        }

        if (identifiers.length === 0) return <span className="text-gray-400 dark:text-slate-500">----</span>;

        return (
            <div className="flex flex-col gap-1 text-xs">
                {identifiers.map((item, index) => {
                    let text = item.text || '';
                    if (!text) {
                        text = item.value;
                        if (item.caption) text = `${item.caption}: ${text}`;
                        if (item.country) text = `${text} (${item.country})`;
                    }

                    // Визначаємо іконку/колір за групою
                    let iconClass = "fa-regular fa-id-card";
                    let colorClass = "text-gray-500 dark:text-slate-400";

                    if (item.group === 'tax') {
                        iconClass = "fa-solid fa-sack-dollar";
                        colorClass = "text-green-600 dark:text-green-400";
                    } else if (item.group === 'reg') {
                        iconClass = "fa-solid fa-building";
                        colorClass = "text-blue-600 dark:text-blue-400";
                    }

                    return (
                        <div key={index} className="flex items-start gap-1.5">
                            <i className={`${iconClass} mt-0.5 text-[10px] ${colorClass}`}></i>
                            <span className="leading-tight text-gray-800 dark:text-slate-200">
                                {highlightText(text, filters.search)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    },

    // Кастомне відображення для колонки 'decree'
    decree: ({ row, highlightText, filters }) => {
        const originalData = row.original.original_data || {};
        const { precomputedData } = originalData;

        const decree = precomputedData?.decree ?? null;

        let proposals = [];
        if (precomputedData?.proposals && Array.isArray(precomputedData.proposals)) {
            proposals = precomputedData.proposals;
        } else if (originalData.computed_proposals) {
            proposals = originalData.computed_proposals.split('; ').map(p => ({ caption: p }));
        }

        if (!decree && proposals.length === 0) {
            return <span className="text-gray-400 dark:text-slate-500">----</span>;
        }

        return (
            <div className="flex flex-col gap-1.5 text-xs">
                {/* Указ (новий підхід — з precomputedData.decree) */}
                {decree && (
                    <div className="flex flex-col gap-0.5">
                        <DecreeBadge
                            code={decree.code}
                            highlightText={highlightText}
                            filters={filters}
                        />
                        {decree.date && (
                            <span className="text-gray-400 dark:text-slate-500 text-[10px] pl-0.5">
                                {decree.date.substring(0, 10)}
                            </span>
                        )}
                    </div>
                )}

                {/* Подання */}
                {proposals.map((prop, index) => (
                    <div key={index} className="flex items-start gap-1.5">
                        <i className="fa-solid fa-folder-open mt-0.5 text-[10px] text-blue-400 dark:text-blue-500"></i>
                        <span className="font-medium text-gray-900 dark:text-slate-200 leading-tight">
                            {highlightText(prop.caption || '', filters.search)}
                        </span>
                    </div>
                ))}
            </div>
        );
    },

    // Кастомне відображення для колонки 'other'
    other: ({ row, highlightText, filters }) => {
        const originalData = row.original.original_data || {};
        const {
            state_icon, state_color, state_caption,
            action_type_caption,
            precomputedData,
            computed_documents
        } = originalData;

        // Отримуємо документи з precomputedData, якщо вони є
        let documents = [];
        if (precomputedData && precomputedData.documents && Array.isArray(precomputedData.documents)) {
            documents = precomputedData.documents;
        } else if (computed_documents) {
            // Фолбек на текстове поле, якщо precomputedData недоступна
            documents = computed_documents.split('; ').map(doc => ({ text: doc }));
        }

        return (
            <div className="flex flex-col gap-1.5 text-xs">
                {/* Блок статусу та типу дії */}
                {(state_caption || action_type_caption) && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                        {state_caption && (
                            <Tooltip content={state_caption}>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30 text-gray-700 dark:text-slate-300">
                                    {state_icon && <i className={`${state_icon} ${state_color || 'text-gray-500 dark:text-slate-400'}`}></i>}
                                    <span className="font-medium">{state_caption}</span>
                                </span>
                            </Tooltip>
                        )}
                        {action_type_caption && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium">
                                {action_type_caption}
                            </span>
                        )}
                    </div>
                )}

                {/* Документи */}
                {documents.length > 0 && (
                    <div className="flex flex-col gap-1 mt-0.5">
                        {documents.map((doc, index) => {
                            // Формуємо текст документа
                            let docText = doc.text || '';
                            if (!docText) {
                                const parts = [];
                                if (doc.unitCaption) parts.push(doc.unitCaption);
                                if (doc.regNum) parts.push(`№${doc.regNum}`);
                                if (doc.regDate) parts.push(`від ${doc.regDate}`);
                                docText = parts.join(' ');
                            }

                            return (
                                <div key={index} className="flex items-start gap-1.5 text-gray-800 dark:text-slate-300">
                                    <i className="fa-regular fa-file-lines mt-0.5 text-gray-400 dark:text-slate-500 text-[10px]"></i>
                                    <span className="leading-tight">
                                        {highlightText(docText, filters.search)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
};
