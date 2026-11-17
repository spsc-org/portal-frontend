import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { observer } from "mobx-react-lite";
import { statusConfig } from "../../model/liveAnalysisModel.js";
import AnalysisTooltip from "./AnalysisTooltip.jsx";

const TOOLTIP_WIDTH = 700;
const GAP = 8;

/** Позиція підказки біля значка з урахуванням меж вікна (legacy showAnalysisTooltip). */
function placeTooltip(rect, height) {
    const width = Math.min(TOOLTIP_WIDTH, window.innerWidth * 0.9);
    let left = rect.right + GAP;
    let top = rect.top;
    if (left + width > window.innerWidth - GAP) left = rect.left - width - GAP;
    if (left < GAP) {
        left = Math.max(GAP, rect.left + rect.width / 2 - width / 2);
        top = rect.bottom + GAP;
    }
    if (top + height > window.innerHeight - GAP) top = rect.top - height - GAP;
    return { left: Math.max(GAP, Math.min(left, window.innerWidth - width - GAP)), top: Math.max(GAP, top) };
}

/**
 * Значок результату живого аналізу поля (legacy .analysis-container): спінер / ❌ / іконка статусу,
 * при наведенні — детальна підказка. `state` — LiveAnalysisState, `field`/`objectId` — ключ.
 */
const AnalysisBadge = ({ state, field, objectId = null, className = "" }) => {
    const badge = state.badge(field, objectId);
    const anchorRef = useRef(null);
    const closeTimer = useRef(null);
    const [anchorRect, setAnchorRect] = useState(null);
    const hasResult = !["idle", "loading", "error"].includes(badge.status);

    useEffect(() => {
        if (!anchorRect) return undefined;
        const close = () => setAnchorRect(null);
        window.addEventListener("scroll", close, true);
        return () => window.removeEventListener("scroll", close, true);
    }, [anchorRect]);
    useEffect(() => () => clearTimeout(closeTimer.current), []);

    const open = () => {
        if (!hasResult) return;
        clearTimeout(closeTimer.current);
        setAnchorRect(anchorRef.current.getBoundingClientRect());
    };
    const scheduleClose = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setAnchorRect(null), 150);
    };

    let content;
    if (badge.status === "loading") content = <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />;
    else if (badge.status === "error") content = <span className="text-red-500">❌</span>;
    else if (badge.status === "idle") content = null;
    else {
        const config = statusConfig(badge.status);
        content = <i className={`${config.icon} ${config.color} text-sm`} />;
    }

    return (
        <span
            ref={anchorRef}
            data-analysis-field={field}
            data-analysis-status={badge.status}
            onMouseEnter={open}
            onMouseLeave={scheduleClose}
            className={`relative inline-flex h-5 w-5 min-w-[20px] shrink-0 items-center justify-center rounded ${hasResult ? "cursor-help" : ""} ${className}`}
        >
            {content}
            {anchorRect &&
                hasResult &&
                createPortal(
                    <div
                        ref={(node) => {
                            // позиція за реальною висотою підказки (legacy showAnalysisTooltip)
                            if (!node) return;
                            const { left, top } = placeTooltip(anchorRect, Math.min(node.scrollHeight, window.innerHeight * 0.8));
                            node.style.left = `${left}px`;
                            node.style.top = `${top}px`;
                        }}
                        onMouseEnter={() => clearTimeout(closeTimer.current)}
                        onMouseLeave={scheduleClose}
                        className={`fixed z-[10000] max-h-[90vh] w-[700px] max-w-[90vw] overflow-y-auto rounded-lg border p-4 text-sm shadow-xl ${statusConfig(badge.status).box}`}
                        data-testid="analysis-tooltip"
                    >
                        <AnalysisTooltip result={badge} field={field} objectId={objectId} />
                    </div>,
                    document.body,
                )}
        </span>
    );
};

export default observer(AnalysisBadge);
