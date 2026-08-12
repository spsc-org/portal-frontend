import React from 'react';

const DecreeBadge = ({ code, highlightText, filters, className = '' }) => {
    if (!code) return null;

    return (
        <div className={`flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded w-fit border border-red-100 dark:border-red-900/30 ${className}`}>
            <i className="fa-solid fa-gavel text-[10px]"></i>
            <span className="font-bold text-[10px]">
                {highlightText ? highlightText(`${code}`, filters?.search) : `${code}`}
            </span>
        </div>
    );
};

export default DecreeBadge;
