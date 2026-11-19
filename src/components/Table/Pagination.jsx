import {DOTS, usePagination} from "../../hooks/usePagination.jsx";
import React from "react";

const Pagination = ({
                        currentPage = 1,
                        onPageChange,
                        onLimitChange,
                        siblingCount = 1,
                        totalCount = 0,
                        pageSize = 50
                    }) => {
    const paginationRange = usePagination({
        currentPage,
        totalCount,
        siblingCount,
        pageSize
    });

    const onNext = () => {
        onPageChange(currentPage + 1);
    };

    const onPrevious = () => {
        onPageChange(currentPage - 1);
    };
    let lastPage = paginationRange[paginationRange.length - 1];

    const handleChangeLimit = (event) => {
        onLimitChange(event?.target?.value);
    }

    return (
        <div className="flex flex-wrap shadow-md items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 dark:border-gray-700 dark:bg-gray-900/60">
            <div className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                <span>Знайдено: {totalCount}</span>
            </div>

            <div className="flex items-center gap-2">
                <label htmlFor="selectLimit" className="whitespace-nowrap text-xs font-semibold text-gray-700 dark:text-slate-300">
                    На сторінці
                </label>
                <div className="relative">
                    <select
                        id="selectLimit"
                        value={pageSize}
                        onChange={handleChangeLimit}
                        className="h-8 w-[4.5rem] rounded-md border border-gray-300 bg-white pl-2.5 pr-7 text-sm font-medium leading-none text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200 dark:focus:border-blue-400"
                        style={{appearance: "none", WebkitAppearance: "none", MozAppearance: "none"}}
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                    </select>
                </div>
            </div>
            <div className="ml-auto flex items-center gap-1">
                {
                    paginationRange.length > 2 &&
                    <button onClick={onPrevious} disabled={currentPage === 1}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:bg-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5"
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
                            </svg>
                            <span>Назад</span>
                    </button>
                }
                {
                    paginationRange.map((pageNumber, index) => {
                        if (pageNumber === DOTS) {
                            return <span key={index + 1} className="px-1 text-xs text-gray-500 dark:text-gray-400">&#8230;</span>;
                        }
                        return (
                            <button key={index + 1} onClick={() => onPageChange(pageNumber)}
                                    className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors
                                    ${currentPage === pageNumber
                                        ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500 dark:text-gray-900"
                                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-400 dark:hover:bg-gray-700"}`}>
                                {pageNumber}
                            </button>
                        )
                    })
                }
                {
                    paginationRange.length > 2 &&
                    <button onClick={onNext} disabled={currentPage === lastPage}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:bg-gray-700">
                            <span>Далі</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5"
                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                            </svg>
                    </button>
                }
            </div>
        </div>
    );
};

export default Pagination;
