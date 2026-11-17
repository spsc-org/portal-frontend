import { createPortal } from "react-dom";
import { useSubmenuViewModel, useViewportClamp } from "../viewModel/useFloatingPlacement.js";
import { shorten } from "../lib/text.js";

// Контекстне меню (View): пункти, роздільники, підменю на hover.
// items — формат features/row-context-menu/model/contextMenuItems.js; menuRef/onSelect — з ViewModel.
// Спільний контрол сам привʼязує лише свій ViewModel розміщення (useFloatingPlacement).
const PANEL = "rounded-lg border border-gray-200 bg-white py-1 text-xs text-gray-700 shadow-lg dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300";
const ROW = "flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left";
const ENABLED = "cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700";
const DISABLED = "cursor-not-allowed opacity-50";

const MenuItem = ({ item, onSelect }) => (
    <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        title={item.disabled ? item.disabledTitle : item.caption}
        onClick={() => onSelect(item)}
        className={`${ROW} ${item.disabled ? DISABLED : ENABLED}`}
    >
        <i className={`fa-regular ${item.icon} w-4 text-gray-500 dark:text-gray-400`} aria-hidden="true" />
        <span>{shorten(item.caption, 60)}</span>
    </button>
);

const MenuGroup = ({ group, onSelect }) => {
    const { open, ref: submenuRef, placement, onEnter, onLeave } = useSubmenuViewModel();

    if (group.children.length === 0) {
        return (
            <div title={group.disabledTitle} className={`${ROW} ${DISABLED}`}>
                <i className={`fa-regular ${group.icon} w-4`} aria-hidden="true" />
                <span className="flex-1">{group.caption}</span>
                <i className="fa-solid fa-chevron-right text-[10px]" aria-hidden="true" />
            </div>
        );
    }

    return (
        <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <div className={`${ROW} ${ENABLED}`} role="menuitem" aria-haspopup="menu" aria-expanded={open}>
                <i className={`fa-regular ${group.icon} w-4 text-gray-500 dark:text-gray-400`} aria-hidden="true" />
                <span className="flex-1">{group.caption}</span>
                <span className="text-[10px] text-gray-400">{group.count}</span>
                <i className="fa-solid fa-chevron-right text-[10px]" aria-hidden="true" />
            </div>
            {open && (
                <div
                    ref={submenuRef}
                    role="menu"
                    style={{ top: placement.shiftTop }}
                    className={`absolute max-h-80 min-w-[12rem] max-w-md overflow-y-auto ${placement.side === "right" ? "left-full" : "right-full"} ${PANEL}`}
                >
                    {group.children.map((child) => (
                        <MenuItem key={child.key} item={child} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ContextMenu = ({ x, y, items, menuRef, onSelect, label }) => {
    const position = useViewportClamp(menuRef, x, y);

    return createPortal(
        <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onContextMenu={(event) => event.preventDefault()}
            style={{ left: position.left, top: position.top, visibility: position.measured ? "visible" : "hidden" }}
            className={`fixed z-[1060] min-w-[12rem] ${PANEL}`}
        >
            {items.map((item) =>
                item.type === "separator" ? (
                    <hr key={item.key} className="my-1 border-gray-200 dark:border-neutral-700" />
                ) : item.type === "group" ? (
                    <MenuGroup key={item.key} group={item} onSelect={onSelect} />
                ) : (
                    <MenuItem key={item.key} item={item} onSelect={onSelect} />
                )
            )}
        </div>,
        document.body
    );
};

export default ContextMenu;
