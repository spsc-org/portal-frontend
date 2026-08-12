import React from "react";

// Дрібні перевикористовувані поля для bulk-форм кошика.
// Мультивибір із пошуком — див. спільний Components/fields/MultiSelect.jsx
// (react-select), а не окреме поле тут: AddProposalForm/AddRestrictionsForm/
// RewriteRestrictionsForm використовують його напряму.

export const SelectField = ({ label, value, onChange, options, placeholder = "— оберіть —", required = false }) => (
    <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-200"
        >
            <option value="">{placeholder}</option>
            {options.map((o) => (
                <option key={o.id} value={o.id}>{o.caption}</option>
            ))}
        </select>
    </div>
);
