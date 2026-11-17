
// View: кнопка "Нові проєкти: N" під пагінацією (Portal UI kit: primary-tint / primary-on-tint).
// vm — useNewProjectsNoticeViewModel().
const NewProjectsButton = ({ vm }) => (
    <div aria-live="polite" className="flex justify-start">
        {vm.visible && (
            <button
                type="button"
                onClick={vm.onShowNew}
                className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-800 shadow-sm transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-blue-400/50 dark:bg-blue-800/20 dark:text-blue-300 dark:hover:bg-blue-800/40"
            >
                <i className="fa-solid fa-arrow-up" aria-hidden="true" />
                Нові проєкти: {vm.count}
            </button>
        )}
    </div>
);

export default NewProjectsButton;
