import { observer } from "mobx-react-lite";
import { useVM } from "../../../../shared/mvvm/index.js";
import { ANALYSED_FIELDS, highlightItems, missingPhrases } from "../../model/liveAnalysisModel.js";
import AnalysisBadge from "../liveAnalysis/AnalysisBadge.jsx";
import { HighlightedText, RequiredPhrases } from "../liveAnalysis/AnalysisText.jsx";

// Класи полів картки (modalProjectCard/tab-general.blade.php)
const BOX = "rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-gray-100";
const TONES = {
    default: { title: "text-gray-600 dark:text-gray-400", box: BOX },
    green: { title: "text-green-700 dark:text-green-400", box: "rounded-md border border-green-300 bg-green-50 px-2.5 py-1.5 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400" },
    blue: { title: "text-blue-700 dark:text-blue-300", box: "rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-100" },
};

// Поле вводу інлайн-редагування: займає місце значення і не виходить за рамку блоку
// (min-w-0 w-full — інакше input у flex не стискається нижче ~20 символів). Відступи й
// шрифт задано явно: @tailwindcss/forms дає input/textarea padding .5rem .75rem і 1rem.
const EDIT_INPUT =
    "block min-h-[1.5em] w-full min-w-0 flex-1 rounded border border-dashed border-blue-400 bg-blue-50 px-1 py-0 text-sm leading-[1.5] text-gray-800 shadow-none focus:border-solid focus:border-blue-500 focus:outline-none focus:ring-0 dark:border-blue-500 dark:bg-blue-900/30 dark:text-gray-100";

export const Box = ({ children, className = "", title }) => (
    <div className={`${BOX} ${className}`} title={title}>
        {children}
    </div>
);

export const SectionTitle = ({ children, tone = "default" }) => <h3 className={`mb-1 text-xs ${TONES[tone].title}`}>{children}</h3>;

/** Значення зі словника (legacy SimpleVocTextBlockComponent): блок ховається, якщо значення немає. */
export const VocField = ({ title, value }) =>
    value ? (
        <div>
            <SectionTitle>{title}</SectionTitle>
            <div className={BOX}>
                <span className="block truncate" title={value.length > 40 ? value : undefined}>
                    {value}
                </span>
            </div>
        </div>
    ) : null;

/**
 * Текстове поле картки з редагуванням (legacy SimpleTextBlockComponent):
 * ✏️ при наведенні → поле вводу, Enter/втрата фокусу — зберегти, Escape — скасувати.
 * Невдале збереження підсвічується червоним, значення лишається для повтору.
 */
export const CardText = observer(({ field, label, title, tone = "default", editable, multiline = false, alwaysVisible = false }) => {
    const vm = useVM().projectCard;
    const value = vm.project?.[field];
    const failed = vm.failed[field];
    const isEditing = vm.editing?.field === field;
    const canEdit = editable ?? vm.isEditable;
    const shown = failed ?? (value == null ? "" : String(value));
    if (!shown && !isEditing && !alwaysVisible && !canEdit) return null;
    const onKeyDown = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            vm.cancelEdit();
        } else if (event.key === "Enter" && (!multiline || event.ctrlKey)) {
            event.preventDefault();
            event.currentTarget.blur();
        }
    };
    const Input = multiline ? "textarea" : "input";
    // живий аналіз: значок у полі, підсвітка знахідок, відсутні обов'язкові фрази під полем
    const analysed = ANALYSED_FIELDS.includes(field);
    const analysis = analysed && failed == null ? vm.analysis.textResult(field) : null;
    const items = analysis ? highlightItems(analysis.validationData, shown) : [];
    return (
        <div>
            {title && <SectionTitle tone={tone}>{title}</SectionTitle>}
            <div className={`${TONES[tone].box} ${failed != null ? "bg-red-100 text-red-700 outline outline-1 outline-red-400" : ""}`} title={failed != null ? "Не збережено! Натисніть ✏️ і Enter, щоб повторити, або Escape, щоб скасувати" : undefined}>
                <div className="group relative flex w-full items-start gap-2">
                    {label && <span className="whitespace-nowrap text-blue-600 dark:text-blue-400">{label}</span>}
                    {isEditing ? (
                        <Input
                            autoFocus
                            rows={multiline ? 6 : undefined}
                            value={vm.editing.value}
                            onChange={(event) => vm.setEditValue(event.target.value)}
                            onKeyDown={onKeyDown}
                            onBlur={vm.commitEdit}
                            className={EDIT_INPUT}
                        />
                    ) : (
                        <span className={`min-h-[1.5em] min-w-0 flex-1 break-words ${multiline ? "whitespace-pre-wrap" : ""}`}>{items.length ? <HighlightedText text={shown} items={items} /> : shown}</span>
                    )}
                    {vm.savingField === field && <i className="fa-solid fa-spinner fa-spin mt-1 text-xs text-gray-500" />}
                    {analysed && <AnalysisBadge state={vm.analysis} field={field} className={canEdit ? "mr-6" : ""} />}
                    {canEdit && !isEditing && (
                        <button type="button" title="Редагувати" onClick={() => vm.startEdit(field)} className="absolute right-0 top-0 px-1 opacity-0 transition-opacity group-hover:opacity-100">
                            ✏️
                        </button>
                    )}
                </div>
            </div>
            {analysis && <RequiredPhrases phrases={missingPhrases(analysis)} />}
        </div>
    );
});

/** Прапор країни (public/flag-svg бекенду). */
export const Flag = ({ iso2, title }) =>
    iso2 ? <span className="mr-2 inline-block h-4 w-5 shrink-0 bg-cover bg-no-repeat align-middle" style={{ backgroundImage: `url('/flag-svg/${iso2}.svg')` }} title={title} /> : null;
