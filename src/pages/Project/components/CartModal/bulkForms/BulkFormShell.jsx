import React, { useState } from "react";

// Спільна "рамка" для всіх 12 bulk-форм (bulkTab1..12 у легасі-модалці):
// поле "reason" (не в усіх форм — addDocument його не має, див. cartManager.js
// prepareRequestBody) + кнопка "Виконати" зі станом завантаження + інлайн
// повідомлення про результат. Кожна конкретна форма (SetStateForm тощо)
// рендерить лише СВОЇ поля як children і передає mutation-об'єкт react-query
// (isPending/isError/...) — сам виклик мутації робить форма (bo в кожної
// свій набір полів/валідація), ця обгортка лише уніфікує "низ" форми.
const BulkFormShell = ({
    title,
    description,
    children,
    hasReason = true,
    reason,
    onReasonChange,
    onSubmit,
    isPending,
    isError,
    errorMessage,
    disabled,
}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400">{title}</h2>

            {description && (
                <div className="space-y-1 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    {description}
                </div>
            )}

            {children}

            {hasReason && (
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Коментар до масової операції
                    </label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        placeholder="Довільний текст"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200 dark:placeholder-gray-500"
                    />
                </div>
            )}

            {isError && (
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            )}

            <div className="mt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isPending || disabled}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                    <i className={`fas ${isPending ? "fa-spinner fa-spin" : "fa-play"} text-xs`} />
                    Виконати
                </button>
            </div>
        </form>
    );
};

export default BulkFormShell;
