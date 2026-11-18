import {useEffect, useId, useRef, useState} from "react";

const CollapsibleSection = ({
    title = "Section",
    defaultOpen = true,
    collapsedPreviewRows = 1,
    showHiddenAppliedBadge = false,
    className = "",
    headerClassName = "",
    bodyClassName = "",
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [expandedHeight, setExpandedHeight] = useState(0);
    const [collapsedHeight, setCollapsedHeight] = useState(0);
    const [hiddenAppliedCount, setHiddenAppliedCount] = useState(0);
    const contentRef = useRef(null);
    const sectionId = useId();

    useEffect(() => {
        const calculateHeights = () => {
            const contentNode = contentRef.current;
            if (!contentNode) return;

            const nextExpandedHeight = contentNode.scrollHeight;
            let nextCollapsedHeight = 0;

            if (collapsedPreviewRows > 0) {
                const primaryLayoutNode = contentNode.firstElementChild;
                const items = Array.from(primaryLayoutNode?.children || []);

                if (items.length > 0) {
                    const layoutRect = primaryLayoutNode.getBoundingClientRect();
                    const itemTops = items
                        .map((item) => {
                            const rect = item.getBoundingClientRect();
                            if (rect.height <= 0) return null;
                            // Use visual top position relative to grid container.
                            return Math.round(rect.top - layoutRect.top);
                        })
                        .filter((top) => top !== null);

                    const uniqueTops = [...new Set(itemTops)].sort((a, b) => a - b);

                    if (uniqueTops.length <= collapsedPreviewRows) {
                        if (items.length > 0 && collapsedPreviewRows === 1) {
                            // Fallback: force a single-row preview even when rows collapse to one top value.
                            const firstRect = items[0].getBoundingClientRect();
                            const layoutStyle = window.getComputedStyle(primaryLayoutNode);
                            const rowGapValue = parseFloat(layoutStyle.rowGap || layoutStyle.gap || "0") || 0;
                            nextCollapsedHeight = Math.min(nextExpandedHeight, Math.ceil(firstRect.height + rowGapValue / 2));
                        } else {
                            nextCollapsedHeight = nextExpandedHeight;
                        }
                        if (showHiddenAppliedBadge) setHiddenAppliedCount(0);
                    } else {
                        const nextRowTop = uniqueTops[collapsedPreviewRows];
                        const layoutStyle = window.getComputedStyle(primaryLayoutNode);
                        const rowGapValue = parseFloat(layoutStyle.rowGap || layoutStyle.gap || "0") || 0;

                        // Cut exactly before the next row starts (with a tiny gap compensation).
                        nextCollapsedHeight = Math.max(0, nextRowTop - Math.max(0, rowGapValue / 2));

                        if (showHiddenAppliedBadge) {
                            const hiddenItems = items.filter((item) => {
                                const rect = item.getBoundingClientRect();
                                const top = Math.round(rect.top - layoutRect.top);
                                return top >= nextRowTop;
                            });

                            let nextHiddenAppliedCount = 0;
                            hiddenItems.forEach((item) => {
                                if (item.matches('[data-filter-active="true"]')) {
                                    nextHiddenAppliedCount += 1;
                                }
                                nextHiddenAppliedCount += item.querySelectorAll('[data-filter-active="true"]').length;
                            });

                            setHiddenAppliedCount(nextHiddenAppliedCount);
                        }
                    }
                }
            }

            if (!showHiddenAppliedBadge) {
                setHiddenAppliedCount(0);
            }

            setExpandedHeight(nextExpandedHeight);
            setCollapsedHeight(nextCollapsedHeight);
        };

        calculateHeights();

        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(calculateHeights) : null;
        if (observer && contentRef.current) {
            observer.observe(contentRef.current);
        }
        window.addEventListener("resize", calculateHeights);

        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener("resize", calculateHeights);
        };
    }, [children, collapsedPreviewRows, showHiddenAppliedBadge]);

    return (
        <div className={className}>
            <div className={`transition flex items-center justify-between gap-2 ${headerClassName}`}>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {title}
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(prevState => !prevState)}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-700 dark:text-gray-200 dark:hover:border-blue-400 dark:hover:bg-neutral-600"
                    aria-expanded={isOpen}
                    aria-controls={sectionId}
                >
                    <i className={`fa-solid ${isOpen ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                    {isOpen ? "Згорнути" : "Розгорнути"}
                    {!isOpen && hiddenAppliedCount > 0 && (
                        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white dark:bg-blue-500 dark:text-gray-900">
                            {hiddenAppliedCount}
                        </span>
                    )}
                </button>
            </div>

            <div
                id={sectionId}
                className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${bodyClassName}`}
                style={{maxHeight: `${isOpen ? expandedHeight : collapsedHeight}px`}}
            >
                <div ref={contentRef}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CollapsibleSection;
