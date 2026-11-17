import { useRef } from "react";
import { highlightSegments, highlightTitle } from "../../model/liveAnalysisModel.js";

const MARK_CLASS = {
    error: "rounded px-1 font-medium bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
    warning: "rounded px-1 font-medium bg-yellow-200 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100",
};

/** Текст із підсвіченими знахідками аналізу (legacy SimpleTextBlockComponent.applyHighlighting). */
export const HighlightedText = ({ text, items }) =>
    highlightSegments(text, items).map((segment, index) =>
        segment.mark ? (
            <mark key={index} className={MARK_CLASS[segment.mark.severity] ?? MARK_CLASS.warning} title={highlightTitle(segment.mark.type)}>
                {segment.text}
            </mark>
        ) : (
            <span key={index}>{segment.text}</span>
        ),
    );

/** "Відсутні обов'язкові фрази" під полем (legacy _renderRequiredPanel). */
export const RequiredPhrases = ({ phrases }) =>
    phrases?.length ? (
        <div className="mt-1 rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-900/20" data-testid="analysis-required">
            <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0" />
                <div>
                    <span className="font-medium">Відсутні обов'язкові фрази:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {phrases.map((phrase) => (
                            <span key={phrase} className="rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                {phrase}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    ) : null;

const BACKDROP_MARK = {
    error: "rounded-sm bg-red-300/65 text-transparent",
    warning: "rounded-sm bg-yellow-300/55 text-transparent",
};

/**
 * Textarea з підсвіткою фраз позаду тексту (legacy ReasoningHighlightComponent): підкладка
 * з тими самими шрифтом/відступами, текстове поле прозоре, прокрутка синхронізована.
 */
export const HighlightTextarea = ({ value, items, className, ...props }) => {
    const backdropRef = useRef(null);
    return (
    <div className="relative block">
        <div
            ref={backdropRef}
            aria-hidden="true"
            className={`${className} pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words !border-transparent text-transparent`}
        >
            {items.length > 0 &&
                highlightSegments(value, items, { wholeWords: true }).map((segment, index) =>
                    segment.mark ? (
                        <mark key={index} className={BACKDROP_MARK[segment.mark.severity]}>
                            {segment.text}
                        </mark>
                    ) : (
                        <span key={index}>{segment.text}</span>
                    ),
                )}
            {"\n"}
        </div>
        <textarea
            {...props}
            value={value}
            onScroll={(event) => backdropRef.current && (backdropRef.current.scrollTop = event.currentTarget.scrollTop)}
            className={`${className} relative !bg-transparent`}
        />
    </div>
    );
};
