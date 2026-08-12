import React from "react";
import {useDossierOptionsQuery} from "../../entities/dossier/queries.js";
import {pluralDays} from "../../entities/dossier/model.js";

// Впізнаваний бейдж стану "під санкціями України" — переюзаний і в Реєстрі досьє (рядок),
// і в Картці досьє. Підпис — з options.uaSanctionsStatuses (єдине джерело правди,
// DossierService::getOptions()); фон/рамка пілюлі — тут, бо options.style дає лише
// колір тексту (той самий формат, що й у DictValue, там цього достатньо, тут — мало).
const BADGE_CLASSES = {
    active: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
    expired: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
    // Не сірий/нейтральний навмисно — санкції реально БУЛИ (на відміну від "none"), просто скасовані.
    cancelled: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800",
    none: "bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700",
};

// Щит завжди показує якийсь символ поруч (в обох варіантах — full і compact): число
// (active), "∞" (active без daysRemaining — безстроково), "×" (cancelled — скасовані),
// "—" (expired/none).
const compactValue = (status, daysRemaining) =>
    status === "active"
        ? (typeof daysRemaining === "number" ? daysRemaining : "∞")
        : status === "cancelled"
            ? "×"
            : "—";

// onRefresh/isRefreshing — опційні: якщо передані, поруч зʼявляється кнопка примусового
// перерахунку для цього конкретного досьє (та сама логіка, що й щоденна
// dossier:refresh-status, без очікування крону) — і в Картці, і в Реєстрі.
// variant="compact" (Реєстр досьє, місця мало) і variant="full" (Картка досьє) — та сама
// структура (щит + значення), full лише додає слова (підпис стану, "· ще N днів").
const SanctionsStatusBadge = ({status, daysRemaining, onRefresh, isRefreshing = false, variant = "full"}) => {
    const {data: options} = useDossierOptionsQuery();
    const meta = options?.uaSanctionsStatuses?.find((item) => item.id === status);

    if (!meta) {
        return null;
    }

    const isCompact = variant === "compact";
    const daysPhrase = typeof daysRemaining === "number" ? `ще ${daysRemaining} ${pluralDays(daysRemaining)}` : "безстроково";

    return (
        <span className="inline-flex items-center gap-1">
            <span
                title={`${meta.caption}${status === "active" ? ` · ${daysPhrase}` : ""}`}
                className={`inline-flex items-center gap-1 font-semibold rounded-md border ${BADGE_CLASSES[status] ?? BADGE_CLASSES.none} ${
                    isCompact ? "text-[10.5px] px-1.5 py-0.5" : "text-[11px] px-2 py-1"
                }`}
            >
                <i className={`fa-solid fa-shield ${isCompact ? "text-[9px]" : "text-[10px]"}`}></i>
                {isCompact ? (
                    compactValue(status, daysRemaining)
                ) : (
                    <>
                        {meta.caption}
                        {status === "active" && <span className="font-normal opacity-80">· {daysPhrase}</span>}
                    </>
                )}
            </span>
            {Boolean(onRefresh) && (
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title="Примусово перерахувати стан підсанкційності цього досьє"
                    className={`inline-flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-900/40 dark:hover:text-blue-400 ${
                        isCompact ? "w-4 h-4" : "w-6 h-6"
                    }`}
                >
                    <i className={`fa-solid fa-rotate ${isCompact ? "text-[9px]" : "text-[11px]"} ${isRefreshing ? "fa-spin" : ""}`}></i>
                </button>
            )}
        </span>
    );
};

export default SanctionsStatusBadge;
