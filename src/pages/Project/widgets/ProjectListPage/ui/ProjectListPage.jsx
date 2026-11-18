import { observer } from "mobx-react-lite";
import ProjectFilters from "../../../features/filter-projects/ui/ProjectFilters.jsx";
import ActiveFiltersBar from "../../../features/saved-filters/ui/ActiveFiltersBar.jsx";
import NewProjectsButton from "../../../features/new-projects-notice/ui/NewProjectsButton.jsx";
import Pagination from "../../../shared/ui/Pagination.jsx";
import PageSizeSelect from "../../../shared/ui/PageSizeSelect.jsx";
import { HighlightProvider } from "../../../shared/ui/Highlight.jsx";
import ProjectListTable from "../../ProjectListTable/ui/ProjectListTable.jsx";

const ListBar = ({ total, page, pages, onPageChange, pageSize, pageSizes, onPageSizeChange, disabled }) => (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
        <span className="text-xs font-semibold">Знайдено: {total ?? "…"}</span>
        <Pagination page={page} pages={pages} onChange={onPageChange} disabled={disabled} />
        <div className="ml-auto">
            <PageSizeSelect value={pageSize} options={pageSizes} onChange={onPageSizeChange} disabled={disabled} />
        </div>
    </div>
);

// View списку /project. vm — ProjectListPageViewModel (observer: читає getter-и VM).
const ProjectListPage = ({ vm }) => (
    <div className="flex flex-col gap-2">
        <ProjectFilters vm={vm.filters} />

        <ActiveFiltersBar filters={vm.filters} saved={vm.savedFilters} />

        <ListBar {...vm.pagination} />

        <NewProjectsButton vm={vm.newProjects} />

        {vm.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                {vm.error}
                <button type="button" className="ml-2 underline" onClick={vm.onRetry}>
                    Спробувати ще раз
                </button>
            </div>
        )}

        {vm.showTable && (
            <HighlightProvider words={vm.highlightedWords}>
                <ProjectListTable vm={vm.table} />
            </HighlightProvider>
        )}

        {vm.showBottomBar && <ListBar {...vm.pagination} />}
    </div>
);

export default observer(ProjectListPage);
