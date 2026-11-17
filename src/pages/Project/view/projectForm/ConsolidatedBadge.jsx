import { observer } from "mobx-react-lite";

/**
 * Значок збігів у консолідованій базі біля поля (legacy span.cs-field-badge):
 * до першого пошуку невидимий, далі — спінер / кількість (клік — збіги поля) / сірий 0.
 */
const ConsolidatedBadge = ({ search, fieldKey }) => {
    const status = search.status[fieldKey];
    const hasResult = status === "result";
    const base = "inline-flex shrink-0 select-none items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors";
    const tone = hasResult
        ? "cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/60"
        : "cursor-default bg-gray-100 text-gray-400 dark:bg-gray-700/60 dark:text-gray-500";
    return (
        <button
            type="button"
            tabIndex={hasResult ? 0 : -1}
            disabled={!hasResult}
            onClick={() => search.openField(fieldKey)}
            title={hasResult ? "Збіги в консолідованій базі — клік для перегляду" : status === "empty" ? "Збігів не знайдено" : "Консолідована база"}
            data-consolidated-field={fieldKey}
            data-consolidated-status={status ?? "idle"}
            className={`${base} ${tone} ${status ? "" : "invisible"} disabled:pointer-events-none`}
        >
            {status === "loading" ? <i className="fa-solid fa-circle-notch fa-spin" /> : <span>{hasResult ? search.count(fieldKey) : status === "empty" ? 0 : ""}</span>}
            <i className="fa-solid fa-globe text-[9px] opacity-60" />
        </button>
    );
};

export default observer(ConsolidatedBadge);
