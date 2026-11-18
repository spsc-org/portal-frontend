import { useLayoutEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../shared/mvvm/index.js";
import CardGeneralTab from "./projectCard/CardGeneralTab.jsx";
import CardChangesTab from "./projectCard/CardChangesTab.jsx";

// Кнопки шапки (modalProjectCard/main.blade.php: $cardIconBtn / $cardNavBtn)
const ICON_BTN = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300";
const ICON_IDLE = "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:border-blue-400 dark:hover:bg-neutral-700 dark:hover:text-blue-300";
const ICON_ACTIVE = "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500";
const NAV_BTN = "inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700";

const TabButton = observer(({ tab, title, count }) => {
    const vm = useVM().projectCard;
    const active = vm.tab === tab;
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => vm.setTab(tab)}
            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                active
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-neutral-600 dark:hover:text-gray-200"
            }`}
        >
            {title}
            {count > 0 && <span className="pointer-events-none rounded-full bg-gray-100 px-1.5 py-0.5 text-[0.7rem] text-gray-600 dark:bg-neutral-700 dark:text-gray-300">{count}</span>}
        </button>
    );
});

/** Картка швидкого перегляду (порт #modalProjectCard). Стан — ProjectCardViewModel (vm.projectCard). */
const ProjectCard = () => {
    const vm = useVM().projectCard;
    const scrollRef = useRef(null);
    const projectId = vm.isOpen ? vm.projectId : null;
    const loaded = Boolean(vm.project);
    // Новий проєкт — на початок; розгорнута з панелі картка — на збережену позицію
    useLayoutEffect(() => {
        if (!scrollRef.current || !loaded) return;
        scrollRef.current.scrollTop = vm.consumeRestoreScroll() ?? 0;
    }, [projectId, loaded, vm]);
    if (!vm.isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[1055] overflow-hidden bg-gray-900/50 dark:bg-black/70"
            data-testid="project-card"
            onMouseDown={(event) => event.target === event.currentTarget && vm.close()}
        >
            <div className="relative mx-auto h-full max-h-screen w-full max-w-[96%] py-3" onMouseDown={(event) => event.target === event.currentTarget && vm.close()}>
                {vm.isRefreshing && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/40 dark:bg-neutral-900/70">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                )}
                <div className="flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xl dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
                    <div className="shrink-0 border-b border-gray-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <h3 className="min-w-0 truncate text-base font-bold uppercase text-gray-800 dark:text-gray-300">
                                Деталі проєкту <span className="text-blue-600 dark:text-blue-400">#{vm.projectId}</span>
                            </h3>
                            <div className="flex shrink-0 items-center gap-2">
                                <button type="button" title="Згорнути (картка залишиться внизу екрана)" aria-label="Згорнути" onClick={vm.minimize} className={`${ICON_BTN} ${ICON_IDLE}`}>
                                    <i className="fa-solid fa-window-minimize pointer-events-none text-xs" />
                                </button>
                                <button type="button" aria-label="Закрити" onClick={vm.close} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-colors hover:bg-gray-300 dark:bg-black dark:text-gray-300 dark:hover:bg-neutral-700">
                                    <i className="fa-solid fa-xmark pointer-events-none" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-end justify-between gap-3 px-2">
                            <nav role="tablist" className="flex gap-1 overflow-x-auto overflow-y-hidden">
                                <TabButton tab="general" title="Загальна інформація" />
                                <TabButton tab="changes" title="Історія змін" count={vm.changesCount} />
                            </nav>
                            <div className="flex shrink-0 items-center gap-2 pb-2 pr-2">
                                <button type="button" title={vm.inCart ? "Прибрати з кошика" : "Додати в кошик"} aria-label="Кошик" onClick={vm.toggleCart} className={`${ICON_BTN} ${vm.inCart ? ICON_ACTIVE : ICON_IDLE}`} data-testid="card-cart-toggle">
                                    <i className="fa-solid fa-cart-shopping pointer-events-none text-xs" />
                                </button>
                                {vm.isChain && (
                                    <>
                                        <button type="button" title="Попередній (←)" className={NAV_BTN} disabled={!vm.canPrev} onClick={() => vm.step(-1)}>
                                            <i className="fa-solid fa-chevron-left text-[0.65rem]" /> Попередній
                                        </button>
                                        <button type="button" title="Наступний (→)" className={NAV_BTN} disabled={!vm.canNext} onClick={() => vm.step(1)}>
                                            Наступний <i className="fa-solid fa-chevron-right text-[0.65rem]" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div ref={scrollRef} onScroll={(event) => vm.setScrollTop(event.currentTarget.scrollTop)} className="min-h-0 flex-grow overflow-y-auto bg-gray-50 p-3 dark:bg-neutral-900">
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                            {vm.error ? (
                                <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">{vm.error}</div>
                            ) : vm.isLoading ? (
                                <div className="flex justify-center py-16">
                                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                                </div>
                            ) : vm.tab === "general" ? (
                                <CardGeneralTab />
                            ) : (
                                <CardChangesTab />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Панель згорнутих карток унизу екрана (legacy ProjectCardDock). */
export const ProjectCardDock = observer(() => {
    const vm = useVM().projectCard;
    if (vm.dock.length === 0) return null;
    return (
        <div className="pointer-events-none fixed bottom-2 left-2 right-2 z-[1050] flex flex-wrap-reverse items-end justify-end gap-2" data-i-doc="component:project-card-dock">
            {vm.dock.map((item) => (
                <div key={item.projectId} className="pointer-events-auto flex max-w-[16rem] items-center rounded-lg border border-gray-300 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-700">
                    <button type="button" title={`Розгорнути картку #${item.projectId}`} onClick={() => vm.restoreFromDock(item)} className="flex min-w-0 items-center gap-2 rounded-l-lg py-1.5 pl-3 pr-2 text-sm text-gray-800 hover:bg-blue-50 dark:text-gray-100 dark:hover:bg-neutral-600">
                        <i className="fa-regular fa-window-restore pointer-events-none text-blue-700 dark:text-blue-400" />
                        <span className="pointer-events-none shrink-0 font-semibold">#{item.projectId}</span>
                        <span className="pointer-events-none truncate">{item.caption}</span>
                    </button>
                    <button type="button" title="Закрити" onClick={() => vm.removeFromDock(item.projectId)} className="rounded-r-lg border-l border-gray-200 px-2 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:bg-neutral-600 dark:hover:text-gray-100">
                        <i className="fa-solid fa-xmark pointer-events-none" />
                    </button>
                </div>
            ))}
            {vm.dock.length > 1 && (
                <button type="button" title="Закрити всі згорнуті картки" onClick={vm.clearDock} className="pointer-events-auto rounded-lg border border-gray-300 bg-white/90 px-2 py-1.5 text-xs text-gray-600 shadow hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-700/90 dark:text-gray-300 dark:hover:bg-neutral-600">
                    <i className="fa-solid fa-xmark pointer-events-none" /> Усі
                </button>
            )}
        </div>
    );
});

export default observer(ProjectCard);
