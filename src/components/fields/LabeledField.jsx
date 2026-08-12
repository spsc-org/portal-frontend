import React, {forwardRef} from "react";

// Спільна розмітка "label + поле форми" (модалки створення/редагування:
// Announcement, DeveloperPost, Handbook Телефони/Дні народження) — раніше
// продубльована окремо в кожному модалі (border/bg/padding/focus-стиль
// повторювався буква в букву). Три атомарні поля тут покривають усі наявні
// випадки; `invalid` (лише LabeledInput) — для inline-валідації на кшталт
// формату версії в CreateDeveloperPostModal. forwardRef на Input/Textarea —
// DeveloperPost вставляє markdown-зображення в позицію курсора textarea.
const FieldLabel = ({children}) => (
    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{children}</label>
);

export const LabeledInput = forwardRef(({label, invalid = false, className = "", ...props}, ref) => (
    <div>
        <FieldLabel>{label}</FieldLabel>
        <input
            ref={ref}
            className={`w-full rounded-md border bg-white p-2 text-sm text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100 ${
                invalid
                    ? "border-red-300 dark:border-red-700"
                    : "border-slate-200 focus:border-blue-300 dark:border-slate-700"
            } ${className}`}
            {...props}
        />
    </div>
));

export const LabeledTextarea = forwardRef(({label, className = "", ...props}, ref) => (
    <div>
        <FieldLabel>{label}</FieldLabel>
        <textarea
            ref={ref}
            className={`w-full resize-y rounded-md border border-slate-200 bg-white p-2 text-sm leading-relaxed text-slate-700 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 ${className}`}
            {...props}
        />
    </div>
));

export const LabeledSelect = ({label, children, className = "", ...props}) => (
    <div>
        <FieldLabel>{label}</FieldLabel>
        <select
            className={`w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-blue-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 ${className}`}
            {...props}
        >
            {children}
        </select>
    </div>
);
